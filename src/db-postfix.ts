import { appendFile } from 'node:fs/promises';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';
import { ENV, LOGS_PATH, TIMESTAMP } from './config';

async function fix(connection: Connection) {
  const fixAutoIncrement = async (table: string) => {
    const [rows] = await connection.query<(RowDataPacket & { next: string })[]>(
      `SELECT COALESCE(MAX(id), 0) + 1 AS next FROM \`${table}\``,
    );

    if (!rows[0]?.next) {
      return;
    }

    await connection.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ${rows[0].next}`);
  };

  await fixAutoIncrement('roles');
  await fixAutoIncrement('groups');
  await fixAutoIncrement('permissions');
  await fixAutoIncrement('resources');
  await fixAutoIncrement('role_licenses');
  await fixAutoIncrement('users');
}

async function main() {
  const connection = await mysql.createConnection({
    host: ENV.targetDB.host,
    port: +ENV.targetDB.port,
    user: ENV.targetDB.user,
    password: ENV.targetDB.password,
    database: ENV.targetDB.database,
  });

  connection.on('error', async (error) => appendFile(`${LOGS_PATH}/${TIMESTAMP}.shift.log`, `[ERR] ${error}`));
  connection.on('packet', async (packet) => await appendFile(`${LOGS_PATH}/${TIMESTAMP}.shift.log`, `[LOG] ${packet}`));

  await fix(connection);

  await connection.end();
}

main();
