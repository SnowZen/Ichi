import { RequestHandler } from "express";
import { SkyjoPlayer, SkyjoGameRoom, SkyjoCard } from "@shared/skyjo";

// Skyjo logic functions (moved directly here to avoid import issues)
function createSkyjoCard(value: number, id: string): SkyjoCard {
  return {
    id,
    value,
    isRevealed: false,
  };
}

function createSkyjoDeck(): number[] {
  const deck: number[] = [];

  // Card distribution for Skyjo
  // -2: 5 cards
  for (let i = 0; i < 5; i++) deck.push(-2);

  // -1: 10 cards
  for (let i = 0; i < 10; i++) deck.push(-1);

  // 0: 15 cards
  for (let i = 0; i < 15; i++) deck.push(0);

  // 1-12: 10 cards each
  for (let value = 1; value <= 12; value++) {
    for (let i = 0; i < 10; i++) deck.push(value);
  }

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function initializeSkyjoPlayer(
  playerId: string,
  playerName: string,
  deck: number[],
): SkyjoPlayer {
  const player: SkyjoPlayer = {
    id: playerId,
    name: playerName,
    cards: [],
    score: 0,
    totalScore: 0,
    isConnected: true,
  };

  // Deal 12 cards in 4x3 grid
  for (let row = 0; row < 3; row++) {
    player.cards[row] = [];
    for (let col = 0; col < 4; col++) {
      const value = deck.pop()!;
      player.cards[row][col] = createSkyjoCard(
        value,
        `${playerId}-${row}-${col}`,
      );
    }
  }

  // Don't automatically reveal cards - let players choose their 2 initial cards

  return player;
}

function checkAndRemoveColumn(player: SkyjoPlayer, col: number): boolean {
  // Check if all 3 cards in column are revealed and have same value
  const card1 = player.cards[0][col];
  const card2 = player.cards[1][col];
  const card3 = player.cards[2][col];

  if (card1.isRevealed && card2.isRevealed && card3.isRevealed) {
    if (card1.value === card2.value && card2.value === card3.value) {
      // Remove the column by setting cards as "removed" (we'll use value 999 to mark removed)
      player.cards[0][col] = createSkyjoCard(999, `removed-${col}-0`);
      player.cards[1][col] = createSkyjoCard(999, `removed-${col}-1`);
      player.cards[2][col] = createSkyjoCard(999, `removed-${col}-2`);
      player.cards[0][col].isRevealed = true;
      player.cards[1][col].isRevealed = true;
      player.cards[2][col].isRevealed = true;
      return true;
    }
  }
  return false;
}

function allCardsRevealed(player: SkyjoPlayer): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (
        !player.cards[row][col].isRevealed &&
        player.cards[row][col].value !== 999
      ) {
        return false;
      }
    }
  }
  return true;
}

function finalizeRoundScoring(
  room: SkyjoGameRoom,
  finishingPlayerId: string,
): void {
  // Reveal all cards for all players
  room.players.forEach((player: any) => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (player.cards[row][col].value !== 999) {
          player.cards[row][col].isRevealed = true;
        }
      }
    }
  });

  // Calculate scores
  room.players.forEach((player: any) => {
    player.score = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (player.cards[row][col].value !== 999) {
          player.score += player.cards[row][col].value;
        }
      }
    }
  });

  // Find the player who finished and check if they have the lowest score
  const finishingPlayer = room.players.find((p) => p.id === finishingPlayerId);
  if (finishingPlayer) {
    const lowestScore = Math.min(...room.players.map((p: any) => p.score));

    // If the finishing player doesn't have the lowest score, double their points
    if ((finishingPlayer as any).score > lowestScore) {
      (finishingPlayer as any).score *= 2;
    }
  }

  // Add to total scores
  room.players.forEach((player: any) => {
    player.totalScore += player.score;
  });
}

interface UnoCard {
  id: string;
  color: "red" | "blue" | "green" | "yellow" | "wild";
  type: "number" | "skip" | "reverse" | "draw2" | "wild" | "wild_draw4";
  value?: number;
}

interface Player {
  id: string;
  name: string;
  cards: UnoCard[] | any[][]; // UNO cards or Skyjo grid (SkyjoCard[][])
  isConnected: boolean;
  score?: number; // Skyjo only
  totalScore?: number; // Skyjo only
}

