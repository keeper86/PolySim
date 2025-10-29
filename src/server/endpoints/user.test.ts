import { getAppRouter, getCaller, testUsers } from 'tests/vitest/setupTestcontainer';
import { describe, expect, it } from 'vitest';
import type { UserSummary } from './user';

const ENDPOINT_GET_USERS = 'users';
const ENDPOINT_GET_USER = 'user';
const ENDPOINT_UPDATE_USER = 'user-update';

describe('user endpoint (integration)', async () => {
    it('get users with pagination', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const result = await caller[ENDPOINT_GET_USERS]({ limit: 10, offset: 0 });
        expect(result).toHaveProperty('users');
        expect(result).toHaveProperty('total');
        expect(Array.isArray(result.users)).toBe(true);

        const users = Object.values(testUsers);
        expect(result.users.length).toBeLessThanOrEqual(users.length);
        expect(result.total).toBe(users.length);
        expect(result.users).toEqual(
            expect.arrayContaining(
                users.map((u) =>
                    expect.objectContaining({
                        id: u.user_id,
                    }),
                ),
            ),
        );
    });

    it('get user by ID', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const user = await caller[ENDPOINT_GET_USER]({ userId: testUsers.testUser.user_id });
        expect(user).toHaveProperty('id', testUsers.testUser.user_id);
    });

    it('update user information', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const updateData: UserSummary = {
            id: testUsers.testUser.user_id,
            displayName: 'Updated User',
            hasAssessmentPublished: true,
        };

        await caller[ENDPOINT_UPDATE_USER](updateData);

        const updatedUser = await caller[ENDPOINT_GET_USER]({ userId: testUsers.testUser.user_id });
        expect(updatedUser).toHaveProperty('displayName', 'Updated User');
        expect(updatedUser).toHaveProperty('hasAssessmentPublished', true);
    });

    it('getting user without a session should fail', async () => {
        const anonCaller = getAppRouter().createCaller({ session: null }); // no session

        await expect(anonCaller[ENDPOINT_GET_USER]({ userId: testUsers.testUser.user_id })).rejects.toThrow();
    });

    it('pagination with only published assessments', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const result = await caller[ENDPOINT_GET_USERS]({
            limit: 10,
            offset: 0,
            onlyWithPublishedAssessments: true,
        });

        expect(result).toHaveProperty('users');
        expect(result).toHaveProperty('total');
        expect(Array.isArray(result.users)).toBe(true);
    });
});
