import { DUMP_FILE_PATH, ENV } from './config';
import { spawnAsync } from './core';

async function restore() {
  await spawnAsync('mysql', ['--version']);

  const cmd =
    'mysql ' +
    `--user=${ENV.targetDB.user} ` +
    `--password=${ENV.targetDB.password} ` +
    `--host=${ENV.targetDB.host} ` +
    `--port=${ENV.targetDB.port} ` +
    `${ENV.targetDB.database} < ${DUMP_FILE_PATH}`;

  await spawnAsync('sh', ['-c', cmd]);
}

async function main() {
  await restore();
}

main();
