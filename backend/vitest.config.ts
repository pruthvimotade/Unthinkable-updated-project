import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      CORS_ORIGIN: "http://localhost:5173",
    },
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/modules/pricing/**",
        "src/modules/assignment/**",
      ],
    },
  },
});
