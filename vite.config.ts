/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const external = (id: string) =>
  !id.startsWith("\0") && !id.startsWith(".") && !id.startsWith("/");

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
  test: {},
  plugins: [dts()],
});
