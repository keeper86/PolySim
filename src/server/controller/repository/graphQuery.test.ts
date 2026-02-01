import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getDb } from 'tests/vitest/setupTestcontainer.js';
import { runGraphQuery } from './graphQuery.js';
import { db } from '@/server/db.js';

describe('runGraphQuery (integration with testcontainer)', () => {
    it('should be able to call the test dummy function', async () => {
        const db = getDb();
        const query = {
            name: 'dummy_test_v1',
            input: z.object({
                id: z.string(),
            }),
            result: z.object({
                ok: z.string(),
            }),
        };
        const input = {
            id: 'e8e5fac19389c6b5d4401398edce9b9a9b27d689cc92fb49dfc60c6834a0eeb2',
        };

        const result = await runGraphQuery(db, query, input);
        // runGraphQuery returns an array of results; assert the first entry matches the expected shape
        expect(result[0]).toEqual({ ok: 'hello world' });
    });
});
