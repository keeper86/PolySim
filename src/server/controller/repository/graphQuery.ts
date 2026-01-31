import type { z } from 'zod';
import type { Knex } from 'knex';

type GraphQuery = {
    name: string;
    params: z.ZodType;
    result: z.ZodType;
};

type QueryInput = z.infer<GraphQuery['params']>;
type QueryResult = z.infer<GraphQuery['result']>;

export async function runGraphQuery(db: Knex, query: GraphQuery, input: QueryInput): Promise<QueryResult> {
    const params = query.params.parse(input);
    const functionName = `prov.${query.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const sql = `SELECT * FROM ${functionName}(?)`;
    const { rows = [] } = (await db.raw(sql, [JSON.stringify(params)])) as {
        rows?: { result: QueryResult }[];
    };

    if (rows.length !== 1) {
        throw new Error(`Graph query "${query.name}" returned ${rows.length} rows - expected exactly 1.`);
    }

    return query.result.parse(rows[0].result);
}
