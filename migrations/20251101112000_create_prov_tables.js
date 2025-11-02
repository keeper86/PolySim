exports.up = function (knex) {
    return knex.schema
        .createTable('entities', function (table) {
            table.text('id').primary();
            table.text('label').nullable();
            table.jsonb('metadata').notNullable().defaultTo({});
            table.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        })
        .createTable('activities', function (table) {
            table.text('id').primary();
            table.text('label').notNullable().defaultTo('<Activity>');
            table.timestamp('started_at').notNullable();
            table.timestamp('ended_at').notNullable();
            table.jsonb('metadata').nullable().defaultTo({});
        })
        .createTable('agents', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.text('label').notNullable().defaultTo('');
            table.jsonb('metadata').nullable().defaultTo({});
            table.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        })
        .createTable('was_generated_by', function (table) {
            table.text('entity_id').notNullable();
            table.text('activity_id').notNullable();
            table.primary(['entity_id', 'activity_id']);
            table.foreign('entity_id').references('id').inTable('entities').onDelete('CASCADE');
            table.foreign('activity_id').references('id').inTable('activities').onDelete('CASCADE');
        })
        .createTable('used', function (table) {
            table.text('activity_id').notNullable();
            table.text('entity_id').notNullable();
            table.text('role').notNullable().defaultTo('input');
            table.primary(['activity_id', 'entity_id']);
            table.foreign('activity_id').references('id').inTable('activities').onDelete('CASCADE');
            table.foreign('entity_id').references('id').inTable('entities').onDelete('CASCADE');
        })
        .createTable('was_attributed_to', function (table) {
            table.text('entity_id').notNullable();
            table.uuid('agent_id').notNullable();
            table.primary(['entity_id', 'agent_id']);
            table.foreign('entity_id').references('id').inTable('entities').onDelete('CASCADE');
            table.foreign('agent_id').references('id').inTable('agents').onDelete('CASCADE');
        })
        .createTable('was_associated_with', function (table) {
            table.text('activity_id').notNullable();
            table.uuid('agent_id').notNullable();
            table.text('role').nullable();
            table.primary(['activity_id', 'agent_id']);
            table.foreign('activity_id').references('id').inTable('activities').onDelete('CASCADE');
            table.foreign('agent_id').references('id').inTable('agents').onDelete('CASCADE');
        })
        .createTable('was_informed_by', function (table) {
            table.text('informed_id').notNullable();
            table.text('informer_id').notNullable();
            table.primary(['informed_id', 'informer_id']);
            table.foreign('informed_id').references('id').inTable('activities').onDelete('CASCADE');
            table.foreign('informer_id').references('id').inTable('activities').onDelete('CASCADE');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('was_associated_with')
        .dropTableIfExists('was_attributed_to')
        .dropTableIfExists('used')
        .dropTableIfExists('was_generated_by')
        .dropTableIfExists('was_informed_by')
        .dropTableIfExists('agents')
        .dropTableIfExists('activities')
        .dropTableIfExists('entities');
};
