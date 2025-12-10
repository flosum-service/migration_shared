import { spawn } from 'node:child_process';
import { appendFile, mkdir } from 'node:fs/promises';
import { TIMESTAMP } from './config';

export const spawnAsync = async (cmd: string, args: string[]) => {
  await mkdir('.logs', { recursive: true });
  await mkdir('.tmp', { recursive: true });

  return new Promise((resolve, reject) => {
    console.log(`${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args);

    child.stdout.on('data', async (data) => {
      process.stdout.write(data);
      await appendFile(`./.logs/${TIMESTAMP}.dump.log`, `[LOG] ${data}\n`);
    });

    child.stderr.on('data', async (data) => {
      process.stderr.write(data);
      await appendFile(`./.logs/${TIMESTAMP}.dump.log`, `[ERR] ${data}\n`);
    });

    child.on('error', async (error) => {
      console.error(error);
      await appendFile(`./.logs/${TIMESTAMP}.dump.log`, `[ERR] ${error}\n`);
    });

    child.on('close', async (code) => {
      await appendFile(
        `./.logs/${TIMESTAMP}.dump.log`,
        `[EXT] Code: ${code}\n`,
      );

      if (code) {
        reject(null);
      } else {
        resolve(null);
      }
    });
  });
};
