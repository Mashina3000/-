import { h, head, toast } from '../dom';

type Tile = '' | 'block' | 'spike' | 'ship' | 'ball' | 'cube';
const COLS = 32, ROWS = 8;
const KEY = 'gd.editor.level.v1';

export function editorScreen() {
  let tool: Tile = 'block';
  let tiles: Tile[] = Array(COLS * ROWS).fill('');
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const data = JSON.parse(saved) as { tiles?: Tile[] };
      if (Array.isArray(data.tiles) && data.tiles.length === tiles.length) tiles = data.tiles;
    }
  } catch { /* ignore invalid local save */ }

  const grid = h('div', { class: 'editor-grid', role: 'grid', 'aria-label': 'Сетка уровня' });
  const cells: HTMLButtonElement[] = [];
  const tools: [Tile, string, string][] = [
    ['block', 'Блок', '▰'], ['spike', 'Шип', '▲'], ['ship', 'Портал корабля', '🚀'],
    ['ball', 'Портал гравитации', '◉'], ['cube', 'Портал кубика', '◆'], ['', 'Ластик', '⌫'],
  ];
  const palette = h('div', { class: 'editor-tools' }, ...tools.map(([id, label, glyph]) =>
    h('button', { class: `btn editor-tool${id === tool ? ' active' : ''}`, title: label, onclick: () => setTool(id) }, `${glyph} ${label}`)));

  function setTool(next: Tile) {
    tool = next;
    palette.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', tools[i][0] === tool));
  }
  function drawCell(i: number) {
    const cell = cells[i];
    cell.dataset.tile = tiles[i];
    cell.textContent = tiles[i] === 'block' ? '■' : tiles[i] === 'spike' ? '▲' : tiles[i] === 'ship' ? '🚀' : tiles[i] === 'ball' ? '◉' : tiles[i] === 'cube' ? '◆' : '';
    cell.setAttribute('aria-label', `Столбец ${i % COLS + 1}, ряд ${Math.floor(i / COLS) + 1}: ${tiles[i] || 'пусто'}`);
  }
  for (let i = 0; i < tiles.length; i++) {
    const cell = h('button', { class: 'editor-cell', role: 'gridcell', onclick: () => { tiles[i] = tool; drawCell(i); } });
    cells.push(cell); grid.append(cell); drawCell(i);
  }
  const status = h('p', { class: 'editor-status' }, '32 × 8 клеток · нажми на сетку, чтобы размещать объекты');
  const name = h('input', { class: 'editor-name', value: 'Мой уровень', maxlength: '40', 'aria-label': 'Название уровня' }) as HTMLInputElement;
  const save = () => {
    localStorage.setItem(KEY, JSON.stringify({ name: name.value || 'Мой уровень', cols: COLS, rows: ROWS, tiles, updatedAt: new Date().toISOString() }));
    status.textContent = 'Уровень сохранён на этом компьютере ✓';
    toast('Уровень сохранён');
  };
  const exportLevel = () => {
    const data = JSON.stringify({ name: name.value || 'Мой уровень', cols: COLS, rows: ROWS, tiles }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = h('a', { href: url, download: 'my-geometry-dash-level.json' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    status.textContent = 'JSON-файл уровня подготовлен для скачивания';
  };
  const clear = () => { tiles = Array(COLS * ROWS).fill(''); cells.forEach((_, i) => drawCell(i)); status.textContent = 'Поле очищено'; };
  const load = () => {
    const input = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' }) as HTMLInputElement;
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text()) as { name?: string; tiles?: Tile[] };
        if (!Array.isArray(data.tiles) || data.tiles.length !== COLS * ROWS || data.tiles.some(t => !['', 'block', 'spike', 'ship', 'ball', 'cube'].includes(t))) throw new Error('format');
        tiles = data.tiles; name.value = data.name ?? 'Мой уровень'; cells.forEach((_, i) => drawCell(i));
        status.textContent = 'Уровень загружен ✓';
      } catch { status.textContent = 'Не удалось открыть файл уровня'; }
      input.remove();
    });
    document.body.append(input); input.click();
  };
  return h('section', { class: 'sub editor-screen' },
    head('Редактор уровней'),
    h('div', { class: 'editor-panel' },
      h('div', { class: 'editor-top' }, h('label', {}, 'Название ', name), h('span', { class: 'editor-tip' }, 'Клик по клетке — поставить объект')),
      palette, grid,
      h('div', { class: 'editor-actions' },
        h('button', { class: 'btn go', onclick: save }, 'Сохранить'),
        h('button', { class: 'btn', onclick: load }, 'Открыть JSON'),
        h('button', { class: 'btn', onclick: exportLevel }, 'Экспорт JSON'),
        h('button', { class: 'btn', onclick: clear }, 'Очистить')),
      status,
      h('p', { class: 'editor-note' }, 'Редактор сохраняет карту локально и умеет импортировать/экспортировать JSON. Прямой запуск пользовательской карты внутри игрового режима пока не подключён.')));
}
