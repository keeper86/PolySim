import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { protectedProcedure } from '../trpcRoot';
import { activitySchema } from './uploadActivity';

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
                activities: z.array(activitySchema),
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
            const test = {
                activities: activities.map((activity) => ({
                    metadata: activity.metadata,
                    label: activity.label,
                    id: activity.id,
                    startedAt: activity.started_at.getTime(),
                    endedAt: activity.ended_at.getTime(),
                })),
                total,
            };
            console.log(test);
            return test;
        });
};
