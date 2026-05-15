import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["**/*.entity.ts", "**/*.module.ts", "**/main.ts"],
      thresholds: {
        lines: 70,
      },
    },
  },
  plugins: [swc.vite()],
});
