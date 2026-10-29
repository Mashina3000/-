import { get } from '../../core/store';
import { startLevel } from '../../game';
import { h, toast } from '../dom';
import { go } from '../router';
import { cube } from '../cube';

export function mainScreen() {
  const word = (text: string, offset: number) =>
    h('span', { class: 'logo-word' }, ...[...text].map((ch, i) => h('span', { style: `--i:${i + offset}` }, ch)));

  const hero = cube(78);
  hero.classList.add('main-mascot', 'hop');

  const nav = (symbol: string, label: string, cls: string, fn: () => void) =>
    h('button', { class: `gd-nav ${cls}`, onclick: fn, title: label },
      h('span', { class: 'gd-nav-icon' }, symbol),
      h('span', { class: 'gd-nav-label' }, label));

  const feature = (symbol: string, label: string, fn: () => void) =>
    h('button', { class: 'gd-feature', onclick: fn },
      h('span', { class: 'gd-feature-icon' }, symbol),
      h('span', {}, label));

  const play = h('button', { class: 'gd-play', 'aria-label': 'Выбрать уровень', onclick: () => go('levels') },
    h('span', { class: 'gd-play-triangle' }),
    h('span', { class: 'gd-play-caption' }, 'ИГРАТЬ'));

  const last = get().lastLevel;
  return h('section', { class: 'main gd-main' },
    h('div', { class: 'gd-topline' },
      h('div', { class: 'gd-mini-brand' }, h('span', { class: 'gd-brand-gem' }, '◆'), ' DASH WORLD'),
      h('button', { class: 'gd-top-button', onclick: () => go('settings'), 'aria-label': 'Настройки' }, '⚙')),
    h('div', { class: 'gd-logo-wrap' },
      h('div', { class: 'gd-logo-shadow' }, word('GEOMETRY', 0), word('DASH', 8)),
      h('h1', { class: 'title gd-title' }, word('GEOMETRY', 0), word('DASH', 8)),
      h('div', { class: 'gd-subtitle' }, 'JUMP • FLY • SURVIVE')),
    h('div', { class: 'gd-main-stage' },
      h('div', { class: 'gd-side-glow gd-glow-left' }),
      h('div', { class: 'gd-side-glow gd-glow-right' }),
      h('div', { class: 'gd-orbit gd-orbit-one' }),
      h('div', { class: 'gd-orbit gd-orbit-two' }),
      hero,
      h('div', { class: 'gd-stage-label' }, 'READY PLAYER ONE')),
    h('div', { class: 'gd-play-row' },
      feature('▦', 'УРОВНИ', () => go('levels')),
      play,
      feature('✦', 'СКИНЫ', () => go('skins'))),
    h('div', { class: 'gd-bottom-nav' },
      nav('⌂', 'Главная', 'active', () => toast('Ты уже на главном экране')),
      nav('◈', 'Уровни', '', () => go('levels')),
      nav('✎', 'Создать', '', () => go('editor')),
      nav('♙', 'Иконки', '', () => go('skins')),
      nav('⚙', 'Настройки', '', () => go('settings'))),
    h('div', { class: 'gd-corner-badge' }, `LEVEL ${String(last ?? '1').replace(/^l/, '')} • CUSTOM EDITION`));
}
