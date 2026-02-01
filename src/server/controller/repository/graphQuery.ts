import { z } from 'zod';
import type { ZodType } from 'zod';
import type { Knex } from 'knex';

export type GraphQuery = {
    name: string;
    input: ZodType;
    result: ZodType;
};

export const queryNameSchema = z
    .string()
    .transform((s) => s.toLowerCase())
    .refine((s) => /^[a-z0-9_]+$/.test(s), {
        message: 'graph query name must contain only lowercase a-z, numbers and underscore',
    });

type QueryInput = z.infer<GraphQuery['input']>;
export async function runGraphQuery(db: Knex, query: GraphQuery, input: QueryInput): Promise<unknown[]> {
    const params = query.input.parse(input);
    const name = queryNameSchema.parse(query.name);

    await db.raw("SET search_path = ag_catalog, '$user', public");

    const sql = `SELECT * FROM prov.${name}(?::agtype)`;
    const result = await db.raw(sql, [params]);

    const { rows = [] } = result as { rows?: Record<string, unknown>[] };

    return rows.map((r) => Object.values(r)[0]);
}
