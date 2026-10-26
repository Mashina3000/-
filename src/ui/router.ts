type Make = () => HTMLElement;
const registry: Record<string, Make> = {};
let current: HTMLElement | null = null;
let currentName = '';

export const register = (name: string, make: Make) => { registry[name] = make; };

/** dir: 1 — вперёд, -1 — назад, 0 — без анимации (первый показ). */
export function go(name: string, dir: 1 | -1 | 0 = 1) {
  const next = registry[name]();
  next.classList.add('screen');
  if (dir) next.classList.add(dir > 0 ? 'in-fwd' : 'in-back');
  if (current) {
    const old = current;
    old.classList.add('out', dir > 0 ? 'out-fwd' : 'out-back');
    setTimeout(() => old.remove(), 300);
  }
  document.getElementById('ui')!.append(next);
  current = next;
  currentName = name;
}

export const back = () => { if (currentName !== 'main') go('main', -1); };
