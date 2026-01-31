import type { z, ZodTypeAny } from 'zod';
import type { Knex } from 'knex';

type GraphQueryDef<P extends ZodTypeAny, R extends ZodTypeAny> = {
    name: string;
    params: P;
    result: R;
    cypher: string;
};

export function graphQuery<P extends ZodTypeAny, R extends ZodTypeAny>(def: GraphQueryDef<P, R>) {
    return def;
}

export async function runGraphQuery<Q extends ReturnType<typeof graphQuery>>(
    db: Knex,
    query: Q,
    input: z.infer<Q['params']>,
): Promise<z.infer<Q['result']>> {
    const params = query.params.parse(input);

    const escapeSqlString = (v: string) => v.replace(/'/g, "\\'");

    // Replace $param placeholders in the cypher with literal SQL-safe values.
    const rendered = query.cypher.replace(/\$([a-zA-Z0-9_]+)/g, (_m, name) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val: any = (params as any)[name];
        if (val === undefined) {
            return _m; // leave unknown placeholders untouched
        }
        if (typeof val === 'number' || typeof val === 'bigint') {
            return String(val);
        }
        // boolean
        if (typeof val === 'boolean') {
            return val ? 'TRUE' : 'FALSE';
        }
        // treat everything else as string
        return `'${escapeSqlString(String(val))}'`;
    });

    // Convert SQL-style single-line comments (`-- comment`) to Cypher single-line comments
    // (`// comment`). Cypher does not support `--` comments and unescaped `--` will
    // cause the cypher parser to fail. We only do a line-based replacement which is
    // safe for our use-cases where comments are their own lines.
    // Remove SQL-style single-line comments (`-- comment`) which are invalid in Cypher.
    // We remove the comment lines but keep their line breaks so that positional
    // structure of the script is preserved.
    let cypherBody = rendered.replace(/^\s*--.*$/gm, '');
    // Collapse runs of more than two newlines to at most two to avoid creating
    // accidental empty header/footer lines.
    cypherBody = cypherBody.replace(/\n{3,}/g, '\n\n');

    // Ensure we use a dollar-quote tag that does not appear inside the cypher body.
    let tag = 'PGCY';
    let counter = 0;
    while (cypherBody.includes(`$${tag}$`)) {
        counter += 1;
        tag = `PGCY${counter}`;
    }

    const sql = `\nSELECT result\nFROM ag_catalog.cypher('prov', $${tag}$${cypherBody}$${tag}$::cstring) AS (result json)\n`;

    const rowsRaw = await db.raw(sql);

    const asObj = rowsRaw as unknown as { rows?: unknown[] };
    const rows = asObj.rows ?? [];

    if (rows.length === 0) {
        throw new Error(
            `Graph query "${query.name}" returned 0 rows - expected exactly 1 aggregated JSON result named \`result\`. ` +
                'Ensure your Cypher aggregates and returns a single JSON object as `result`.',
        );
    }

    if (rows.length > 1) {
        throw new Error(
            `Graph query "${query.name}" returned ${rows.length} rows - expected exactly 1 aggregated JSON result. ` +
                'Queries must aggregate (e.g. collect/distinct) and RETURN one JSON `result` to be versionable/auditable.',
        );
    }

    // resultRow is expected to have a `result` property (json). We pass it through zod for runtime validation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (rows[0] as any).result;
    // cast through unknown to satisfy the generic return type — runtime validation is handled by zod.parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return query.result.parse(raw as any) as unknown as z.infer<Q['result']>;
}

export type GraphQuery = ReturnType<typeof graphQuery>;
