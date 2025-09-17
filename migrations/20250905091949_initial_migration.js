export async function up(knex) {
    console.log('Creating events table...');

    await knex.schema.createTable('events', (table) => {
        table.increments('id').primary();
        table.string('type').notNullable();
        table.jsonb('data').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('events');
}
