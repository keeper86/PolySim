import type { UserData } from '@/types/db_schemas';
import z from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { getUserIdFromContext, patAccessibleProcedure, protectedProcedure } from '../trpcRoot';

const userId = z.object({
    userId: z.string(),
});
const userData = z.object({
    displayName: z.string().optional(),
    hasAssessmentPublished: z.boolean().optional(),
    avatar: z.string().optional(),
});
export const userSummary = userId.merge(userData);
export type UserSummary = z.infer<typeof userSummary>;

export const getUsers = () => {
    return protectedProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).optional().default(25),
                offset: z.number().int().min(0).optional().default(0),
                onlyWithPublishedAssessments: z.boolean().optional().default(false),
            }),
        )
        .output(
            z.object({
                users: z.array(userSummary),
                total: z.number(),
            }),
        )
        .query(async ({ input }) => {
            const { limit, offset } = input;

            const query = db('user_data');
            if (input.onlyWithPublishedAssessments) {
                query.andWhere({ has_assessment_published: true });
            }

            const totalResult = await query.clone().count<{ count: string }>('* as count').first();
            const total = totalResult ? Number(totalResult.count) : 0;
            // Execute paginated query
            const users: UserData[] = await query.orderBy('user_id').offset(offset).limit(limit);

            logger.debug({ component: 'user-list' }, `Fetched users: ${JSON.stringify(users)}`);

            return {
                users: users.map((r) => ({
                    userId: r.user_id,
                    displayName: r.display_name || undefined,
                    hasAssessmentPublished: r.has_assessment_published,
                })),
                total,
            };
        });
};

export const getUser = () => {
    return protectedProcedure
        .input(
            z.object({
                userId: z.string().optional(),
            }),
        )
        .output(userSummary)
        .query(async ({ input, ctx }) => {
            logger.debug({ component: 'user-get' }, `Fetching user info for user ID: ${input.userId}`);

            const userId = getUserIdFromContext(ctx);
            const row = await db('user_data')
                .where({ user_id: input.userId || userId })
                .first();

            if (!row) {
                throw new Error('User not found');
            }

            const user: UserSummary = {
                userId: row.user_id,
                displayName: row.display_name || undefined,
                hasAssessmentPublished: row.has_assessment_published,
                avatar: row.avatar ? row.avatar.toString('base64') : undefined,
            };

            logger.debug({ component: 'user-get' }, `Fetched user info: ${JSON.stringify({ ...user, avatar: user.avatar ? '[base64 omitted]' : undefined })}`);

            return user;
        });
};

export const updateUser = () => {
    return protectedProcedure
        .input(userData)
        .output(z.void())
        .mutation(async ({ input, ctx }) => {
            const userId = getUserIdFromContext(ctx);
            console.log(`Updating user info for user ID: ${userId}`);

            logger.debug({ component: 'user-update' }, `Updating user info for user ID: ${userId}`);

            const updateData: Partial<UserData> = { user_id: userId };
            if (input.hasAssessmentPublished !== undefined) {
                updateData.has_assessment_published = input.hasAssessmentPublished;
            }
            if (input.displayName !== undefined) {
                updateData.display_name = input.displayName;
            }
            if (input.avatar !== undefined) {
                const base64 = (() => {
                    const trimmed = input.avatar.trim();
                    if (trimmed === '') {
                        return null;
                    }
                    const dataUrlPrefix = 'data:image/png;base64,';
                    return trimmed.startsWith(dataUrlPrefix) ? trimmed.slice(dataUrlPrefix.length) : trimmed;
                })();

                if (base64 === null) {
                    updateData.avatar = null;
                } else {
                    let buffer: Buffer;
                    try {
                        buffer = Buffer.from(base64, 'base64');
                    } catch (e) {
                        throw new Error('Invalid base64 image data');
                    }

                    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
                    if (buffer.length === 0 || buffer.length > MAX_SIZE_BYTES) {
                        throw new Error('Avatar image must be between 1 byte and 2MB');
                    }

                    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
                    if (buffer.length < 8 || !buffer.subarray(0, 8).equals(pngSignature)) {
                        throw new Error('Only PNG images are supported for avatar');
                    }

                    updateData.avatar = buffer;
                }
            }

            await db('user_data').where({ user_id: userId }).update(updateData);
        });
};

export const getUserIdFromSession = () => {
    return patAccessibleProcedure
        .meta({
            openapi: { method: 'GET', path: '/user-id', tags: ['PolySim'], summary: 'Get User ID', protect: true },
        })
        .input(z.void())
        .output(z.object({ userId: z.string() }))
        .query(async ({ ctx }) => {
            const userId = getUserIdFromContext(ctx);
            logger.debug({ component: 'getUserIdFromPat' }, `Retrieved user ID from PAT: ${userId}`);
            return { userId };
        });
};
