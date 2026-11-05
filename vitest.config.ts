import { defineConfig } from "vitest/config";

export default defineConfig({
  // the subpath imports of package.json point to the build, tests run on the sources
  resolve: { alias: [{ find: /^#\//, replacement: new URL("src/", import.meta.url).pathname }] },
  test: { setupFiles: ["./vitest.setup.ts"] },
});
