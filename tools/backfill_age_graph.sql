-- Backfill Apache AGE graph from existing relational provenance data
--
-- This script populates the AGE 'prov' graph with all existing data from the
-- relational tables. It should be run once after enabling AGE and creating triggers.
--
-- Prerequisites:
-- - Apache AGE extension must be installed
-- - The 'prov' graph must exist
-- - Triggers should be created (to handle future inserts)
--
-- Usage:
--   psql -d polysimdb -U postgres -f scripts/backfill_age_graph.sql
--
-- WARNING: This script is NOT idempotent. Running it multiple times will create
-- duplicate vertices and edges. To re-run, first clear the graph:
--   SELECT ag_catalog.drop_graph('prov', true);
--   SELECT ag_catalog.create_graph('prov');

-- Set search path to include AGE catalog
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Start transaction
BEGIN;

-- Step 1: Insert all entities as vertices
DO $$
DECLARE
    entity_row RECORD;
    entity_count INTEGER := 0;
BEGIN
    FOR entity_row IN SELECT id FROM entities ORDER BY created_at NULLS LAST
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Entity {id: %L}) $cypher$) as (a agtype)',
            entity_row.id);
        entity_count := entity_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % entities', entity_count;
END $$;

-- Step 2: Insert all activities as vertices
DO $$
DECLARE
    activity_row RECORD;
    activity_count INTEGER := 0;
BEGIN
    FOR activity_row IN SELECT id FROM activities ORDER BY started_at
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Activity {id: %L}) $cypher$) as (a agtype)',
            activity_row.id);
        activity_count := activity_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % activities', activity_count;
END $$;

-- Step 3: Insert all agents as vertices
DO $$
DECLARE
    agent_row RECORD;
    agent_count INTEGER := 0;
BEGIN
    FOR agent_row IN SELECT id FROM agents ORDER BY created_at NULLS LAST
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ CREATE (:Agent {id: %L}) $cypher$) as (a agtype)',
            agent_row.id);
        agent_count := agent_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % agents', agent_count;
END $$;

-- Step 4: Insert all wasGeneratedBy edges
DO $$
DECLARE
    edge_row RECORD;
    edge_count INTEGER := 0;
BEGIN
    FOR edge_row IN SELECT * FROM was_generated_by
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L}) MATCH (a:Activity {id: %L}) CREATE (e)-[:wasGeneratedBy]->(a) $cypher$) as (a agtype)',
            edge_row.entity_id, edge_row.activity_id);
        edge_count := edge_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % wasGeneratedBy edges', edge_count;
END $$;

-- Step 5: Insert all used edges
DO $$
DECLARE
    edge_row RECORD;
    edge_count INTEGER := 0;
BEGIN
    FOR edge_row IN SELECT * FROM used
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L}) MATCH (e:Entity {id: %L}) CREATE (a)-[:used {role: %L}]->(e) $cypher$) as (a agtype)',
            edge_row.activity_id, edge_row.entity_id, COALESCE(edge_row.role, 'input'));
        edge_count := edge_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % used edges', edge_count;
END $$;

-- Step 6: Insert all wasAttributedTo edges
DO $$
DECLARE
    edge_row RECORD;
    edge_count INTEGER := 0;
BEGIN
    FOR edge_row IN SELECT * FROM was_attributed_to
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (e:Entity {id: %L}) MATCH (ag:Agent {id: %L}) CREATE (e)-[:wasAttributedTo]->(ag) $cypher$) as (a agtype)',
            edge_row.entity_id, edge_row.agent_id);
        edge_count := edge_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % wasAttributedTo edges', edge_count;
END $$;

-- Step 7: Insert all wasAssociatedWith edges
DO $$
DECLARE
    edge_row RECORD;
    edge_count INTEGER := 0;
BEGIN
    FOR edge_row IN SELECT * FROM was_associated_with
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (a:Activity {id: %L}) MATCH (ag:Agent {id: %L}) CREATE (a)-[:wasAssociatedWith {role: %L}]->(ag) $cypher$) as (a agtype)',
            edge_row.activity_id, edge_row.agent_id, COALESCE(edge_row.role, ''));
        edge_count := edge_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % wasAssociatedWith edges', edge_count;
END $$;

-- Step 8: Insert all wasInformedBy edges
DO $$
DECLARE
    edge_row RECORD;
    edge_count INTEGER := 0;
BEGIN
    FOR edge_row IN SELECT * FROM was_informed_by
    LOOP
        EXECUTE format('SELECT * FROM ag_catalog.cypher(''prov'', $cypher$ MATCH (informed:Activity {id: %L}) MATCH (informer:Activity {id: %L}) CREATE (informed)-[:wasInformedBy]->(informer) $cypher$) as (a agtype)',
            edge_row.informed_id, edge_row.informer_id);
        edge_count := edge_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % wasInformedBy edges', edge_count;
END $$;

-- Commit transaction
COMMIT;

-- Validation
DO $$
DECLARE
    rel_entities INTEGER;
    rel_activities INTEGER;
    rel_agents INTEGER;
    rel_was_generated_by INTEGER;
    rel_used INTEGER;
    rel_was_attributed_to INTEGER;
    rel_was_associated_with INTEGER;
    rel_was_informed_by INTEGER;
    
    graph_entities INTEGER;
    graph_activities INTEGER;
    graph_agents INTEGER;
    graph_was_generated_by INTEGER;
    graph_used INTEGER;
    graph_was_attributed_to INTEGER;
    graph_was_associated_with INTEGER;
    graph_was_informed_by INTEGER;
    
    all_valid BOOLEAN := true;
