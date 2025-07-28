import { RequestHandler } from "express";

interface UnoCard {
  id: string;
  color: "red" | "blue" | "green" | "yellow" | "wild";
  type: "number" | "skip" | "reverse" | "draw2" | "wild" | "wild_draw4";
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
  gameType: "uno" | "skyjo";
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentPlayer?: string;
  direction: 1 | -1;
  topCard?: UnoCard;
  deck: UnoCard[];
  discardPile: UnoCard[];
  winner?: string;
  drawPenalty?: number; // Number of cards next player must draw
  wildColor?: "red" | "blue" | "green" | "yellow"; // Color chosen for wild cards
  unoCalledBy?: string; // Player who called UNO
  unoChallengeTime?: number; // Timestamp when UNO can be challenged
  isFinished?: boolean; // Game has ended
}

// In-memory storage for demo purposes
const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: ("red" | "blue" | "green" | "yellow")[] = [
    "red",
    "blue",
    "green",
    "yellow",
  ];

  // Add number cards (108 cards total)
  colors.forEach((color) => {
    // One 0 card per color (4 cards)
    deck.push({
      id: `${color}-0-${Math.random().toString(36).substr(2, 9)}`,
      color,
      type: "number",
      value: 0,
    });

    // Two of each number 1-9 per color (72 cards)
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${value}-${copy}-${Math.random().toString(36).substr(2, 9)}`,
          color,
          type: "number",
          value,
        });
      }
    }

    // Two of each action card per color (24 cards)
    ["skip", "reverse", "draw2"].forEach((type) => {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${type}-${copy}-${Math.random().toString(36).substr(2, 9)}`,
          color,
          type: type as any,
        });
      }
    });
  });

  // Wild cards (8 cards)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild-${i}-${Math.random().toString(36).substr(2, 9)}`,
      color: "wild",
      type: "wild",
    });

    deck.push({
      id: `wild-draw4-${i}-${Math.random().toString(36).substr(2, 9)}`,
      color: "wild",
      type: "wild_draw4",
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
  const { playerName, maxPlayers = 4, gameType = "uno" } = req.body;

  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ error: "Nom de joueur requis" });
  }

  const roomId = generateRoomCode();
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    cards: [],
    isConnected: true,
  };

  const room: GameRoom = {
    id: roomId,
    name: `Salon ${roomId}`,
    gameType: gameType as any,
    players: [player],
    maxPlayers,
    isStarted: false,
    direction: 1,
    deck: [],
    discardPile: [],
  };

  rooms.set(roomId, room);

  res.json({
    roomId,
    playerId,
    playerName: playerName.trim(),
    room,
  });
};

export const joinRoom: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;

  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ error: "Nom de joueur requis" });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  if (room.isStarted) {
    return res.status(400).json({ error: "La partie a déjà commencé" });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: "Salon complet" });
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    cards: [],
    isConnected: true,
  };

  room.players.push(player);

  res.json({
    roomId,
    playerId,
    playerName: playerName.trim(),
    room,
  });
};

export const getRoom: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  res.json(room);
};

export const startGame: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  if (room.isStarted) {
    return res.status(400).json({ error: "La partie a déjà commencé" });
  }

  if (room.players.length < 2) {
    return res.status(400).json({ error: "Au moins 2 joueurs requis" });
  }

  // Initialize game
  const deck = createDeck();

  // Deal 7 cards to each player
  room.players.forEach((player) => {
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
    if (deck[i].color !== "wild") {
      topCard = deck.splice(i, 1)[0];
      break;
    }
  }

  room.deck = deck;
  room.discardPile = topCard ? [topCard] : [];
  room.topCard = topCard;
  room.currentPlayer = room.players[0].id;
  room.isStarted = true;
  room.drawPenalty = 0;

  rooms.set(roomId, room);
  res.json(room);
};

