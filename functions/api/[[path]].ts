// functions/api/api.ts

// 1. On importe l'application Hono ("le cerveau") depuis son fichier de définition.
// Le chemin remonte de deux niveaux pour atteindre la racine, puis entre dans /server.
// L'extension .js est importante pour la résolution des modules modernes.
import app from '../../server/index.js';

// 2. On exporte la fonction que Cloudflare Pages va exécuter.
// Elle prend simplement la requête entrante et la passe à notre application Hono.
export const onRequest: PagesFunction = (context) => {
  return app.fetch(
    context.request,
    context.env,
    context
  );
};