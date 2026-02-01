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
type QueryResult = z.infer<GraphQuery['result']>;
export async function runGraphQuery(db: Knex, query: GraphQuery, input: QueryInput): Promise<QueryResult> {
    console.log(query.name);

    const params = query.input.parse(input);
    const name = queryNameSchema.parse(query.name);

    const functionName = `prov.${name}`;
    const sql = `
        SELECT result AS result FROM ${functionName}(?)
    `;

    const { rows = [] } = (await db.raw(sql, [JSON.stringify(params)])) as {
        rows?: { result: unknown }[];
    };

    if (rows.length !== 1) {
        throw new Error(`Graph query "${query.name}" returned ${rows.length} rows - expected exactly 1.`);
    }

    return query.result.parse(rows[0].result);
}
