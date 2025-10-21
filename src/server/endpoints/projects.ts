import { z } from 'zod';
import { logger } from '../logger';
import type { ProcedureBuilderType } from '../router';

export const createProject = (procedure: ProcedureBuilderType, _: `/${string}`) => {
    return procedure
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
