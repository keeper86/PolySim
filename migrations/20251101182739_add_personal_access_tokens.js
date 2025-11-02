exports.up = function (knex) {
    return knex.schema
        .createTable('personal_access_tokens', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.string('user_id').notNullable().index();
            table.string('name').notNullable().defaultTo('');
            table.string('token_hash').notNullable().unique().index();
            table.timestamp('expires_at').nullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        })
        .createTable('personal_access_tokens_logs', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('pat_id').references('id').inTable('personal_access_tokens').onDelete('CASCADE').index();
            table.timestamp('used_at').notNullable().defaultTo(knex.fn.now()).index();
            table.string('ip').nullable();
            table.text('user_agent').nullable();
        });
};

exports.down = function (knex) {
    return knex.schema //
        .dropTableIfExists('personal_access_tokens_logs')
        .dropTableIfExists('personal_access_tokens');
};