export const playCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, cardId, wildColor } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: "La partie n'a pas commencé" });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: "Ce n'est pas votre tour" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  const cardIndex = player.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(400).json({ error: "Carte non trouvée" });
  }

  const card = player.cards[cardIndex];

  // Check if wild card requires color selection
  if ((card.type === "wild" || card.type === "wild_draw4") && !wildColor) {
    return res
      .status(400)
      .json({ error: "Vous devez choisir une couleur pour cette carte" });
  }

  // Validate wild color if provided
  if (wildColor && !["red", "blue", "green", "yellow"].includes(wildColor)) {
    return res.status(400).json({ error: "Couleur invalide" });
  }

  // Check if player can play this card when there's a draw penalty
  if (room.drawPenalty && room.drawPenalty > 0) {
    // Strict rules: +2 only on +2, +4 only on +2 and +4
    if (room.topCard?.type === "draw2") {
      if (card.type !== "draw2" && card.type !== "wild_draw4") {
        return res.status(400).json({
          error: "Vous devez jouer une carte +2 ou +4 pour contrer un +2",
        });
      }
    } else if (room.topCard?.type === "wild_draw4") {
      if (card.type !== "wild_draw4") {
        return res
          .status(400)
          .json({ error: "Vous devez jouer une carte +4 pour contrer un +4" });
      }
    }
  }

  // Remove card from player's hand
  player.cards.splice(cardIndex, 1);

  // Add card to discard pile
  room.discardPile.push(card);
  room.topCard = card;

  // Handle special cards
  let skipNextPlayer = false;
  let reverseDirection = false;

  if (card.type === "skip") {
    skipNextPlayer = true;
    room.drawPenalty = 0; // Clear penalty
  } else if (card.type === "reverse") {
    reverseDirection = true;
    room.drawPenalty = 0; // Clear penalty
  } else if (card.type === "draw2") {
    // Add to existing penalty or start new one
    room.drawPenalty = (room.drawPenalty || 0) + 2;
  } else if (card.type === "wild_draw4") {
    // Add to existing penalty or start new one
    room.drawPenalty = (room.drawPenalty || 0) + 4;
    room.wildColor = wildColor as any; // Set the chosen color
  } else if (card.type === "wild") {
    room.drawPenalty = 0; // Clear penalty
    room.wildColor = wildColor as any; // Set the chosen color
  } else {
    // Regular card played, clear any existing penalty and wild color
    room.drawPenalty = 0;
    room.wildColor = undefined;
  }

  // Reverse direction if needed
  if (reverseDirection) {
    room.direction = room.direction === 1 ? -1 : 1;
  }

  // Move to next player
  const currentPlayerIndex = room.players.findIndex((p) => p.id === playerId);
  let nextPlayerIndex;

  if (room.direction === 1) {
    nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  } else {
    nextPlayerIndex =
      currentPlayerIndex === 0
        ? room.players.length - 1
        : currentPlayerIndex - 1;
  }

  // Skip next player if needed
  if (skipNextPlayer) {
    if (room.direction === 1) {
      nextPlayerIndex = (nextPlayerIndex + 1) % room.players.length;
    } else {
      nextPlayerIndex =
        nextPlayerIndex === 0 ? room.players.length - 1 : nextPlayerIndex - 1;
    }
  }

  room.currentPlayer = room.players[nextPlayerIndex].id;

  // Check for winner
  if (player.cards.length === 0) {
    room.winner = playerId;
    room.isFinished = true;
    room.currentPlayer = undefined; // No more turns
  }

  // Reset UNO status only if player no longer has exactly 1 card after playing
  if (player.cards.length !== 1 && room.unoCalledBy === playerId) {
    room.unoCalledBy = undefined;
    room.unoChallengeTime = undefined;
  }

  rooms.set(roomId, room);
  res.json(room);
};

