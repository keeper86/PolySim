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
    console.log(params);

    const name = queryNameSchema.parse(query.name);

    await db.raw("SET search_path = ag_catalog, '$user', public");

    const sql = `SELECT * FROM prov.${name}(?::agtype)`;
    const result = await db.raw(sql, [{ params: JSON.stringify(params) }]);

    const existingId = 'b4a827afe1269ba19c71a5c2e736ed98ff5e062c76663c67761b82225ea95cfc';

    const resu8lt = await db.raw(
        `
        SELECT * FROM ag_catalog.cypher(
            'prov', 
            $$
                MATCH (u $props)
                RETURN u
            $$, 
            ?::agtype
        ) AS (user_node json) 
    `,
        [{ props: { id: existingId } }],
    );

    const { rows = [] } = result as { rows: unknown[] };

    console.log('result:', result.rows, resu8lt.rows);

    return rows;
}
