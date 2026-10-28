export interface Skin { icon: number; c1: string; c2: string }
export interface Settings { music: number; sfx: number; particles: boolean; shake: boolean; fps: boolean }
export interface Save {
  settings: Settings;
  skin: Skin;
  progress: Record<string, { best: number; coins: number }>;
  lastLevel: string;
}

const KEY = 'gd.save.v1';
const DEFAULT: Save = {
  settings: { music: 70, sfx: 80, particles: true, shake: true, fps: false },
  skin: { icon: 0, c1: '#7dff00', c2: '#00ffff' },
  progress: {},
  lastLevel: 'l1',
};

function load(): Save {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULT, ...p, settings: { ...DEFAULT.settings, ...p.settings }, skin: { ...DEFAULT.skin, ...p.skin } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

let state = load();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };

export const get = () => state;
export function set(fn: (s: Save) => void) { fn(state); persist(); }
export function reset() { state = structuredClone(DEFAULT); persist(); }