interface GameRoom {
  id: string;
  name: string;
  gameType: "uno" | "skyjo";
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentPlayer?: string;
  direction?: 1 | -1; // UNO only
  topCard?: UnoCard; // UNO only
  deck: UnoCard[] | number[]; // UNO cards or Skyjo card values
  discardPile: UnoCard[] | number[]; // UNO cards or Skyjo card values
  winner?: string;
  drawPenalty?: number; // UNO only - Number of cards next player must draw
  wildColor?: "red" | "blue" | "green" | "yellow"; // UNO only - Color chosen for wild cards
  unoCalledBy?: string; // UNO only - Player who called UNO
  unoChallengeTime?: number; // UNO only - Timestamp when UNO can be challenged
  isFinished?: boolean; // Game has ended
  round?: number; // Skyjo only - Current round number
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

  // Initialize game based on game type
  if (room.gameType === "uno") {
    // Initialize UNO game
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
    room.drawPenalty = 0;
  } else if (room.gameType === "skyjo") {
    // Initialize Skyjo game
    const deck = createSkyjoDeck();

    // Initialize players with Skyjo cards
    room.players.forEach((player) => {
      const skyjoPlayer = initializeSkyjoPlayer(player.id, player.name, deck);
      player.cards = skyjoPlayer.cards;
      player.score = 0;
      player.totalScore = 0;
      (player as any).cardsRevealed = 0; // Track how many initial cards have been revealed
    });

    room.deck = deck;
    room.discardPile = [];
    room.topCard = undefined;
    room.drawPenalty = 0;
    room.round = 1;
    (room as any).isInitialization = true; // Start in initialization phase

    // Start the discard pile with one card from deck
    if (deck.length > 0) {
      const firstCard = deck.pop()!;
      room.discardPile = [firstCard];
    }
  }

  room.currentPlayer = room.players[0].id;
  room.isStarted = true;

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
      error: "Défi invalide - le joueur a déjà appel�� UNO ou n'a pas 1 carte",
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

  // Allow game change even with players connected (host decision)

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

export const leaveGame: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Salon non trouvé" });
  }

  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    return res.status(404).json({ error: "Joueur non trouv��" });
  }

  // Remove player from room
  room.players.splice(playerIndex, 1);

  // If no players left, delete the room
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return res.json({ message: "Salon fermé - aucun joueur restant" });
  }

  // If the game was started and the leaving player was the current player, advance to next
  if (room.isStarted && room.currentPlayer === playerId) {
    const nextPlayerIndex = playerIndex % room.players.length;
    room.currentPlayer = room.players[nextPlayerIndex].id;
  }

  // If only one player left in a started game, end the game
  if (room.isStarted && room.players.length === 1) {
    room.isFinished = true;
    room.winner = room.players[0].id;
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

// Skyjo-specific endpoints
export const skyjoRevealCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, row, col } = req.body;

  const room = rooms.get(roomId);
  if (!room || room.gameType !== "skyjo") {
    return res.status(404).json({ error: "Salon Skyjo non trouvé" });
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

  // Reveal the card
  if (
    player.cards[row] &&
    player.cards[row][col] &&
    !player.cards[row][col].isRevealed
  ) {
    player.cards[row][col].isRevealed = true;

    // Check for column removal
    checkAndRemoveColumn(player as any, col);

    // Move to next player
    const nextPlayerIndex =
      (room.players.findIndex((p) => p.id === playerId) + 1) %
      room.players.length;
    room.currentPlayer = room.players[nextPlayerIndex].id;

    rooms.set(roomId, room);
    res.json(room);
  } else {
    res.status(400).json({ error: "Carte déjà révélée ou position invalide" });
  }
};

export const skyjoDrawCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomId);
  if (!room || room.gameType !== "skyjo") {
    return res.status(404).json({ error: "Salon Skyjo non trouvé" });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: "La partie n'a pas commencé" });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: "Ce n'est pas votre tour" });
  }

  const deck = room.deck as number[];
  if (deck.length === 0) {
    return res.status(400).json({ error: "Plus de cartes dans la pioche" });
  }

  const drawnCard = deck.pop()!;

  // Player now needs to choose: exchange with one of their cards or discard
  // For now, we'll store the drawn card in a temporary property
  (room as any).tempDrawnCard = drawnCard;
  (room as any).tempDrawnBy = playerId;

  rooms.set(roomId, room);
  res.json({ room, drawnCard });
};

