import { http } from "msw";
import { setupServer } from "msw/node";
import { mockForecastData, mockHistoricData } from "./mockData";

const handlers = [
    http.get("/api/v1/energy/historical", () => {
        console.log("Mock server: returning historical data", JSON.stringify(mockHistoricData));
        return new Response(
            JSON.stringify({
                data: mockHistoricData,
            }),
            {
                headers: { "Content-Type": "application/json" },
            },
        );
    }),

    http.get("/api/v1/energy/forecast", () => {
        console.log("Mock server: returning forecast data", JSON.stringify(mockForecastData));
        return new Response(
            JSON.stringify({
                data: mockForecastData,
            }),
            {
                headers: { "Content-Type": "application/json" },
            },
        );
    }),
];

export const testServer = setupServer(...handlers);
