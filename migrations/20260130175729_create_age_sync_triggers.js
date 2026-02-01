/**
 * Create trigger functions to synchronize relational provenance tables with Apache AGE graph
 *
 * Note: Uses EXECUTE with dynamic SQL to call cypher(), as per AGE documentation.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw("LOAD 'age'");
    await knex.raw("SET search_path = ag_catalog, '$user', public");

    // Entities: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_entity_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Entity {id: %L}) $cypher$) as (a agtype)',
                NEW.id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // Entities: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_entity_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L}) DETACH DELETE e $cypher$) as (a agtype)',
                OLD.id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // Activities: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_activity_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Activity {id: %L}) $cypher$) as (a agtype)',
                NEW.id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // Activities: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_activity_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L}) DETACH DELETE a $cypher$) as (a agtype)',
                OLD.id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // Agents: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_agent_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Agent {id: %L}) $cypher$) as (a agtype)',
                NEW.id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // Agents: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_agent_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (ag:Agent {id: %L}) DETACH DELETE ag $cypher$) as (a agtype)',
                OLD.id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // was_generated_by: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_generated_by_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L}) MATCH (a:Activity {id: %L}) CREATE (e)-[:wasGeneratedBy]->(a) $cypher$) as (a agtype)',
                NEW.entity_id, NEW.activity_id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // was_generated_by: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_generated_by_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L})-[r:wasGeneratedBy]->(a:Activity {id: %L}) DELETE r $cypher$) as (a agtype)',
                OLD.entity_id, OLD.activity_id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // used: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_used_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L}) MATCH (e:Entity {id: %L}) CREATE (a)-[:used {role: %L}]->(e) $cypher$) as (a agtype)',
                NEW.activity_id, NEW.entity_id, COALESCE(NEW.role, 'input')) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // used: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_used_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L})-[r:used]->(e:Entity {id: %L}) DELETE r $cypher$) as (a agtype)',
                OLD.activity_id, OLD.entity_id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // was_attributed_to: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_attributed_to_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L}) MATCH (ag:Agent {id: %L}) CREATE (e)-[:wasAttributedTo]->(ag) $cypher$) as (a agtype)',
                NEW.entity_id, NEW.agent_id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // was_attributed_to: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_attributed_to_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L})-[r:wasAttributedTo]->(ag:Agent {id: %L}) DELETE r $cypher$) as (a agtype)',
                OLD.entity_id, OLD.agent_id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // was_associated_with: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_associated_with_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L}) MATCH (ag:Agent {id: %L}) CREATE (a)-[:wasAssociatedWith {role: %L}]->(ag) $cypher$) as (a agtype)',
                NEW.activity_id, NEW.agent_id, COALESCE(NEW.role, '')) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // was_associated_with: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_associated_with_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L})-[r:wasAssociatedWith]->(ag:Agent {id: %L}) DELETE r $cypher$) as (a agtype)',
                OLD.activity_id, OLD.agent_id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // was_informed_by: INSERT
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_informed_by_insert()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (informed:Activity {id: %L}) MATCH (informer:Activity {id: %L}) CREATE (informed)-[:wasInformedBy]->(informer) $cypher$) as (a agtype)',
                NEW.informed_id, NEW.informer_id) INTO result;
            RETURN NEW;
        END;
        $func$;
    `);

    // was_informed_by: DELETE
    await knex.raw(`
        CREATE OR REPLACE FUNCTION sync_was_informed_by_delete()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SET search_path = ag_catalog, "$user", public
        AS $func$
        DECLARE
            result agtype;
        BEGIN
            EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (informed:Activity {id: %L})-[r:wasInformedBy]->(informer:Activity {id: %L}) DELETE r $cypher$) as (a agtype)',
                OLD.informed_id, OLD.informer_id) INTO result;
            RETURN OLD;
        END;
        $func$;
    `);

    // Attach all triggers
    const triggers = [
        ['entities', 'sync_entity'],
        ['activities', 'sync_activity'],
        ['agents', 'sync_agent'],
        ['was_generated_by', 'sync_was_generated_by'],
        ['used', 'sync_used'],
        ['was_attributed_to', 'sync_was_attributed_to'],
        ['was_associated_with', 'sync_was_associated_with'],
        ['was_informed_by', 'sync_was_informed_by'],
    ];

    for (const [table, funcPrefix] of triggers) {
        await knex.raw(`
            DROP TRIGGER IF EXISTS ${table}_insert_trigger ON ${table};
            CREATE TRIGGER ${table}_insert_trigger
            AFTER INSERT ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION ${funcPrefix}_insert();
        `);

        await knex.raw(`
            DROP TRIGGER IF EXISTS ${table}_delete_trigger ON ${table};
            CREATE TRIGGER ${table}_delete_trigger
            AFTER DELETE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION ${funcPrefix}_delete();
        `);
    }
};

exports.down = async function (knex) {
    const tables = [
        'entities',
        'activities',
        'agents',
        'was_generated_by',
        'used',
        'was_attributed_to',
        'was_associated_with',
        'was_informed_by',
    ];

    for (const table of tables) {
        await knex.raw(`DROP TRIGGER IF EXISTS ${table}_insert_trigger ON ${table}`);
        await knex.raw(`DROP TRIGGER IF EXISTS ${table}_delete_trigger ON ${table}`);
    }

    const functions = [
        'sync_entity_insert',
        'sync_entity_delete',
        'sync_activity_insert',
        'sync_activity_delete',
        'sync_agent_insert',
        'sync_agent_delete',
        'sync_was_generated_by_insert',
        'sync_was_generated_by_delete',
        'sync_used_insert',
        'sync_used_delete',
        'sync_was_attributed_to_insert',
        'sync_was_attributed_to_delete',
        'sync_was_associated_with_insert',
        'sync_was_associated_with_delete',
        'sync_was_informed_by_insert',
        'sync_was_informed_by_delete',
    ];

    for (const func of functions) {
        await knex.raw(`DROP FUNCTION IF EXISTS ${func}()`);
    }
};
