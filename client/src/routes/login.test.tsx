import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ApiError } from "@/api/client";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/context/auth.context", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    hasRole: () => false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (opts: any) => ({
    ...opts,
    useSearch: () => ({ redirect: undefined }),
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

let LoginPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("@/routes/login");
  LoginPage = (mod.Route as any).component;
});

describe("LoginPage", () => {
  it("should render the login form with email and password fields", () => {
    render(React.createElement(LoginPage));

    expect(screen.getByLabelText("E-posta")).toBeInTheDocument();
    expect(screen.getByLabelText("Şifre")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /giriş yap/i }),
    ).toBeInTheDocument();
  });

  it("should show validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    const emailInput = screen.getByLabelText("E-posta");
    await user.click(emailInput);
    await user.type(emailInput, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Geçerli bir e-posta girin")).toBeInTheDocument();
    });
  });

  it("should show validation error when password is empty", async () => {
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    const passwordInput = screen.getByLabelText("Şifre");
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Şifre gerekli")).toBeInTheDocument();
    });
  });

  it("should call login and navigate on successful submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("E-posta"), "test@test.com");
    await user.type(screen.getByLabelText("Şifre"), "Password123");
    await user.click(screen.getByRole("button", { name: /giriş yap/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "Password123");
    });
  });

  it("should show inline error on 401 response", async () => {
    mockLogin.mockRejectedValue(new ApiError(401, "Unauthorized"));
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("E-posta"), "bad@test.com");
    await user.type(screen.getByLabelText("Şifre"), "WrongPass1");
    await user.click(screen.getByRole("button", { name: /giriş yap/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Geçersiz e-posta veya şifre"),
      ).toBeInTheDocument();
    });
  });

  it("should show generic error on non-401 failure", async () => {
    mockLogin.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("E-posta"), "test@test.com");
    await user.type(screen.getByLabelText("Şifre"), "Password123");
    await user.click(screen.getByRole("button", { name: /giriş yap/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Bir hata oluştu. Lütfen tekrar deneyin."),
      ).toBeInTheDocument();
    });
  });

  it("should have a link to register page", () => {
    render(React.createElement(LoginPage));

    const link = screen.getByText("Kayıt Ol");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });
});
