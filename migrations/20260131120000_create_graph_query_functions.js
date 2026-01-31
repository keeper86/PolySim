/**
 * Create graph query functions for Apache AGE
 *
 * This migration creates permanent PostgreSQL functions for graph queries,
 * replacing the previous string concatenation approach with secure parameterized functions.
 *
 * Each function takes an agtype JSON parameter and returns an agtype result.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Set search path to include ag_catalog
    await knex.raw("SET search_path = ag_catalog, '$user', public");

    // Create function for entity lineage query (prov.entity_lineage_v1)
    await knex.raw(`
        CREATE OR REPLACE FUNCTION prov.entity_lineage_v1(params agtype)
        RETURNS agtype
        LANGUAGE plpgsql
        VOLATILE
        AS $function$
        BEGIN
            RETURN (
                SELECT result FROM ag_catalog.cypher('prov', $$
                    // Aggregate all matched paths, then extract distinct nodes and relationships
                    // Match variable-length paths of any relationship type, up to the configured depth;
                    // we'll filter the relationship kinds below to the set we care about.
                    MATCH p = (e:Entity)<-[*1..coalesce(params.maxDepth::int, 10)]-(n)
                    WHERE e.id = params.entityId
                    WITH collect(p) AS paths

                    // collect distinct nodes across all paths
                    UNWIND paths AS pp
                    UNWIND nodes(pp) AS nd
                    WITH collect(DISTINCT nd) AS allNodes, paths

                    // collect distinct relationships across all paths, but only keep the kinds we want
                    UNWIND paths AS pp2
                    UNWIND relationships(pp2) AS rel
                    WITH allNodes, rel
                    WHERE type(rel) IN ['WAS_DERIVED_FROM', 'WAS_GENERATED_BY', 'USED']
                    WITH allNodes, collect(DISTINCT rel) AS allRels

                    RETURN {
                        nodes: [node IN allNodes | { id: node.id, kind: head(labels(node)) }],
                        edges: [r IN allRels | { from: startNode(r).id, to: endNode(r).id, label: type(r) }]
                    } AS result
                $$, params)
            );
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
        DROP FUNCTION IF EXISTS prov.entity_lineage_v1(agtype);
    `);
};
