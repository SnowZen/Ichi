import { SkyjoCard, SkyjoPlayer, SkyjoGameRoom } from "./skyjo";

export function createSkyjoCard(value: number, id: string): SkyjoCard {
  return {
    id,
    value,
    isRevealed: false,
  };
}

export function createSkyjoDeck(): number[] {
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

export function initializeSkyjoPlayer(playerId: string, playerName: string, deck: number[]): SkyjoPlayer {
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
      player.cards[row][col] = createSkyjoCard(value, `${playerId}-${row}-${col}`);
    }
  }
  
  // Reveal 2 random cards for each player
  const positions = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      positions.push({ row, col });
    }
  }
  
  // Shuffle positions and reveal first 2
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  for (let i = 0; i < 2; i++) {
    const { row, col } = positions[i];
    player.cards[row][col].isRevealed = true;
  }
  
  return player;
}

export function calculatePlayerScore(player: SkyjoPlayer): number {
  let score = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (player.cards[row][col].isRevealed) {
        score += player.cards[row][col].value;
      }
    }
  }
  return score;
}

export function checkAndRemoveColumn(player: SkyjoPlayer, col: number): boolean {
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

export function isGameFinished(players: SkyjoPlayer[]): boolean {
  return players.some(player => player.totalScore >= 100);
}

export function allCardsRevealed(player: SkyjoPlayer): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (!player.cards[row][col].isRevealed && player.cards[row][col].value !== 999) {
        return false;
      }
    }
  }
  return true;
}

export function revealAllCards(player: SkyjoPlayer): void {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (player.cards[row][col].value !== 999) {
        player.cards[row][col].isRevealed = true;
      }
    }
  }
}

export function finalizeRoundScoring(room: SkyjoGameRoom, finishingPlayerId: string): void {
  // Reveal all cards for all players
  room.players.forEach(player => revealAllCards(player));
  
  // Calculate scores
  room.players.forEach(player => {
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
  const finishingPlayer = room.players.find(p => p.id === finishingPlayerId);
  if (finishingPlayer) {
    const lowestScore = Math.min(...room.players.map(p => p.score));
    
    // If the finishing player doesn't have the lowest score, double their points
    if (finishingPlayer.score > lowestScore) {
      finishingPlayer.score *= 2;
    }
  }
  
  // Add to total scores
  room.players.forEach(player => {
    player.totalScore += player.score;
  });
}
