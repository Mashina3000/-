import { get } from '../../core/store';
import { startLevel } from '../../game';
import { h } from '../dom';
import { go } from '../router';
import { cube } from '../cube';

export function mainScreen() {
  const word = (text: string, offset: number) =>
    h('span', { class: 'word' }, ...[...text].map((ch, i) => h('span', { style: `--i:${i + offset}` }, ch)));

  const hero = cube(76);
  hero.classList.add('hero', 'hop');

  const orb = (label: string, icon: HTMLElement, fn: () => void) =>
    h('button', { class: 'orb', onclick: fn }, h('div', { class: 'ico' }, icon), h('span', { class: 'ol' }, label));

  return h('section', { class: 'main' },
    h('h1', { class: 'title' }, word('GEOMETRY', 0), word('DASH', 8)),
    h('div', { class: 'row' },
      orb('Скины', cube(56), () => go('skins')),
      h('button', { class: 'play', 'aria-label': 'Играть', onclick: () => startLevel(get().lastLevel) }, h('i')),
      orb('Уровни', h('i', { class: 'spike' }), () => go('levels'))),
    h('button', { class: 'btn editor-launch', onclick: () => go('editor') }, '✎ РЕДАКТОР УРОВНЕЙ'),
    h('button', { class: 'gear', 'aria-label': 'Настройки', onclick: () => go('settings') }, '⚙'),
    hero);
}
