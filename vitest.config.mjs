import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/*.test.jsx", "**/*.test.js"],
    globals: true,
    restoreMocks: true,
  },
});
