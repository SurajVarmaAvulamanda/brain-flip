
import { Difficulty } from './types';

export const INDIAN_SYMBOLS = [
  '🐘', '🦚', '🪔', '🏏', '🥭', '🕌', '🍛', '🥘', 
  '🕍', '🐯', '🪷', '🪁', '🥁', '🇮🇳', '🐄', '🥥',
];

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: { rows: 4, cols: 4, pairs: 8, label: 'Easy' },
  [Difficulty.MEDIUM]: { rows: 5, cols: 4, pairs: 10, label: 'Medium' },
  [Difficulty.HARD]: { rows: 6, cols: 5, pairs: 15, label: 'Hard' }
};

export const PLAYER_CONFIG = [
  { name: 'Player 1', color: '#FF9933', icon: '🪷' }, // Saffron
  { name: 'Player 2', color: '#138808', icon: '🦚' }, // Green
  { name: 'Player 3', color: '#000080', icon: '🐘' }, // Navy
  { name: 'Player 4', color: '#E91E63', icon: '🪔' }, // Pink/Rose
];

export const COLORS = {
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080',
  cream: '#FFF9F2',
  earthy: '#3E2723'
};
