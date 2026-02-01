exports.up = async function (knex) {
    await knex.raw(`
    CREATE SCHEMA IF NOT EXISTS prov;
    CREATE OR REPLACE FUNCTION prov.dummy_test_v1(params agtype)
    RETURNS TABLE(result json)
    LANGUAGE plpgsql

    AS $func$
    BEGIN

        RETURN QUERY EXECUTE
          'SELECT * FROM ag_catalog.cypher(
              ''prov'', 
              $$
                  MATCH (u '$id')
                  RETURN u
              $$, 
              $1
          ) AS (user_node json)'
        USING params;

    END;
    $func$;
  `);
};

exports.down = async function (knex) {
    await knex.raw(`DROP FUNCTION IF EXISTS prov.dummy_test_v1(agtype);`);
};
