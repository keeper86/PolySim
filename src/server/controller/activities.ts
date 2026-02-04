import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { protectedProcedure } from '../trpcRoot';
import { activitySchema } from './uploadActivity';

const activitiesInputSchema = z.object({
    limit: z.number().int().min(1).max(100).optional().default(25),
    offset: z.number().int().min(0).optional().default(0),
    // time interval filters (milliseconds since epoch)
    from: z.number().int().min(0).optional(),
    to: z.number().int().min(0).optional(),
    // wall-time (duration) filters in milliseconds
    minWallTimeMs: z.number().int().min(0).optional(),
    maxWallTimeMs: z.number().int().min(0).optional(),
    // free text / full text query
    query: z.string().min(1).optional(),
    // search by a file hash present somewhere in metadata
    fileHash: z.string().min(1).optional(),
    // search by entity or agent name (will search label & metadata)
    entityName: z.string().min(1).optional(),
    // sorting
    sortBy: z.enum(['startedAt', 'endedAt', 'wallTime', 'id', 'label']).optional().default('startedAt'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ActivitiesInput = z.infer<typeof activitiesInputSchema>;

export const getActivities = () => {
    return protectedProcedure
        .input(activitiesInputSchema)
        .output(
            z.object({
                activities: z.array(activitySchema),
                total: z.number(),
            }),
        )
        .query(({ input }) => {
            return fetchActivities(input);
        });
};

// Exported helper so the core logic can be tested in isolation.
export async function fetchActivities(input: ActivitiesInput) {
    const {
        limit,
        offset,
        from,
        to,
        minWallTimeMs,
        maxWallTimeMs,
        query: textQuery,
        fileHash,
        entityName,
        sortBy,
        sortDir,
    } = input;

    const baseQuery = db('activities');
    // time interval: compare started_at
    if (from) {
        baseQuery.where('started_at', '>=', new Date(from));
    }
    if (to) {
        baseQuery.where('started_at', '<=', new Date(to));
    }

    // wall time filters: compute ended_at - started_at in ms
    if (minWallTimeMs || maxWallTimeMs) {
        if (minWallTimeMs) {
            baseQuery.whereRaw('EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000 >= ?', [minWallTimeMs]);
        }
        if (maxWallTimeMs) {
            baseQuery.whereRaw('EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000 <= ?', [maxWallTimeMs]);
        }
    }

    // text / full-text search
    if (textQuery) {
        // use full-text search over label and metadata text
        baseQuery.whereRaw(
            "to_tsvector('simple', coalesce(label, '') || ' ' || coalesce(metadata::text, '')) @@ plainto_tsquery(?)",
            [textQuery],
        );
    }

    // fileHash & entityName search inside metadata as text
    if (fileHash) {
        baseQuery.whereRaw('metadata::text ILIKE ?', [`%${fileHash}%`]);
    }

    if (entityName) {
        baseQuery.whereRaw('metadata::text ILIKE ? OR label ILIKE ?', [`%${entityName}%`, `%${entityName}%`]);
    }

    // compute total before limit/offset
    const totalResult = await baseQuery.clone().count<{ count: string }>('* as count').first();
    const total = totalResult ? Number(totalResult.count) : 0;

    // sorting
    if (sortBy === 'startedAt') {
        baseQuery.orderBy('started_at', sortDir as 'asc' | 'desc');
    } else if (sortBy === 'endedAt') {
        baseQuery.orderBy('ended_at', sortDir as 'asc' | 'desc');
    } else if (sortBy === 'wallTime') {
        baseQuery.orderByRaw(
            'EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000 ' + (sortDir === 'asc' ? 'asc' : 'desc'),
        );
    } else if (sortBy === 'id') {
        // allow ordering by the activity id (text)
        baseQuery.orderBy('id', sortDir as 'asc' | 'desc');
    } else if (sortBy === 'label') {
        // allow ordering by the activity label
        baseQuery.orderBy('label', sortDir as 'asc' | 'desc');
    } else {
        baseQuery.orderBy('started_at', sortDir as 'asc' | 'desc');
    }

    const activities = await baseQuery.offset(offset).limit(limit);

    logger.debug({ component: 'activities' }, `Fetched activities: ${activities.length} items`);

    return {
        activities: activities.map((activity) => ({
            metadata: activity.metadata,
            label: activity.label,
            id: activity.id,
            startedAt: activity.started_at!.getTime(),
            endedAt: activity.ended_at!.getTime(),
        })),
        total,
    };
}
