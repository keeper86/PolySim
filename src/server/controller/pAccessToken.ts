import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db';
import { getUserIdFromContext, protectedProcedure } from '../trpcRoot';
import { logger } from '../logger';

const MAX_ACTIVE_TOKENS = parseInt(process.env.MAX_ACTIVE_PERSONAL_TOKENS_PER_USER ?? '10', 10);

const createPatInput = z.object({
    name: z.string().optional().default('token'),
    expiresInDays: z.number().min(0).max(360).optional().default(1),
});

export const createPAT = () => {
    return protectedProcedure
        .input(createPatInput)
        .output(z.object({ token: z.hex() }))
        .mutation(async ({ ctx, input }) => {
            const userId = getUserIdFromContext(ctx);

            logger.debug(
                { component: 'createPAT' },
                `Creating PAT for user ${userId} with name "${input.name}" and expiration in ${input.expiresInDays} days`,
            );

            const activeCountRow = await db('personal_access_tokens')
                .where({ user_id: userId })
                .andWhere(function () {
                    this.whereNull('expires_at').orWhere('expires_at', '>', new Date().toISOString());
                })
                .count('id')
                .first();

            const activeCount = Number(activeCountRow?.count || 0);
            if (activeCount >= MAX_ACTIVE_TOKENS) {
                throw new Error(`Maximum number of active tokens (${MAX_ACTIVE_TOKENS}) reached`);
            }

            const token = crypto.randomBytes(64).toString('hex');
            const createHmac = crypto.createHmac('sha256', process.env.SUPER_SECRET_SERVER_PASSWORD || 'default_salt');
            const tokenWithSalt = createHmac.update(token).digest('hex');
            const hash = crypto.createHash('sha256').update(tokenWithSalt).digest('hex');

            const expiresAt = input.expiresInDays
                ? new Date(Date.now() + input.expiresInDays * 24 * 3600 * 1000)
                : null;

            await db('personal_access_tokens').insert({
                user_id: userId,
                name: input.name ?? 'token',
                token_hash: hash,
                expires_at: expiresAt,
            });

            return { token };
        });
};

export const listPATs = () => {
    return protectedProcedure
        .input(z.object({}))
        .output(
            z.array(
                z.object({
                    id: z.uuid(),
                    name: z.string().nullable(),
                    created_at: z.date(),
                    expires_at: z.date().nullable(),
                }),
            ),
        )
        .query(async ({ ctx }) => {
            const userId = getUserIdFromContext(ctx);
            const rows = await db('personal_access_tokens')
                .where({ user_id: userId })
                .select('id', 'name', 'created_at', 'expires_at');
            return rows;
        });
};

export const revokePAT = () => {
    return protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const userId = getUserIdFromContext(ctx);

            await db('personal_access_tokens').where({ id: input.id, user_id: userId }).delete();
            return { success: true };
        });
};