BEGIN
    -- Get relational counts
    SELECT COUNT(*) INTO rel_entities FROM entities;
    SELECT COUNT(*) INTO rel_activities FROM activities;
    SELECT COUNT(*) INTO rel_agents FROM agents;
    SELECT COUNT(*) INTO rel_was_generated_by FROM was_generated_by;
    SELECT COUNT(*) INTO rel_used FROM used;
    SELECT COUNT(*) INTO rel_was_attributed_to FROM was_attributed_to;
    SELECT COUNT(*) INTO rel_was_associated_with FROM was_associated_with;
    SELECT COUNT(*) INTO rel_was_informed_by FROM was_informed_by;
    
    -- Get graph counts
    SELECT count::integer INTO graph_entities 
        FROM ag_catalog.cypher('prov', $$ MATCH (n:Entity) RETURN count(n) $$) as (count agtype);
    SELECT count::integer INTO graph_activities 
        FROM ag_catalog.cypher('prov', $$ MATCH (n:Activity) RETURN count(n) $$) as (count agtype);
    SELECT count::integer INTO graph_agents 
        FROM ag_catalog.cypher('prov', $$ MATCH (n:Agent) RETURN count(n) $$) as (count agtype);
    SELECT count::integer INTO graph_was_generated_by 
        FROM ag_catalog.cypher('prov', $$ MATCH ()-[r:wasGeneratedBy]->() RETURN count(r) $$) as (count agtype);
    SELECT count::integer INTO graph_used 
        FROM ag_catalog.cypher('prov', $$ MATCH ()-[r:used]->() RETURN count(r) $$) as (count agtype);
    SELECT count::integer INTO graph_was_attributed_to 
        FROM ag_catalog.cypher('prov', $$ MATCH ()-[r:wasAttributedTo]->() RETURN count(r) $$) as (count agtype);
    SELECT count::integer INTO graph_was_associated_with 
        FROM ag_catalog.cypher('prov', $$ MATCH ()-[r:wasAssociatedWith]->() RETURN count(r) $$) as (count agtype);
    SELECT count::integer INTO graph_was_informed_by 
        FROM ag_catalog.cypher('prov', $$ MATCH ()-[r:wasInformedBy]->() RETURN count(r) $$) as (count agtype);
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Backfill Validation ===';
    RAISE NOTICE '';
    
    -- Validate vertices
    IF rel_entities = graph_entities THEN
        RAISE NOTICE '✓ Entities: % (relational) = % (graph)', rel_entities, graph_entities;
    ELSE
        RAISE WARNING '✗ Entities: % (relational) ≠ % (graph)', rel_entities, graph_entities;
        all_valid := false;
    END IF;
    
    IF rel_activities = graph_activities THEN
        RAISE NOTICE '✓ Activities: % (relational) = % (graph)', rel_activities, graph_activities;
    ELSE
        RAISE WARNING '✗ Activities: % (relational) ≠ % (graph)', rel_activities, graph_activities;
        all_valid := false;
    END IF;
    
    IF rel_agents = graph_agents THEN
        RAISE NOTICE '✓ Agents: % (relational) = % (graph)', rel_agents, graph_agents;
    ELSE
        RAISE WARNING '✗ Agents: % (relational) ≠ % (graph)', rel_agents, graph_agents;
        all_valid := false;
    END IF;
    
    RAISE NOTICE '';
    
    -- Validate edges
    IF rel_was_generated_by = graph_was_generated_by THEN
        RAISE NOTICE '✓ wasGeneratedBy: % (relational) = % (graph)', rel_was_generated_by, graph_was_generated_by;
    ELSE
        RAISE WARNING '✗ wasGeneratedBy: % (relational) ≠ % (graph)', rel_was_generated_by, graph_was_generated_by;
        all_valid := false;
    END IF;
    
    IF rel_used = graph_used THEN
        RAISE NOTICE '✓ used: % (relational) = % (graph)', rel_used, graph_used;
    ELSE
        RAISE WARNING '✗ used: % (relational) ≠ % (graph)', rel_used, graph_used;
        all_valid := false;
    END IF;
    
    IF rel_was_attributed_to = graph_was_attributed_to THEN
        RAISE NOTICE '✓ wasAttributedTo: % (relational) = % (graph)', rel_was_attributed_to, graph_was_attributed_to;
    ELSE
        RAISE WARNING '✗ wasAttributedTo: % (relational) ≠ % (graph)', rel_was_attributed_to, graph_was_attributed_to;
        all_valid := false;
    END IF;
    
    IF rel_was_associated_with = graph_was_associated_with THEN
        RAISE NOTICE '✓ wasAssociatedWith: % (relational) = % (graph)', rel_was_associated_with, graph_was_associated_with;
    ELSE
        RAISE WARNING '✗ wasAssociatedWith: % (relational) ≠ % (graph)', rel_was_associated_with, graph_was_associated_with;
        all_valid := false;
    END IF;
    
    IF rel_was_informed_by = graph_was_informed_by THEN
        RAISE NOTICE '✓ wasInformedBy: % (relational) = % (graph)', rel_was_informed_by, graph_was_informed_by;
    ELSE
        RAISE WARNING '✗ wasInformedBy: % (relational) ≠ % (graph)', rel_was_informed_by, graph_was_informed_by;
        all_valid := false;
    END IF;
    
    RAISE NOTICE '';
    
    IF all_valid THEN
        RAISE NOTICE '=== ✓ All validations passed! Backfill completed successfully. ===';
    ELSE
        RAISE WARNING '=== ✗ Some validations failed. Please investigate discrepancies. ===';
    END IF;
END $$;
