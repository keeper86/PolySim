/**
 * Type definitions for Apache AGE cypher results used by the app.
 * These mirror the agtype structures described in the AGE docs and the
 * shapes emitted by our specific cypher queries (id, label, properties, etc.).
 */

export type AgtypeProperties = Record<string, unknown>;

export type AgtypeVertex = {
    id: string | number;
    label: string;
    properties?: AgtypeProperties;
};

export type AgtypeEdge = {
    id: string | number;
    start_id?: string | number;
    end_id?: string | number;
    label?: string;
    properties?: AgtypeProperties;
};

// Row shape for 'SELECT ... RETURN n.id as id, head(labels(n)) as type, n.label as label, n.properties as properties'
export type CypherNodeRow = {
    id?: string | number;
    type?: string;
    label?: string;
    properties?: AgtypeProperties;
};

// Row shape for 'RETURN s.id as from, t.id as to, type(r) as rel, r.role as role'
export type CypherEdgeRow = {
    from?: string | number;
    to?: string | number;
    rel?: string;
    role?: string;
    properties?: AgtypeProperties;
};

// Normalized types used by the frontend graph components
export type NormalizedNode = { id: string; label: string; group?: string };
export type NormalizedEdge = { from: string; to: string; label?: string };

// intentionally no default export; file provides named types only
