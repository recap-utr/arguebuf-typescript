/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts()],
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
