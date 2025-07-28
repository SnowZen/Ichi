import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  playCard,
  drawCard,
  callUno,
  challengeUno,
  changeGame,
  restartGame,
  leaveGame,
  skyjoRevealCard,
  skyjoDrawCard,
  skyjoExchangeCard,
  skyjoDiscardDrawn,
  skyjoTakeFromDiscard,
  heartbeat,
  backupRoom,
  restoreRoom,
  createRoomWithRestore,
} from "./routes/rooms";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Uno game routes
  app.post("/api/rooms", createRoom);
  app.post("/api/rooms/restore", createRoomWithRestore);
  app.post("/api/rooms/:roomId/join", joinRoom);
  app.get("/api/rooms/:roomId", getRoom);
  app.post("/api/rooms/:roomId/start", startGame);
  app.post("/api/rooms/:roomId/play", playCard);
  app.post("/api/rooms/:roomId/draw", drawCard);
  app.post("/api/rooms/:roomId/uno", callUno);
  app.post("/api/rooms/:roomId/challenge", challengeUno);
  app.post("/api/rooms/:roomId/change-game", changeGame);
  app.post("/api/rooms/:roomId/restart", restartGame);
  app.post("/api/rooms/:roomId/leave", leaveGame);
  app.post("/api/rooms/:roomId/heartbeat", heartbeat);
  app.post("/api/rooms/:roomId/backup", backupRoom);
  app.get("/api/rooms/:roomId/restore", restoreRoom);

  // Skyjo game routes
  app.post("/api/rooms/:roomId/skyjo/reveal", skyjoRevealCard);
  app.post("/api/rooms/:roomId/skyjo/draw", skyjoDrawCard);
  app.post("/api/rooms/:roomId/skyjo/exchange", skyjoExchangeCard);
  app.post("/api/rooms/:roomId/skyjo/discard", skyjoDiscardDrawn);
  app.post("/api/rooms/:roomId/skyjo/take-discard", skyjoTakeFromDiscard);

  return app;
}
