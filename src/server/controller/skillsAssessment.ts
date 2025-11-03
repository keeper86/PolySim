import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import { getUserIdFromContext, protectedProcedure } from '../trpcRoot';

const skillDefinition = z.object({
    name: z.string(),
    level: z.number().min(0).max(3).optional(),
});
export type SkillDefinition = z.infer<typeof skillDefinition>;
const skillAssessment = skillDefinition.extend({
    subSkills: z.array(skillDefinition).optional(),
});
export type SkillAssessment = z.infer<typeof skillAssessment>;

const skillsAssessmentCategory = z.object({
    category: z.string(),
    skills: z.array(skillAssessment),
});
export type SkillsAssessmentCategory = z.infer<typeof skillsAssessmentCategory>;

const skillsAssessmentSchema = z.object({ data: z.array(skillsAssessmentCategory) });
export type SkillsAssessmentSchema = z.infer<typeof skillsAssessmentSchema>;

export const getSkillsAssessment = () => {
    return protectedProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/skills-assessment',
                tags: ['Skills'],
                summary: 'Get Skills Assessment',
                description: 'Retrieve the current user skills assessment',
                protect: true,
            },
        })
        .input(
            z.object({
                userId: z.string().optional(),
            }),
        )
        .output(skillsAssessmentSchema)
        .query(async ({ ctx, input }) => {
            const userIdFromSession = ctx.session?.user?.id;
            if (!userIdFromSession && !input) {
                throw new Error('User ID not found');
            }

            if (input?.userId && input.userId !== userIdFromSession) {
                const published = await db('user_data').where({ user_id: input.userId });
                logger.debug(
                    { component: 'skills-assessment-get' },
                    `Checking published status for user: ${input.userId}, result: ${JSON.stringify(published)}`,
                );
                if (published.length === 0 || !published[0]?.has_assessment_published) {
                    throw new Error('Published assessment not found or not public.');
                }
            }

            logger.debug(
                { component: 'skills-assessment-get' },
                `Fetching skills assessment for user: ${input.userId ?? userIdFromSession}`,
            );

            const result = await db('skills_assessment_history')
                .where({ user_id: input.userId ?? userIdFromSession })
                .orderBy('assessment_date', 'desc')
                .first();

            logger.debug({ component: 'skills-assessment-get' }, `Skills assessment data: ${JSON.stringify(result)}`);

            return (result?.assessment_data as SkillsAssessmentSchema) || { data: [] };
        });
};

export const updateSkillsAssessment = () => {
    return protectedProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/skills-assessment',
                tags: ['Skills'],
                summary: 'Save Skills Assessment',
                description: 'Save or update the current user skills assessment',
                protect: true,
            },
        })
        .input(skillsAssessmentSchema)
        .output(
            z.object({
                success: z.boolean(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const userId = getUserIdFromContext(ctx);

            const today = new Date(new Date().toISOString().split('T')[0]); // YYYY-MM-DD -> Date at local midnight

            const serializedInput = JSON.stringify(input.data);
            const existing = await db('skills_assessment_history')
                .where({ user_id: userId, assessment_date: today })
                .first();

            if (existing) {
                logger.debug(
                    { component: 'skills-assessment-upsert' },
                    `Updating skills assessment for user: ${userId} with data: ${serializedInput}`,
                );
                await db('skills_assessment_history')
                    .where({ user_id: userId, assessment_date: today })
                    .update({ assessment_data: input });
            } else {
                logger.debug(
                    { component: 'skills-assessment-upsert' },
                    `Inserting new skills assessment for user: ${userId} with data: ${serializedInput}`,
                );
                await db('skills_assessment_history').insert({
                    user_id: userId,
                    assessment_date: today,
                    assessment_data: input,
                });
            }

            return { success: true };
        });
};
