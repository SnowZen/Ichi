import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "functions/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      external: [
        // Externaliser Hono pour le build client
        "hono",
      ],
    },
  },
  plugins: [react(), copyCloudflareFilesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // Configuration pour les Functions (serveur)
  ssr: {
    format: "esm", // Forcer les modules ES pour Cloudflare Workers
    external: [
      "hono",
      // Externaliser les modules Node.js non supportés si utilisés dans ./routes
      "fs",
      "path",
      "crypto",
      "zlib",
      "querystring",
      "events",
      "stream",
      "os",
      "http",
      "net",
      "string_decoder",
      "util",
      "url",
    ],
  },
}));

function copyCloudflareFilesPlugin(): Plugin {
  return {
    name: "copy-cloudflare-files",
    apply: "build",
    writeBundle() {
      const files = ["_headers", "_redirects"];
      files.forEach((file) => {
        if (existsSync(file)) {
          copyFileSync(file, `dist/spa/${file}`);
        }
      });
    },
  };
}