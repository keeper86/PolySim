import { beforeEach, describe, expect, it } from 'vitest';
import { getCaller, getDb } from 'tests/vitest/setupTestcontainer';
import { randomUUID } from 'crypto';

const testUserId = randomUUID();

describe('Provenance Lineage Queries', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(async () => {
        db = getDb();
        // Clean up all provenance tables
        await db('was_associated_with').del();
        await db('was_attributed_to').del();
        await db('used').del();
        await db('was_generated_by').del();
        await db('was_informed_by').del();
        await db('agents').del();
        await db('activities').del();
        await db('entities').del();
    });

    describe('getEntityLineage', () => {
        it('should return the full backward lineage of an entity', async () => {
            // Create a simple lineage chain: input1.txt -> process1 -> intermediate.txt -> process2 -> output.txt
            await db('entities').insert([
                { id: 'input1.txt', label: 'Input File 1', metadata: {} },
                { id: 'intermediate.txt', label: 'Intermediate File', metadata: {} },
                { id: 'output.txt', label: 'Output File', metadata: {} },
            ]);

            await db('activities').insert([
                {
                    id: 'process1',
                    label: 'First Process',
                    started_at: new Date('2026-01-01T10:00:00Z'),
                    ended_at: new Date('2026-01-01T10:01:00Z'),
                    metadata: {},
                },
                {
                    id: 'process2',
                    label: 'Second Process',
                    started_at: new Date('2026-01-01T10:02:00Z'),
                    ended_at: new Date('2026-01-01T10:03:00Z'),
                    metadata: {},
                },
            ]);

            await db('used').insert([
                { activity_id: 'process1', entity_id: 'input1.txt', role: 'input' },
                { activity_id: 'process2', entity_id: 'intermediate.txt', role: 'input' },
            ]);

            await db('was_generated_by').insert([
                { entity_id: 'intermediate.txt', activity_id: 'process1' },
                { entity_id: 'output.txt', activity_id: 'process2' },
            ]);

            // Query the lineage of output.txt
            const caller = getCaller(testUserId);

            const result = await caller.getEntityLineage({
                entityId: 'output.txt',
                maxDepth: 10,
                includeMetadata: false,
            });

            // Verify we have all nodes in the lineage
            expect(result.nodes).toHaveLength(5); // output.txt, process2, intermediate.txt, process1, input1.txt

            const nodeIds = result.nodes.map((n) => n.id).sort();
            expect(nodeIds).toEqual(['input1.txt', 'intermediate.txt', 'output.txt', 'process1', 'process2']);

            // Verify node types
            const entities = result.nodes.filter((n) => n.nodeType === 'entity');
            const activities = result.nodes.filter((n) => n.nodeType === 'activity');
            expect(entities).toHaveLength(3);
            expect(activities).toHaveLength(2);

            // Verify edges connect the lineage correctly
            expect(result.edges).toHaveLength(4);
            expect(result.edges).toContainEqual({
                from: 'output.txt',
                to: 'process2',
                relationshipType: 'wasGeneratedBy',
                role: null,
            });
            expect(result.edges).toContainEqual({
                from: 'process2',
                to: 'intermediate.txt',
                relationshipType: 'used',
                role: 'input',
            });
            expect(result.edges).toContainEqual({
                from: 'intermediate.txt',
                to: 'process1',
                relationshipType: 'wasGeneratedBy',
                role: null,
            });
            expect(result.edges).toContainEqual({
                from: 'process1',
                to: 'input1.txt',
                relationshipType: 'used',
                role: 'input',
            });
        });

        it('should respect maxDepth parameter', async () => {
            // Create a chain of 4 entities
            await db('entities').insert([
                { id: 'e1', label: 'Entity 1', metadata: {} },
                { id: 'e2', label: 'Entity 2', metadata: {} },
                { id: 'e3', label: 'Entity 3', metadata: {} },
                { id: 'e4', label: 'Entity 4', metadata: {} },
            ]);

            await db('activities').insert([
                {
                    id: 'a1',
                    label: 'Activity 1',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'a2',
                    label: 'Activity 2',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'a3',
                    label: 'Activity 3',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
            ]);

            await db('used').insert([
                { activity_id: 'a1', entity_id: 'e1', role: 'input' },
                { activity_id: 'a2', entity_id: 'e2', role: 'input' },
                { activity_id: 'a3', entity_id: 'e3', role: 'input' },
            ]);

            await db('was_generated_by').insert([
                { entity_id: 'e2', activity_id: 'a1' },
                { entity_id: 'e3', activity_id: 'a2' },
                { entity_id: 'e4', activity_id: 'a3' },
            ]);

            const caller = getCaller(testUserId);

            // Query with maxDepth=2, should only get e4 -> a3 -> e3
            const result = await caller.getEntityLineage({
                entityId: 'e4',
                maxDepth: 2,
                includeMetadata: false,
            });

            // Should have e4 (depth 0), a3 (depth 1), e3 (depth 2), but not a2 or e2
            const nodeIds = result.nodes.map((n) => n.id).sort();
            expect(nodeIds).toEqual(['a3', 'e3', 'e4']);
        });

        it('should handle entities with no lineage', async () => {
            await db('entities').insert({ id: 'orphan.txt', label: 'Orphan File', metadata: {} });

            const caller = getCaller(testUserId);

            const result = await caller.getEntityLineage({
                entityId: 'orphan.txt',
                maxDepth: 10,
                includeMetadata: false,
            });

            // Should only return the entity itself
            expect(result.nodes).toHaveLength(1);
            expect(result.nodes[0]).toMatchObject({
                id: 'orphan.txt',
                label: 'Orphan File',
                nodeType: 'entity',
                depth: 0,
            });
            expect(result.edges).toHaveLength(0);
        });

        it('should include metadata when requested', async () => {
            await db('entities').insert([
                { id: 'input.txt', label: 'Input', metadata: { size: 1024, format: 'txt' } },
                { id: 'output.txt', label: 'Output', metadata: { size: 2048, format: 'txt' } },
            ]);

            await db('activities').insert({
                id: 'transform',
                label: 'Transform',
                started_at: new Date(),
                ended_at: new Date(),
                metadata: { tool: 'converter', version: '1.0' },
            });

            await db('used').insert({ activity_id: 'transform', entity_id: 'input.txt', role: 'input' });
            await db('was_generated_by').insert({ entity_id: 'output.txt', activity_id: 'transform' });

            const caller = getCaller(testUserId);

            const result = await caller.getEntityLineage({
                entityId: 'output.txt',
                maxDepth: 10,
                includeMetadata: true,
            });

            const outputNode = result.nodes.find((n) => n.id === 'output.txt');
            expect(outputNode?.metadata).toEqual({ size: 2048, format: 'txt' });

            const transformNode = result.nodes.find((n) => n.id === 'transform');
            expect(transformNode?.metadata).toEqual({ tool: 'converter', version: '1.0' });
        });

        it('should detect and avoid cycles', async () => {
            // Create a cycle: e1 -> a1 -> e2 -> a2 -> e1
            await db('entities').insert([
                { id: 'e1', label: 'Entity 1', metadata: {} },
                { id: 'e2', label: 'Entity 2', metadata: {} },
            ]);

            await db('activities').insert([
                {
                    id: 'a1',
                    label: 'Activity 1',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'a2',
                    label: 'Activity 2',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
            ]);

            await db('used').insert([
                { activity_id: 'a1', entity_id: 'e1', role: 'input' },
                { activity_id: 'a2', entity_id: 'e2', role: 'input' },
            ]);

            await db('was_generated_by').insert([
                { entity_id: 'e2', activity_id: 'a1' },
                { entity_id: 'e1', activity_id: 'a2' },
            ]);

            const caller = getCaller(testUserId);

            const result = await caller.getEntityLineage({
                entityId: 'e1',
                maxDepth: 100,
                includeMetadata: false,
            });

            // Should terminate due to cycle detection, not infinite loop
            expect(result.nodes.length).toBeLessThan(100);
        });
    });

    describe('getEntityDescendants', () => {
        it('should return the full forward lineage of an entity', async () => {
            // Create a lineage: input.txt -> process1 -> intermediate.txt -> process2 -> output.txt
            await db('entities').insert([
                { id: 'input.txt', label: 'Input File', metadata: {} },
                { id: 'intermediate.txt', label: 'Intermediate File', metadata: {} },
                { id: 'output.txt', label: 'Output File', metadata: {} },
            ]);

            await db('activities').insert([
                {
                    id: 'process1',
                    label: 'First Process',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'process2',
                    label: 'Second Process',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
            ]);

            await db('used').insert([
                { activity_id: 'process1', entity_id: 'input.txt', role: 'input' },
                { activity_id: 'process2', entity_id: 'intermediate.txt', role: 'input' },
            ]);

            await db('was_generated_by').insert([
                { entity_id: 'intermediate.txt', activity_id: 'process1' },
                { entity_id: 'output.txt', activity_id: 'process2' },
            ]);

            const caller = getCaller(testUserId);

            const result = await caller.getEntityDescendants({
                entityId: 'input.txt',
                maxDepth: 10,
                includeMetadata: false,
            });

            // Should have all descendants
            const nodeIds = result.nodes.map((n) => n.id).sort();
            expect(nodeIds).toEqual(['input.txt', 'intermediate.txt', 'output.txt', 'process1', 'process2']);

            // Verify edges are in forward direction
            expect(result.edges).toContainEqual({
                from: 'input.txt',
                to: 'process1',
                relationshipType: 'used',
                role: 'input',
            });
            expect(result.edges).toContainEqual({
                from: 'process1',
                to: 'intermediate.txt',
                relationshipType: 'wasGeneratedBy',
                role: null,
            });
        });

        it('should handle entities with no descendants', async () => {
            await db('entities').insert({ id: 'final.txt', label: 'Final Output', metadata: {} });

            const caller = getCaller(testUserId);

            const result = await caller.getEntityDescendants({
                entityId: 'final.txt',
                maxDepth: 10,
                includeMetadata: false,
            });

            expect(result.nodes).toHaveLength(1);
            expect(result.nodes[0]).toMatchObject({
                id: 'final.txt',
                nodeType: 'entity',
                depth: 0,
            });
            expect(result.edges).toHaveLength(0);
        });
    });

    describe('getCommonAncestors', () => {
        it('should find common ancestors between two entities', async () => {
            // Create a diamond pattern:
            //   common.txt -> split_process -> branch1.txt -> merge1 -> output1.txt
            //                              \-> branch2.txt -> merge2 -> output2.txt
            await db('entities').insert([
                { id: 'common.txt', label: 'Common Input', metadata: {} },
                { id: 'branch1.txt', label: 'Branch 1', metadata: {} },
                { id: 'branch2.txt', label: 'Branch 2', metadata: {} },
                { id: 'output1.txt', label: 'Output 1', metadata: {} },
                { id: 'output2.txt', label: 'Output 2', metadata: {} },
            ]);

            await db('activities').insert([
                {
                    id: 'split',
                    label: 'Split Process',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'merge1',
                    label: 'Merge 1',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
                {
                    id: 'merge2',
                    label: 'Merge 2',
                    started_at: new Date(),
                    ended_at: new Date(),
                    metadata: {},
                },
            ]);

            await db('used').insert([
                { activity_id: 'split', entity_id: 'common.txt', role: 'input' },
                { activity_id: 'merge1', entity_id: 'branch1.txt', role: 'input' },
                { activity_id: 'merge2', entity_id: 'branch2.txt', role: 'input' },
            ]);

            await db('was_generated_by').insert([
                { entity_id: 'branch1.txt', activity_id: 'split' },
                { entity_id: 'branch2.txt', activity_id: 'split' },
                { entity_id: 'output1.txt', activity_id: 'merge1' },
                { entity_id: 'output2.txt', activity_id: 'merge2' },
            ]);

            const caller = getCaller(testUserId);

            const result = await caller.getCommonAncestors({
                entityId1: 'output1.txt',
                entityId2: 'output2.txt',
                maxDepth: 10,
            });

            // Should find common.txt and branch1/branch2 as common ancestors
            expect(result.commonAncestors.length).toBeGreaterThan(0);

            const commonIds = result.commonAncestors.map((a) => a.id);
            expect(commonIds).toContain('common.txt');
        });

        it('should return empty array when entities have no common ancestors', async () => {
            await db('entities').insert([
                { id: 'independent1.txt', label: 'Independent 1', metadata: {} },
                { id: 'independent2.txt', label: 'Independent 2', metadata: {} },
            ]);

            const caller = getCaller(testUserId);

            const result = await caller.getCommonAncestors({
                entityId1: 'independent1.txt',
                entityId2: 'independent2.txt',
                maxDepth: 10,
            });

            expect(result.commonAncestors).toHaveLength(0);
        });

        it('should not include the query entities themselves as common ancestors', async () => {
            await db('entities').insert([{ id: 'same.txt', label: 'Same Entity', metadata: {} }]);

            const caller = getCaller(testUserId);

            const result = await caller.getCommonAncestors({
                entityId1: 'same.txt',
                entityId2: 'same.txt',
                maxDepth: 10,
            });

            // Should not include the entity itself
            expect(result.commonAncestors).toHaveLength(0);
        });
    });
});
