import { describe, expect, it } from 'vitest';
import { getDb } from 'tests/vitest/setupTestcontainer';

export const TABLES = ['user_data', 'skills_assessment_history'];

const tableExists = async (table: string): Promise<boolean> => {
    const db = getDb();
    try {
        await db(table).select('*').limit(1);
        return true;
    } catch {
        return false;
    }
};

describe('Database connection and tables', () => {
    it('db is reachable', async () => {
        const db = getDb();
        const result = await db.raw('SELECT 1');
        expect(result).toBeDefined();
    });

    it('required tables exist', async () => {
        for (const table of TABLES) {
            const exists = await tableExists(table);
            expect(exists).toBe(true);
        }
        const doesNotExist = await tableExists('non_existent_table_xyz');
        expect(doesNotExist).toBe(false);
    });
});
