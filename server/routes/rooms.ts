import { RequestHandler } from "express";

interface UnoCard {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';
  value?: number;
}

interface Player {
  id: string;
  name: string;
  cards: UnoCard[];
  isConnected: boolean;
}

interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentPlayer?: string;
  direction: 1 | -1;
  topCard?: UnoCard;
  deck: UnoCard[];
  discardPile: UnoCard[];
  winner?: string;
}

// In-memory storage for demo purposes
const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];
  
  // Add number cards and action cards
  colors.forEach(color => {
    // Numbers 0-9
    for (let value = 0; value <= 9; value++) {
      deck.push({
        id: `${color}-${value}-${Math.random().toString(36).substr(2, 9)}`,
        color,
        type: 'number',
        value
      });
    }
    
    // Action cards
    ['skip', 'reverse', 'draw2'].forEach(type => {
      deck.push({
        id: `${color}-${type}-${Math.random().toString(36).substr(2, 9)}`,
        color,
        type: type as any
      });
    });
  });
  
  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild-${i}-${Math.random().toString(36).substr(2, 9)}`,
      color: 'wild',
      type: 'wild'
    });
    
    deck.push({
      id: `wild-draw4-${i}-${Math.random().toString(36).substr(2, 9)}`,
      color: 'wild',
      type: 'wild_draw4'
    });
  }
  
  return shuffleDeck(deck);
}

function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

  res.json({
    roomId,
    playerId,
    playerName: playerName.trim(),
    room
  });
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

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    cards: [],
    isConnected: true
  };

  room.players.push(player);

  res.json({
    roomId,
    playerId,
    playerName: playerName.trim(),
    room
  });
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

  // Initialize game
  const deck = createDeck();
  
  // Deal 7 cards to each player
  room.players.forEach(player => {
    player.cards = [];
    for (let i = 0; i < 7; i++) {
      const card = deck.pop();
      if (card) {
        player.cards.push(card);
      }
    }
  });

  // Find a starting card
  let topCard: UnoCard | undefined;
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].color !== 'wild') {
      topCard = deck.splice(i, 1)[0];
      break;
    }
  }

  room.deck = deck;
  room.discardPile = topCard ? [topCard] : [];
  room.topCard = topCard;
  room.currentPlayer = room.players[0].id;
  room.isStarted = true;

  rooms.set(roomId, room);
  res.json(room);
};

export const playCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, cardId } = req.body;
  
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Salon non trouvé' });
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

  rooms.set(roomId, room);
  res.json(room);
};

export const callUno: RequestHandler = (req, res) => {
  res.json({ success: true });
};
