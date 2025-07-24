import { UnoCard, UnoColor, Player, GameRoom } from './uno';

export function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
  
  // Add number cards (0-9)
  colors.forEach(color => {
    // One 0 card per color
    deck.push({
      id: `${color}-0-${Math.random().toString(36).substr(2, 9)}`,
      color,
      type: 'number',
      value: 0
    });
    
    // Two of each number 1-9 per color
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${value}-${copy}-${Math.random().toString(36).substr(2, 9)}`,
          color,
          type: 'number',
          value
        });
      }
    }
    
    // Two of each action card per color
    ['skip', 'reverse', 'draw2'].forEach(type => {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `${color}-${type}-${copy}-${Math.random().toString(36).substr(2, 9)}`,
          color,
          type: type as any
        });
      }
    });
  });
  
  // Add wild cards
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

export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: UnoCard[], numPlayers: number): { hands: UnoCard[][], remainingDeck: UnoCard[] } {
  const hands: UnoCard[][] = Array(numPlayers).fill(null).map(() => []);
  const remainingDeck = [...deck];
  
  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < numPlayers; j++) {
      const card = remainingDeck.pop();
      if (card) {
        hands[j].push(card);
      }
    }
  }
  
  return { hands, remainingDeck };
}

export function canPlayCard(card: UnoCard, topCard: UnoCard, currentColor?: UnoColor): boolean {
  // Wild cards can always be played
  if (card.color === 'wild') {
    return true;
  }
  
  // Match color
  if (card.color === topCard.color || card.color === currentColor) {
    return true;
  }
  
  // Match type/value for number cards
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) {
    return true;
  }
  
  // Match action card type
  if (card.type === topCard.type && card.type !== 'number') {
    return true;
  }
  
  return false;
}

export function getPlayableCards(hand: UnoCard[], topCard: UnoCard, currentColor?: UnoColor): UnoCard[] {
  return hand.filter(card => canPlayCard(card, topCard, currentColor));
}

export function getNextPlayer(currentPlayerIndex: number, numPlayers: number, direction: 1 | -1): number {
  if (direction === 1) {
    return (currentPlayerIndex + 1) % numPlayers;
  } else {
    return currentPlayerIndex === 0 ? numPlayers - 1 : currentPlayerIndex - 1;
  }
}

export function initializeGame(room: GameRoom): GameRoom {
  const deck = createDeck();
  const { hands, remainingDeck } = dealCards(deck, room.players.length);
  
  // Assign cards to players
  const updatedPlayers = room.players.map((player, index) => ({
    ...player,
    cards: hands[index]
  }));
  
  // Find a starting card that's not a wild card
  let topCard: UnoCard;
  let topCardIndex = -1;
  
  for (let i = 0; i < remainingDeck.length; i++) {
    if (remainingDeck[i].color !== 'wild') {
      topCard = remainingDeck[i];
      topCardIndex = i;
      break;
    }
  }
  
  // Remove the top card from deck
  const finalDeck = remainingDeck.filter((_, index) => index !== topCardIndex);
  
  return {
    ...room,
    players: updatedPlayers,
    deck: finalDeck,
    discardPile: [topCard!],
    topCard: topCard!,
    currentPlayer: room.players[0].id,
    direction: 1,
    isStarted: true
  };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
