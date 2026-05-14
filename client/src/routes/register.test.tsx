import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/context/auth.context", () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    loading: false,
    hasRole: () => false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (opts: any) => ({
    ...opts,
    useSearch: () => ({}),
  }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) =>
    React.createElement("a", { href: to }, children),
  redirect: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  },
}));

let RegisterPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("@/routes/register");
  RegisterPage = (mod.Route as any).component;
});

describe("RegisterPage", () => {
  it("should render the registration form", () => {
    render(React.createElement(RegisterPage));

    expect(screen.getByLabelText("İsim")).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta")).toBeInTheDocument();
    expect(screen.getByLabelText("Şifre")).toBeInTheDocument();
    expect(screen.getByLabelText("Şifre Tekrarı")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /kayıt ol/i }),
    ).toBeInTheDocument();
  });

  it("should show error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("Şifre"), "Password123");
    await user.type(screen.getByLabelText("Şifre Tekrarı"), "Different456");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Şifreler eşleşmiyor")).toBeInTheDocument();
    });
  });

  it("should show error for short password", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    const passwordInput = screen.getByLabelText("Şifre");
    await user.type(passwordInput, "Ab1");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("Şifre en az 8 karakter olmalı"),
      ).toBeInTheDocument();
    });
  });

  it("should show error for password without letter", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    const passwordInput = screen.getByLabelText("Şifre");
    await user.type(passwordInput, "12345678");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("Şifre en az bir harf içermeli"),
      ).toBeInTheDocument();
    });
  });

  it("should call register and navigate on successful submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("İsim"), "Test User");
    await user.type(screen.getByLabelText("E-posta"), "new@test.com");
    await user.type(screen.getByLabelText("Şifre"), "Password123");
    await user.type(screen.getByLabelText("Şifre Tekrarı"), "Password123");
    await user.click(screen.getByRole("button", { name: /kayıt ol/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "Test User",
        "new@test.com",
        "Password123",
      );
    });
  });

  it("should show error message on registration failure", async () => {
    const { ApiError } = await import("@/api/client");
    mockRegister.mockRejectedValue(new ApiError(409, "Email already in use"));
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("İsim"), "Test User");
    await user.type(screen.getByLabelText("E-posta"), "dupe@test.com");
    await user.type(screen.getByLabelText("Şifre"), "Password123");
    await user.type(screen.getByLabelText("Şifre Tekrarı"), "Password123");
    await user.click(screen.getByRole("button", { name: /kayıt ol/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  it("should have a link to login page", () => {
    render(React.createElement(RegisterPage));

    const link = screen.getByText("Giriş Yap");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });
});
