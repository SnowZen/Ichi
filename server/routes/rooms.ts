import { RequestHandler } from "express";
import { GameRoom, Player } from "@shared/uno";
import { generateRoomCode, initializeGame } from "@shared/unoLogic";

// In-memory storage for demo purposes
// In production, this would be in a database
const rooms = new Map<string, GameRoom>();
const playerSessions = new Map<string, { playerId: string; roomId: string }>();

export const createRoom: RequestHandler = (req, res) => {
  const { playerName, maxPlayers = 4 } = req.body;
  
  if (!playerName || typeof playerName !== 'string') {
    return res.status(400).json({ error: 'Nom de joueur requis' });
  }

  const roomId = generateRoomCode();
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    cards: [],
    isConnected: true
  };

  const room: GameRoom = {
    id: roomId,
    name: `Salon ${roomId}`,
    players: [player],
    maxPlayers,
    isStarted: false,
    direction: 1,
    deck: [],
    discardPile: []
  };

  rooms.set(roomId, room);
  playerSessions.set(req.sessionID || req.ip, { playerId, roomId });

  res.json({ roomId, playerId });
};

export const joinRoom: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;
  
  if (!playerName || typeof playerName !== 'string') {
    return res.status(400).json({ error: 'Nom de joueur requis' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  if (room.isStarted) {
    return res.status(400).json({ error: 'La partie a déjà commencé' });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: 'Salon complet' });
  }

  // Check if player name already exists
  if (room.players.some(p => p.name === playerName.trim())) {
    return res.status(400).json({ error: 'Ce nom est déjà pris' });
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    cards: [],
    isConnected: true
  };

  room.players.push(player);
  playerSessions.set(req.sessionID || req.ip, { playerId, roomId });

  res.json({ roomId, playerId, room });
};

export const getRoom: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  res.json(room);
};

export const startGame: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  if (room.isStarted) {
    return res.status(400).json({ error: 'La partie a déjà commencé' });
  }

  if (room.players.length < 2) {
    return res.status(400).json({ error: 'Au moins 2 joueurs requis' });
  }

  const initializedRoom = initializeGame(room);
  rooms.set(roomId, initializedRoom);

  res.json(initializedRoom);
};

export const playCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, cardId } = req.body;
  
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: 'La partie n\'a pas commencé' });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: 'Ce n\'est pas votre tour' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur non trouvé' });
  }

  const cardIndex = player.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(400).json({ error: 'Carte non trouvée' });
  }

  const card = player.cards[cardIndex];
  
  // TODO: Implement card validation logic here
  // For now, allow any card to be played
  
  // Remove card from player's hand
  player.cards.splice(cardIndex, 1);
  
  // Add card to discard pile
  room.discardPile.push(card);
  room.topCard = card;
  
  // Move to next player
  const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  room.currentPlayer = room.players[nextPlayerIndex].id;
  
  // Check for winner
  if (player.cards.length === 0) {
    room.winner = playerId;
  }

  rooms.set(roomId, room);
  res.json(room);
};

export const drawCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: 'La partie n\'a pas commencé' });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: 'Ce n\'est pas votre tour' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur non trouvé' });
  }

  if (room.deck.length === 0) {
    return res.status(400).json({ error: 'Plus de cartes à piocher' });
  }

  // Draw a card
  const drawnCard = room.deck.pop();
  if (drawnCard) {
    player.cards.push(drawnCard);
  }

  // Move to next player
  const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  room.currentPlayer = room.players[nextPlayerIndex].id;

  rooms.set(roomId, room);
  res.json(room);
};

export const callUno: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur non trouvé' });
  }

  // TODO: Implement UNO calling logic
  console.log(`${player.name} a crié UNO!`);
  
  res.json({ success: true, message: `${player.name} a crié UNO!` });
};
