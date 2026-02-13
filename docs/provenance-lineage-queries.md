# Provenance Lineage Queries with Recursive CTEs

## Overview

PolySim now includes efficient provenance lineage queries using PostgreSQL's **Recursive Common Table Expressions (CTEs)**. These queries allow you to trace the complete history and dependencies of entities in your PROV-DM graph without loading the entire graph into memory.

## What are Recursive CTEs?

**CTEs (Common Table Expressions)** are temporary named result sets in SQL, similar to subqueries. **Recursive CTEs** can reference themselves, making them perfect for **graph traversal** operations.

### Why Recursive CTEs vs Other Solutions?

| Solution              | Pros                                                        | Cons                                     |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| **Recursive CTEs** ✅ | Native PostgreSQL, standard SQL, efficient, no dependencies | Requires PostgreSQL knowledge            |
| Apache AGE            | Graph-native syntax                                         | Brittle, lots of custom code, immature   |
| Ontop VKG             | SPARQL compliance, semantic web                             | Complex setup, overkill for internal use |
| Loading full graph    | Simple to understand                                        | Doesn't scale, wastes memory             |

## Available Endpoints

### 1. `getEntityLineage` - Backward Traversal

Traces **backwards** through the provenance graph to find all ancestors of an entity.

**Use cases:**

- "How was this file created?"
- "What input data contributed to this result?"
- "Show me the complete processing pipeline"

**Example Query:**

```typescript
const lineage = await trpc.getEntityLineage.query({
    entityId: '/output/results.csv',
    maxDepth: 10,
    includeMetadata: true,
});

// Returns: { nodes: [...], edges: [...] }
```

**SQL Implementation:**

```sql
WITH RECURSIVE lineage AS (
    -- Start with the target entity
    SELECT e.id, 'entity' as type, 0 as depth
    FROM entities e WHERE e.id = '/output/results.csv'

    UNION ALL

    -- Follow edges backward through activities
    SELECT
        CASE WHEN l.type = 'entity' THEN a.id ELSE e.id END,
        CASE WHEN l.type = 'entity' THEN 'activity' ELSE 'entity' END,
        l.depth + 1
    FROM lineage l
    LEFT JOIN was_generated_by wgb ON wgb.entity_id = l.id
    LEFT JOIN activities a ON a.id = wgb.activity_id
    LEFT JOIN used u ON u.activity_id = l.id
    LEFT JOIN entities e ON e.id = u.entity_id
    WHERE l.depth < 10 AND (cycle detection)
)
SELECT * FROM lineage;
```

### 2. `getEntityDescendants` - Forward Traversal

Traces **forwards** through the provenance graph to find all descendants of an entity.

**Use cases:**

- "What files were derived from this input?"
- "Show me all downstream processing"
- "Impact analysis: what breaks if I change this?"

**Example Query:**

```typescript
const descendants = await trpc.getEntityDescendants.query({
    entityId: '/input/raw_data.csv',
    maxDepth: 10,
    includeMetadata: false,
});
```

### 3. `getCommonAncestors` - Find Shared Lineage

Finds entities that are ancestors of **both** specified entities.

**Use cases:**

- "Do these two results share common input data?"
- "Find the branching point in the pipeline"
- "What common dependencies do these outputs have?"

**Example Query:**

```typescript
const common = await trpc.getCommonAncestors.query({
    entityId1: '/output/report_a.pdf',
    entityId2: '/output/report_b.pdf',
    maxDepth: 10,
});

// Returns common ancestors sorted by total distance
```

## API Reference

### Input Schema

```typescript
// getEntityLineage & getEntityDescendants
{
    entityId: string,        // The entity ID to trace
    maxDepth?: number,       // Max graph depth (default: 10, max: 100)
    includeMetadata?: boolean // Include metadata fields (default: false)
}

// getCommonAncestors
{
    entityId1: string,       // First entity ID
    entityId2: string,       // Second entity ID
    maxDepth?: number        // Max depth to search (default: 10, max: 100)
}
```

### Output Schema

```typescript
// Lineage queries return:
{
    nodes: Array<{
        id: string,
        label: string | null,
        nodeType: 'entity' | 'activity' | 'agent',
        depth: number,
        metadata: Record<string, unknown> | null
    }>,
    edges: Array<{
        from: string,
        to: string,
        relationshipType: string,
        role: string | null
    }>
}

// Common ancestors returns:
{
    commonAncestors: Array<{
        id: string,
        label: string | null,
        depthFromEntity1: number,
        depthFromEntity2: number
    }>
}
```

## Performance Characteristics

### Scalability

- ✅ **Only loads relevant nodes**: Unlike loading the full graph, CTEs traverse only necessary paths
- ✅ **PostgreSQL optimized**: Native query planner handles optimization
- ✅ **Memory efficient**: Results streamed, not loaded all at once
- ✅ **Cycle detection**: Path tracking prevents infinite loops

### Benchmarks (Approximate)

- Small graph (< 100 nodes): < 10ms
- Medium graph (100-1,000 nodes): 10-100ms
- Large graph (1,000-10,000 nodes): 100ms-1s
- Very large (> 10,000 nodes): Use `maxDepth` limits

## Implementation Details

