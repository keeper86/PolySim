import { getAppRouter, getDb } from 'tests/vitest/setupTestcontainer';
import { describe, expect, it } from 'vitest';
import type { SkillsAssessmentSchema } from './skills-assessment';

const TEST_USER_ID = 'test-user-integration';
const SKILLS_ASSESSMENT_TABLE = 'skills_assessment_history';
const ENDPOINT_SAVE = 'skills-assessment-save';
const ENDPOINT_GET = 'skills-assessment-get';

const TEST_ASSESSMENT: SkillsAssessmentSchema = [
    {
        category: 'Languages',
        skills: [{ name: 'TypeScript', level: 2, subSkills: [{ name: 'Generics', level: 1 }] }],
    },
];

describe('skills-assessment endpoint (integration)', async () => {
    const getCaller = (id: string) => {
        return getAppRouter().createCaller({
            session: { user: { id }, expires: new Date(Date.now() + 3600_000).toISOString() },
        });
    };

    it('db is reachable and table exists', async () => {
        const res = await getDb()(SKILLS_ASSESSMENT_TABLE).select().limit(1);
        expect(res).toBeDefined();
    });

    it('save then get skills assessment for current user', async () => {
        const caller = getCaller(TEST_USER_ID);

        const saveResult = await caller[ENDPOINT_SAVE](TEST_ASSESSMENT);
        expect(saveResult).toHaveProperty('success', true);

        const savedAssessment = await caller[ENDPOINT_GET]({});
        expect(savedAssessment).toEqual(TEST_ASSESSMENT);
    });

    it('saving without a session should fail', async () => {
        const anonCaller = getAppRouter().createCaller({ session: null }); // no session

        await expect(anonCaller[ENDPOINT_SAVE](TEST_ASSESSMENT)).rejects.toThrow();
    });

    it("getting another user's unpublished assessment should throw", async () => {
        const OTHER_USER_ID = 'other-user-unpublished-integration';
        const otherUserCaller = getCaller(OTHER_USER_ID);

        await otherUserCaller[ENDPOINT_SAVE](TEST_ASSESSMENT);

        const caller = getCaller(TEST_USER_ID);
        await expect(caller[ENDPOINT_GET]({ userId: OTHER_USER_ID })).rejects.toThrow(
            'Published assessment not found or not public.',
        );
    });

    it("should get another user's published assessment", async () => {
        const PUBLISHED_USER_ID = 'other-user-published-integration';
        const publishedUserCaller = getCaller(PUBLISHED_USER_ID);

        await publishedUserCaller[ENDPOINT_SAVE](TEST_ASSESSMENT);
        await getDb()('user_data').insert({
            user_id: PUBLISHED_USER_ID,
            email: '<email>',
            has_assessment_published: true,
        });

        const caller = getCaller(TEST_USER_ID);
        const publishedAssessment = await caller[ENDPOINT_GET]({ userId: PUBLISHED_USER_ID });
        expect(publishedAssessment).toEqual(TEST_ASSESSMENT);
    });

    it('invalid payload should be rejected by validation', async () => {
        const caller = getAppRouter().createCaller({
            session: { user: { id: TEST_USER_ID }, expires: new Date(Date.now() + 3600_000).toISOString() },
        });

        const invalidPayload: unknown = [
            {
                category: 'Languages',
                skills: [{ name: 'TypeScript', level: 5 }],
            },
        ];

        // @ts-expect-error we're intentionally passing invalid shape
        await expect(caller[ENDPOINT_SAVE](invalidPayload)).rejects.toThrow();
    });

    it('saving twice on the same day should update the existing record', async () => {
        const caller = getAppRouter().createCaller({
            session: { user: { id: TEST_USER_ID }, expires: new Date(Date.now() + 3600_000).toISOString() },
        });

        const secondAssessment: SkillsAssessmentSchema = [
            {
                category: 'Frameworks',
                skills: [{ name: 'React', level: 3 }],
            },
        ];

        const result1 = await caller[ENDPOINT_SAVE](TEST_ASSESSMENT);
        expect(result1).toHaveProperty('success', true);

        const result2 = await caller[ENDPOINT_SAVE](secondAssessment);
        expect(result2).toHaveProperty('success', true);

        const savedAssessment = await caller[ENDPOINT_GET]({});
        expect(savedAssessment).toEqual(secondAssessment);
    });
});
