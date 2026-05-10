import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is a runtime no-op in Next.js (it throws if imported
      // client-side). Vitest doesn't ship it, so stub to an empty module.
      "server-only": path.resolve(__dirname, "lib/test-stubs/empty.ts"),
    },
  },
});
