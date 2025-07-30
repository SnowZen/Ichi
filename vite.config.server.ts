import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        'zlib',
        'querystring',
        'path',
        'crypto',
        'events',
        'fs',
        'stream',
        'os',
        'http',
        'net',
        'string_decoder',
        'util',
        'url',
        'serverless-http',
        'express',
        'body-parser',
        'dotenv',
        'etag',
        'mime',
        'parseurl',
        'send',
        'serve-static',
        'content-disposition',
        'cookie-signature',
        'mime-types',
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
