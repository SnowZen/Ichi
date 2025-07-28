export interface SkyjoCard {
  id: string;
  value: number; // -2 to 12
  isRevealed: boolean;
}

export interface SkyjoPlayer {
  id: string;
  name: string;
  cards: SkyjoCard[][]; // 4 columns x 3 rows
  score: number;
  totalScore: number;
  isConnected: boolean;
}

export interface SkyjoGameRoom {
  id: string;
  name: string;
  gameType: 'skyjo';
  players: SkyjoPlayer[];
  maxPlayers: number;
  isStarted: boolean;
  currentPlayer?: string;
  deck: number[];
  discardPile: number[];
  winner?: string;
  isFinished?: boolean;
  round: number;
}

export interface SkyjoAction {
  type: 'reveal_card' | 'draw_card' | 'exchange_card' | 'discard_and_reveal';
  playerId: string;
  cardPosition?: { row: number; col: number };
  drawnCard?: number;
}
