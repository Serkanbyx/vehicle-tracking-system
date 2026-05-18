import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  Link: ({ children, to }: any) => React.createElement("a", { href: to }, children),
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

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should show validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    const emailInput = screen.getByLabelText("Email");
    await user.click(emailInput);
    await user.type(emailInput, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    });
  });

  it("should show validation error when password is empty", async () => {
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    const passwordInput = screen.getByLabelText("Password");
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("should call login and navigate on successful submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "Password123");
    });
  });

  it("should show inline error on 401 response", async () => {
    mockLogin.mockRejectedValue(new ApiError(401, "Unauthorized"));
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("Email"), "bad@test.com");
    await user.type(screen.getByLabelText("Password"), "WrongPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("should show generic error on non-401 failure", async () => {
    mockLogin.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(React.createElement(LoginPage));

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
    });
  });

  it("should have a link to register page", () => {
    render(React.createElement(LoginPage));

    const link = screen.getByText("Sign Up");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });
});
