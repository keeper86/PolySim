import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnergyForecast } from './EnergyForecast';

vi.mock('chartjs-adapter-date-fns', () => ({}));

vi.mock('chart.js', async () => {
    const actual = await vi.importActual<typeof import('chart.js')>('chart.js');
    return {
        ...actual,
        Chart: class MockChart extends actual.Chart {
            constructor(ctx: CanvasRenderingContext2D, config: never) {
                super(ctx, config);
            }
            // eslint-disable-next-line
            destroy() {}
        },
    };
});

vi.mock('react-chartjs-2', () => ({
    Line: () => <canvas data-testid='mock-chart'></canvas>,
}));

describe('EnergyForecast', () => {
    it('displays data after loading', async () => {
        render(<EnergyForecast />);

        await waitFor(() => {
            expect(screen.getByText('Data loaded successfully')).toBeInTheDocument();
        });

        expect(screen.getByText(/Historical Data: 7 points/)).toBeInTheDocument();
        expect(screen.getByText(/Forecast Data: 6 points/)).toBeInTheDocument();
    });
});
