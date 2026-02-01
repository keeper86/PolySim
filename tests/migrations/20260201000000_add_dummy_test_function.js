exports.up = async function (knex) {
    await knex.raw(`
    CREATE SCHEMA IF NOT EXISTS prov;


    CREATE OR REPLACE FUNCTION prov.dummy_test_v1(params jsonb)
    RETURNS TABLE(result jsonb)
    LANGUAGE plpgsql
    AS $$
    BEGIN

        RETURN QUERY SELECT json_build_object('ok', params->>'testVal')::jsonb;
        
    END;
    $$;
  `);
};

exports.down = async function (knex) {
    await knex.raw(`DROP FUNCTION IF EXISTS prov.dummy_test_v1(jsonb);`);
};
