// server/room-do.ts

import { GameRoom } from "./routes/rooms"; // Réutilisons votre logique de jeu !

interface PlayerSocket {
  socket: WebSocket;
  playerId: string;
}

export class GameRoomDurableObject {
  state: DurableObjectState;
  sockets: Set<PlayerSocket>;
  room?: GameRoom;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sockets = new Set();
    // Charger l'état de la room au démarrage
    this.state.storage.get<GameRoom>("room").then(room => {
      if (room) this.room = room;
    });
  }

  // Gère la requête de connexion WebSocket initiale
  async fetch(request: Request) {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');
    if (!playerId) {
      return new Response("playerId est requis", { status: 400 });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Attendu une requête websocket", { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    await this.handleSession(server, playerId);

    return new Response(null, { status: 101, webSocket: client });
  }

  // Gère une session WebSocket pour un joueur
  async handleSession(socket: WebSocket, playerId: string) {
    const playerSocket = { socket, playerId };
    this.sockets.add(playerSocket);

    // Envoyer l'état actuel de la room au joueur qui vient de se connecter
    if (this.room) {
      socket.send(JSON.stringify(this.room));
    }

    socket.addEventListener("message", async (msg) => {
      try {
        const message = JSON.parse(msg.data as string);
        
        // --- C'est ici que l'on gère les actions du joueur ---
        // TODO: Implémentez la logique pour chaque type de message
        // Ex: if (message.type === 'PLAY_CARD') { this.room = playCardLogic(...) }
        
        // Après chaque action, on sauvegarde et on diffuse
        await this.saveAndBroadcast();

      } catch (err) {
        console.error("Erreur de message WebSocket:", err);
      }
    });

    socket.addEventListener("close", () => {
      this.sockets.delete(playerSocket);
    });

    socket.addEventListener("error", () => {
      this.sockets.delete(playerSocket);
    });
  }
  
  // Sauvegarde l'état actuel et le diffuse à tous les joueurs connectés
  async saveAndBroadcast() {
    if (this.room) {
      await this.state.storage.put("room", this.room);
      const message = JSON.stringify(this.room);
      for (const { socket } of this.sockets) {
        socket.send(message);
      }
    }
  }

  // Méthode pour initialiser ou mettre à jour la room depuis l'API Hono
  async setRoom(room: GameRoom) {
    this.room = room;
    await this.saveAndBroadcast();
  }
}