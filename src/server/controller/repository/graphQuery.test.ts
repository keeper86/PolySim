import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { graphQuery, runGraphQuery } from './graphQuery';
import { getDb } from 'tests/vitest/setupTestcontainer';

describe('runGraphQuery (integration with testcontainer)', () => {
    it('substitutes simple params and parses JSON result', async () => {
        const Q = graphQuery({
            name: 'test.simple',
            params: z.object({ x: z.string() }),
            result: z.object({ ok: z.string() }),
            cypher: `RETURN { ok: $x } AS result`,
        });

        const db = getDb();
        const out = await runGraphQuery(db, Q, { x: 'hello' });
        expect(out).toEqual({ ok: 'hello' });
    });

    it('handles single quotes in substituted strings', async () => {
        const Q = graphQuery({
            name: 'test.escape',
            params: z.object({ who: z.string() }),
            result: z.object({ ok: z.string() }),
            cypher: `RETURN { ok: $who } AS result`,
        });

        const db = getDb();
        const out = await runGraphQuery(db, Q, { who: "o'neil" });
        expect(out).toEqual({ ok: "o'neil" });
    });

    it('throws when query returns 0 rows', async () => {
        const Q = graphQuery({
            name: 'test.zero',
            params: z.object({}),
            result: z.object({ ok: z.string() }),
            // unwind empty list -> zero rows
            cypher: `UNWIND [] AS x RETURN { ok: 'x' } AS result`,
        });

        const db = getDb();
        type Params = z.infer<(typeof Q)['params']>;

        await expect(runGraphQuery(db, Q, {} as unknown as Params)).rejects.toThrow(/returned 0 rows/);
    });

    it('throws when query returns multiple rows', async () => {
        const Q = graphQuery({
            name: 'test.multiple',
            params: z.object({}),
            result: z.object({ ok: z.any() }),
            // unwind two elements -> two rows
            cypher: `UNWIND [1,2] AS x RETURN { ok: x } AS result`,
        });

        const db = getDb();
        type Params = z.infer<(typeof Q)['params']>;

        await expect(runGraphQuery(db, Q, {} as unknown as Params)).rejects.toThrow(/returned 2 rows/);
    });

    it('leaves unknown $placeholders untouched (does not error)', async () => {
        const Q = graphQuery({
            name: 'test.unknown',
            params: z.object({}),
            result: z.object({ ok: z.string() }),
            cypher: `// $missing\nRETURN { ok: 'ok' } AS result`,
        });

        const db = getDb();
        type Params = z.infer<(typeof Q)['params']>;
        const out = await runGraphQuery(db, Q, {} as unknown as Params);
        expect(out).toEqual({ ok: 'ok' });
    });

    it('throws when params fail zod validation', async () => {
        const Q = graphQuery({
            name: 'test.zod',
            params: z.object({ n: z.number() }),
            result: z.object({ ok: z.number() }),
            cypher: `RETURN { ok: $n } AS result`,
        });

        const db = getDb();
        // pass the wrong type on purpose
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect(runGraphQuery(db, Q, { n: 'nope' } as any)).rejects.toThrow();
    });

    it('parses nested JSON, arrays and multiple types correctly', async () => {
        const Q = graphQuery({
            name: 'test.nested',
            params: z.object({ n: z.number(), b: z.boolean(), s: z.string() }),
            result: z.object({
                n: z.number(),
                b: z.boolean(),
                s: z.string(),
                arr: z.array(z.number()),
                obj: z.object({ inner: z.string() }),
            }),
            cypher: `RETURN { n: $n, b: $b, s: $s, arr: [1,2,3], obj: { inner: $s } } AS result`,
        });

        const db = getDb();
        const out = await runGraphQuery(db, Q, { n: 7, b: true, s: 'hello' });
        expect(out).toEqual({ n: 7, b: true, s: 'hello', arr: [1, 2, 3], obj: { inner: 'hello' } });
    });

    it('preserves literal $$ sequences inside the cypher', async () => {
        const Q = graphQuery({
            name: 'test.dollars',
            params: z.object({}),
            result: z.object({ ok: z.string() }),
            cypher: `RETURN { ok: '$$money$$' } AS result`,
        });

        const db = getDb();
        type Params = z.infer<(typeof Q)['params']>;
        const out = await runGraphQuery(db, Q, {} as unknown as Params);
        expect(out).toEqual({ ok: '$$money$$' });
    });
});
