import { getCaller, getUnauthenticatedCaller, testUsers } from 'tests/vitest/setupTestcontainer';
import { describe, expect, it } from 'vitest';
import type { UserSummary } from './user';

describe('user endpoint (integration)', async () => {
    it('get users with pagination', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const result = await caller.getUsers({ limit: 10, offset: 0 });
        expect(result).toHaveProperty('users');
        expect(result).toHaveProperty('total');
        expect(Array.isArray(result.users)).toBe(true);

        const users = Object.values(testUsers);
        // The normal dev seeding will have an extra user created.
        expect(result.total).toBe(users.length + 1);
        expect(result.users).toEqual(
            expect.arrayContaining(
                users.map((u) =>
                    expect.objectContaining({
                        userId: u.user_id,
                    }),
                ),
            ),
        );
    });

    it('get user by ID', async () => {
        const caller = getCaller('somebody-else-id');

        const user = await caller.getUser({ userId: testUsers.testUser.user_id });
        expect(user.userId).toBe(testUsers.testUser.user_id);
    });

    it('update user information', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const updateData: UserSummary = {
            userId: testUsers.testUser.user_id,
            displayName: 'Updated User',
            hasAssessmentPublished: true,
        };

        await caller.updateUser(updateData);

        const updatedUser = await caller.getUser({ userId: testUsers.testUser.user_id });
        expect(updatedUser).toHaveProperty('displayName', 'Updated User');
        expect(updatedUser).toHaveProperty('hasAssessmentPublished', true);
    });

    it('getting user without a session should fail', async () => {
        const anonCaller = getUnauthenticatedCaller(); // no session

        await expect(anonCaller.getUser({ userId: testUsers.testUser.user_id })).rejects.toThrow();
    });

    it('pagination with only published assessments', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const result = await caller.getUsers({
            limit: 10,
            offset: 0,
            onlyWithPublishedAssessments: true,
        });

        expect(result).toHaveProperty('users');
        expect(result).toHaveProperty('total');
        expect(Array.isArray(result.users)).toBe(true);
    });
});
