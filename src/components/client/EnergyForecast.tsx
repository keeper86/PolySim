'use client';
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
} from 'chart.js';

import { FC, useEffect, useState } from 'react';

import 'chartjs-adapter-date-fns';

import { TimeSeriesData } from '../../types/timeSeriesData';
import { mockForecastData, mockHistoricData } from '../../../test/mockData';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

export const EnergyForecast: FC = () => {
    const [historicalData, setHistoricalData] = useState<TimeSeriesData[]>([]);
    const [forecastData, setForecastData] = useState<TimeSeriesData[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined')
            import('chartjs-plugin-zoom').then((plugin) => {
                Chart.register(plugin.default);
            });

        const fetchData = async () => {
            // fetch data from the server endpoint /api/user
            const historicalDataResult = await fetch('/api/v1/energy/historical');
            if (!historicalDataResult.ok) {
                console.log('Failed to fetch historical data');
                setHistoricalData(mockHistoricData);
            } else {
                setHistoricalData((await historicalDataResult.json()).data);
            }
            const forecastDataResult = await fetch('/api/v1/energy/forecast');
            if (!forecastDataResult.ok) {
                console.log('Failed to fetch forecast data');
                setForecastData(mockForecastData);
            } else {
                setForecastData((await forecastDataResult.json()).data);
            }
            setIsLoading(false);
        };
        fetchData().catch((error) => {
            console.error('Error fetching data:', error);
            setIsLoading(false);
        });
    }, []);

    const chartData = {
        datasets: [
            {
                label: 'Historical Data',
                data: historicalData.map((d) => ({
                    x: d.date,
                    y: d.value,
                })),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                fill: {
                    target: 'origin',
                    above: 'rgba(53, 162, 235, 0.1)',
                },
                tension: 0.3,
                pointRadius: 2,
            },
            {
                label: 'Forecast',
                data: forecastData.map((d) => ({
                    x: d.date,
                    y: d.value,
                })),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time' as const,
                time: {
                    unit: 'month' as const,
                    tooltipFormat: 'yyyy-MM-dd',
                },
                title: {
                    display: true,
                    text: 'Date',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Energy Value',
                },
            },
        },
        plugins: {
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy' as const,
                },
                pan: {
                    enabled: true,
                    mode: 'xy' as const,
                },
            },
            tooltip: {
                callbacks: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    title: (tooltipItems: any) => {
                        const rawValue = (tooltipItems[0].raw as { x: string | number | Date }).x;
                        const date = new Date(rawValue);
                        return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
                    },
                },
            },
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Energy Production with Forecast',
            },
        },
    };

    return (
        <div className='flex flex-col items-center justify-center'>
            {isLoading && <div className='animate-pulse text-gray-500'>Loading...</div>}
            {!isLoading && historicalData.length === 0 && <div className='text-red-500'>No data available</div>}
            {!isLoading && historicalData.length > 0 && <div className='text-green-500'>Data loaded successfully</div>}
            <div className='text-gray-500 mb-4'>Historical Data: {historicalData.length} points</div>
            <div className='text-gray-500 mb-4'>Forecast Data: {forecastData.length} points</div>
            <div className='text-gray-500 mb-4'>
                {isLoading ? 'Loading chart...' : `Chart with ${historicalData.length + forecastData.length} points`}
            </div>
            <div className='h-[600px] w-full'>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};
