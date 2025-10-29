import { describe, expect, it } from 'vitest';
import { getDb } from '../../tests/vitest/setupTestcontainer';

export const TABLES = ['user_data', 'skills_assessment_history'];

describe('Database connection and tables', () => {
    it('db is reachable', async () => {
        const db = getDb();
        const result = await db.raw('SELECT 1');
        expect(result).toBeDefined();
    });

    it('required tables exist', async () => {
        const db = getDb();
        for (const table of TABLES) {
            const exists = await db.schema.hasTable(table);
            expect(exists).toBe(true);
        }
    });
});
