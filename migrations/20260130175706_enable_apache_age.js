/**
 * Enable Apache AGE extension and create provenance graph
 *
 * Apache AGE (A Graph Extension for PostgreSQL) enables property graph queries using Cypher.
 * This migration:
 * 1. Creates the AGE extension (idempotent)
 * 2. Loads AGE into the search path
 * 3. Creates a graph named 'prov' for provenance data
 *
 * The graph is synchronized with relational tables via triggers (see subsequent migrations).
 *
 * Note: Applications must set search_path to include ag_catalog when querying AGE:
 *   LOAD 'age';
 *   SET search_path = ag_catalog, "$user", public;
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Create AGE extension if it doesn't exist
    await knex.raw('CREATE EXTENSION IF NOT EXISTS age');

    // Load AGE into search path (ag_catalog contains AGE functions)
    await knex.raw("SET search_path = ag_catalog, '$user', public");

    // Create the provenance graph if it doesn't exist
    // Using DO block for idempotency since CREATE GRAPH doesn't support IF NOT EXISTS
    await knex.raw(`
        DO $$
        BEGIN
            -- Check if graph already exists
            IF NOT EXISTS (
                SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'prov'
            ) THEN
                -- Create the graph
                PERFORM ag_catalog.create_graph('prov');
            END IF;
        END
        $$;
    `);
};

/**
 * Rollback: Drop the graph and extension
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Drop the graph if it exists
    await knex.raw(`
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'prov'
            ) THEN
                PERFORM ag_catalog.drop_graph('prov', true);
            END IF;
        END
        $$;
    `);

    // Drop the AGE extension
    await knex.raw('DROP EXTENSION IF EXISTS age CASCADE');
};
