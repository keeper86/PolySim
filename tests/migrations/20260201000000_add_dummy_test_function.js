exports.up = async function (knex) {
    await knex.raw(`
    CREATE SCHEMA IF NOT EXISTS prov;

    -- Make sure AGE is loaded in this session
    CREATE EXTENSION IF NOT EXISTS age;
    LOAD 'age';

    CREATE OR REPLACE FUNCTION prov.dummy_test_v1(params jsonb)
    RETURNS TABLE(result jsonb)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      cypher_query text;
    BEGIN
      cypher_query := format(
        $cypher$
        RETURN { ok: %L } AS result
        $cypher$,
        params->>'testVal'
      );

      RETURN QUERY
      SELECT t.result::jsonb
      FROM ag_catalog.cypher('prov', cypher_query)
        AS t(result text);
    END;
    $$;
  `);
};

exports.down = async function (knex) {
    await knex.raw(`DROP FUNCTION IF EXISTS prov.dummy_test_v1(jsonb);`);
};
