import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

/* ── jsdom polyfills ── */

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/* ── Global mocks ── */

vi.mock("@/env", () => ({
  env: Object.freeze({
    API_URL: "http://localhost:5000/api",
    WS_URL: "ws://localhost:5000",
    MAP_STYLE_URL: "https://tiles.openfreemap.org/styles/liberty",
    SENTRY_DSN: "",
  }),
}));
