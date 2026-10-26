export type GameMode = 'cube' | 'ship' | 'ball';
export interface Level { id: string; name: string; difficulty: string; color: string; bpm: number; theme: 'neon' | 'minecraft'; modes: GameMode[] }

export const LEVELS: Level[] = [
  { id: 'l1', name: 'Первый прыжок', difficulty: 'Лёгкий', color: '#3ad46a', bpm: 120, theme: 'neon', modes: ['cube'] },
  { id: 'l2', name: 'Кубический мир', difficulty: 'Средний', color: '#65d84b', bpm: 128, theme: 'minecraft', modes: ['cube', 'ship', 'ball'] },
];