export const drawCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: "La partie n'a pas commencé" });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: "Ce n'est pas votre tour" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  if (room.deck.length === 0) {
    return res.status(400).json({ error: "Plus de cartes à piocher" });
  }

  // Check if there's a draw penalty to apply
  if (room.drawPenalty && room.drawPenalty > 0) {
    // Player must draw the penalty cards
    for (let i = 0; i < room.drawPenalty; i++) {
      const drawnCard = room.deck.pop();
      if (drawnCard) {
        player.cards.push(drawnCard);
      }
    }
    room.drawPenalty = 0; // Clear penalty after drawing
  } else {
    // Normal draw - just one card
    const drawnCard = room.deck.pop();
    if (drawnCard) {
      player.cards.push(drawnCard);
    }
  }

  // Reset UNO status if player no longer has exactly 1 card after drawing
  if (player.cards.length !== 1 && room.unoCalledBy === playerId) {
    room.unoCalledBy = undefined;
    room.unoChallengeTime = undefined;
  }

  // Move to next player after drawing
  const currentPlayerIndex = room.players.findIndex((p) => p.id === playerId);
  let nextPlayerIndex;

  if (room.direction === 1) {
    nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  } else {
    nextPlayerIndex =
      currentPlayerIndex === 0
        ? room.players.length - 1
        : currentPlayerIndex - 1;
  }

  room.currentPlayer = room.players[nextPlayerIndex].id;

  rooms.set(roomId, room);
  res.json(room);
};

export const callUno: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  // Player must have exactly 1 card to call UNO
  if (player.cards.length !== 1) {
    return res
      .status(400)
      .json({ error: "Vous devez avoir exactement 1 carte pour appeler UNO" });
  }

  // Set UNO status
  room.unoCalledBy = playerId;
  room.unoChallengeTime = Date.now() + 10000; // 10 seconds to challenge

  rooms.set(roomId, room);
  res.json({ success: true, message: `${player.name} a appelé UNO!`, room });
};

export const challengeUno: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { challengerId, challengedPlayerId } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  const challenger = room.players.find((p) => p.id === challengerId);
  const challenged = room.players.find((p) => p.id === challengedPlayerId);

  if (!challenger || !challenged) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  // Challenge is valid if player has exactly 1 card and hasn't called UNO
  if (
    challenged.cards.length === 1 &&
    room.unoCalledBy !== challengedPlayerId
  ) {
    // Challenge successful - challenged player draws 2 cards automatically
    for (let i = 0; i < 2; i++) {
      const card = room.deck.pop();
      if (card) {
        challenged.cards.push(card);
      }
    }

    // Clear UNO challenge state
    room.unoCalledBy = undefined;
    room.unoChallengeTime = undefined;

    rooms.set(roomId, room);
    res.json({
      success: true,
      message: `${challenger.name} a défié ${challenged.name} avec succès! ${challenged.name} pioche 2 cartes automatiquement.`,
      room,
    });
  } else {
    res.status(400).json({
      error: "Défi invalide - le joueur a déjà appelé UNO ou n'a pas 1 carte",
    });
  }
};

export const changeGame: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { gameType } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  if (room.isStarted) {
    return res
      .status(400)
      .json({ error: "Impossible de changer de jeu pendant une partie" });
  }

  if (room.players.length > 1) {
    return res
      .status(400)
      .json({
        error: "Impossible de changer de jeu avec des joueurs connectés",
      });
  }

  if (!["uno", "skyjo"].includes(gameType)) {
    return res.status(400).json({ error: "Type de jeu invalide" });
  }

  room.gameType = gameType;

  // Adjust max players based on game
  if (gameType === "skyjo") {
    room.maxPlayers = Math.min(room.maxPlayers, 8);
  } else {
    room.maxPlayers = Math.min(room.maxPlayers, 4);
  }

  rooms.set(roomId, room);
  res.json(room);
};

export const restartGame: RequestHandler = (req, res) => {
  const { roomId } = req.params;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  // Reset room to lobby state
  room.isStarted = false;
  room.isFinished = false;
  room.winner = undefined;
  room.currentPlayer = undefined;
  room.topCard = undefined;
  room.deck = [];
  room.discardPile = [];
  room.drawPenalty = 0;
  room.wildColor = undefined;
  room.unoCalledBy = undefined;
  room.unoChallengeTime = undefined;

  // Clear all player cards
  room.players.forEach((player) => {
    player.cards = [];
  });

  rooms.set(roomId, room);
  res.json(room);
};
