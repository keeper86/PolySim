import { getCaller, testUsers } from 'tests/vitest/setupTestcontainer';
import { describe, expect, it } from 'vitest';

describe('personal access token controller (integration)', () => {
    it('create, list and revoke PAT', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const { token } = await caller.createPAT({ name: 'test-token', expiresInDays: 1 });
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThanOrEqual(64);
        expect(/^[0-9a-f]+$/i.test(token)).toBe(true);

        const pats = await caller.listPATs({});
        expect(Array.isArray(pats)).toBe(true);

        const found = pats.find((p) => String(p.name ?? '') === 'test-token');

        expect(found).toBeDefined();

        expect(found).toHaveProperty('id');
        expect(found).toHaveProperty('created_at');

        const revokeResult = await caller.revokePAT({ id: String(found!.id) });
        expect(revokeResult).toHaveProperty('success', true);

        const patsAfter = await caller.listPATs({});
        const stillThere = patsAfter.find((p) => String(p.id) === String(found!.id));
        expect(stillThere).toBeUndefined();
    });
});
