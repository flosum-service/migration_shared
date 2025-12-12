import { spawn } from 'node:child_process';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import basex from 'base-x';
import chunk from 'chunk';
import { ENV } from './config';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = basex(ALPHABET);

const s3 = new S3Client({ region: ENV.aws.region });

function encoded(id: number): string {
  const padded = id.toString().padStart(11, '0');
  return base58.encode(Buffer.from(padded));
}

async function main() {
  await mkdir('./.logs', { recursive: true });

  const toMigrateFirst = new Set<string>();
  const toMigrateSecond = new Set<string>();

  const main = await s3.send(
    new ListObjectsV2Command({
      Bucket: ENV.aws.bucket,
      Prefix: 'data/',
      Delimiter: '/',
    }),
  );

  if (main.CommonPrefixes) {
    for (const cp of main.CommonPrefixes) {
      if (!cp.Prefix) {
        continue;
      }

      toMigrateSecond.add(cp.Prefix);

      const p = await s3.send(
        new ListObjectsV2Command({
          Bucket: ENV.aws.bucket,
          Prefix: `${cp.Prefix}connections/`,
          Delimiter: '/',
        }),
      );

      if (!p.CommonPrefixes) {
        continue;
      }

      for (const cpp of p.CommonPrefixes) {
        if (cpp.Prefix) {
          toMigrateFirst.add(cpp.Prefix);
        }
      }
    }
  }

  const fit = await s3.send(
    new ListObjectsV2Command({
      Bucket: ENV.aws.bucket,
      Prefix: 'data/fit/',
      Delimiter: '/',
    }),
  );

  if (fit.CommonPrefixes) {
    for (const cp of fit.CommonPrefixes) {
      if (!cp.Prefix) {
        continue;
      }

      toMigrateSecond.add(cp.Prefix);

      const p = await s3.send(
        new ListObjectsV2Command({
          Bucket: ENV.aws.bucket,
          Prefix: `${cp.Prefix}connections/`,
          Delimiter: '/',
        }),
      );

      if (!p.CommonPrefixes) {
        continue;
      }

      for (const cpp of p.CommonPrefixes) {
        if (cpp.Prefix) {
          toMigrateFirst.add(cpp.Prefix);
        }
      }
    }
  }

  console.dir(toMigrateFirst, { depth: null });
  console.dir(toMigrateSecond, { depth: null });

  const migrationsFirst = [];

  for (const from of toMigrateFirst.keys()) {
    console.log({ from });

    const to = from.slice(0, -1).split('/');

    const id = parseInt(to[to.length - 1]);

    if (!id) {
      continue;
    }

    to.slice();
    to[to.length - 1] = `${id + 1000}`;

    migrationsFirst.push({
      from: `${from.slice(0, -1)}`,
      to: `${to.join('/')}`,
      cmd: `aws ${['s3', 'sync', from, `${to.join('/')}`].join(' ')}`,
    });
  }

  await writeFile('migration.json', JSON.stringify(toMigrateFirst));

  console.log({ env: ENV.aws });
  console.log({ toMigrateFirst });

  const an = await rl.question('\n\nContinue ? (yes|no): ');

  if (an !== 'yes') {
    return;
  }

  const promises = [];

  for (const ch of chunk(migrations, migrations.length / 10)) {
    let promise = Promise.resolve();

    for (const { encodedId, from, to } of ch) {
      promise = promise.then(async () => {
        console.log(`Executing: aws ${['s3', 'sync', from, to].join(' ')}...`);

        await new Promise((resolve, reject) => {
          const child = spawn('aws', ['s3', 'sync', `s3://${ENV.aws.bucket}/${from}`, `s3://${ENV.aws.bucket}/${to}`]);

          child.stdout.on('data', async (data) => {
            process.stdout.write(data);
            await appendFile(`./.logs/${encodedId}.migrate.log`, `[LOG] ${data}`);
          });

          child.stderr.on('data', async (data) => {
            process.stderr.write(data);
            await appendFile(`./.logs/${encodedId}.migrate.log`, `[ERR] ${data}`);
          });

          child.on('close', async (code) => {
            await appendFile(`./.logs/${encodedId}.migrate.log`, `[EXT] ${code}`);

            resolve(null);
          });

          child.on('error', async (err: Error) => {
            process.stderr.write(err.message);
            await appendFile(`./.logs/${encodedId}.migrate.log`, `[ERR] ${JSON.stringify(err)}`);
          });
        });
      });
    }

    promises.push(promise);
  }

  await Promise.all(promises);
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

main().then(() => {
  rl.close();
});
