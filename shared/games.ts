export type GameType = 'uno' | 'skyjo';

export interface GameOption {
  id: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
}

export const AVAILABLE_GAMES: GameOption[] = [
  {
    id: 'uno',
    name: 'UNO',
    description: 'Jeu de cartes classique - débarrassez-vous de toutes vos cartes !',
    minPlayers: 2,
    maxPlayers: 4,
    icon: '🎯'
  },
  {
    id: 'skyjo',
    name: 'Skyjo',
    description: 'Minimisez vos points avec ce jeu de stratégie et de mémoire !',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '⭐'
  }
];
