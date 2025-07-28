export type UnoColor = "red" | "blue" | "green" | "yellow";
export type UnoCardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild_draw4";

export interface UnoCard {
  id: string;
  color: UnoColor | "wild";
  type: UnoCardType;
  value?: number; // For number cards 0-9
}

export interface Player {
  id: string;
  name: string;
  cards: UnoCard[];
  isConnected: boolean;
}

export interface GameRoom {
  id: string;
  name: string;
  gameType: 'uno' | 'skyjo';
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentPlayer?: string;
  direction: 1 | -1;
  topCard?: UnoCard;
  deck: UnoCard[];
  discardPile: UnoCard[];
  winner?: string;
  drawPenalty?: number;
  wildColor?: UnoColor; // Color chosen for wild cards
  unoCalledBy?: string; // Player who called UNO
  unoChallengeTime?: number; // Timestamp when UNO can be challenged
  isFinished?: boolean; // Game has ended
}

export interface GameAction {
  type: "play_card" | "draw_card" | "call_uno" | "challenge_uno";
  playerId: string;
  card?: UnoCard;
  targetPlayer?: string;
}

export interface RoomUpdate {
  room: GameRoom;
  action?: GameAction;
  message?: string;
}
