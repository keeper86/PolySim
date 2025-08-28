import { TimeSeriesData } from '../src/types/timeSeriesData';

export const mockHistoricData: TimeSeriesData[] = [
    { date: '2020-01-01T00:00', value: 6206.8125 },
    { date: '2020-01-02T00:00', value: 6202.8125 },
    { date: '2020-01-03T00:00', value: 6203.8125 },
    { date: '2020-01-04T00:00', value: 6204.8125 },
    { date: '2020-01-05T00:00', value: 6200.8125 },
    { date: '2020-01-06T00:00', value: 6209.8125 },
    { date: '2020-01-07T00:00', value: 6206.8125 },
];

export const mockForecastData: TimeSeriesData[] = [
    { date: '2020-01-07T00:00', value: 6206.8125 },
    { date: '2020-01-08T00:00', value: 6212.8125 },
    { date: '2020-01-09T00:00', value: 6213.8125 },
    { date: '2020-01-10T00:00', value: 6214.8125 },
    { date: '2020-01-11T00:00', value: 6220.8125 },
    { date: '2020-01-12T00:00', value: 6229.8125 },
];
