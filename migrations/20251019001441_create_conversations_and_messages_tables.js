/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Creating conversations and messages tables.');
    }

    // Create conversations table
    await knex.schema.createTable('conversations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });

    // Create conversation_participants table (many-to-many relationship)
    await knex.schema.createTable('conversation_participants', (table) => {
        table.increments('id').primary();
        table.integer('conversation_id').unsigned().notNullable().references('id').inTable('conversations').onDelete('CASCADE');
        table.string('user_id').notNullable();
        table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
        table.unique(['conversation_id', 'user_id']);
        table.index('user_id');
    });

    // Create messages table
    await knex.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table.integer('conversation_id').unsigned().notNullable().references('id').inTable('conversations').onDelete('CASCADE');
        table.string('sender_id').notNullable();
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.index('conversation_id');
        table.index('created_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Dropping conversations and messages tables.');
    }
    await knex.schema.dropTableIfExists('messages');
    await knex.schema.dropTableIfExists('conversation_participants');
    await knex.schema.dropTableIfExists('conversations');
};
