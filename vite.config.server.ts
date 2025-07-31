// vite.config.server.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Ne pas vider le dossier 'dist'
    ssr: 'functions/api/[[path]].ts', // Le point d'entrée de notre fonction API
    rollupOptions: {
      output: {
        entryFileNames: '_worker.js', // Le nom conventionnel pour les fonctions Pages
        format: 'es',
      },
    },
  },
});