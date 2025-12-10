import { appendFile } from 'node:fs/promises';
import baseX from 'base-x';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';
import { ENV, LOGS_PATH, TIMESTAMP } from './config';

const BASE58 = baseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

function padNumber(num: number): string {
  return num.toString().padStart(11, '0');
}

async function dropFK(connection: Connection) {
  await connection.query('ALTER TABLE actions DROP FOREIGN KEY FK_fdf36211fd8d00471607d4a88b3;');
  await connection.query('ALTER TABLE applications DROP FOREIGN KEY fk_applications_tenant;');
  await connection.query('ALTER TABLE ip_ranges DROP FOREIGN KEY fk_ip_ranges_tenant;');
  await connection.query('ALTER TABLE resource_references DROP FOREIGN KEY FK_337c7ec1860e064d55baf5abba8;');
  await connection.query('ALTER TABLE roles DROP FOREIGN KEY fk_roles_tenant;');
  await connection.query('ALTER TABLE `groups` DROP FOREIGN KEY FK_a71751384b8ea4d293ed1fce;');
  await connection.query('ALTER TABLE `groups` DROP FOREIGN KEY fk_groups_tenant;');
  await connection.query('ALTER TABLE identity_provider DROP FOREIGN KEY FK_identity_provider_default_group;');
  await connection.query('ALTER TABLE identity_provider DROP FOREIGN KEY fk_identity_provider_tenant;');
  await connection.query('ALTER TABLE open_id DROP FOREIGN KEY FK_27372537e8ce34aaf6fba7adb9c;');
  await connection.query('ALTER TABLE permissions DROP FOREIGN KEY FK_2be576d0e6ed6df24d170e71eb7;');
  await connection.query('ALTER TABLE permissions DROP FOREIGN KEY FK_b7ffb35e42b00ebc4557bfbbfa1;');
  await connection.query('ALTER TABLE resources DROP FOREIGN KEY FK_3721bc5bc7c3b7aa38499c3fc87;');
  await connection.query('ALTER TABLE resources DROP FOREIGN KEY FK_e7a0aa298ec43b0d966a3c7f754;');
  await connection.query('ALTER TABLE role_licenses DROP FOREIGN KEY FK_e1f81b8e2c8c5c99480d1ec2b97;');
  await connection.query('ALTER TABLE users DROP FOREIGN KEY FK_3315a14a9c17bc7c4eeff960;');
  await connection.query('ALTER TABLE users DROP FOREIGN KEY fk_users_tenant;');
  await connection.query('ALTER TABLE api_tokens DROP FOREIGN KEY FK_api_tokens_users;');
  await connection.query('ALTER TABLE authorization_code DROP FOREIGN KEY FK_e9faa3a047b4fad5df2a5d629e9;');
  await connection.query('ALTER TABLE authorization_code DROP FOREIGN KEY FK_c84c3d4d0e6344f36785f679e47;');
  await connection.query('ALTER TABLE mfa DROP FOREIGN KEY FK_e114d31b2c228a8291db8cbf474;');
  await connection.query('ALTER TABLE password_reset_codes DROP FOREIGN KEY FK_9c30b1d4c6199fd152c128dbd37;');
  await connection.query('ALTER TABLE refresh_token DROP FOREIGN KEY FK_8134698f9742a302b865d9c4a02;');
  await connection.query('ALTER TABLE refresh_token DROP FOREIGN KEY FK_8e913e288156c133999341156ad;');
  await connection.query('ALTER TABLE access_token DROP FOREIGN KEY FK_10c48d0d4ab60b391fe9fd9a014;');
  await connection.query('ALTER TABLE access_token DROP FOREIGN KEY FK_87a9a37389f9fe5c754e93bec43;');
  await connection.query('ALTER TABLE access_token DROP FOREIGN KEY FK_9949557d0e1b2c19e5344c171e9;');
  await connection.query('ALTER TABLE permission_action_links DROP FOREIGN KEY FK_746b0fa79b6473625ddc1461aaf;');
  await connection.query('ALTER TABLE permission_action_links DROP FOREIGN KEY FK_17473ff790199e4bb789760dfd3;');
  await connection.query('ALTER TABLE resource_reference_action_links DROP FOREIGN KEY FK_9705b1d83148a3ff18a07efbe2d;');
  await connection.query('ALTER TABLE resource_reference_action_links DROP FOREIGN KEY FK_b1f4548a26208a081b4981a28bd;');
}

