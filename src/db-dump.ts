import { DUMP_FILE_PATH, ENV, IGNORE_TABLES } from './config';
import { spawnAsync } from './core';

async function dump() {
  await spawnAsync('mysqldump', ['--version']);

  await spawnAsync('mysqldump', [
    `--user=${ENV.sourceDB.user}`,
    `--password=${ENV.sourceDB.password}`,
    `--host=${ENV.sourceDB.host}`,
    `--port=${ENV.sourceDB.port}`,
    '--databases',
    ENV.sourceDB.database,
    ...IGNORE_TABLES.map((tb) => `--ignore-table=${ENV.sourceDB.database}.${tb}`),
    `--result-file=${DUMP_FILE_PATH}`,
    '--set-gtid-purged=OFF',
    '--skip-add-drop-table',
    '--no-create-info',
    '--skip-triggers',
  ]);
}

async function main() {
  await dump();
}

main();
