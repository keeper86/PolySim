/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('personal_access_tokens', function (table) {
        table.timestamp('expires_at').notNullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('personal_access_tokens', function (table) {
        table.timestamp('expires_at').nullable().alter();
    });
};
