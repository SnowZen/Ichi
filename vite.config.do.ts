// vite.config.do.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Important: ne pas vider le dossier 'dist' du client
    lib: {
      entry: 'server/room-do.ts', // Le fichier source de notre DO
      formats: ['es'],
      fileName: () => '_workers/room-do-worker.js', // Le nom du fichier de sortie
    },
    rollupOptions: {
      // Les Durable Objects n'ont pas besoin de dépendances externes ici
    },
  },
});