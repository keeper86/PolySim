# Apache AGE Integration

## Overview

PolySim integrates [Apache AGE (A Graph Extension for PostgreSQL)](https://age.apache.org/) to provide advanced graph query capabilities for the provenance data model. AGE enables Cypher queries on the relational provenance data while keeping PostgreSQL as the source of truth.

## Architecture

**Source of Truth**: PostgreSQL relational tables (`entities`, `activities`, `agents`, and join tables)

**Derived Representation**: Apache AGE property graph (`prov` graph)

**Synchronization**: Row-level triggers automatically maintain consistency between relational and graph representations

## Graph Schema

### Vertices

- **Entity**: Corresponds to the `entities` table
    - Properties: `id` only (metadata retrieved via relational join)
- **Activity**: Corresponds to the `activities` table
    - Properties: `id` only (metadata retrieved via relational join)
- **Agent**: Corresponds to the `agents` table
    - Properties: `id` only (metadata retrieved via relational join)

### Edges

- **wasGeneratedBy**: Entity → Activity (from `was_generated_by` table)
- **used**: Activity → Entity (from `used` table)
    - Property: `role`
- **wasAttributedTo**: Entity → Agent (from `was_attributed_to` table)
- **wasAssociatedWith**: Activity → Agent (from `was_associated_with` table)
    - Property: `role`
- **wasInformedBy**: Activity → Activity (from `was_informed_by` table)

**Design Principle**: The graph stores minimal data (only IDs and edge properties). All metadata, labels, and timestamps remain in relational tables and can be retrieved via joins using the `id` property.

## Usage Rules

### Writing Data

**✅ DO:**

- Write to relational tables (`entities`, `activities`, `agents`, join tables)
- Let triggers automatically synchronize to AGE

**❌ DON'T:**

- Write directly to the AGE graph from application code
- Modify the AGE graph manually (except via backfill script)
- Disable triggers in production

**⚠️ LIMITATION:**

- **UPDATE operations are not synchronized**: If you update an entity's label, metadata, or activity timestamps in the relational tables, the changes will NOT be reflected in the AGE graph. To sync after updates, you must either:
    1. Rebuild the entire graph using the backfill script
    2. Manually update the graph using Cypher
    3. Delete and re-insert the row (triggers will handle it)

### Reading Data

**Use Relational SQL when:**

- Querying single entities or simple joins
- Using fixed-depth relationships
- Leveraging PostgreSQL indexes and constraints

**Use AGE Cypher when:**

- Performing deep graph traversals
- Analyzing multi-hop relationships
- Using graph algorithms (shortest path, etc.)
- Exploring unknown relationship depths

## Example Queries

### Count all vertices by type

```sql
-- Count entities
SELECT * FROM ag_catalog.cypher('prov', $$
    MATCH (n:Entity)
    RETURN count(n)
$$) as (count agtype);

-- Count activities
SELECT * FROM ag_catalog.cypher('prov', $$
    MATCH (n:Activity)
    RETURN count(n)
$$) as (count agtype);

-- Count agents
SELECT * FROM ag_catalog.cypher('prov', $$
    MATCH (n:Agent)
    RETURN count(n)
$$) as (count agtype);
```

### Find provenance chain

```sql
-- Find all entities that were directly or indirectly used by an activity
SELECT * FROM ag_catalog.cypher('prov', $$
    MATCH (a:Activity {id: 'some-activity-id'})-[:used*1..5]->(e:Entity)
    RETURN e.id
$$) as (id agtype);
```

### Find entities attributed to a specific agent with metadata

```sql
-- Get entity IDs from graph, then join with relational table for full details
SELECT e.id, e.label, e.metadata
FROM ag_catalog.cypher('prov', $$
    MATCH (ent:Entity)-[:wasAttributedTo]->(ag:Agent {id: 'some-agent-id'})
    RETURN ent.id
$$) as (entity_id agtype)
JOIN entities e ON e.id = (entity_id #>> '{}')::text;
```

### Find activity dependencies

```sql
-- Find all activities that informed a specific activity (direct and indirect)
SELECT * FROM ag_catalog.cypher('prov', $$
    MATCH (a:Activity)-[:wasInformedBy*1..10]->(informer:Activity)
    WHERE a.id = 'target-activity-id'
    RETURN informer.id
$$) as (id agtype);
```

## Backfilling Existing Data

After enabling AGE and creating triggers, you need to backfill existing data:

```bash
# Assuming you have PostgreSQL client installed
psql -d polysimdb -U postgres -f scripts/backfill_age_graph.sql
```

The backfill script:

- Inserts all vertices (entities, activities, agents)
- Creates all edges (relationships from join tables)
- Runs within a transaction (all-or-nothing)
- Is idempotent on an empty graph

## Rebuilding the Graph

If the graph becomes out of sync (e.g., triggers were disabled), rebuild it:

```sql
-- 1. Drop and recreate the graph
SELECT ag_catalog.drop_graph('prov', true);
SELECT ag_catalog.create_graph('prov');

-- 2. Run the backfill script
\i scripts/backfill_age_graph.sql
```

## Database Migrations

The AGE integration is managed through Knex migrations:

1. **20260130175706_enable_apache_age.js**
    - Enables the AGE extension
    - Creates the `prov` graph

2. **20260130175729_create_age_sync_triggers.js**
    - Creates trigger functions for all vertices and edges
    - Attaches triggers to tables

## Troubleshooting

### Extension Not Found

If you see `ERROR: extension "age" is not available`:

- Apache AGE must be installed in PostgreSQL
- The Docker image needs to include AGE (see docker-compose configuration)

### Trigger Errors

If inserts fail with AGE-related errors:

- Check that the `prov` graph exists
- Verify search_path includes `ag_catalog`
- Ensure referenced vertices exist before creating edges

### Performance

- AGE queries run in the same transaction as relational operations
- Trigger overhead is minimal for single-row operations
- Bulk inserts may be slower; consider temporarily disabling triggers and running backfill

## References

- [Apache AGE Documentation](https://age.apache.org/docs/master/index.html)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [W3C PROV Data Model](https://www.w3.org/TR/prov-dm/)
