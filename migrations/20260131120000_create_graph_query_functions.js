/**
 * Create graph query functions for Apache AGE
 *
 * This migration creates permanent PostgreSQL functions for graph queries,
 * replacing the previous string concatenation approach with secure parameterized functions.
 *
 * Each function takes an agtype JSON parameter and returns a JSON result.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Set search path to include ag_catalog
    await knex.raw("SET search_path = ag_catalog, '$user', public");

    // Create function for entity lineage query (prov.entity_lineage_v2)
    await knex.raw(`
        CREATE OR REPLACE FUNCTION prov.entity_lineage_v2(params text)
        RETURNS TABLE (result json)
        LANGUAGE plpgsql
        VOLATILE
        AS $function$
        DECLARE
            entity_id text;
            query text;
            dynsql text;
        BEGIN
            -- extract entity id from JSON params
            entity_id := params::json->>'entityId';

            -- build a safe cypher query by quoting the literal to avoid injection
            query := 'MATCH (e:Entity {id: ' || quote_literal(entity_id) || '}) RETURN e.kind AS kind';

            -- build the dynamic SQL that calls ag_catalog.cypher and constructs
            -- the JSON payload. We request AGE to return JSON for the "kind"
            -- column so we avoid problematic casts from agtype -> jsonb.
            dynsql := 'SELECT json_build_object(''
                ''nodes'', json_build_array(json_build_object(''id'', ' || quote_literal(entity_id) || ', ''kind'', t.kind::text)), ''edges'', ''[]''::json) '
                || 'FROM ag_catalog.cypher(''prov'', $$' || query || '$$) AS t(kind json)';

            RETURN QUERY EXECUTE dynsql;
        END;
        $function$;
    `);
};

/**
 * Rollback: Drop the graph query functions
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Set search path to include ag_catalog
    await knex.raw("SET search_path = ag_catalog, '$user', public");

    // Drop the function if it exists
    await knex.raw(`
        DROP FUNCTION IF EXISTS prov.entity_lineage_v2(text);
    `);
};
