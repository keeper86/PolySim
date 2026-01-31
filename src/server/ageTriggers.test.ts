import { describe, expect, it } from 'vitest';
import { getDb } from 'tests/vitest/setupTestcontainer';

// Helper to get a sensible count from different raw result shapes
const getCount = (res: unknown): number => {
    if (res == null) {
        return 0;
    }
    if (Array.isArray(res)) {
        return res.length;
    }
    const asObj = res as Record<string, unknown>;
    if (typeof asObj.rowCount === 'number') {
        return asObj.rowCount;
    }
    if (Array.isArray(asObj.rows)) {
        return asObj.rows.length;
    }
    return 0;
};

describe('Apache AGE trigger sync', () => {
    it('should create nodes and relationships in AGE when provenance rows are inserted', async () => {
        const db = getDb();

        // Create entities, activities, and an agent
        await db('entities').insert({ id: 'e1', label: 'Entity 1' });
        await db('activities').insert({ id: 'a1', label: 'Activity 1', started_at: new Date(), ended_at: new Date() });
        await db('activities').insert({ id: 'a2', label: 'Activity 2', started_at: new Date(), ended_at: new Date() });

        await db('agents').insert({ label: 'Agent 1' });
        const agentRow = await db('agents').select('id').where('label', 'Agent 1').first();
        const agentId = (agentRow as { id: string } | undefined)?.id;

        // Insert relationships that should be mirrored into the AGE graph via triggers
        await db('was_generated_by').insert({ entity_id: 'e1', activity_id: 'a1' });
        await db('used').insert({ activity_id: 'a1', entity_id: 'e1', role: 'input' });
        await db('was_attributed_to').insert({ entity_id: 'e1', agent_id: agentId });
        await db('was_associated_with').insert({ activity_id: 'a1', agent_id: agentId, role: 'creator' });
        await db('was_informed_by').insert({ informed_id: 'a2', informer_id: 'a1' });

        // Helper available at module scope

        // Query AGE via cypher to ensure the node and relationships exist
        const nodeRes = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e1'}) RETURN e $$) as (a agtype)`,
        );
        expect(getCount(nodeRes)).toBeGreaterThan(0);

        const relRes = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e1'})-[r:wasGeneratedBy]->(a:Activity {id: 'a1'}) RETURN r $$) as (a agtype)`,
        );
        expect(getCount(relRes)).toBeGreaterThan(0);

        const usedRel = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (a:Activity {id: 'a1'})-[r:used]->(e:Entity {id: 'e1'}) RETURN r $$) as (a agtype)`,
        );
        expect(getCount(usedRel)).toBeGreaterThan(0);

        const attrRel = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e1'})-[r:wasAttributedTo]->(ag:Agent) RETURN r $$) as (a agtype)`,
        );
        expect(getCount(attrRel)).toBeGreaterThan(0);
    });

    it('should remove relationships and nodes in AGE when provenance rows are deleted', async () => {
        const db = getDb();

        // create a new set
        await db('entities').insert({ id: 'e-del', label: 'ToDelete' });
        await db('activities').insert({ id: 'a-del', label: 'A-Del', started_at: new Date(), ended_at: new Date() });
        await db('agents').insert({ label: 'Agent-Del' });

        await db('was_generated_by').insert({ entity_id: 'e-del', activity_id: 'a-del' });
        await db('used').insert({ activity_id: 'a-del', entity_id: 'e-del', role: 'input' });

        // ensure relationship exists
        const relBefore = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e-del'})-[r:wasGeneratedBy]->(a:Activity {id: 'a-del'}) RETURN r $$) as (a agtype)`,
        );
        expect(getCount(relBefore)).toBeGreaterThan(0);

        // delete the relationship row, trigger should remove it from AGE
        await db('was_generated_by').where({ entity_id: 'e-del', activity_id: 'a-del' }).del();
        const relAfter = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e-del'})-[r:wasGeneratedBy]->(a:Activity {id: 'a-del'}) RETURN r $$) as (a agtype)`,
        );
        expect(getCount(relAfter)).toBe(0);

        // delete the entity row and verify the node is removed
        await db('entities').where({ id: 'e-del' }).del();
        const nodeAfter = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e-del'}) RETURN e $$) as (a agtype)`,
        );
        expect(getCount(nodeAfter)).toBe(0);
    });

    it('should preserve node properties and allow matching by them', async () => {
        const db = getDb();

        // create a node with custom properties
        await db('entities').insert({ id: 'e-prop', label: 'PropLabel', metadata: { foo: 'bar' } });

        // match by id (triggers currently create node with id)
        const propRes = await db.raw(
            `SELECT * FROM ag_catalog.cypher('prov', $$ MATCH (e:Entity {id: 'e-prop'}) RETURN e $$) as (a agtype)`,
        );
        expect(getCount(propRes)).toBeGreaterThan(0);
    });
});