### File Structure

```
src/server/controller/
├── provenance.ts        # Recursive CTE endpoints with helper functions
├── provenance.test.ts   # Comprehensive test suite (10 tests)
└── ageGraph.ts          # Existing full graph endpoint
```

### Code Organization

The implementation uses **well-structured helper functions** to keep the code maintainable:

**Helper Functions:**

- `buildMetadataSelect()` - Conditionally includes metadata in queries
- `buildAlternatingMetadataSelect()` - Handles metadata for entity/activity alternation
- `parseLineageResults()` - Transforms database rows into typed nodes/edges
- `executeBackwardLineageQuery()` - Executes ancestor traversal SQL
- `executeForwardLineageQuery()` - Executes descendant traversal SQL
- `executeCommonAncestorsQuery()` - Finds shared ancestry

**Benefits of this structure:**

- ✅ SQL is isolated in dedicated query functions
- ✅ Business logic separated from data access
- ✅ Reusable parsing logic
- ✅ Type-safe interfaces (`LineageRow`, `LineageNode`, `LineageEdge`)
- ✅ Easier to test and maintain
- ✅ Clear separation of concerns

**Example structure:**

```typescript
// Helper function encapsulates SQL
const executeBackwardLineageQuery = async (
    knex: Knex,
    entityId: string,
    maxDepth: number,
    includeMetadata: boolean,
): Promise<LineageRow[]> => {
    // Recursive CTE SQL here...
};

// Endpoint uses helpers
export const getEntityLineage = () => {
    return procedure.query(async ({ input }) => {
        const rows = await executeBackwardLineageQuery(db, input.entityId, input.maxDepth, input.includeMetadata);
        return parseLineageResults(rows);
    });
};
```

### How Cycle Detection Works

The queries maintain a `path` array to track visited nodes:

```sql
-- Example cycle detection
WHERE NOT (next_node_id = ANY(path_array))
```

This prevents:

- Infinite loops in cyclic graphs
- Re-processing the same node
- Incorrect lineage calculations

### Relationship Mappings

| PROV Relationship   | Direction           | Meaning                        |
| ------------------- | ------------------- | ------------------------------ |
| `wasGeneratedBy`    | Entity → Activity   | Entity was created by activity |
| `used`              | Activity → Entity   | Activity consumed entity       |
| `wasAttributedTo`   | Entity → Agent      | Entity created by agent        |
| `wasAssociatedWith` | Activity → Agent    | Agent performed activity       |
| `wasInformedBy`     | Activity → Activity | Activity triggered by activity |

## Usage Examples

### Example 1: Debug a Failed Pipeline

```typescript
// Find out what inputs led to a corrupted output file
const lineage = await trpc.getEntityLineage.query({
    entityId: '/output/corrupted_results.csv',
    maxDepth: 20,
    includeMetadata: true,
});

// Check metadata for each ancestor
lineage.nodes
    .filter((n) => n.nodeType === 'entity')
    .forEach((e) => {
        console.log(`${e.id}: ${JSON.stringify(e.metadata)}`);
    });
```

### Example 2: Impact Analysis

```typescript
// See what would be affected by changing an input file
const impact = await trpc.getEntityDescendants.query({
    entityId: '/input/config.json',
    maxDepth: 15,
});

console.log(`${impact.nodes.length} items would be affected`);
```

### Example 3: Data Lineage Audit

```typescript
// Verify two reports use the same source data
const shared = await trpc.getCommonAncestors.query({
    entityId1: '/reports/q1_summary.pdf',
    entityId2: '/reports/q1_detailed.pdf',
    maxDepth: 10,
});

if (shared.commonAncestors.length === 0) {
    console.warn('Reports have different source data!');
}
```

## Testing

Comprehensive test suite with 10 tests covering:

- ✅ Full backward lineage traversal
- ✅ Full forward lineage traversal
- ✅ Depth limiting
- ✅ Cycle detection
- ✅ Metadata inclusion
- ✅ Empty result handling
- ✅ Common ancestor finding
- ✅ Diamond pattern graphs

**Run tests:**

```bash
npm run test:server -- provenance
```

## Future Enhancements

Potential additions:

1. **Shortest path queries**: Find minimal path between two entities
2. **Filtered traversal**: Only follow specific relationship types
3. **Time-based queries**: Lineage within time windows
4. **Aggregation queries**: Count descendants, measure graph depth
5. **Visualization helpers**: Export to DOT/Graphviz format

## Migration from `ageGraph`

The existing `getProvGraph` endpoint still works for visualization, but for lineage queries, use the new endpoints:

| Old Approach                      | New Approach                     |
| --------------------------------- | -------------------------------- |
| `getProvGraph()` → client filters | `getEntityLineage({ entityId })` |
| Load all, filter client-side      | Server-side CTE query            |
| ~200 nodes max                    | Scales to thousands              |
| JavaScript traversal              | PostgreSQL native                |

## References

- [PostgreSQL Recursive CTEs Documentation](https://www.postgresql.org/docs/current/queries-with.html)
- [PROV-DM Specification](https://www.w3.org/TR/prov-dm/)
- [PolySim Architecture Documentation](../arc42/arc42.adoc)
