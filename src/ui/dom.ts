import { back } from './router';

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  el.append(...kids);
  return el;
}

export function toast(msg: string) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2400);
}

export const head = (title: string) =>
  h('header', { class: 'head' },
    h('button', { class: 'btn', 'aria-label': 'Назад', onclick: () => back() }, '‹'),
    h('h2', { class: 'ol' }, title));
