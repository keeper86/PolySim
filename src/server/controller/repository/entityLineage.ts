import { z } from 'zod';
import type { GraphQuery } from './graphQuery';

export const entityLineage: GraphQuery = {
    name: 'entity_lineage_v2',

    input: z.object({
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
};
