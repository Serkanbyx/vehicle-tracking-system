import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

let RegisterPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("@/routes/register");
  RegisterPage = (mod.Route as any).component;
});

describe("RegisterPage", () => {
  it("should render the registration form", () => {
    render(React.createElement(RegisterPage));

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("should show error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.type(screen.getByLabelText("Confirm Password"), "Different456");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("should show error for short password", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "Ab1");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("should show error for password without letter", async () => {
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "12345678");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Password must contain at least one letter")).toBeInTheDocument();
    });
  });

  it("should call register and navigate on successful submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "new@test.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.type(screen.getByLabelText("Confirm Password"), "Password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("Test User", "new@test.com", "Password123");
    });
  });

  it("should show error message on registration failure", async () => {
    const { ApiError } = await import("@/api/client");
    mockRegister.mockRejectedValue(new ApiError(409, "Email already in use"));
    const user = userEvent.setup();
    render(React.createElement(RegisterPage));

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "dupe@test.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.type(screen.getByLabelText("Confirm Password"), "Password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  it("should have a link to login page", () => {
    render(React.createElement(RegisterPage));

    const link = screen.getByText("Sign In");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });
});
