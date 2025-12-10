import { spawn } from 'node:child_process';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { ENV } from './config';

async function main() {
  await mkdir('./.logs', { recursive: true });

  const migrations = await readFile('migration.json', 'utf-8').then((data) => JSON.parse(data));

  console.log({ migrations });

  const an = await rl.question("\n\nTo remove 'from' path say yes. (yes|no): ");

  if (an !== 'yes') {
    return;
  }

  for (const { encodedId, from } of migrations) {
    console.log(`Executing: aws ${['s3', 'rm', from, '--recursive']}...`);

    await new Promise((resolve, reject) => {
      const child = spawn('aws', ['s3', 'rm', `s3://${ENV.aws.bucket}/${from}`, '--recursive']);

      child.stdout.on('data', async (data) => {
        process.stdout.write(data);
        await appendFile(`./.logs/${encodedId}.clean.log`, `[LOG] ${JSON.stringify({ data })}`);
      });

      child.stderr.on('data', async (data) => {
        process.stderr.write(data);
        await appendFile(`./.logs/${encodedId}.clean.log`, `[ERR] ${JSON.stringify({ data })}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        }

        reject(null);
      });
    });
  }
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

main().then(() => {
  rl.close();
});
