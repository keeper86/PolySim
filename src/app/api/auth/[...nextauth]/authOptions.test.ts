import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('authOptions callbacks', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('should provision user idempotently using onConflict().ignore() on signIn', async () => {
        const user = {
            user_id: 'u1',
            display_name: 'Nice Name',
            email: 'abc@example.com',
            has_assessment_published: false,
        };
        let insertArgs: Record<string, unknown> | null = null;

        const merge = vi.fn(() => Promise.resolve());
        const onConflict = vi.fn(() => ({ merge }));
        const insert = vi.fn((args: Record<string, unknown>) => {
            insertArgs = args;
            return { onConflict };
        });

        const dbFn = vi.fn(() => ({ insert }));

        vi.doMock('../../../../server/db', () => ({ db: dbFn }));

        const mod = await import('./authOptions');
        const { authOptions } = mod;

        const signInFn = authOptions.callbacks!.signIn!;
        const res = await signInFn({
            account: { providerAccountId: user.user_id, provider: 'keycloak', type: 'oauth' },
            profile: { email: user.email, name: user.display_name, sub: user.user_id },
            user: { id: user.user_id, email: user.email },
        });

        expect(res).toBe(true);
        expect(dbFn).toHaveBeenCalledWith('user_data');
        expect(insert).toHaveBeenCalled();
        expect(onConflict).toHaveBeenCalledWith('user_id');
        expect(merge).toHaveBeenCalled();
        expect(insertArgs).toEqual(user);
    });
});
