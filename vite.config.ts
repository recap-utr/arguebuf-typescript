/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { configDefaults } from "vitest/dist/config";

const external = (id: string) =>
  !id.startsWith("\0") && !id.startsWith(".") && !id.startsWith("/");

// https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vanilla-ts
export default defineConfig({
  build: {
    rollupOptions: {
      external,
    },
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
  },
  test: {
    exclude: [...configDefaults.exclude, ".direnv/**"],
  },
  plugins: [dts()],
});
