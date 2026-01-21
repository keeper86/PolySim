import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { getUserIdFromContext, patAccessibleProcedure } from '../trpcRoot';

const entitySchema = z.object({
    id: z.hash('sha256'),
    label: z.string().optional().default(''),
    metadata: z.any().optional(),
    role: z.literal('input').or(z.literal('output')).or(z.literal('process')),
    createdAt: z.number().optional().default(Date.now()),
});

type Entity = z.infer<typeof entitySchema>;

const activitySchema = z.object({
    id: z.hash('sha256'),
    label: z.string().optional().default(''),
    startedAt: z.number(),
    endedAt: z.number(),
    metadata: z.any().optional(),
});

export const provUploadInputSchema = z.object({
    entities: z.array(entitySchema),
    activity: activitySchema,
});

export type ProvUploadInput = z.infer<typeof provUploadInputSchema>;

const countsSchema = z.object({
    entities: z.number(),
    activities: z.number(),
    wasAssociatedWith: z.number(),
    wasGeneratedBy: z.number(),
    used: z.number(),
    wasInformedBy: z.number(),
});
type Counts = z.infer<typeof countsSchema>;
const zeroCounts: Counts = {
    entities: 0,
    activities: 0,
    wasAssociatedWith: 0,
    wasGeneratedBy: 0,
    used: 0,
    wasInformedBy: 0,
};