async function alterFK(connection: Connection) {
  await connection.query(`
      ALTER TABLE actions 
      ADD CONSTRAINT FK_fdf36211fd8d00471607d4a88b3
      FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE applications
      ADD CONSTRAINT fk_applications_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE ip_ranges
      ADD CONSTRAINT fk_ip_ranges_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE resource_references
      ADD CONSTRAINT FK_337c7ec1860e064d55baf5abba8
      FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE roles
      ADD CONSTRAINT fk_roles_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE \`groups\`
      ADD CONSTRAINT FK_a71751384b8ea4d293ed1fce
      FOREIGN KEY (roleId) REFERENCES roles(id);
    `);

  await connection.query(`
      ALTER TABLE \`groups\`
      ADD CONSTRAINT fk_groups_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE identity_provider
      ADD CONSTRAINT FK_identity_provider_default_group
      FOREIGN KEY (defaultGroupId) REFERENCES \`groups\`(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE identity_provider
      ADD CONSTRAINT fk_identity_provider_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE open_id
      ADD CONSTRAINT FK_27372537e8ce34aaf6fba7adb9c
      FOREIGN KEY (identityProviderId) REFERENCES identity_provider(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE permissions
      ADD CONSTRAINT FK_2be576d0e6ed6df24d170e71eb7
      FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE permissions
      ADD CONSTRAINT FK_b7ffb35e42b00ebc4557bfbbfa1
      FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE resources
      ADD CONSTRAINT FK_3721bc5bc7c3b7aa38499c3fc87
      FOREIGN KEY (referenceId) REFERENCES resource_references(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE resources
      ADD CONSTRAINT FK_e7a0aa298ec43b0d966a3c7f754
      FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE role_licenses
      ADD CONSTRAINT FK_e1f81b8e2c8c5c99480d1ec2b97
      FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE users
      ADD CONSTRAINT FK_3315a14a9c17bc7c4eeff960
      FOREIGN KEY (groupId) REFERENCES \`groups\`(id);
    `);

  await connection.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_tenant
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE api_tokens
      ADD CONSTRAINT FK_api_tokens_users
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE authorization_code
      ADD CONSTRAINT FK_e9faa3a047b4fad5df2a5d629e9
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE authorization_code
      ADD CONSTRAINT FK_c84c3d4d0e6344f36785f679e47
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE mfa
      ADD CONSTRAINT FK_e114d31b2c228a8291db8cbf474
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE password_reset_codes
      ADD CONSTRAINT FK_9c30b1d4c6199fd152c128dbd37
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE refresh_token
      ADD CONSTRAINT FK_8134698f9742a302b865d9c4a02
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE refresh_token
      ADD CONSTRAINT FK_8e913e288156c133999341156ad
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE access_token
      ADD CONSTRAINT FK_10c48d0d4ab60b391fe9fd9a014
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE access_token
      ADD CONSTRAINT FK_87a9a37389f9fe5c754e93bec43
      FOREIGN KEY (refreshTokenId) REFERENCES refresh_token(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE access_token
      ADD CONSTRAINT FK_9949557d0e1b2c19e5344c171e9
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE permission_action_links
      ADD CONSTRAINT FK_746b0fa79b6473625ddc1461aaf
      FOREIGN KEY (actionsId) REFERENCES actions(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE permission_action_links
      ADD CONSTRAINT FK_17473ff790199e4bb789760dfd3
      FOREIGN KEY (permissionsId) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE resource_reference_action_links
      ADD CONSTRAINT FK_9705b1d83148a3ff18a07efbe2d
      FOREIGN KEY (actionsId) REFERENCES actions(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);

  await connection.query(`
      ALTER TABLE resource_reference_action_links
      ADD CONSTRAINT FK_b1f4548a26208a081b4981a28bd
      FOREIGN KEY (resourceReferencesId) REFERENCES resource_references(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);
}

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
  async function shift(connection: Connection) {
    const [rows] = await connection.query<(RowDataPacket & { id: string })[]>('SELECT id from tenants');

    for (const { id: oldId } of rows) {
      const newId = BASE58.encode(Buffer.from(padNumber(parseInt(Buffer.from(BASE58.decode(oldId)).toString(), 10) + 1000)));

      await connection.query('UPDATE tenants SET id=?, name=? WHERE id=?;', [newId, newId, oldId]);

      await connection.query('UPDATE applications SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE ip_ranges SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE roles SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE tenant_verification_codes SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE `groups` SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE identity_provider SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
      await connection.query('UPDATE users SET tenantId=? WHERE tenantId=?;', [newId, oldId]);
    }

    await connection.query('UPDATE icons SET id = id + 1000;');
    // await connection.query('UPDATE migrations SET id = id + 1000;');
    // await connection.query('UPDATE services SET id = id + 1000;');
    await connection.query('UPDATE tenant_id_seq SET id = id + 1000;');
    await connection.query('UPDATE verification_codes SET id = id + 1000;');
    // await connection.query('UPDATE actions SET id = id + 1000;');
    await connection.query('UPDATE applications SET id = id + 1000;');
    await connection.query('UPDATE ip_ranges SET id = id + 1000;');
    // await connection.query('UPDATE resource_references SET id = id + 1000;');
    await connection.query('UPDATE roles SET id = id + 1000;');
    await connection.query('UPDATE tenant_verification_codes SET id = id + 1000;');
    await connection.query('UPDATE `groups` SET id = id + 1000;');
    await connection.query('UPDATE identity_provider SET id = id + 1000;');
    await connection.query('UPDATE open_id SET id = id + 1000;');
    await connection.query('UPDATE permissions SET id = id + 1000;');
    await connection.query('UPDATE resources SET id = id + 1000;');
    await connection.query('UPDATE role_licenses SET id = id + 1000;');
    await connection.query('UPDATE users SET id = id + 1000;');
    await connection.query('UPDATE api_tokens SET id = id + 1000;');
    await connection.query('UPDATE authorization_code SET id = id + 1000;');
    await connection.query('UPDATE mfa SET id = id + 1000;');
    await connection.query('UPDATE refresh_token SET id = id + 1000;');
    await connection.query('UPDATE access_token SET id = id + 1000;');

    // await connection.query('UPDATE actions SET serviceId = serviceId + 1000 WHERE serviceId IS NOT NULL;');
    // await connection.query('UPDATE resource_references SET serviceId = serviceId + 1000 WHERE serviceId IS NOT NULL;');
    // await connection.query('UPDATE permissions SET serviceId = serviceId + 1000 WHERE serviceId IS NOT NULL;');
    // await connection.query('UPDATE resources SET referenceId = referenceId + 1000 WHERE referenceId IS NOT NULL;');

    await connection.query('UPDATE permissions SET roleId = roleId + 1000 WHERE roleId IS NOT NULL;');
    await connection.query('UPDATE `groups` SET roleId = roleId + 1000 WHERE roleId IS NOT NULL;');
    await connection.query('UPDATE identity_provider SET defaultGroupId = defaultGroupId + 1000 WHERE defaultGroupId IS NOT NULL;');
    await connection.query('UPDATE open_id SET identityProviderId = identityProviderId + 1000 WHERE identityProviderId IS NOT NULL;');
    await connection.query('UPDATE resources SET permissionId = permissionId + 1000 WHERE permissionId IS NOT NULL;');
    await connection.query('UPDATE role_licenses SET roleId = roleId + 1000 WHERE roleId IS NOT NULL;');
    await connection.query('UPDATE users SET groupId = groupId + 1000 WHERE groupId IS NOT NULL;');
    await connection.query('UPDATE api_tokens SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE authorization_code SET applicationId = applicationId + 1000 WHERE applicationId IS NOT NULL;');
    await connection.query('UPDATE authorization_code SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE mfa SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE password_reset_codes SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE refresh_token SET applicationId = applicationId + 1000 WHERE applicationId IS NOT NULL;');
    await connection.query('UPDATE refresh_token SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE access_token SET applicationId = applicationId + 1000 WHERE applicationId IS NOT NULL;');
    await connection.query('UPDATE access_token SET refreshTokenId = refreshTokenId + 1000 WHERE refreshTokenId IS NOT NULL;');
    await connection.query('UPDATE access_token SET userId = userId + 1000 WHERE userId IS NOT NULL;');
    await connection.query('UPDATE permission_action_links SET permissionsId = permissionsId + 1000;');

    // await connection.query('UPDATE permission_action_links SET actionsId = actionsId + 1000');

    // await connection.query(
    //   'UPDATE resource_reference_action_links SET actionsId = actionsId + 1000, resourceReferencesId = resourceReferencesId + 1000;',
    // );
  };

async function main() {
  const connection = await mysql.createConnection({
    host: ENV.sourceDB.host,
    port: +ENV.sourceDB.port,
    user: ENV.sourceDB.user,
    password: ENV.sourceDB.password,
    database: ENV.sourceDB.database,
  });

  connection.on('error', async (error) => appendFile(`${LOGS_PATH}/${TIMESTAMP}.shift.log`, `[ERR] ${error}`));
  connection.on('packet', async (packet) => await appendFile(`${LOGS_PATH}/${TIMESTAMP}.shift.log`, `[LOG] ${packet}`));

  await dropFK(connection);
  await shift(connection);
  await alterFK(connection);

  await connection.end();
}

main();
