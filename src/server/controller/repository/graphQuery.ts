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
    const _params = query.input.parse(input);
    const _name = queryNameSchema.parse(query.name);

    await db.raw("SET search_path = ag_catalog, '$user', public");

    console.log(_params);
    const param = {
        id: 'e8e5fac19389c6b5d4401398edce9b9a9b27d689cc92fb49dfc60c6834a0eeb2',
    };

    const existingId = 'b4a827afe1269ba19c71a5c2e736ed98ff5e062c76663c67761b82225ea95cfc';
    const sql = `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (v{myid: '${existingId}'}) RETURN v $$) AS (v json);`;

    const result = await db.raw(
        `
        SELECT * FROM ag_catalog.cypher(
            'prov', 
            $$
                MATCH (u $param)
                RETURN u
            $$, 
            ?::agtype
        ) AS (user_node json) 
    `,
        [{ param }],
    );

    console.log('RESULT', result);

    const { rows = [] } = result as {
        rows?: { v: unknown }[];
    };

    const vertices = rows.map((row) => row.v);
    return vertices;
}
