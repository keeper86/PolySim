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

                const outputs = input.entities.filter((e) => e.role === 'output');
                if (outputs.length === 0) {
                    throw new TRPCError({ message: 'At least one output entity is required', code: 'BAD_REQUEST' });
                }

                const processes = input.entities.filter((e) => e.role === 'process');
                if (processes.length === 0 || processes.length > 1) {
                    throw new TRPCError({ message: 'Exactly one process entity is required', code: 'BAD_REQUEST' });
                }
                const [process] = processes;

                const inputs = input.entities.filter((e) => e.role === 'input');

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

                    const existingEntityIds = (
                        await db('entities').whereIn(
                            'id',
                            input.entities.map((e) => e.id),
                        )
                    ).map((e) => e.id);

                    const rows = input.entities
                        .filter((e) => !existingEntityIds.includes(e.id))
                        .map((e) => ({
                            id: e.id,
                            metadata: e.metadata,
                            label: e.label,
                            created_at: e.createdAt ? new Date(e.createdAt) : undefined,
                        }));

                    await trx('entities').insert(rows);
                    logger.debug(
                        { component: 'uploadActivity' },
                        `Inserting ${rows.length} new entities. Found ${existingEntityIds.length} existing entities.`,
                    );
                    counts.entities = rows.length;

                    const mapEntity = (inputEntity: Entity) => ({
                        activity_id: input.activity.id,
                        entity_id: inputEntity.id,
                    });

                    const usedRows = [
                        ...inputs.map((inputEntity) => ({
                            ...mapEntity(inputEntity),
                            role: inputEntity.role,
                        })),
                        { ...mapEntity(process), role: process.role },
                    ];
                    if (usedRows.length > 0) {
                        await trx('used').insert(usedRows);
                    }

                    const wasGeneratedByRows = outputs.map((outputEntity) => mapEntity(outputEntity));
                    if (wasGeneratedByRows.length > 0) {
                        await trx('was_generated_by').insert(wasGeneratedByRows);
                    }

                    const wasAttributedRows = outputs.map((outputEntity) => ({
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
                            { expected: input.entities.length, inserted: counts.entities },
                            `Some entities were not inserted because they already exist.
                            we need to find if some of these entities are used in wasInformedBy relations
                            `,
                        );
                        const wasGeneratedBy = await db('was_generated_by').whereIn('entity_id', existingEntityIds);
                        const wasUsed = await db('used').whereIn('entity_id', existingEntityIds);

                        const informedByActivityIds = new Set<string>();

                        wasGeneratedBy.forEach((wgb) => informedByActivityIds.add(wgb.activity_id));

                        const informedByRows = Array.from(informedByActivityIds).map((informedId) => ({
                            informed_id: informedId,
                            informer_id: activity.id,
                        }));

                        const informerToActivityIds = new Set<string>();
                        wasUsed.forEach((used) => informerToActivityIds.add(used.activity_id));
                        const usedInformedByRows = Array.from(informerToActivityIds).map((informedId) => ({
                            informed_id: informedId,
                            informer_id: activity.id,
                        }));

                        const totalInformedByRows = informedByRows.concat(usedInformedByRows);

                        await trx('was_informed_by')
                            .insert(totalInformedByRows)
                            .onConflict(['informed_id', 'informer_id'])
                            .ignore();
                        counts.wasInformedBy = totalInformedByRows.length;
                    }
                });

                return { success: true, counts };
            } catch (err) {
                logger.error({ err }, 'Error inserting provenance data');
                throw err;
            }
        });
};
