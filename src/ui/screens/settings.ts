import { get, reset, set } from '../../core/store';
import { go } from '../router';
import { h, head, toast } from '../dom';

export function settingsScreen() {
  const S = get().settings;

  const slider = (label: string, key: 'music' | 'sfx') =>
    h('label', { class: 'set' }, label,
      h('input', { type: 'range', min: '0', max: '100', value: String(S[key]),
        oninput: (e: Event) => set((s) => { s.settings[key] = +(e.target as HTMLInputElement).value; }) }));

  const toggle = (label: string, key: 'particles' | 'shake' | 'fps') =>
    h('label', { class: 'set' }, label,
      h('input', { type: 'checkbox', class: 'tg', checked: S[key],
        onchange: (e: Event) => set((s) => { s.settings[key] = (e.target as HTMLInputElement).checked; }) }));

  return h('section', { class: 'sub' },
    head('Настройки'),
    h('div', { class: 'list' },
      slider('Музыка', 'music'),
      slider('Звуки', 'sfx'),
      toggle('Частицы на фоне', 'particles'),
      toggle('Тряска экрана', 'shake'),
      toggle('Показывать FPS', 'fps'),
      h('button', { class: 'btn', onclick: () => {
        if (confirm('Сбросить весь прогресс и скин?')) { reset(); toast('Прогресс сброшен'); go('settings', 0); }
      } }, 'Сбросить прогресс')));
}
