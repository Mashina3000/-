import { get, type Skin } from '../core/store';
import { h } from './dom';
import { customSkinSource } from '../data/skin-assets';

export function applySkin(el: HTMLElement, s: Skin) {
  el.dataset.icon = String(s.icon);
  el.title = `Скин ${s.icon + 1}`;
  el.style.setProperty('--c1', s.c1);
  el.style.setProperty('--c2', s.c2);
  const image = customSkinSource(s.icon);
  el.classList.toggle('custom-skin', Boolean(image));
  el.style.backgroundImage = image ? `url(\"${image}\")` : '';
  el.style.backgroundSize = image ? 'cover' : '';
  el.style.backgroundPosition = image ? 'center' : '';
  el.style.backgroundColor = image ? 'transparent' : s.c1;
}

export function cube(size: number, skin: Skin = get().skin) {
  const el = h('div', { class: 'cube', style: `--s:${size}px` }, h('b'));
  applySkin(el, skin);
  return el;
}
