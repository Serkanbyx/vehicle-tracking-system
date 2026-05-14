import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockCreateVehicle = vi.fn();
const mockUpdateVehicle = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/api/vehicles", () => ({
  createVehicle: (...args: any[]) => mockCreateVehicle(...args),
  updateVehicle: (...args: any[]) => mockUpdateVehicle(...args),
}));

vi.mock("@/api/uploads", () => ({
  uploadDriver: vi.fn().mockResolvedValue({ url: "http://photo.test/driver.jpg" }),
  uploadVehicle: vi.fn().mockResolvedValue({ url: "http://photo.test/vehicle.jpg" }),
}));

vi.mock("@/context/auth.context", () => ({
  useAuth: () => ({
    user: { id: "u1", role: "manager" },
    hasRole: () => true,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(
    QueryClientProvider,
    { client: qc },
    children,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VehicleForm — Create mode", () => {
  it("should render all form sections", async () => {
    const { VehicleForm } = await import(
      "@/components/vehicles/VehicleForm"
    );

    render(React.createElement(VehicleForm), { wrapper: Wrapper });

    expect(screen.getByLabelText("Plaka *")).toBeInTheDocument();
    expect(screen.getByLabelText("Tür")).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    expect(screen.getByLabelText("Renk")).toBeInTheDocument();
    expect(screen.getByText("Sürücü Bilgileri")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /oluştur/i }),
    ).toBeInTheDocument();
  });

  it("should call createVehicle with correct payload on submit", async () => {
    mockCreateVehicle.mockResolvedValue({ id: "new-v1" });
    const user = userEvent.setup();

    const { VehicleForm } = await import(
      "@/components/vehicles/VehicleForm"
    );

    render(React.createElement(VehicleForm), { wrapper: Wrapper });

    await user.clear(screen.getByLabelText("Plaka *"));
    await user.type(screen.getByLabelText("Plaka *"), "34 TEST 01");

    const driverNameInput = screen.getByLabelText("İsim");
    await user.type(driverNameInput, "Ahmet");

    await user.click(screen.getByRole("button", { name: /oluştur/i }));

    await waitFor(() => {
      expect(mockCreateVehicle).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateVehicle.mock.calls[0]![0];
    expect(payload.plate).toBe("34 TEST 01");
    expect(payload.vehicleType).toBe("car");
    expect(payload.driver.name).toBe("Ahmet");
  });

  it("should show error on submit failure", async () => {
    mockCreateVehicle.mockRejectedValue(new Error("Server error"));
    const user = userEvent.setup();

    const { VehicleForm } = await import(
      "@/components/vehicles/VehicleForm"
    );

    render(React.createElement(VehicleForm), { wrapper: Wrapper });

    await user.clear(screen.getByLabelText("Plaka *"));
    await user.type(screen.getByLabelText("Plaka *"), "34 ERR 01");
    await user.type(screen.getByLabelText("İsim"), "Driver");
    await user.click(screen.getByRole("button", { name: /oluştur/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});

describe("VehicleForm — Edit mode", () => {
  const existingVehicle = {
    id: "v-existing",
    plate: "06 EDIT 01",
    vehicleType: "truck" as const,
    model: "Volvo FH",
    year: 2022,
    color: "White",
    driver: { name: "Existing Driver", phone: "+905551234567" },
    photoUrl: null,
    speedLimitKmh: 80,
    isActive: true,
    lastLocation: null,
    assignedManagers: [],
    createdById: "u1",
    tags: ["cargo", "priority"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  it("should pre-fill form fields in edit mode", async () => {
    const { VehicleForm } = await import(
      "@/components/vehicles/VehicleForm"
    );

    render(
      React.createElement(VehicleForm, { vehicle: existingVehicle }),
      { wrapper: Wrapper },
    );

    expect(screen.getByLabelText("Plaka *")).toHaveValue("06 EDIT 01");
    expect(screen.getByLabelText("Model")).toHaveValue("Volvo FH");
    expect(
      screen.getByRole("button", { name: /güncelle/i }),
    ).toBeInTheDocument();
  });

  it("should call updateVehicle on submit in edit mode", async () => {
    mockUpdateVehicle.mockResolvedValue(existingVehicle);
    const user = userEvent.setup();

    const { VehicleForm } = await import(
      "@/components/vehicles/VehicleForm"
    );

    render(
      React.createElement(VehicleForm, { vehicle: existingVehicle }),
      { wrapper: Wrapper },
    );

    const colorInput = screen.getByLabelText("Renk");
    await user.clear(colorInput);
    await user.type(colorInput, "Blue");
    await user.click(screen.getByRole("button", { name: /güncelle/i }));

    await waitFor(() => {
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateVehicle.mock.calls[0]![0]).toBe("v-existing");
  });
});
