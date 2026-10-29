export type GameMode = 'cube' | 'ship' | 'ball';
export interface Level { id: string; name: string; difficulty: string; color: string; bpm: number; theme: 'neon' | 'minecraft' | 'sunset' | 'toxic'; modes: GameMode[]; subtitle: string }

// Оригинальная кампания из 22 самостоятельных уровней, вдохновлённых ростом
// сложности классических rhythm-platformer уровней. Карты и последовательности препятствий созданы для этого проекта.
export const LEVELS: Level[] = [
  { id: 'l1', name: 'Stereo Rush', subtitle: 'NEON CITY • CUBE RUN', difficulty: 'Лёгкий', color: '#31e9ff', bpm: 120, theme: 'neon', modes: ['cube'] },
  { id: 'l2', name: 'Back on Track', subtitle: 'BOOST PADS • TIMING', difficulty: 'Лёгкий', color: '#ffb52e', bpm: 124, theme: 'neon', modes: ['cube', 'ship', 'ball'] },
  { id: 'l3', name: 'Polargeist', subtitle: 'ORBS • MID-AIR JUMPS', difficulty: 'Лёгкий', color: '#7de9ff', bpm: 128, theme: 'neon', modes: ['cube', 'ship'] },
  { id: 'l4', name: 'Dry Out', subtitle: 'GRAVITY • PRECISION', difficulty: 'Нормальный', color: '#b7ff39', bpm: 132, theme: 'toxic', modes: ['cube', 'ball'] },
  { id: 'l5', name: 'Base After Base', subtitle: 'RHYTHM • PLATFORM FLOW', difficulty: 'Нормальный', color: '#9cff68', bpm: 134, theme: 'minecraft', modes: ['cube'] },
  { id: 'l6', name: "Can't Let Go", subtitle: 'TIGHT JUMPS • QUICK REACTIONS', difficulty: 'Нормальный', color: '#ff647e', bpm: 138, theme: 'sunset', modes: ['cube'] },
  { id: 'l7', name: 'Jumper', subtitle: 'HIGH JUMPS • BOOST CHAINS', difficulty: 'Нормальный', color: '#ffcf43', bpm: 140, theme: 'neon', modes: ['cube'] },
  { id: 'l8', name: 'Time Machine', subtitle: 'FLIP • REVERSE GRAVITY', difficulty: 'Сложный', color: '#c58cff', bpm: 142, theme: 'neon', modes: ['cube', 'ball'] },
  { id: 'l9', name: 'Cycles', subtitle: 'ROLLING GRAVITY • MIX', difficulty: 'Сложный', color: '#ff9e54', bpm: 145, theme: 'sunset', modes: ['cube', 'ball'] },
  { id: 'l10', name: 'xStep', subtitle: 'PORTALS • PRECISION', difficulty: 'Сложный', color: '#51e4b4', bpm: 148, theme: 'toxic', modes: ['cube', 'ship'] },
  { id: 'l11', name: 'Clutterfunk', subtitle: 'MINI SECTIONS • TIGHT GAPS', difficulty: 'Сложный', color: '#f6e85b', bpm: 150, theme: 'neon', modes: ['cube', 'ship'] },
  { id: 'l12', name: 'Theory of Everything', subtitle: 'MODE SWITCH • RHYTHM', difficulty: 'Сложный', color: '#ff67b5', bpm: 152, theme: 'sunset', modes: ['cube', 'ship', 'ball'] },
  { id: 'l13', name: 'Electroman Adventures', subtitle: 'SPEED • COLOR PULSE', difficulty: 'Очень сложно', color: '#42dcff', bpm: 156, theme: 'neon', modes: ['cube', 'ship'] },
  { id: 'l14', name: 'Clubstep', subtitle: 'TRAPS • FALSE PATHS', difficulty: 'Очень сложно', color: '#ff596c', bpm: 158, theme: 'toxic', modes: ['cube', 'ship'] },
  { id: 'l15', name: 'Electrodynamix', subtitle: 'HIGH SPEED • REACTION', difficulty: 'Очень сложно', color: '#ff9c42', bpm: 162, theme: 'neon', modes: ['cube', 'ship'] },
  { id: 'l16', name: 'Hexagon Force', subtitle: 'SYNC • DOUBLE RHYTHM', difficulty: 'Очень сложно', color: '#a77bff', bpm: 164, theme: 'neon', modes: ['cube', 'ball'] },
  { id: 'l17', name: 'Blast Processing', subtitle: 'WAVE-LIKE ZIGZAGS • FLOW', difficulty: 'Очень сложно', color: '#50f1da', bpm: 166, theme: 'minecraft', modes: ['cube', 'ship'] },
  { id: 'l18', name: 'Theory of Everything 2', subtitle: 'PORTAL CHAINS • EXPERT', difficulty: 'Безумный', color: '#ff6fe0', bpm: 170, theme: 'sunset', modes: ['cube', 'ship', 'ball'] },
  { id: 'l19', name: 'Geometrical Dominator', subtitle: 'MOVING LOOK • SURPRISES', difficulty: 'Безумный', color: '#b6ff4d', bpm: 172, theme: 'toxic', modes: ['cube', 'ship'] },
  { id: 'l20', name: 'Deadlocked', subtitle: 'NARROW GAPS • FAST SWITCHES', difficulty: 'Безумный', color: '#ff4e6b', bpm: 176, theme: 'toxic', modes: ['cube', 'ship', 'ball'] },
  { id: 'l21', name: 'Fingerdash', subtitle: 'BOOSTS • COMBO ROUTES', difficulty: 'Безумный', color: '#53e9ff', bpm: 178, theme: 'neon', modes: ['cube', 'ship', 'ball'] },
  { id: 'l22', name: 'Dash', subtitle: 'FINAL RUN • CAMERA RUSH', difficulty: 'Демон', color: '#ff8a37', bpm: 182, theme: 'sunset', modes: ['cube', 'ship', 'ball'] },
];
