export type GameMode = 'cube' | 'ship' | 'ball';
export interface Level { id: string; name: string; difficulty: string; color: string; bpm: number; theme: 'neon' | 'minecraft' | 'sunset' | 'toxic'; modes: GameMode[]; subtitle: string }

// Original levels with distinct palettes, pacing and obstacle mixes.
export const LEVELS: Level[] = [
  { id: 'l1', name: 'Stereo Rush', subtitle: 'NEON CITY • CUBE RUN', difficulty: 'Лёгкий', color: '#31e9ff', bpm: 120, theme: 'neon', modes: ['cube'] },
  { id: 'l2', name: 'Block Kingdom', subtitle: 'PIXEL LAND • PORTAL MIX', difficulty: 'Средний', color: '#7dff67', bpm: 128, theme: 'minecraft', modes: ['cube', 'ship', 'ball'] },
  { id: 'l3', name: 'Sunset Drive', subtitle: 'GOLDEN HOUR • JUMP & FLY', difficulty: 'Сложный', color: '#ff9d5c', bpm: 138, theme: 'sunset', modes: ['cube', 'ship'] },
  { id: 'l4', name: 'Toxic Factory', subtitle: 'ACID CORE • PRECISION', difficulty: 'Очень сложно', color: '#b7ff39', bpm: 145, theme: 'toxic', modes: ['cube', 'ball', 'ship'] },
];
