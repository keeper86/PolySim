import { z } from 'zod';
import { procedure } from '../trpcRoot';
import { db } from '../db';
import { logger } from '../logger';
import { runGraphQuery } from './repository/graphQuery';
import { EntityLineage } from './repository/entityLineage';

export const getEntityLineage = () => {
    return procedure
        .input(
            z.object({
                entityId: z.string(),
                maxDepth: z.number().int().min(1).max(50).optional(),
            }),
        )
        .output(EntityLineage.result)
        .query(async ({ input }) => {
            try {
                return await runGraphQuery(db, EntityLineage, {
                    entityId: input.entityId,
                    maxDepth: input.maxDepth ?? 10,
                });
            } catch (err) {
                logger.error({ err, input }, 'Failed to run entity lineage graph query');
                throw err;
            }
        });
};
