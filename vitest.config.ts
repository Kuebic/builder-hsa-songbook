/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./client/test/setup/vitest.setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "client/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
        "shared/**/*.{ts,tsx}"
      ],
      exclude: [
        "node_modules/",
        "client/test/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/index.{ts,tsx}"
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@features": path.resolve(__dirname, "./client/features"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@/shared": path.resolve(__dirname, "./client/shared"),
    },
  },
});