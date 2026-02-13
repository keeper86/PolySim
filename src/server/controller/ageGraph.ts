import { z } from 'zod';
import { procedure } from '../trpcRoot';
import { db } from '../db';
import { logger } from '../logger';

const provNode = z.object({
    id: z.string(),
    label: z.string().optional(),
    group: z.string().optional(),
});

const provEdge = z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
});

export const getProvGraph = () => {
    return procedure
        .input(
            z.object({
                includeEntities: z.boolean().optional(),
                includeActivities: z.boolean().optional(),
                includeAgents: z.boolean().optional(),
                maxItemsPerType: z.number().int().min(1).optional(),
            }),
        )
        .output(
            z.object({
                nodes: z.array(provNode),
                edges: z.array(provEdge),
            }),
        )
        .query(async ({ input }) => {
            const includeEntities = input.includeEntities ?? true;
            const includeActivities = input.includeActivities ?? true;
            const includeAgents = input.includeAgents ?? true;
            const max = input.maxItemsPerType ?? 200;

            const nodes: Array<{ id: string; label?: string; group?: string }> = [];
            const edges: Array<{ from: string; to: string; label?: string }> = [];

            try {
                if (includeEntities) {
                    const ents = await db.select('id', 'label').from('entities').limit(max);
                    for (const e of ents) {
                        // Use raw IDs (no prefix) to keep IDs consistent with storage
                        nodes.push({ id: String(e.id), label: e.label ?? `Entity ${e.id}`, group: 'entity' });
                    }
                }

                if (includeActivities) {
                    const acts = await db.select('id', 'label').from('activities').limit(max);
                    for (const a of acts) {
                        nodes.push({ id: String(a.id), label: a.label ?? `Activity ${a.id}`, group: 'activity' });
                    }
                }

                if (includeAgents) {
                    const ags = await db.select('id', 'label').from('agents').limit(max);
                    for (const ag of ags) {
                        nodes.push({ id: String(ag.id), label: ag.label ?? `Agent ${ag.id}`, group: 'agent' });
                    }
                }

                // relations
                const wgb = await db.select('*').from('was_generated_by').limit(max);
                for (const r of wgb) {
                    edges.push({ from: String(r.entity_id), to: String(r.activity_id), label: 'wasGeneratedBy' });
                }

                const used = await db.select('*').from('used').limit(max);
                for (const r of used) {
                    edges.push({ from: String(r.activity_id), to: String(r.entity_id), label: r.role ?? 'used' });
                }

                const wat = await db.select('*').from('was_attributed_to').limit(max);
                for (const r of wat) {
                    edges.push({ from: String(r.entity_id), to: String(r.agent_id), label: 'wasAttributedTo' });
                }

                const waw = await db.select('*').from('was_associated_with').limit(max);
                for (const r of waw) {
                    edges.push({
                        from: String(r.activity_id),
                        to: String(r.agent_id),
                        label: r.role ?? 'wasAssociatedWith',
                    });
                }

                const winf = await db.select('*').from('was_informed_by').limit(max);
                for (const r of winf) {
                    edges.push({ from: String(r.informed_id), to: String(r.informer_id), label: 'wasInformedBy' });
                }

                return { nodes, edges };
            } catch (err) {
                logger.error({ err }, 'Failed to build prov graph');
                return { nodes: [], edges: [] };
            }
        });
};
