import { getCaller, testUsers } from 'tests/vitest/setupTestcontainer';
import { describe, it, expect } from 'vitest';
import type { LogEntry } from './logs';

describe('Logs Endpoint Integration Test', () => {
    it('should process valid log entries', async () => {
        const caller = getCaller(testUsers.testUser.user_id);

        const testLogs: LogEntry[] = [
            {
                level: 'info',
                message: 'Integration test log',
                data: { key: 'value' },
                component: 'test-component',
                timestamp: new Date().toISOString(),
            },
        ];

        const result = await caller.logs({ logs: testLogs });
        expect(result).toHaveProperty('success', true);
    });

    it('should reject invalid log entries', async () => {
        const caller = getCaller('test-user');

        const invalidLogs = [
            {
                level: 'invalid-level',
                message: 'This should fail',
            },
        ];

        // @ts-expect-error will fail validation
        await expect(caller.logs({ logs: invalidLogs })).rejects.toThrow();
    });
});
