import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import type { ProcedureBuilderType } from '../router';

const skillDefinition = z.object({
    name: z.string(),
    level: z.number().min(0).max(3),
});
const skillAssessment = skillDefinition.extend({
    subSkills: z.array(skillDefinition).optional(),
});
export type SkillAssessment = z.infer<typeof skillAssessment>;

const skillsAssessmentSchema = z.array(
    z.object({
        name: z.string(),
        skills: z.array(skillAssessment),
    }),
);
export type SkillsAssessmentSchema = z.infer<typeof skillsAssessmentSchema>;

export const getSkillsAssessment = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Skills'],
                summary: 'Get Skills Assessment',
                description: 'Retrieve the current user skills assessment',
                protect: true,
            },
        })
        .input(z.void())
        .output(skillsAssessmentSchema)
        .query(async ({ ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name;
            if (!userId) {
                throw new Error('User ID not found');
            }

            logger.info({ component: 'skills-assessment' }, `Fetching skills assessment for user: ${userId}`);

            const result = await db('skills_assessment_history')
                .where({ user_id: userId })
                .orderBy('assessment_date', 'desc')
                .first();

            logger.debug({ component: 'skills-assessment' }, `Skills assessment data: ${JSON.stringify(result)}`);

            return result?.assessment_data ?? [];
        });
};

export const saveSkillsAssessment = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'POST',
                path,
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
            const userId = ctx.session?.user?.email || ctx.session?.user?.name;
            if (!userId) {
                throw new Error('User ID not found');
            }

            logger.info({ component: 'skills-assessment' }, `Saving skills assessment for user: ${userId}`);

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

            const existing = await db('skills_assessment_history')
                .where({ user_id: userId, assessment_date: today })
                .first();

            const serialized = JSON.stringify(input);

            if (existing) {
                await db('skills_assessment_history')
                    .where({ user_id: userId, assessment_date: today })
                    .update({ assessment_data: serialized });
            } else {
                await db('skills_assessment_history').insert({
                    user_id: userId,
                    assessment_date: today,
                    assessment_data: serialized,
                });
            }

            return { success: true };
        });
};
