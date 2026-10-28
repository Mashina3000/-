import { get } from '../../core/store';
import { LEVELS } from '../../data/levels';
import { startLevel } from '../../game';
import { h, head } from '../dom';

export function levelsScreen() {
  let i = Math.max(0, LEVELS.findIndex((l) => l.id === get().lastLevel));

  const cards = LEVELS.map((l, n) => {
    const best = get().progress[l.id]?.best ?? 0;
    return h('article', { class: 'card', style: `--lv:${l.color}`, onclick: () => (n === i ? startLevel(l.id) : show(n)) },
      h('h2', { class: 'ol' }, l.name),
      h('span', { class: 'badge' }, l.difficulty),
      h('p', {}, `${l.bpm} BPM`),
      h('div', { class: 'bar' }, h('i', { style: `width:${best}%` })),
      h('p', {}, `Лучший результат: ${best}%`),
      h('button', { class: 'btn go' }, 'Играть'));
  });

  function show(n: number) {
    i = Math.min(Math.max(n, 0), LEVELS.length - 1);
    cards.forEach((c, k) => {
      c.classList.toggle('on', k === i);
      c.toggleAttribute('data-far', Math.abs(k - i) > 2);
      c.style.setProperty('--d', String(k - i));
    });
  }

  const root = h('section', { class: 'sub' },
    head('Уровни'),
    h('div', { class: 'stage' }, ...cards,
      h('button', { class: 'btn arrow l', 'aria-label': 'Предыдущий', onclick: () => show(i - 1) }, '‹'),
      h('button', { class: 'btn arrow r', 'aria-label': 'Следующий', onclick: () => show(i + 1) }, '›')));

  const key = (e: KeyboardEvent) => {
    if (!root.isConnected) return removeEventListener('keydown', key);
    if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Enter') startLevel(LEVELS[i].id);
  };
  addEventListener('keydown', key);
  show(i);
  return root;
}
