// server/index.ts

import { Hono } from "hono";
import { cors } from 'hono/cors';
// On importe les fonctions de création de room pour la route HTTP
import { createRoom as createRoomLogic } from './routes/rooms'; 
// ET on importe la classe du Durable Object pour l'exporter
import { GameRoomDurableObject } from './room-do'; 


export { GameRoomDurableObject };

type Bindings = {
  GAME_ROOM_DO: DurableObjectNamespace<GameRoomDurableObject>
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Créer un salon (reste une requête HTTP normale)
app.post('/api/rooms', async (c) => {
  const { playerName } = await c.req.json();
  // Exemple simplifié. Assurez-vous que votre createRoomLogic retourne un objet room valide.
  const newRoom = { id: Math.random().toString(36).substring(2, 8).toUpperCase(), players: [{ id: `player_${Date.now()}`, name: playerName, cards: [] }], isStarted: false, gameType: 'uno', maxPlayers: 4 };

  const id = c.env.GAME_ROOM_DO.idFromName(newRoom.id);
  const stub = c.env.GAME_ROOM_DO.get(id);

  // Initialiser l'état du DO
  await stub.setRoom(newRoom as any);

  return c.json(newRoom);
});

// Route WebSocket
app.get('/api/rooms/:roomId/connect', async (c) => {
  const { roomId } = c.req.param();
  const playerId = c.req.query('playerId');

  if (!playerId) {
    return c.text('playerId est requis', 400);
  }

  const id = c.env.GAME_ROOM_DO.idFromName(roomId);
  const stub = c.env.GAME_ROOM_DO.get(id);

  // Transférer la requête au Durable Object
  return stub.fetch(c.req.raw);
});

// L'export par défaut reste l'application Hono pour la fonction de Pages
export default app;