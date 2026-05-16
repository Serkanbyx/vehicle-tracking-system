import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["test/e2e/**/*.e2e.spec.ts"],
    setupFiles: ["test/e2e/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
    forks: { singleFork: true },
  },
  plugins: [swc.vite()],
});
