import z from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { type ProcedureBuilderType } from '../router';
import type { UserData } from '@/types/db_schemas';

const userSummary = z.object({
    id: z.string(),
    displayName: z.string().optional(),
    hasAssessmentPublished: z.boolean().optional(),
});
export type UserSummary = z.infer<typeof userSummary>;

export const getUsers = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['User'],
                summary: 'List users (paginated)',
                description:
                    'Return a paginated list of users using offset-based pagination. By default email is not returned.',
                protect: true,
            },
        })
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
            const users: UserData[] = await query.orderBy('user_id').offset(offset).limit(limit);

            logger.debug({ component: 'user-list' }, `Fetched users: ${JSON.stringify(users)}`);

            return {
                users: users.map((r) => ({
                    id: r.user_id,
                    displayName: r.display_name || undefined,
                    hasAssessmentPublished: r.has_assessment_published,
                })),
                total,
            };
        });
};

export const getUser = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['User'],
                summary: 'Get User Info',
                description: 'Retrieve user information by user ID',
                protect: true,
            },
        })
        .input(
            z.object({
                userId: z.string().optional(),
            }),
        )
        .output(userSummary)
        .query(async ({ input }) => {
            logger.debug({ component: 'user-get' }, `Fetching user info for user ID: ${input.userId}`);

            const row = await db('user_data').where({ user_id: input.userId }).first();

            if (!row) {
                throw new Error('User not found');
            }

            const user: UserSummary = {
                id: row.user_id,
                displayName: row.display_name || undefined,
                hasAssessmentPublished: row.has_assessment_published,
            };

            logger.debug({ component: 'user-get' }, `Fetched user info: ${JSON.stringify(user)}`);

            return user;
        });
};

export const updateUser = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'PUT',
                path,
                tags: ['User'],
                summary: 'Update User Info',
                description: 'Update user information',
                protect: true,
            },
        })
        .input(userSummary)
        .output(z.void())
        .mutation(async ({ input }) => {
            logger.debug({ component: 'user-update' }, `Updating user info for user ID: ${input.id}`);

            const updateData = {} as Partial<UserData>;
            if (input.hasAssessmentPublished !== undefined) {
                updateData.has_assessment_published = input.hasAssessmentPublished;
            }

            const result = await db('user_data').where({ user_id: input.id }).update(updateData);

            if (!result) {
                throw new Error('User not found');
            }

            logger.debug({ component: 'user-update' }, `User updated successfully: ${JSON.stringify(input)}`);
        });
};
