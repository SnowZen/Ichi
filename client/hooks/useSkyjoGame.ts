import { useState, useCallback } from "react";
import { SkyjoGameRoom, SkyjoPlayer, SkyjoCard } from "@shared/skyjo";

interface SkyjoGameHook {
  room: SkyjoGameRoom | null;
  createRoom: (roomId: string, hostName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: () => void;
  revealCard: (playerId: string, row: number, col: number) => void;
  takeFromDiscard: (playerId: string, row: number, col: number) => void;
  drawCard: (playerId: string) => void;
  exchangeCard: (playerId: string, row: number, col: number, drawnCard: number) => void;
  leaveRoom: (playerId: string) => void;
}

function createSkyjoDeck(): number[] {
  const deck: number[] = [];
  
  // Card distribution for Skyjo
  for (let i = 0; i < 5; i++) deck.push(-2);
  for (let i = 0; i < 10; i++) deck.push(-1);
  for (let i = 0; i < 15; i++) deck.push(0);
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

function createSkyjoCard(value: number, id: string): SkyjoCard {
  return { id, value, isRevealed: false };
}

function initializeSkyjoPlayer(playerId: string, playerName: string, deck: number[]): SkyjoPlayer {
  const player: SkyjoPlayer = {
    id: playerId,
    name: playerName,
    cards: [],
    score: 0,
    totalScore: 0,
    isConnected: true,
    cardsRevealed: 0,
  };
  
  // Deal 12 cards in 4x3 grid
  for (let row = 0; row < 3; row++) {
    player.cards[row] = [];
    for (let col = 0; col < 4; col++) {
      const value = deck.pop()!;
      player.cards[row][col] = createSkyjoCard(value, `${playerId}-${row}-${col}`);
    }
  }
  
  return player;
}

export function useSkyjoGame(): SkyjoGameHook {
  const [room, setRoom] = useState<SkyjoGameRoom | null>(null);

  const createRoom = useCallback((roomId: string, hostName: string) => {
    const newRoom: SkyjoGameRoom = {
      id: roomId,
      name: `Salon ${roomId}`,
      gameType: "skyjo",
      players: [{
        id: `player_${Date.now()}`,
        name: hostName,
        cards: [],
        score: 0,
        totalScore: 0,
        isConnected: true,
        cardsRevealed: 0,
      }],
      maxPlayers: 8,
      isStarted: false,
      deck: [],
      discardPile: [],
      round: 1,
      isInitialization: false,
    };
    
    setRoom(newRoom);
    localStorage.setItem(`skyjo_room_${roomId}`, JSON.stringify(newRoom));
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    // Try to load room from localStorage first
    const saved = localStorage.getItem(`skyjo_room_${roomId}`);
    if (saved) {
      const savedRoom = JSON.parse(saved);
      
      // Check if player already exists
      const existingPlayer = savedRoom.players.find((p: any) => p.name === playerName);
      if (existingPlayer) {
        existingPlayer.isConnected = true;
        setRoom(savedRoom);
        localStorage.setItem(`skyjo_room_${roomId}`, JSON.stringify(savedRoom));
        return;
      }
      
      // Add new player if room has space
      if (savedRoom.players.length < savedRoom.maxPlayers) {
        savedRoom.players.push({
          id: `player_${Date.now()}`,
          name: playerName,
          cards: [],
          score: 0,
          totalScore: 0,
          isConnected: true,
          cardsRevealed: 0,
        });
        
        setRoom(savedRoom);
        localStorage.setItem(`skyjo_room_${roomId}`, JSON.stringify(savedRoom));
      }
    }
  }, []);

  const startGame = useCallback(() => {
    if (!room || room.isStarted) return;

    const deck = createSkyjoDeck();
    
    // Initialize players with cards
    const updatedPlayers = room.players.map(player => 
      initializeSkyjoPlayer(player.id, player.name, deck)
    );

    const updatedRoom = {
      ...room,
      players: updatedPlayers,
      deck,
      discardPile: deck.length > 0 ? [deck.pop()!] : [],
      isStarted: true,
      isInitialization: true,
      currentPlayer: room.players[0].id,
    };

    setRoom(updatedRoom);
    localStorage.setItem(`skyjo_room_${room.id}`, JSON.stringify(updatedRoom));
  }, [room]);

  const revealCard = useCallback((playerId: string, row: number, col: number) => {
    if (!room) return;

    const updatedRoom = { ...room };
    const player = updatedRoom.players.find(p => p.id === playerId);
    if (!player || player.cards[row][col].isRevealed) return;

    player.cards[row][col].isRevealed = true;
    player.cardsRevealed = (player.cardsRevealed || 0) + 1;

    // Handle initialization phase
    if (updatedRoom.isInitialization) {
      if (player.cardsRevealed >= 2) {
        const nextPlayerIndex = (updatedRoom.players.findIndex(p => p.id === playerId) + 1) % updatedRoom.players.length;
        updatedRoom.currentPlayer = updatedRoom.players[nextPlayerIndex].id;
        
        // Check if all players have revealed 2 cards
        const allReady = updatedRoom.players.every(p => (p.cardsRevealed || 0) >= 2);
        if (allReady) {
          updatedRoom.isInitialization = false;
          updatedRoom.currentPlayer = updatedRoom.players[0].id;
        }
      }
    } else {
      // Normal game - advance turn
      const nextPlayerIndex = (updatedRoom.players.findIndex(p => p.id === playerId) + 1) % updatedRoom.players.length;
      updatedRoom.currentPlayer = updatedRoom.players[nextPlayerIndex].id;
    }

    setRoom(updatedRoom);
    localStorage.setItem(`skyjo_room_${room.id}`, JSON.stringify(updatedRoom));
  }, [room]);

  const takeFromDiscard = useCallback((playerId: string, row: number, col: number) => {
    if (!room || room.discardPile.length === 0) return;

    const updatedRoom = { ...room };
    const player = updatedRoom.players.find(p => p.id === playerId);
    if (!player) return;

    const takenCard = updatedRoom.discardPile.pop()!;
    const oldCard = player.cards[row][col];
    
    player.cards[row][col] = {
      id: `${playerId}-${row}-${col}`,
      value: takenCard,
      isRevealed: true,
    };

    // Add old card to discard
    updatedRoom.discardPile.push(oldCard.value);

    // Advance turn
    const nextPlayerIndex = (updatedRoom.players.findIndex(p => p.id === playerId) + 1) % updatedRoom.players.length;
    updatedRoom.currentPlayer = updatedRoom.players[nextPlayerIndex].id;

    setRoom(updatedRoom);
    localStorage.setItem(`skyjo_room_${room.id}`, JSON.stringify(updatedRoom));
  }, [room]);

  const drawCard = useCallback((playerId: string) => {
    if (!room || room.deck.length === 0) return null;

    const drawnCard = room.deck[room.deck.length - 1];
    return drawnCard;
  }, [room]);

  const exchangeCard = useCallback((playerId: string, row: number, col: number, drawnCard: number) => {
    if (!room) return;

    const updatedRoom = { ...room };
    const player = updatedRoom.players.find(p => p.id === playerId);
    if (!player) return;

    // Remove drawn card from deck
    updatedRoom.deck.pop();
    
    const oldCard = player.cards[row][col];
    player.cards[row][col] = {
      id: `${playerId}-${row}-${col}`,
      value: drawnCard,
      isRevealed: true,
    };

    // Add old card to discard if it was revealed
    if (oldCard.isRevealed) {
      updatedRoom.discardPile.push(oldCard.value);
    }

    // Advance turn
    const nextPlayerIndex = (updatedRoom.players.findIndex(p => p.id === playerId) + 1) % updatedRoom.players.length;
    updatedRoom.currentPlayer = updatedRoom.players[nextPlayerIndex].id;

    setRoom(updatedRoom);
    localStorage.setItem(`skyjo_room_${room.id}`, JSON.stringify(updatedRoom));
  }, [room]);

  const leaveRoom = useCallback((playerId: string) => {
    if (!room) return;

    const updatedRoom = { ...room };
    const playerIndex = updatedRoom.players.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
      updatedRoom.players.splice(playerIndex, 1);
      
      if (updatedRoom.players.length === 0) {
        setRoom(null);
        localStorage.removeItem(`skyjo_room_${room.id}`);
        return;
      }
      
      setRoom(updatedRoom);
      localStorage.setItem(`skyjo_room_${room.id}`, JSON.stringify(updatedRoom));
    }
  }, [room]);

  return {
    room,
    createRoom,
    joinRoom,
    startGame,
    revealCard,
    takeFromDiscard,
    drawCard,
    exchangeCard,
    leaveRoom,
  };
}
