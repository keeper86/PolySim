import { z } from 'zod';
import { procedure } from '../trpcRoot';
import { db } from '../db';
import { logger } from '../logger';
import { runGraphQuery } from './repository/graphQuery';
import { entityLineage } from './repository/entityLineage';

export const getEntityLineage = () => {
    return procedure
        .input(entityLineage.input)
        .output(entityLineage.result)
        .query(async ({ input }) => {
            try {
                return await runGraphQuery(db, entityLineage, {
                    entityId: input.entityId,
                    maxDepth: input.maxDepth ?? 10,
                });
            } catch (err) {
                logger.error({ err, input }, 'Failed to run entity lineage graph query');
                throw err;
            }
        });
};
