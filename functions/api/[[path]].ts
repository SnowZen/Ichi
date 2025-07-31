// functions/api/[[path]].ts

// On importe l'application Hono (le "cerveau" HTTP)
import app from '../../server/index.js';

// On exporte le handler onRequest. C'est tout.
// Le binding GAME_ROOM_DO sera automatiquement disponible dans context.env
// grâce à la configuration dans wrangler.toml.
export const onRequest: PagesFunction = (context) => {
  return app.fetch(
    context.request,
    context.env,
    context
  );
};