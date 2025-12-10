/** biome-ignore-all lint/style/noNonNullAssertion: because */
import path from 'node:path';

const errors = [];
if (!process.env.SOURCE_DB_HOST) errors.push(new Error('No env: "SOURCE_DB_HOST"'));
if (!process.env.SOURCE_DB_PORT) errors.push(new Error('No env: "SOURCE_DB_PORT"'));
if (!process.env.SOURCE_DB_USERNAME) errors.push(new Error('No env: "SOURCE_DB_USERNAME"'));
if (!process.env.SOURCE_DB_PASSWORD) errors.push(new Error('No env: "SOURCE_DB_PASSWORD"'));
if (!process.env.SOURCE_DB_DATABASE) errors.push(new Error('No env: "SOURCE_DB_DATABASE"'));

if (!process.env.TARGET_DB_HOST) errors.push(new Error('No env: "TARGET_DB_HOST"'));
if (!process.env.TARGET_DB_PORT) errors.push(new Error('No env: "TARGET_DB_PORT"'));
if (!process.env.TARGET_DB_USERNAME) errors.push(new Error('No env: "TARGET_DB_USERNAME"'));
if (!process.env.TARGET_DB_PASSWORD) errors.push(new Error('No env: "TARGET_DB_PASSWORD"'));
if (!process.env.TARGET_DB_DATABASE) errors.push(new Error('No env: "TARGET_DB_DATABASE"'));

if (errors.length) {
  console.error('Env validation failed:');
  for (const { message } of errors) {
    console.error(message);
  }
  process.exit(1);
}

export const TIMESTAMP = Date.now();

export const LOGS_PATH = path.join(process.cwd(), '.logs');
export const TMP_PATH = path.join(process.cwd(), '.tmp');

export const IGNORE_TABLES = [
  'access_token',
  'actions',
  'applications',
  'authorization_code',
  'icons',
  'identity_provider',
  'ip_ranges',
  'migrations',
  'open_id',
  'password_reset_codes',
  'permission_action_links',
  'refresh_token',
  'resource_reference_action_links',
  'resource_references',
  'services',
  'sessions',
  'tenant_id_map',
  'tenant_id_seq',
  'tenant_verification_codes',
  'verification_codes',
];
// export const IGNORE_TABLES = [];

export const DUMP_FILE_PATH = path.join(TMP_PATH, 'dump.sql');

export const ENV = {
  sourceDB: {
    host: process.env.SOURCE_DB_HOST!,
    port: process.env.SOURCE_DB_PORT!,
    user: process.env.SOURCE_DB_USERNAME!,
    password: process.env.SOURCE_DB_PASSWORD!,
    database: process.env.SOURCE_DB_DATABASE!,
  },
  targetDB: {
    host: process.env.TARGET_DB_HOST!,
    port: process.env.TARGET_DB_PORT!,
    user: process.env.TARGET_DB_USERNAME!,
    password: process.env.TARGET_DB_PASSWORD!,
    database: process.env.TARGET_DB_DATABASE!,
  },
};
