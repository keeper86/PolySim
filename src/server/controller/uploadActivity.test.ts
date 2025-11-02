import { createHash, randomUUID } from 'crypto';
import { getCaller, getDb, getPatCaller } from 'tests/vitest/setupTestcontainer';
import { describe, expect, it } from 'vitest';
import type { ProvUploadInput } from './uploadActivity';

const testUserId = randomUUID();

describe('upload-activity endpoint (integration)', () => {
    it.each(['next-auth', 'pat'])(
        'inserts provenance records and returns counts with %s session',
        async (callerType) => {
            const caller = callerType === 'next-auth' ? getCaller(testUserId) : getPatCaller(testUserId);
            const db = getDb();

            const activityId = createHash('sha256')
                .update('activityLabel' + callerType)
                .digest('hex');

            const now = Date.now();

            const firstEntityId = createHash('sha256')
                .update('Test Entity' + callerType)
                .digest('hex');
            const secondEntityId = createHash('sha256')
                .update('Test Entity Process' + callerType)
                .digest('hex');

            const activityUploadInput: ProvUploadInput = {
                entities: [
                    {
                        id: firstEntityId,
                        label: 'Test Entity',
                        metadata: { foo: 'bar' },
                        role: 'output',
                        createdAt: now,
                    },
                    {
                        id: secondEntityId,
                        label: 'Test Entity Process',
                        metadata: { process: true },
                        role: 'process',
                        createdAt: now,
                    },
                ],
                activity: {
                    id: activityId,
                    label: 'Test Activity',
                    startedAt: now,
                    endedAt: now,
                    metadata: { env: true },
                },
            };

            const result = await caller.uploadActivity(activityUploadInput);
            expect(result).toHaveProperty('success', true);
            expect(result.counts).toMatchObject({
                entities: 2,
                activities: 1,
                used: 1,
                wasGeneratedBy: 1,
            });

            const entities = await db('entities').where({ id: firstEntityId }).first();
            expect(entities).toBeDefined();
            expect(entities!.label).toBe('Test Entity');

            const activities = await db('activities').where({ id: activityId }).first();
            expect(activities).toBeDefined();
            expect(activities!.label).toBe('Test Activity');

            const agents = await db('agents').where({ id: testUserId }).first();
            expect(agents).toBeDefined();

            const generatedBy = await db('was_generated_by')
                .where({ entity_id: firstEntityId, activity_id: activityId })
                .first();
            expect(generatedBy).toBeDefined();

            const usedRow = await db('used').where({ activity_id: activityId, entity_id: secondEntityId }).first();
            expect(usedRow).toBeDefined();
        },
    );

    it('rejects upload when required entities (1 output, 1 process) are missing', async () => {
        const caller = getCaller(testUserId);

        const activityUploadInput: ProvUploadInput = {
            entities: [],
            activity: {
                id: createHash('sha256').update('Activity Missing Process').digest('hex'),
                label: 'Activity Missing Process',
                startedAt: Date.now(),
                endedAt: Date.now(),
                metadata: {},
            },
        };

        await expect(caller.uploadActivity(activityUploadInput)).rejects.toThrow(/one output entity/);

        activityUploadInput.entities.push({
            id: createHash('sha256').update('Only Input Entity').digest('hex'),
            label: 'Only Output Entity',
            metadata: {},
            role: 'output',
            createdAt: Date.now(),
        });

        await expect(caller.uploadActivity(activityUploadInput)).rejects.toThrow(/one process entity/);

        activityUploadInput.entities.push({
            id: createHash('sha256').update('Process Entity').digest('hex'),
            label: 'Process Entity',
            metadata: {},
            role: 'process',
            createdAt: Date.now(),
        });

        const result = await caller.uploadActivity(activityUploadInput);
        expect(result).toHaveProperty('success', true);
    });

    it('rejects upload when activity ID already exists', async () => {
        const caller = getCaller(testUserId);

        const activityId = createHash('sha256').update('Duplicate Activity').digest('hex');

        const activityUploadInput: ProvUploadInput = {
            entities: [
                {
                    id: createHash('sha256').update('Entity for Duplicate Activity').digest('hex'),
                    label: 'Entity for Duplicate Activity',
                    metadata: {},
                    role: 'output',
                    createdAt: Date.now(),
                },
                {
                    id: createHash('sha256').update('Process for Duplicate Activity').digest('hex'),
                    label: 'Process for Duplicate Activity',
                    metadata: {},
                    role: 'process',
                    createdAt: Date.now(),
                },
            ],
            activity: {
                id: activityId,
                label: 'Duplicate Activity',
                startedAt: Date.now(),
                endedAt: Date.now(),
                metadata: {},
            },
        };

        const firstResult = await caller.uploadActivity(activityUploadInput);
        expect(firstResult).toHaveProperty('success', true);

        await expect(caller.uploadActivity(activityUploadInput)).rejects.toThrow(/already exists/);
    });
});
