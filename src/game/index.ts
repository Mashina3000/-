import { get, set } from '../core/store';
import { LEVELS } from '../data/levels';
import { h } from '../ui/dom';
import { customSkinSource } from '../data/skin-assets';

// Первый играбельный уровень. Музыка генерируется Web Audio, поэтому не нужны внешние файлы.
type Obstacle = { x: number; type: 'spike' | 'block'; w: number; h: number };
type ModeGate = { x: number; mode: 'cube' | 'ship' | 'ball'; color: string };
let activeCleanup: (() => void) | null = null;
const skinImageCache = new Map<string, HTMLImageElement>();
function skinImage(src: string): HTMLImageElement {
  let image = skinImageCache.get(src);
  if (!image) { image = new Image(); image.src = src; skinImageCache.set(src, image); }
  return image;
}

export function startLevel(id: string) {
  activeCleanup?.();
  const level = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
  set((s) => { s.lastLevel = level.id; });

  const root = h('section', { class: 'game-screen' });
  const canvas = h('canvas', { class: 'game-canvas', 'aria-label': 'Игровое поле Geometry Dash' });
  const hud = h('div', { class: 'game-hud' },
    h('button', { class: 'game-small-btn', onclick: () => quit() }, '✕ В МЕНЮ'),
    h('div', { class: 'game-title' }, level.name.toUpperCase()),
    h('div', { class: 'game-percent' }, '0%'));
  const progress = h('div', { class: 'game-progress' }, h('i'));
  const hint = h('div', { class: 'game-hint' }, level.id === 'l2' ? 'MINECRAFT WORLD • УДЕРЖИВАЙ В РЕЖИМЕ КОРАБЛЯ' : 'ПРОБЕЛ / ↑ / КЛИК — ПРЫЖОК');
  const modal = h('div', { class: 'game-modal hidden' });
  root.append(canvas, hud, progress, hint, modal);
  document.getElementById('ui')!.append(root);

  const ctx = canvas.getContext('2d')!;
  let width = 0, height = 0, dpr = 1;
  const floorY = () => height * .79;
  const worldSpeed = level.id === 'l2' ? 320 : 300;
  const cubeSize = 34;
  const totalDistance = level.id === 'l2' ? 14200 : 12600;
  const obstacles: Obstacle[] = [];
  // Расстановка в такт 120 BPM: препятствия читаются заранее, одиночные и парные шипы.
  const pattern: [number, 'spike' | 'block', number?][] = level.id === 'l2' ? [
    [620,'block'],[960,'spike'],[1300,'spike',2],[1760,'block'],[2180,'spike'],[2520,'block'],
    [3020,'spike',2],[3480,'block'],[3920,'spike'],[4380,'spike',2],[4920,'block'],[5360,'spike'],
    [5840,'block'],[6320,'spike',2],[6880,'block'],[7340,'spike'],[7820,'spike',2],[8340,'block'],
    [8860,'spike'],[9340,'block'],[9820,'spike',2],[10380,'block'],[10840,'spike'],[11320,'spike',2],
    [11860,'block'],[12320,'spike'],[12820,'block'],[13300,'spike',2],[13760,'spike']
  ] : [
    [760,'spike'],[1120,'spike'],[1500,'spike',2],[2050,'block'],[2420,'spike'],[2780,'spike',2],
    [3330,'block'],[3700,'spike'],[4070,'spike'],[4440,'spike',2],[5010,'block'],[5400,'spike'],
    [5780,'spike',2],[6400,'block'],[6800,'spike'],[7180,'spike'],[7560,'spike',2],[8150,'block'],
    [8550,'spike'],[8930,'spike',2],[9500,'block'],[9890,'spike'],[10270,'spike'],[10650,'spike',2],
    [11350,'block'],[11730,'spike'],[12000,'spike',2]
  ];
  for (const [x, type, count = 1] of pattern) {
    for (let n = 0; n < count; n++) obstacles.push({ x: x + n * 34, type, w: type === 'block' ? 38 : 34, h: type === 'block' ? 42 : 34 });
  }

  const gates: ModeGate[] = level.id === 'l2' ? [{ x: 1900, mode: 'ship', color: '#ffb52e' }, { x: 4450, mode: 'cube', color: '#61f7ff' }, { x: 6900, mode: 'ball', color: '#f66bff' }, { x: 9400, mode: 'cube', color: '#61f7ff' }, { x: 11300, mode: 'ship', color: '#ffb52e' }, { x: 12800, mode: 'cube', color: '#61f7ff' }] : [];
  let mode: 'cube' | 'ship' | 'ball' = 'cube';
  let pressed = false;
  let distance = 0, vy = 0, cubeY = 0, rotation = 0;
  let last = 0, raf = 0, dead = false, won = false, started = false;
  let audio: AudioContext | null = null, master: GainNode | null = null, beatTimer = 0;
  const gravity = 2100, jumpVelocity = -690;
  const playerX = () => width * .22;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = root.clientWidth; height = root.clientHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cubeY = floorY() - cubeSize;
  };
  const tone = (freq: number, duration: number, type: OscillatorType, volume: number, when = 0) => {
    if (!audio || !master) return;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audio.currentTime + when);
    gain.gain.setValueAtTime(.0001, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), audio.currentTime + when + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + when + duration);
    osc.connect(gain); gain.connect(master); osc.start(audio.currentTime + when); osc.stop(audio.currentTime + when + duration + .02);
  };
  const startMusic = async () => {
    try {
      audio = new AudioContext(); master = audio.createGain();
      master.gain.value = get().settings.music / 100 * .18; master.connect(audio.destination);
      await audio.resume(); started = true;
      const bpm = level.bpm, beat = 60 / bpm;
      const melody = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
      const tick = () => {
        if (!audio || dead || won || !root.isConnected) return;
        const step = beatTimer++;
        tone(step % 4 === 0 ? 110 : 55, .11, 'sine', step % 4 === 0 ? .6 : .25);
        tone(step % 2 === 0 ? 1600 : 1200, .035, 'square', .12, .015);
        if (step % 2 === 0) tone(melody[(step / 2) % melody.length], .19, 'triangle', .32, .025);
        window.setTimeout(tick, beat * 500);
      };
      tick();
    } catch { /* браузер может запретить звук — игра остаётся играбельной */ }
  };
  const jump = () => {
    if (dead || won) return;
    if (!started) void startMusic();
    if (mode === 'ship') { pressed = true; return; }
    if (mode === 'ball') { vy = vy >= 0 ? -720 : 720; tone(440, .08, 'square', .12); return; }
    if (cubeY >= floorY() - cubeSize - 1) { vy = jumpVelocity; tone(440, .08, 'square', .12); }
  };
  const onKey = (e: KeyboardEvent) => {
    if (['Space','ArrowUp','KeyW'].includes(e.code)) { e.preventDefault(); if (dead || won) return; if (!e.repeat) jump(); }
    if (e.code === 'Escape') { e.preventDefault(); quit(); }
    if ((dead || won) && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); restart(); }
  };
  const onPointer = (e: PointerEvent) => { if ((e.target as HTMLElement).closest('button')) return; if (dead || won) return; jump(); };
  const release = () => { pressed = false; };
  const onKeyUp = (e: KeyboardEvent) => { if (['Space','ArrowUp','KeyW'].includes(e.code)) release(); };
  const quit = () => { cleanup(); root.remove(); activeCleanup = null; };
  const cleanup = () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', resize); root.removeEventListener('pointerdown', onPointer); root.removeEventListener('pointerup', release); root.removeEventListener('pointercancel', release); if (audio) void audio.close(); };
  const restart = () => { cleanup(); root.remove(); activeCleanup = null; startLevel(level.id); };
  activeCleanup = quit;
  resize();
  addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp); window.addEventListener('resize', resize); root.addEventListener('pointerdown', onPointer); root.addEventListener('pointerup', release); root.addEventListener('pointercancel', release);
  void startMusic();

  const drawSpike = (x: number, y: number, size: number) => {
    ctx.fillStyle = '#101044'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size / 2, y - size); ctx.lineTo(x + size, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9fffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 7, y - 4); ctx.lineTo(x + size / 2, y - size + 10); ctx.lineTo(x + size - 7, y - 4); ctx.stroke();
  };
  const finish = (success: boolean) => {
    if (dead || won) return;
    dead = !success; won = success;
    if (audio && master) { master.gain.setTargetAtTime(.0001, audio.currentTime, .08); }
    set((s) => { const p = s.progress[level.id] ?? { best: 0, coins: 0 }; p.best = Math.max(p.best, success ? 100 : Math.floor(distance / totalDistance * 100)); s.progress[level.id] = p; });
    modal.classList.remove('hidden'); modal.innerHTML = '';
    modal.append(h('div', { class: 'modal-card' },
      h('div', { class: 'modal-eyebrow' }, success ? 'УРОВЕНЬ ПРОЙДЕН' : 'ПОПЫТКА ОКОНЧЕНА'),
      h('h2', {}, success ? 'НЕВЕРОЯТНО!' : 'СТОЛКНОВЕНИЕ!'),
      h('p', {}, success ? `Отличный ритм. Ты прошёл уровень «${level.name}»!` : 'Не сдавайся — запомни ритм и попробуй ещё раз.'),
      h('button', { class: 'btn go', onclick: () => restart() }, '↻ ЕЩЁ РАЗ'),
      h('button', { class: 'btn', onclick: () => quit() }, '⌂ В МЕНЮ')));
  };
  const draw = (time: number) => {
    raf = requestAnimationFrame(draw);
    const dt = Math.min((time - (last || time)) / 1000, .033); last = time;
    if (!dead && !won) {
      distance += worldSpeed * dt;
      for (const gate of gates) if (distance >= gate.x && distance - worldSpeed * dt < gate.x) { mode = gate.mode; vy = mode === 'ship' ? -150 : 0; tone(720, .16, 'triangle', .25); }
      if (mode === 'ship') { vy += (pressed ? -1750 : 1050) * dt; vy = Math.max(-430, Math.min(430, vy)); cubeY += vy * dt; cubeY = Math.max(50, Math.min(floorY() - cubeSize, cubeY)); rotation = Math.max(-.65, Math.min(.65, vy / 600)); }
      else if (mode === 'ball') { vy += gravity * dt; cubeY += vy * dt; if (cubeY >= floorY() - cubeSize) { cubeY = floorY() - cubeSize; vy = 0; } if (cubeY <= 60) { cubeY = 60; vy = Math.abs(vy); } rotation += dt * 6 * (vy < 0 ? -1 : 1); }
      else { vy += gravity * dt; cubeY += vy * dt; if (cubeY >= floorY() - cubeSize) { cubeY = floorY() - cubeSize; vy = 0; rotation = Math.round(rotation / (Math.PI / 2)) * (Math.PI / 2); } else rotation += dt * 7.8; }
      const px = playerX();
      for (const o of obstacles) {
        const ox = o.x - distance + px;
        if (ox < px + cubeSize && ox + o.w > px + 5) {
          const top = o.type === 'spike' ? floorY() - o.h + 8 : floorY() - o.h;
          if (px + cubeSize - 5 > ox && cubeY + cubeSize - 5 > top && cubeY + 5 < floorY()) finish(false);
        }
      }
      if (distance >= totalDistance) finish(true);
    }
    // sky and subtle rhythm grid
    const beatPulse = .5 + .5 * Math.sin(time / (60000 / level.bpm) * Math.PI * 2);
    const minecraft = level.theme === 'minecraft';
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    if (minecraft) { bg.addColorStop(0, '#79cfff'); bg.addColorStop(.72, '#b9ecff'); bg.addColorStop(1, '#e5f7ff'); }
    else { bg.addColorStop(0, '#2589f7'); bg.addColorStop(.7, '#173cc7'); bg.addColorStop(1, '#09115b'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    if (minecraft) {
      // Пиксельные облака и дальние кубические холмы в стиле Minecraft.
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      for (let i = 0; i < 5; i++) { const cx = ((i * 181 - distance * .08) % (width + 180) + width + 180) % (width + 180) - 90; const cy = 70 + (i % 3) * 42; ctx.fillRect(cx, cy, 74, 20); ctx.fillRect(cx + 18, cy - 14, 42, 14); ctx.fillRect(cx + 8, cy + 20, 54, 10); }
      for (let i = 0; i < 12; i++) { const bx = ((i * 113 - distance * .16) % (width + 100) + width + 100) % (width + 100) - 50; const bh = 45 + (i * 31 % 105); ctx.fillStyle = i % 2 ? '#8bd46b' : '#70bd59'; ctx.fillRect(bx, floorY() - bh, 54, bh); ctx.fillStyle = '#4f9c45'; ctx.fillRect(bx, floorY() - bh, 54, 9); }
    }
    ctx.fillStyle = `rgba(95,245,255,${.025 + beatPulse * .025})`;
    for (let x = -((distance * .28) % 72); x < width; x += 72) { ctx.fillRect(x, 0, 2, floorY()); }
    for (let y = 30; y < floorY(); y += 72) ctx.fillRect(0, y, width, 1);
    // decorative skyline
    for (let i = 0; i < 16; i++) { const bx = ((i * 97 - distance * .12) % (width + 120) + width + 120) % (width + 120) - 60; const bh = 35 + (i * 47 % 100); ctx.fillStyle = 'rgba(8,20,100,.24)'; ctx.fillRect(bx, floorY() - bh, 44, bh); }
    // floor
    const fy = floorY(); ctx.fillStyle = '#07144f'; ctx.fillRect(0, fy, width, height - fy);
    ctx.fillStyle = '#e7ffff'; ctx.fillRect(0, fy, width, 5); ctx.shadowColor = '#7dfaff'; ctx.shadowBlur = 18; ctx.fillRect(0, fy, width, 3); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(112,225,255,.26)'; ctx.lineWidth = 1;
    for (let x = -((distance % 48)); x < width; x += 48) { ctx.beginPath(); ctx.moveTo(x, fy + 5); ctx.lineTo(x, height); ctx.stroke(); }
    // objects
    for (const o of obstacles) {
      const x = o.x - distance + playerX(); if (x < -60 || x > width + 60) continue;
      if (o.type === 'spike' && !minecraft) drawSpike(x, fy + 1, o.w);
      else if (o.type === 'spike') { ctx.fillStyle = '#d8d8d8'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + o.w / 2, fy - o.h); ctx.lineTo(x + o.w, fy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = minecraft ? '#8a5a34' : '#1686ff'; ctx.strokeStyle = minecraft ? '#4c3425' : '#000'; ctx.lineWidth = 4; ctx.fillRect(x, fy - o.h, o.w, o.h); ctx.strokeRect(x, fy - o.h, o.w, o.h); if (minecraft) { ctx.fillStyle = '#54b84b'; ctx.fillRect(x, fy - o.h, o.w, 8); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 5, fy - o.h + 10, 8, 8); } else { ctx.strokeStyle = '#a9faff'; ctx.lineWidth = 3; ctx.strokeRect(x + 5, fy - o.h + 5, o.w - 10, o.h - 10); } }
    }
    // Порталы переключения режимов во втором уровне.
    for (const gate of gates) { const gx = gate.x - distance + playerX(); if (gx < -50 || gx > width + 50) continue; ctx.save(); ctx.strokeStyle = gate.color; ctx.lineWidth = 6; ctx.shadowColor = gate.color; ctx.shadowBlur = 18; ctx.beginPath(); ctx.ellipse(gx, fy - 55, 17, 43, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore(); }
    // player and trail
    const skin = get().skin;
    for (let i = 4; i >= 1; i--) { ctx.globalAlpha = .07 * (5 - i); ctx.fillStyle = skin.c1; ctx.fillRect(playerX() - i * 13, cubeY + i * 2, cubeSize, cubeSize); }
    ctx.globalAlpha = 1; ctx.save(); ctx.translate(playerX() + cubeSize / 2, cubeY + cubeSize / 2); ctx.rotate(rotation);
    const customSrc = customSkinSource(skin.icon);
    const customImage = customSrc ? skinImage(customSrc) : null;
    if (mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) {
      ctx.shadowColor = skin.c1; ctx.shadowBlur = 12;
      ctx.drawImage(customImage, -cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowColor = skin.c1; ctx.shadowBlur = 18; ctx.fillStyle = skin.c1; ctx.fillRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize); ctx.shadowBlur = 0;
      ctx.lineWidth = 4; ctx.strokeStyle = minecraft ? '#263d22' : '#000'; ctx.strokeRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);
      ctx.strokeStyle = skin.c2; ctx.lineWidth = 3; ctx.strokeRect(-cubeSize * .29, -cubeSize * .29, cubeSize * .58, cubeSize * .58);
    }
    // Для внешних скинов в режиме куба рисуется PNG; остальные режимы сохраняют свои силуэты.
    ctx.fillStyle = skin.c2; ctx.strokeStyle = skin.c2; ctx.lineWidth = 3;
    const icon = skin.icon % 12;
    if (mode === 'ship') { ctx.beginPath(); ctx.moveTo(-cubeSize * .42, -cubeSize * .28); ctx.lineTo(cubeSize * .48, 0); ctx.lineTo(-cubeSize * .42, cubeSize * .28); ctx.closePath(); ctx.fill(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 1) { ctx.fillRect(-9, -9, 7, 7); ctx.fillRect(3, -9, 7, 7); ctx.fillRect(-7, 5, 15, 4); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 2) { ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(12,0); ctx.lineTo(0,12); ctx.lineTo(-12,0); ctx.closePath(); ctx.stroke(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 3) { ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.stroke(); ctx.fillRect(-3,-3,6,6); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 4) { ctx.fillRect(-12,-5,24,10); ctx.fillRect(-5,-12,10,24); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 5) { ctx.beginPath(); ctx.moveTo(-11,-9); ctx.lineTo(11,-9); ctx.lineTo(0,11); ctx.closePath(); ctx.fill(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 6) { ctx.fillRect(-11,-11,7,7); ctx.fillRect(4,-11,7,7); ctx.fillRect(-11,4,7,7); ctx.fillRect(4,4,7,7); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 7) { ctx.beginPath(); ctx.moveTo(-11,0); ctx.lineTo(-5,-9); ctx.lineTo(5,-9); ctx.lineTo(11,0); ctx.lineTo(5,9); ctx.lineTo(-5,9); ctx.closePath(); ctx.stroke(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 8) { ctx.beginPath(); ctx.moveTo(-10,-8); ctx.lineTo(0,10); ctx.lineTo(10,-8); ctx.stroke(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 9) { ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 10) { ctx.fillRect(-12,-10,24,5); ctx.fillRect(-6,-2,12,5); ctx.fillRect(-12,6,24,5); }
    else if (!(mode === 'cube' && customImage?.complete && customImage.naturalWidth > 0) && icon === 11) { ctx.beginPath(); ctx.moveTo(-12,-8); ctx.lineTo(0,-12); ctx.lineTo(12,-8); ctx.lineTo(8,8); ctx.lineTo(0,12); ctx.lineTo(-8,8); ctx.closePath(); ctx.stroke(); }
    if (mode === 'ball') { ctx.beginPath(); ctx.arc(0,0,cubeSize*.42,0,Math.PI*2); ctx.stroke(); }
    ctx.restore();
    const pct = Math.min(100, Math.floor(distance / totalDistance * 100));
    hud.querySelector('.game-percent')!.textContent = `${pct}%`;
    progress.firstElementChild!.setAttribute('style', `width:${pct}%`);
    if (pct > 3) hint.classList.add('hint-out');
  };
  raf = requestAnimationFrame(draw);
}
