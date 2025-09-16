import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { EnergyForecast } from "./EnergyForecast";
import { testServer } from "../../../test/setupTestServer";
import { http } from "msw";

vi.mock("react-chartjs-2", () => ({
  Line: () => <canvas data-testid='mock-chart'></canvas>,
}));

describe("EnergyForecast", () => {
  it("shows loading state initially", () => {
    render(<EnergyForecast />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays data after loading", async () => {
    render(<EnergyForecast />);

    await waitFor(() => {
      expect(screen.getByText("Data loaded successfully")).toBeInTheDocument();
    });

    expect(screen.getByText(/Historical Data: 7 points/)).toBeInTheDocument();
    expect(screen.getByText(/Forecast Data: 6 points/)).toBeInTheDocument();
  });

  it("shows error state when data is empty", async () => {
    testServer.use(
      http.get("/api/v1/energy/historical", () => new Response(JSON.stringify([]), { status: 200 })),
      http.get("/api/v1/energy/forecast", () => new Response(JSON.stringify({ data: [] }), { status: 200 })),
    );

    render(<EnergyForecast />);

    await waitFor(() => {
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });
});
