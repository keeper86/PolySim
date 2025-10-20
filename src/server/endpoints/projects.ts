import { z } from 'zod';
import { db } from '../db';
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

            const result = await db.insert({ name: input.name }).into('projects');

            if (result.length === 0) {
                logger.error(
                    { component: 'projects', clientTimestamp: new Date().toISOString() },
                    `Failed to create project: ${input.name}`,
                );
                throw new Error('Failed to create project');
            }
            return { success: true };
        });
};
