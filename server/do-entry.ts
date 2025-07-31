// server/do-entry.ts
// Ce fichier est le point d'entrée pour notre "worker" virtuel de DO.
// Son seul but est d'exporter la classe pour que Wrangler puisse la trouver.

export { GameRoomDurableObject } from './room-do';

// On doit aussi exporter un handler par défaut, même s'il ne sera jamais appelé.
export default {
  fetch() {
    return new Response("This is the Durable Object worker entry. It only exports the DO class.", { status: 400 });
  }
}