export const activityUpload = () => {
    return patAccessibleProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/upload-activity',
                tags: ['PolySim'],
                summary: 'Upload Activity Data',
                description: 'Endpoint to upload activity data in PROV format from running a process',
            },
        })
        .input(provUploadInputSchema)
        .output(
            z.object({
                success: z.boolean(),
                counts: countsSchema.optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const counts = { ...zeroCounts };
            try {
                const userId = getUserIdFromContext(ctx);
                logger.debug(
                    { component: 'uploadActivity' },
                    `Uploading (${userId}) activity data: ${JSON.stringify(input)}`,
                );

                const entitiesById: Record<string, Entity> = {} as Record<string, Entity>;
                input.entities.forEach((e) => {
                    if (!entitiesById[e.id]) {
                        entitiesById[e.id] = e;
                    }
                });
                const deduplicatedEntities = Object.values(entitiesById) as Entity[];

                const outputEntities = deduplicatedEntities.filter((e) => e.role === 'output');
                if (outputEntities.length === 0) {
                    throw new TRPCError({ message: 'At least one output entity is required', code: 'BAD_REQUEST' });
                }

                const processes = deduplicatedEntities.filter((e) => e.role === 'process');
                if (processes.length === 0) {
                    throw new TRPCError({ message: 'At least one process entity is required', code: 'BAD_REQUEST' });
                }
                const [process] = processes;

                const inputEntities = deduplicatedEntities.filter((e) => e.role === 'input');

                await db.transaction(async (trx) => {
                    const activity = {
                        id: input.activity.id,
                        label: input.activity.label || `Run ${process.label}` || '<Activity>',
                        started_at: new Date(input.activity.startedAt),
                        ended_at: new Date(input.activity.endedAt),
                        metadata: input.activity.metadata,
                    };
                    logger.debug({ component: 'uploadActivity' }, `Inserting activity: ${JSON.stringify(activity)}`);
                    const result = (await trx('activities').insert(activity).onConflict('id').ignore()) as unknown as {
                        rowCount: number;
                    };
                    counts.activities = result.rowCount;
                    if (counts.activities === 0) {
                        throw new TRPCError({
                            code: 'CONFLICT',
                            message: `Activity with ID ${input.activity.id} already exists`,
                        });
                    }

                    logger.debug({ component: 'uploadActivity' }, `Upserting agent association for user ${userId}`);
                    await trx('agents')
                        .insert({ id: userId, metadata: { autoCreated: true } })
                        .onConflict('id')
                        .ignore();
                    await trx('was_associated_with').insert({
                        activity_id: input.activity.id,
                        agent_id: userId,
                    });

                    const allEntityIds = deduplicatedEntities.map((e) => e.id);
                    const existingEntityIds = (await db('entities').whereIn('id', allEntityIds)).map((e) => e.id);
                    logger.debug(
                        { component: 'uploadActivity' },
                        `Existing entity IDs: ${existingEntityIds.join(', ')}`,
                    );

                    const rows = deduplicatedEntities
                        .filter((e) => !existingEntityIds.includes(e.id))
                        .map((e) => ({
                            id: e.id,
                            metadata: e.metadata,
                            label: e.label,
                            created_at: e.createdAt ? new Date(e.createdAt) : undefined,
                        }));

                    logger.debug({ component: 'uploadActivity' }, `Inserting ${rows.length} new entities.`);

                    if (rows.length > 0) {
                        await trx('entities').insert(rows);
                    }

                    logger.debug(
                        { component: 'uploadActivity' },
                        `Inserted ${rows.length} new entities. Found ${existingEntityIds.length} existing entities.`,
                    );
                    counts.entities = rows.length;

                    const mapEntity = (inputEntity: Entity) => ({
                        activity_id: input.activity.id,
                        entity_id: inputEntity.id,
                    });

                    const usedRows = [
                        ...inputEntities.map((inputEntity) => ({
                            ...mapEntity(inputEntity),
                            role: inputEntity.role,
                        })),
                        { ...mapEntity(process), role: process.role },
                    ];
                    if (usedRows.length > 0) {
                        await trx('used').insert(usedRows);
                    }

                    const wasGeneratedByRows = outputEntities
                        .filter((outputEntity) => !existingEntityIds.includes(outputEntity.id))
                        .map((outputEntity) => mapEntity(outputEntity));
                    if (wasGeneratedByRows.length > 0) {
                        await trx('was_generated_by').insert(wasGeneratedByRows);
                    }

                    const wasAttributedRows = outputEntities
                        .filter((outputEntity) => !existingEntityIds.includes(outputEntity.id))
                        .map((outputEntity) => ({
                            entity_id: outputEntity.id,
                            agent_id: userId,
                        }));
                    if (wasAttributedRows.length > 0) {
                        await trx('was_attributed_to').insert(wasAttributedRows);
                    }

                    counts.used = usedRows.length;
                    counts.wasGeneratedBy = wasGeneratedByRows.length;

                    if (existingEntityIds.length > 0) {
                        logger.debug(
                            { expected: inputEntities.length, inserted: counts.entities },
                            `Some entities were not inserted because they already exist.
                            we need to find if some of these entities are used in wasInformedBy relations
                            `,
                        );
                        const wasGeneratedBy = await db('was_generated_by').whereIn('entity_id', existingEntityIds);
                        logger.debug(
                            { component: 'uploadActivity' },
                            `wasGeneratedBy rows: ${JSON.stringify(wasGeneratedBy)}`,
                        );
                        const wasUsed = await db('used').whereIn('entity_id', existingEntityIds);
                        logger.debug({ component: 'uploadActivity' }, `wasUsed rows: ${JSON.stringify(wasUsed)}`);

                        const generatorActivityIds = new Set<string>();
                        wasGeneratedBy.forEach((wgb) => generatorActivityIds.add(wgb.activity_id));

                        const informerRowsFromGenerators = Array.from(generatorActivityIds).map((generatorId) => ({
                            informed_id: activity.id, // current activity is informed by generatorId
                            informer_id: generatorId,
                        }));

                        const userActivityIds = new Set<string>();
                        wasUsed.forEach((used) => userActivityIds.add(used.activity_id));
                        const informerRowsFromUsers = Array.from(userActivityIds).map((userId) => ({
                            informed_id: activity.id, // current activity is informed by userId
                            informer_id: userId,
                        }));

                        const totalInformerRows = informerRowsFromGenerators.concat(informerRowsFromUsers);

                        await trx('was_informed_by')
                            .insert(totalInformerRows)
                            .onConflict(['informed_id', 'informer_id'])
                            .ignore();
                        counts.wasInformedBy = totalInformerRows.length;
                    }
                });

                return { success: true, counts };
            } catch (err) {
                logger.error({ err }, 'Error inserting provenance data');
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error inserting provenance data',
                });
            }
        });
};
