import { z } from 'zod';
import { procedure } from '../trpcRoot';
import { db } from '../db';
import { logger } from '../logger';

/**
 * Type for a node in the provenance lineage
 */
export type LineageNode = {
    id: string;
    label: string | null;
    nodeType: 'entity' | 'activity' | 'agent';
    depth: number;
    metadata: Record<string, unknown> | null;
};

/**
 * Type for an edge in the provenance lineage
 */
export type LineageEdge = {
    from: string;
    to: string;
    relationshipType: string;
    role: string | null;
};

/**
 * Database row type returned by PostgreSQL lineage functions
 */
interface LineageRow {
    node_id: string;
    node_label: string | null;
    node_type: 'entity' | 'activity' | 'agent';
    depth: number;
    metadata: Record<string, unknown> | null;
    edge_from: string | null;
    edge_to: string | null;
    relationship_type: string | null;
    role: string | null;
}

/**
 * Database row type for common ancestors query
 */
interface CommonAncestorRow {
    node_id: string;
    node_label: string | null;
    node_type: 'entity' | 'activity' | 'agent';
    depth: number;
    metadata: Record<string, unknown> | null;
    edge_from: string | null;
    edge_to: string | null;
    relationship_type: string | null;
    role: string | null;
}

/**
 * Parse lineage rows from PostgreSQL function into nodes and edges
 */
const parseLineageResults = (
    rows: LineageRow[],
    _includeMetadata: boolean,
): { nodes: LineageNode[]; edges: LineageEdge[] } => {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const seenNodes = new Set<string>();
    const seenEdges = new Set<string>();

    for (const row of rows) {
        // Add node if not already seen
        if (!seenNodes.has(row.node_id)) {
            nodes.push({
                id: row.node_id,
                label: row.node_label,
                nodeType: row.node_type,
                depth: row.depth,
                metadata: row.metadata,
            });
            seenNodes.add(row.node_id);
        }

        // Add edge if present and not already seen
        if (row.edge_from && row.edge_to && row.relationship_type) {
            const edgeKey = `${row.edge_from}->${row.edge_to}:${row.relationship_type}`;
            if (!seenEdges.has(edgeKey)) {
                edges.push({
                    from: row.edge_from,
                    to: row.edge_to,
                    relationshipType: row.relationship_type,
                    role: row.role,
                });
                seenEdges.add(edgeKey);
            }
        }
    }

    return { nodes, edges };
};

/**
 * Endpoint: Get entity lineage (backward traversal)
 * Finds all ancestor entities that contributed to the creation of a given entity
 */
export const getEntityLineage = () => {
    return procedure
        .input(
            z.object({
                entityId: z.string(),
                maxDepth: z.number().int().positive().optional(),
                includeMetadata: z.boolean().optional().default(false),
            }),
        )
        .query(async ({ input }) => {
            const { entityId, maxDepth, includeMetadata } = input;

            logger.info({ entityId, maxDepth, includeMetadata }, 'Fetching entity lineage');

            // Call PostgreSQL function
            const result = await db.raw<{ rows: LineageRow[] }>(`SELECT * FROM get_entity_lineage(?, ?, ?)`, [
                entityId,
                maxDepth ?? null,
                includeMetadata,
            ]);

            const { nodes, edges } = parseLineageResults(result.rows, includeMetadata);

            logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, 'Retrieved lineage');

            return {
                nodes,
                edges,
            };
        });
};

/**
 * Endpoint: Get entity descendants (forward traversal)
 * Finds all descendant entities that were derived from a given entity
 */
export const getEntityDescendants = () => {
    return procedure
        .input(
            z.object({
                entityId: z.string(),
                maxDepth: z.number().int().positive().optional(),
                includeMetadata: z.boolean().optional().default(false),
            }),
        )
        .query(async ({ input }) => {
            const { entityId, maxDepth, includeMetadata } = input;

            logger.info({ entityId, maxDepth, includeMetadata }, 'Fetching entity descendants');

            // Call PostgreSQL function
            const result = await db.raw<{ rows: LineageRow[] }>(`SELECT * FROM get_entity_descendants(?, ?, ?)`, [
                entityId,
                maxDepth ?? null,
                includeMetadata,
            ]);

            const { nodes, edges } = parseLineageResults(result.rows, includeMetadata);

            logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, 'Retrieved descendants');

            return {
                nodes,
                edges,
            };
        });
};

/**
 * Endpoint: Get common ancestors
 * Finds common ancestor entities that contributed to both specified entities
 */
export const getCommonAncestors = () => {
    return procedure
        .input(
            z.object({
                entityId1: z.string(),
                entityId2: z.string(),
                maxDepth: z.number().int().positive().optional(),
                includeMetadata: z.boolean().optional().default(false),
            }),
        )
        .query(async ({ input }) => {
            const { entityId1, entityId2, maxDepth, includeMetadata } = input;

            logger.info({ entityId1, entityId2, maxDepth, includeMetadata }, 'Fetching common ancestors');

            // Call PostgreSQL function
            const result = await db.raw<{ rows: CommonAncestorRow[] }>(
                `SELECT * FROM get_common_ancestors(?, ?, ?, ?)`,
                [entityId1, entityId2, maxDepth ?? null, includeMetadata],
            );

            // Use the same parseLineageResults function
            const { nodes, edges } = parseLineageResults(result.rows, includeMetadata);

            logger.info({ nodeCount: nodes.length }, 'Retrieved common ancestors');

            return {
                nodes,
                edges,
            };
        });
};