export const skyjoExchangeCard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, row, col } = req.body;

  const room = rooms.get(roomId);
  if (!room || room.gameType !== "skyjo") {
    return res.status(404).json({ error: "Salon Skyjo non trouvé" });
  }

  const tempDrawnCard = (room as any).tempDrawnCard;
  const tempDrawnBy = (room as any).tempDrawnBy;

  if (!tempDrawnCard || tempDrawnBy !== playerId) {
    return res
      .status(400)
      .json({ error: "Aucune carte piochée ou joueur incorrect" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  // Exchange the card
  const oldCard = player.cards[row][col];
  player.cards[row][col] = {
    id: `${playerId}-${row}-${col}`,
    value: tempDrawnCard,
    isRevealed: true,
  };

  // Add the old card to discard pile if it was revealed
  const discardPile = room.discardPile as number[];
  if (oldCard.isRevealed) {
    discardPile.push(oldCard.value);
  }

  // Check for column removal
  checkAndRemoveColumn(player as any, col);

  // Clear temp card
  delete (room as any).tempDrawnCard;
  delete (room as any).tempDrawnBy;

  // Check if player has all cards revealed (round end condition)
  if (allCardsRevealed(player as any)) {
    finalizeRoundScoring(room as any, playerId);

    // Check if game should end
    const maxScore = Math.max(...room.players.map((p) => p.totalScore || 0));
    if (maxScore >= 100) {
      room.isFinished = true;
      const winnerScore = Math.min(
        ...room.players.map((p) => p.totalScore || 0),
      );
      room.winner = room.players.find((p) => p.totalScore === winnerScore)?.id;
    } else {
      // Start new round
      room.round = (room.round || 1) + 1;
      // Reset for new round (reinitialize cards)
      const newDeck = createSkyjoDeck();
      room.players.forEach((player) => {
        const skyjoPlayer = initializeSkyjoPlayer(
          player.id,
          player.name,
          newDeck,
        );
        player.cards = skyjoPlayer.cards;
        player.score = 0;
      });
      room.deck = newDeck;
      room.discardPile = [];
      if (newDeck.length > 0) {
        const firstCard = newDeck.pop()!;
        room.discardPile = [firstCard];
      }
    }
  }

  // Move to next player
  const nextPlayerIndex =
    (room.players.findIndex((p) => p.id === playerId) + 1) %
    room.players.length;
  room.currentPlayer = room.players[nextPlayerIndex].id;

  rooms.set(roomId, room);
  res.json(room);
};

export const skyjoDiscardDrawn: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, row, col } = req.body;

  const room = rooms.get(roomId);
  if (!room || room.gameType !== "skyjo") {
    return res.status(404).json({ error: "Salon Skyjo non trouvé" });
  }

  const tempDrawnCard = (room as any).tempDrawnCard;
  const tempDrawnBy = (room as any).tempDrawnBy;

  if (!tempDrawnCard || tempDrawnBy !== playerId) {
    return res
      .status(400)
      .json({ error: "Aucune carte piochée ou joueur incorrect" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  // Discard the drawn card
  const discardPile = room.discardPile as number[];
  discardPile.push(tempDrawnCard);

  // Reveal one of player's cards
  if (
    player.cards[row] &&
    player.cards[row][col] &&
    !player.cards[row][col].isRevealed
  ) {
    player.cards[row][col].isRevealed = true;

    // Check for column removal
    checkAndRemoveColumn(player as any, col);
  }

  // Clear temp card
  delete (room as any).tempDrawnCard;
  delete (room as any).tempDrawnBy;

  // Move to next player
  const nextPlayerIndex =
    (room.players.findIndex((p) => p.id === playerId) + 1) %
    room.players.length;
  room.currentPlayer = room.players[nextPlayerIndex].id;

  rooms.set(roomId, room);
  res.json(room);
};

export const skyjoTakeFromDiscard: RequestHandler = (req, res) => {
  const { roomId } = req.params;
  const { playerId, row, col } = req.body;

  const room = rooms.get(roomId);
  if (!room || room.gameType !== "skyjo") {
    return res.status(404).json({ error: "Salon Skyjo non trouvé" });
  }

  if (!room.isStarted) {
    return res.status(400).json({ error: "La partie n'a pas commencé" });
  }

  if (room.currentPlayer !== playerId) {
    return res.status(400).json({ error: "Ce n'est pas votre tour" });
  }

  const discardPile = room.discardPile as number[];
  if (discardPile.length === 0) {
    return res.status(400).json({ error: "Pile de défausse vide" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  // Take the top card from discard pile
  const takenCard = discardPile.pop()!;

  // Exchange with player's card
  const oldCard = player.cards[row][col];
  player.cards[row][col] = {
    id: `${playerId}-${row}-${col}`,
    value: takenCard,
    isRevealed: true,
  };

  // Add the old card to discard pile if it was revealed
  if (oldCard.isRevealed) {
    discardPile.push(oldCard.value);
  }

  // Check for column removal
  checkAndRemoveColumn(player as any, col);

  // Move to next player
  const nextPlayerIndex =
    (room.players.findIndex((p) => p.id === playerId) + 1) %
    room.players.length;
  room.currentPlayer = room.players[nextPlayerIndex].id;

  rooms.set(roomId, room);
  res.json(room);
};
