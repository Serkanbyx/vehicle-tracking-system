import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

const mockRefresh = vi.fn();
const mockGetMe = vi.fn();
const mockSetAccessToken = vi.fn();
const mockDashboardConnect = vi.fn();
const mockDashboardDisconnect = vi.fn();
const mockRouterNavigate = vi.fn();

vi.mock("@/api/auth", () => ({
  refresh: (...args: any[]) => mockRefresh(...args),
  getMe: (...args: any[]) => mockGetMe(...args),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/api", () => ({
  setAccessToken: (...args: any[]) => mockSetAccessToken(...args),
  dashboardSocket: {
    connect: (...args: any[]) => mockDashboardConnect(...args),
    disconnect: (...args: any[]) => mockDashboardDisconnect(...args),
  },
}));

vi.mock("@/router", () => ({
  router: { navigate: (...args: any[]) => mockRouterNavigate(...args) },
}));

import { AuthProvider, useAuth } from "@/context/auth.context";

const testUser = {
  id: "u1",
  name: "Test User",
  email: "test@test.com",
  role: "viewer" as const,
  avatarUrl: null,
  phone: null,
  isActive: true,
  lastLoginAt: null,
  preferences: {},
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

function AuthConsumer() {
  const auth = useAuth();
  return React.createElement("div", null, [
    React.createElement(
      "span",
      { key: "status", "data-testid": "status" },
      auth.loading
        ? "loading"
        : auth.user
          ? "authenticated"
          : "unauthenticated",
    ),
    auth.user
      ? React.createElement(
          "span",
          { key: "email", "data-testid": "email" },
          auth.user.email,
        )
      : null,
  ]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthContext — refresh on mount", () => {
  it("happy path — refresh succeeds and user is set", async () => {
    mockRefresh.mockResolvedValue({ accessToken: "tok-123", user: testUser });
    mockGetMe.mockResolvedValue(testUser);

    await act(async () => {
      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AuthConsumer),
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });

    expect(screen.getByTestId("email").textContent).toBe("test@test.com");
    expect(mockSetAccessToken).toHaveBeenCalledWith("tok-123");
    expect(mockDashboardConnect).toHaveBeenCalledWith("tok-123");
  });

  it("refresh failure — user is null", async () => {
    mockRefresh.mockRejectedValue(new Error("Token expired"));

    await act(async () => {
      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AuthConsumer),
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
  });
});

describe("AuthContext — auth:logout event", () => {
  it("should clear user and disconnect socket on 401 event", async () => {
    mockRefresh.mockResolvedValue({ accessToken: "tok-123", user: testUser });
    mockGetMe.mockResolvedValue(testUser);

    await act(async () => {
      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AuthConsumer),
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });

    expect(mockDashboardDisconnect).toHaveBeenCalled();
    expect(mockRouterNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});

describe("AuthContext — no PII in localStorage", () => {
  it("should not store user data in localStorage", async () => {
    mockRefresh.mockResolvedValue({ accessToken: "tok", user: testUser });
    mockGetMe.mockResolvedValue(testUser);

    await act(async () => {
      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AuthConsumer),
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) ?? "";
        expect(val).not.toContain(testUser.email);
        expect(val).not.toContain(testUser.name);
      }
    }
  });
});
