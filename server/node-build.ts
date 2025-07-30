// nodebuild.ts
import path from "path";
import { serve } from '@hono/node-server';
import app from "./index"; // Importez votre application Hono (elle contient déjà toutes les routes API)

const port = process.env.PORT || 3000;

console.log(`🚀 Board Games Hub server running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port)
});

// Note : La partie qui servait les fichiers statiques (express.static) et le
// "catch-all" pour index.html n'est plus nécessaire ici si vous utilisez
// le serveur de dev de votre frontend (comme Vite) en parallèle,
// ce qui est la pratique courante.