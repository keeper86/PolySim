import { http } from 'msw';
import { setupServer } from 'msw/node';
import { mockForecastData, mockHistoricData } from './mockData';

const handlers = [
    http.get('/api/v1/energy/historical', () => {
        return new Response(JSON.stringify(mockHistoricData), {
            headers: { 'Content-Type': 'application/json' },
        });
    }),

    http.get('/api/v1/energy/forecast', () => {
        return new Response(
            JSON.stringify({
                data: [mockForecastData],
            }),
            {
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }),
];

export const testServer = setupServer(...handlers);
