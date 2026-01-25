import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { protectedProcedure } from '../trpcRoot';

export const getActivities = () => {
    return protectedProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).optional().default(25),
                offset: z.number().int().min(0).optional().default(0),
            }),
        )
        .output(
            z.object({
                activities: z.array(
                    z.object({
                        id: z.string(),
                        label: z.string(),
                        started_at: z.string(),
                        ended_at: z.string(),
                        metadata: z.record(z.string(), z.any()).nullable(),
                    }),
                ),
                total: z.number(),
            }),
        )
        .query(async ({ input }) => {
            const { limit, offset } = input;

            const query = db('activities');

            const totalResult = await query.clone().count<{ count: string }>('* as count').first();
            const total = totalResult ? Number(totalResult.count) : 0;

            const activities = await query.orderBy('started_at', 'desc').offset(offset).limit(limit);

            logger.debug({ component: 'activities' }, `Fetched activities: ${activities.length} items`);

            return {
                activities: activities.map(activity => ({
                    ...activity,
                    started_at: activity.started_at.toISOString(),
                    ended_at: activity.ended_at.toISOString(),
                })),
                total,
            };
        });
};
