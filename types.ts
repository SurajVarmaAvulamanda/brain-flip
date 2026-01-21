
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
}

export interface CardData {
  id: number;
  uniqueId: string;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameStats {
  moves: number;
  time: number;
  difficulty: Difficulty;
  date: string;
}

export interface BestScores {
  [Difficulty.EASY]: GameStats | null;
  [Difficulty.MEDIUM]: GameStats | null;
  [Difficulty.HARD]: GameStats | null;
}

export type View = 'home' | 'game' | 'gameover';
