import { resolve } from "path";
import { defineConfig } from "vite";
import Pages from "vite-plugin-pages";
import react from "@vitejs/plugin-react";
import reactRefresh from "@vitejs/plugin-react-refresh";
import ViteRadar from "vite-plugin-radar";
const inject = require("@rollup/plugin-inject");

export default defineConfig({
  plugins: [
    react(),
    ViteRadar({
      // Google Analytics tag injection
      analytics: {
        id: "G-2MSF5XF8LY",
      },
    }),
    reactRefresh(),
    Pages({
      pagesDir: "src/pages",
      importMode: () => "sync",
    }),
    {
      ...inject({
        global: [
          require.resolve("node-stdlib-browser/helpers/esbuild/shim"),
          "global",
        ],
        process: [
          require.resolve("node-stdlib-browser/helpers/esbuild/shim"),
          "process",
        ],
        Buffer: [
          require.resolve("node-stdlib-browser/helpers/esbuild/shim"),
          "Buffer",
        ],
      }),
      enforce: "post",
    },
  ],
  define: {
    "process.env": {},
  },
  build: {
    target: ["es2020"],
    rollupOptions: {},
  },
  optimizeDeps: {
    include: ["buffer", "process", "intro.js"],
  },
  resolve: {
    alias: {
      util: "util",
      process: "process/browser",
      "@": resolve(__dirname, "./src"),
    },
  },
});
