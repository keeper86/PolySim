import { z } from 'zod';
import { graphQuery } from './graphQuery';

export const EntityLineage = graphQuery({
    name: 'prov.entity.lineage.v1',

    params: z.object({
        entityId: z.string(),
        maxDepth: z.number().int().positive().max(50),
    }),

    result: z.object({
        nodes: z.array(
            z.object({
                id: z.string(),
                kind: z.enum(['Entity', 'Activity', 'Agent']),
            }),
        ),
        edges: z.array(
            z.object({
                from: z.string(),
                to: z.string(),
                label: z.string().optional(),
            }),
        ),
    }),

    cypher: `
        // Aggregate all matched paths, then extract distinct nodes and relationships
        // Match variable-length paths of any relationship type, up to the configured depth;
        // we'll filter the relationship kinds below to the set we care about.
        MATCH p = (e:Entity)<-[*1..$maxDepth]-(n)
        WHERE e.id = $entityId
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
    `,
});
