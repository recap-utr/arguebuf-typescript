/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  test: {},
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "arguebuf",
      fileName: "arguebuf",
      formats: ["es"],
    },
  },
});
