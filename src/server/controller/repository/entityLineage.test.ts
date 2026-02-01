import { createHash, randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { getCaller, getPatCaller } from 'tests/vitest/setupTestcontainer';
type Node = { id: string; kind: 'Entity' | 'Activity' | 'Agent' };
type Edge = { from: string; to: string; label?: string };
type LineageResult = { nodes: Node[]; edges: Edge[] };

describe('prov.entity.lineage.v2 (integration)', () => {
    it.skip.each(['next-auth', 'pat'])('returns upstream lineage for an entity (%s)', async (callerType) => {
        const testUserId = randomUUID();
        const caller = callerType === 'next-auth' ? getCaller(testUserId) : getPatCaller(testUserId);

        const activityId = createHash('sha256')
            .update('lineage-activity' + callerType + Date.now())
            .digest('hex');
        const outputEntityId = createHash('sha256')
            .update('lineage-entity-output' + callerType + Date.now())
            .digest('hex');
        const processEntityId = createHash('sha256')
            .update('lineage-entity-process' + callerType + Date.now())
            .digest('hex');

        const now = Date.now();

        // upload an activity which generates outputEntityId from processEntityId
        await caller.uploadActivity({
            entities: [
                { id: outputEntityId, label: 'Output', metadata: {}, role: 'output', createdAt: now },
                { id: processEntityId, label: 'Process', metadata: {}, role: 'process', createdAt: now },
            ],
            activity: { id: activityId, label: 'Lineage Activity', startedAt: now, endedAt: now, metadata: {} },
        });

        // Allow triggers to run (they are synchronous with the insert, but keep parity with other tests)

        const res = (await caller.getEntityLineage({ entityId: outputEntityId, maxDepth: 5 })) as LineageResult;

        expect(res.nodes).toBeDefined();
        expect(Array.isArray(res.nodes)).toBe(true);
        const foundEntity = res.nodes.find((n) => n.id === outputEntityId);
        expect(foundEntity).toBeDefined();
        // now safe to access
        expect(foundEntity!.kind).toBe('Entity');

        // activity should be present
        const foundActivity = res.nodes.find((n) => n.id === activityId);
        expect(foundActivity).toBeDefined();
        expect(foundActivity!.kind).toBe('Activity');

        // check edges include link between entity and activity
        expect(res.edges).toBeDefined();
        const link = res.edges.find(
            (e) =>
                (e.from === outputEntityId && e.to === activityId) ||
                (e.from === activityId && e.to === outputEntityId),
        );
        expect(link).toBeDefined();
    });

    it('throws when entity is not present', async () => {
        const caller = getCaller();
        const fakeId = createHash('sha256')
            .update('nonexistent' + Date.now())
            .digest('hex');

        await expect(caller.getEntityLineage({ entityId: fakeId, maxDepth: 3 })).rejects.toThrow();
    });
});
