import { get, set } from '../../core/store';
import { COLORS, ICON_COUNT } from '../../data/skins';
import { CUSTOM_SKINS } from '../../data/skin-assets';
import { h, head } from '../dom';
import { applySkin, cube } from '../cube';

export function skinsScreen() {
  const preview = cube(140);
  preview.classList.add('hop');

  const cells = Array.from({ length: ICON_COUNT }, (_, n) => {
    const c = cube(52);
    const name = n < 12 ? `Стандартная ${n + 1}` : CUSTOM_SKINS[n - 12]?.name ?? `Иконка ${n + 1}`;
    const b = h('button', { class: 'cell', title: name, 'aria-label': name, onclick: () => { set((s) => { s.skin.icon = n; }); sync(); } }, c);
    return { b, c, n };
  });

  const swatches = (key: 'c1' | 'c2') =>
    COLORS.map((col) => ({
      key, col,
      b: h('button', { class: 'sw', style: `background:${col}`, 'aria-label': col, onclick: () => { set((s) => { s.skin[key] = col; }); sync(); } }),
    }));
  const r1 = swatches('c1');
  const r2 = swatches('c2');

  function sync() {
    const k = get().skin;
    applySkin(preview, k);
    cells.forEach(({ b, c, n }) => { applySkin(c, { ...k, icon: n }); b.classList.toggle('sel', n === k.icon); });
    [...r1, ...r2].forEach(({ b, col, key }) => b.classList.toggle('sel', k[key] === col));
  }

  const root = h('section', { class: 'sub' },
    head('Скины'),
    h('div', { class: 'skins' },
      h('div', { class: 'stagebox' }, preview),
      h('div', { class: 'panel' },
        h('h3', {}, `Иконка — ${ICON_COUNT} доступных скинов`), h('div', { class: 'grid' }, ...cells.map((x) => x.b)),
        h('h3', {}, 'Основной цвет'), h('div', { class: 'grid' }, ...r1.map((x) => x.b)),
        h('h3', {}, 'Дополнительный цвет'), h('div', { class: 'grid' }, ...r2.map((x) => x.b)))));
  sync();
  return root;
}
