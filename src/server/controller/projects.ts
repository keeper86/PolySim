import { z } from 'zod';
import { logger } from '../logger';
import { protectedProcedure } from '../trpcRoot';

export const createProject = () => {
    return protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, 'Project name is required'),
            }),
        )
        .output(
            z.object({
                success: z.boolean(),
            }),
        )
        .mutation(async ({ input }) => {
            logger.info(
                { component: 'projects', clientTimestamp: new Date().toISOString() },
                `Creating project: ${input.name}`,
            );
            return { success: true };
        });
};
