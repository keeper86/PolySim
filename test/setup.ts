// Extend Jest "expect" functionality with Testing Library assertions.
import '@testing-library/jest-dom';

import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { testServer } from './setupTestServer';

vi.mock('chartjs-adapter-date-fns', () => ({}));

vi.mock('chart.js', async () => {
    const actual = await vi.importActual<typeof import('chart.js')>('chart.js');
    return {
        ...actual,
        Chart: class MockChart extends actual.Chart {
            constructor(ctx: CanvasRenderingContext2D, config: never) {
                super(ctx, config);
            }
            destroy() {}
        },
    };
});

beforeAll(() => testServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => testServer.resetHandlers());
afterAll(() => testServer.close());
