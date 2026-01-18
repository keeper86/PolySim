const fs = require('fs');
const path = require('path');

/**
 * Seed app user_data rows from Keycloak import JSON.
 * This is intended for dev/test only and is idempotent.
 */
exports.seed = async function (knex) {
    if (process.env.NODE_ENV === 'production') {
        console.error('Skipping dev user-data seed in production. Something went wrong!');
        return;
    }

    const user = await exports.getDevAdminUserFromInitialDevRealm();

    const keycloakUserId = user.id;
    const email = user.email;

    if (!keycloakUserId) {
        console.warn('Skipping user with no id in import:', user);
        return;
    }

    if (!email) {
        console.warn('Skipping user with no email in import:', user);
        return;
    }

    const existing = await knex('user_data').where({ user_id: keycloakUserId }).first();

    if (!existing) {
        const row = {
            user_id: keycloakUserId,
            email: email,
        };

        await knex('user_data').insert(row).onConflict('user_id').ignore();
        console.log(`Upserted user_data row for user_id ${keycloakUserId} from Keycloak import`);
    }
};

exports.getDevAdminUserFromInitialDevRealm = async function () {
    const importPath = path.resolve(__dirname, '../keycloak/data/devImport/myRealmDev.json');
    if (!fs.existsSync(importPath)) {
        throw new Error('Keycloak import JSON not found at ' + importPath);
    }

    let realm;
    try {
        realm = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    } catch (e) {
        throw new Error('Failed to parse Keycloak import JSON: ' + e.message);
    }

    const [adminUser] = Array.isArray(realm.users) ? realm.users : [];
    if (!adminUser) {
        throw new Error('Admin user not found in Keycloak import JSON');
    }
    return adminUser;
};
