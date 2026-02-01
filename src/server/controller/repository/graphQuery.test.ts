import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getDb } from 'tests/vitest/setupTestcontainer.js';
import { runGraphQuery } from './graphQuery.js';

describe('runGraphQuery (integration with testcontainer)', () => {
    it('should be able to call the test dummy function', async () => {
        const db = getDb();
        const query = {
            name: 'dummy_test_v1',
            input: z.object({
                testVal: z.string(),
            }),
            result: z.object({
                ok: z.string(),
            }),
        };
        const input = {
            testVal: 'hello world',
        };

        const result = await runGraphQuery(db, query, input);
        expect(result).toEqual({ ok: 'hello world' });
    });
});
