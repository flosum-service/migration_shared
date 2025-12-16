import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import basex from 'base-x';
import chunk from 'chunk';
import { ENV, TIMESTAMP } from './config';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = basex(ALPHABET);

const s3 = new S3Client({ region: ENV.aws.region });

function encoded(id: number): string {
  const padded = id.toString().padStart(11, '0');
  return base58.encode(Buffer.from(padded));
}

function decode(id: string): number {
  return parseInt(Buffer.from(base58.decode(id)).toString(), 10);
}

async function migrate(migrations: { from: string; to: string; cmd: string[] }[]) {
  const promises = [];

  for (const ch of chunk(migrations, migrations.length / 10)) {
    let promise = Promise.resolve();

    for (const { cmd } of ch) {
      promise = promise.then(async () => {
        console.log(`Executing: aws ${cmd}...`);

        await new Promise((resolve) => {
          const child = spawn('aws', cmd);

          const logStream = createWriteStream(`./.logs/${TIMESTAMP}.s3-migrate.log`, {
            flags: 'a',
          });

          child.stdout.on('data', (data) => {
            process.stdout.write(data);
            logStream.write(`[LOG] ${data}`);
          });

          child.stderr.on('data', (data) => {
            process.stderr.write(data);
            logStream.write(`[ERR] ${data}`);
          });

          child.on('close', (code) => {
            logStream.write(`[EXT] ${code}`);
            resolve(null);
          });

          child.on('error', (err: Error) => {
            process.stderr.write(err.message);
            logStream.write(`[ERR] ${JSON.stringify(err)}`);
          });
        });
      });
    }

    promises.push(promise);
  }

  await Promise.all(promises);
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
    }
  }

  console.dir(toMigrateFirst, { depth: null });
  console.dir(toMigrateSecond, { depth: null });

  const migrationsFirst = [];
  const migrationsSecond = [];

  for (const from of toMigrateFirst.keys()) {
    const to = from.slice(0, -1).split('/');

    const id = parseInt(to[to.length - 1]);

    if (!id) {
      continue;
    }

    to.slice();
    to[to.length - 1] = `${id + 1000}`;

    migrationsFirst.push({
      from: `s3://${ENV.aws.bucket}/${from.slice(0, -1)}`,
      to: `s3://${ENV.aws.bucket}/${to.join('/')}`,
      cmd: ['s3', 'mv', `s3://${ENV.aws.bucket}/${from.slice(0, -1)}`, `s3://${ENV.aws.bucket}/${to.join('/')}`, '--recursive'],
    });
  }

  for (const from of toMigrateSecond.keys()) {
    const to = from.slice(0, -1).split('/');

    const id = decode(to[to.length - 1]);

    if (!id) {
      continue;
    }

    to.slice();
    to[to.length - 1] = encoded(id + 1000);

    migrationsSecond.push({
      from: `s3://${ENV.aws.bucket}/${from.slice(0, -1)}`,
      to: `s3://${ENV.aws.bucket}/${to.join('/')}`,
      cmd: ['s3', 'mv', `s3://${ENV.aws.bucket}/${from.slice(0, -1)}`, `s3://${ENV.aws.bucket}/${to.join('/')}`, '--recursive'],
    });
  }

  await writeFile('migration.json', JSON.stringify(toMigrateFirst));

  console.log({ env: ENV.aws });
  console.log({ migrationsFirst });
  console.log({ migrationsSecond });

  const an = await rl.question('\n\nContinue ? (yes|no): ');

  if (an !== 'yes') {
    return;
  }

  await migrate(migrationsFirst);
  await migrate(migrationsSecond);
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

main().then(() => {
  rl.close();
});
