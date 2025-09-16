import type { Knex } from "knex";

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
    console.log("Creating events table...");

    await knex.schema.createTable("events", (table) => {
        table.increments("id").primary();
        table.string("type").notNullable();
        table.jsonb("data").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("events");
}
