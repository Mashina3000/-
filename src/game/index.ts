import { get, set } from '../core/store';
import { LEVELS } from '../data/levels';
import { h } from '../ui/dom';
import { customSkinSource } from '../data/skin-assets';

// Первый играбельный уровень. Музыка генерируется Web Audio, поэтому не нужны внешние файлы.
type Obstacle = { x: number; type: 'spike' | 'block' | 'saw' | 'platform' | 'pad' | 'orb'; w: number; h: number; color?: string };
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
    h('div', { class: 'game-hud-right' },
      h('div', { class: 'game-percent' }, '0%'),
      h('button', { class: 'game-small-btn game-pause-btn', onclick: () => togglePause() }, 'Ⅱ ПАУЗА')));
  const progress = h('div', { class: 'game-progress' }, h('i'));
  const hint = h('div', { class: 'game-hint' }, `${level.subtitle} • ПРОБЕЛ / ↑ / КЛИК — ДЕЙСТВИЕ`);
  const modal = h('div', { class: 'game-modal hidden' });
  root.append(canvas, hud, progress, hint, modal);
  document.getElementById('ui')!.append(root);

  const ctx = canvas.getContext('2d')!;
  let width = 0, height = 0, dpr = 1;
  const floorY = () => height * .79;
  const worldSpeed = level.id === 'l4' ? 365 : level.id === 'l3' ? 340 : level.id === 'l2' ? 320 : 300;
  const cubeSize = 34;
  const totalDistance = level.id === 'l4' ? 15800 : level.id === 'l3' ? 15000 : level.id === 'l2' ? 14200 : 12600;
  const obstacles: Obstacle[] = [];
  // Расстановка в такт 120 BPM: препятствия читаются заранее, одиночные и парные шипы.
  const pattern: [number, Obstacle['type'], number?, number?][] = level.id === 'l4' ? [
    [560,'spike'],[850,'saw'],[1160,'spike',2],[1570,'block'],[1950,'pad'],[2290,'spike',3],[2760,'saw'],[3110,'platform',2],[3560,'spike',2],[3990,'orb'],[4320,'block'],[4680,'saw'],[5090,'spike',3],[5570,'pad'],[5900,'spike',2],[6380,'platform',3],[6880,'saw'],[7260,'spike',2],[7720,'orb'],[8090,'block'],[8460,'spike',3],[8970,'saw'],[9360,'platform',2],[9820,'spike',2],[10300,'pad'],[10650,'saw'],[11100,'spike',3],[11600,'orb'],[11960,'block'],[12400,'saw'],[12800,'spike',2],[13300,'platform',3],[13800,'spike',3],[14300,'saw'],[14800,'spike',2]
  ] : level.id === 'l3' ? [
    [600,'spike'],[930,'block'],[1280,'spike',2],[1740,'saw'],[2130,'platform',2],[2550,'spike',2],[3010,'pad'],[3350,'spike',3],[3900,'saw'],[4330,'block'],[4710,'spike',2],[5190,'platform',3],[5700,'saw'],[6130,'spike',3],[6680,'orb'],[7020,'block'],[7440,'spike',2],[7890,'saw'],[8330,'platform',2],[8780,'spike',3],[9340,'pad'],[9680,'saw'],[10150,'spike',2],[10620,'platform',3],[11150,'spike',3],[11700,'saw'],[12150,'orb'],[12500,'block'],[12920,'spike',2],[13400,'saw'],[13900,'spike',3],[14500,'spike',2]
  ] : level.id === 'l2' ? [
    [620,'block'],[960,'spike'],[1300,'spike',2],[1760,'block'],[2180,'spike'],[2520,'saw'],[3020,'spike',2],[3480,'platform',2],[3920,'spike'],[4380,'spike',2],[4920,'block'],[5360,'pad'],[5840,'saw'],[6320,'spike',2],[6880,'block'],[7340,'spike'],[7820,'spike',2],[8340,'platform',2],[8860,'spike'],[9340,'saw'],[9820,'spike',2],[10380,'block'],[10840,'spike'],[11320,'spike',2],[11860,'platform',2],[12320,'spike'],[12820,'block'],[13300,'spike',2],[13760,'saw']
  ] : [
    [760,'spike'],[1120,'spike'],[1500,'spike',2],[2050,'block'],[2420,'spike'],[2780,'spike',2],[3330,'saw'],[3700,'spike'],[4070,'platform',2],[4440,'spike',2],[5010,'block'],[5400,'spike'],[5780,'spike',2],[6400,'pad'],[6800,'spike'],[7180,'saw'],[7560,'spike',2],[8150,'block'],[8550,'spike'],[8930,'spike',2],[9500,'platform',2],[9890,'spike'],[10270,'spike'],[10650,'spike',2],[11350,'block'],[11730,'saw'],[12000,'spike',2]
  ];
  for (const [x, type, count = 1, spacing = 34] of pattern) {
    for (let n = 0; n < count; n++) {
      const dimensions = type === 'block' ? [42, 42] : type === 'saw' ? [42, 42] : type === 'platform' ? [62, 22] : type === 'pad' ? [30, 12] : type === 'orb' ? [30, 30] : [34, 34];
      obstacles.push({ x: x + n * (type === 'platform' ? 72 : spacing), type, w: dimensions[0], h: dimensions[1], color: level.color });
    }
  }

  const gates: ModeGate[] = level.id === 'l2' ? [{ x: 1900, mode: 'ship', color: '#ffb52e' }, { x: 4450, mode: 'cube', color: '#61f7ff' }, { x: 6900, mode: 'ball', color: '#f66bff' }, { x: 9400, mode: 'cube', color: '#61f7ff' }, { x: 11300, mode: 'ship', color: '#ffb52e' }, { x: 12800, mode: 'cube', color: '#61f7ff' }] : level.id === 'l3' ? [{x:2200,mode:'ship',color:'#ffb66d'},{x:4700,mode:'cube',color:'#ffdb72'},{x:8000,mode:'ship',color:'#ffb66d'},{x:10900,mode:'cube',color:'#ffdb72'}] : level.id === 'l4' ? [{x:2500,mode:'ball',color:'#b7ff39'},{x:5000,mode:'cube',color:'#b7ff39'},{x:7600,mode:'ship',color:'#b7ff39'},{x:10200,mode:'cube',color:'#b7ff39'},{x:12500,mode:'ball',color:'#b7ff39'}] : [];
  let mode: 'cube' | 'ship' | 'ball' = 'cube';
  let pressed = false;
  let distance = 0, vy = 0, cubeY = 0, rotation = 0;
  let last = 0, raf = 0, dead = false, won = false, started = false, paused = false;
  let audio: AudioContext | null = null, master: GainNode | null = null, beatTimer = 0;
  let musicTimer: number | null = null;
  // Each orb can trigger only once per attempt. Restart creates a fresh set.
  const activatedOrbs = new Set<Obstacle>();
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
      // Avoid creating multiple AudioContexts if input arrives while resume() is pending.
      if (audio) {
        if (audio.state === 'suspended') await audio.resume();
        return;
      }
      audio = new AudioContext(); master = audio.createGain();
      master.gain.value = paused ? .0001 : get().settings.music / 100 * .18; master.connect(audio.destination);
      await audio.resume(); started = true;
      const bpm = level.bpm, beat = 60 / bpm;
      const melody = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
      const tick = () => {
        if (!audio || dead || won || !root.isConnected) return;
        if (!paused) {
          const step = beatTimer++;
          tone(step % 4 === 0 ? 110 : 55, .11, 'sine', step % 4 === 0 ? .6 : .25);
          tone(step % 2 === 0 ? 1600 : 1200, .035, 'square', .12, .015);
          if (step % 2 === 0) tone(melody[(step / 2) % melody.length], .19, 'triangle', .32, .025);
        }
        musicTimer = window.setTimeout(tick, beat * 500);
      };
      tick();
    } catch { /* браузер может запретить звук — игра остаётся играбельной */ }
  };
  const jump = () => {
    if (dead || won) return;
    if (!started) void startMusic();
    if (mode === 'ship') { pressed = true; return; }
    if (mode === 'ball') { vy = vy >= 0 ? -720 : 720; tone(440, .08, 'square', .12); return; }
    // Tap an orb when close to it to perform a mid-air boost, like a rhythm platformer orb.
    const px = playerX();
    const nearbyOrb = obstacles.find((o) => o.type === 'orb' && !activatedOrbs.has(o) && Math.abs((o.x - distance + px + o.w / 2) - (px + cubeSize / 2)) < 42 && Math.abs((floorY() - 94) - (cubeY + cubeSize / 2)) < 62);
    if (nearbyOrb && cubeY < floorY() - cubeSize - 1) {
      activatedOrbs.add(nearbyOrb);
      vy = jumpVelocity * 1.12;
      tone(920, .09, 'sine', .18);
      return;
    }
    if (cubeY >= floorY() - cubeSize - 1) { vy = jumpVelocity; tone(440, .08, 'square', .12); }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Escape' && !dead && !won) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (paused && (e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault();
      togglePause(false);
      return;
    }
    // Restart must be checked before normal jump input; otherwise Space is ignored after death.
    if ((dead || won) && (e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault();
      if (!e.repeat) restart();
      return;
    }
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      if (dead || won || paused) return;
      if (!e.repeat) jump();
    }
    if (e.code === 'Escape') { e.preventDefault(); quit(); }
  };
  const onPointer = (e: PointerEvent) => { if ((e.target as HTMLElement).closest('button')) return; if (dead || won || paused) return; jump(); };
  const release = () => { pressed = false; };
  const onKeyUp = (e: KeyboardEvent) => { if (['Space','ArrowUp','KeyW'].includes(e.code)) release(); };
  const togglePause = (force?: boolean) => {
    if (dead || won) return;
    paused = typeof force === 'boolean' ? force : !paused;
    const pauseButton = hud.querySelector('.game-pause-btn') as HTMLButtonElement | null;
    if (pauseButton) pauseButton.textContent = paused ? '▶ ПРОДОЛЖИТЬ' : 'Ⅱ ПАУЗА';
    if (audio && master) {
      const target = paused ? 0.0001 : get().settings.music / 100 * .18;
      master.gain.setTargetAtTime(target, audio.currentTime, .04);
    }
    if (paused) {
      modal.classList.remove('hidden'); modal.innerHTML = '';
      modal.append(h('div', { class: 'modal-card pause-card' },
        h('div', { class: 'modal-eyebrow' }, 'ИГРА НА ПАУЗЕ'),
        h('h2', {}, 'ПЕРЕДОХНИ!'),
        h('p', {}, 'Нажми продолжить, когда будешь готов вернуться в ритм.'),
        h('button', { class: 'btn go', onclick: () => togglePause(false) }, '▶ ПРОДОЛЖИТЬ'),
        h('button', { class: 'btn', onclick: () => restart() }, '↻ ЗАНОВО'),
        h('button', { class: 'btn', onclick: () => quit() }, '⌂ В МЕНЮ')));
    } else {
      modal.classList.add('hidden'); modal.innerHTML = '';
      last = performance.now();
    }
  };
  const quit = () => { cleanup(); root.remove(); activeCleanup = null; };
  const cleanup = () => { cancelAnimationFrame(raf); if (musicTimer !== null) { window.clearTimeout(musicTimer); musicTimer = null; } removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', resize); root.removeEventListener('pointerdown', onPointer); root.removeEventListener('pointerup', release); root.removeEventListener('pointercancel', release); if (audio) void audio.close(); };
  const restart = () => { cleanup(); root.remove(); activeCleanup = null; startLevel(level.id); };
  activeCleanup = quit;
  resize();
  addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp); window.addEventListener('resize', resize); root.addEventListener('pointerdown', onPointer); root.addEventListener('pointerup', release); root.addEventListener('pointercancel', release);
  // Mute the generated music from the very first frame if the first-run tutorial is shown.
  if (!localStorage.getItem('gd-custom-tutorial-seen')) paused = true;
  void startMusic();
  if (!localStorage.getItem('gd-custom-tutorial-seen')) {
    paused = true;
    modal.classList.remove('hidden');
    modal.append(h('div', { class: 'modal-card tutorial-card' },
      h('div', { class: 'modal-eyebrow' }, 'БЫСТРЫЙ СТАРТ'),
      h('h2', {}, 'ГОТОВ?'),
      h('p', {}, 'Пробел, ↑, W или клик — прыжок. Удерживай кнопку в режиме корабля. Нажми Esc, чтобы поставить игру на паузу.'),
      h('button', { class: 'btn go', onclick: () => { localStorage.setItem('gd-custom-tutorial-seen', '1'); paused = false; modal.classList.add('hidden'); modal.innerHTML = ''; last = performance.now(); } }, 'ПОЕХАЛИ!')));
  }

  const drawSpike = (x: number, y: number, size: number) => {
    ctx.fillStyle = '#101044'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size / 2, y - size); ctx.lineTo(x + size, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9fffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 7, y - 4); ctx.lineTo(x + size / 2, y - size + 10); ctx.lineTo(x + size - 7, y - 4); ctx.stroke();
  };
  const finish = (success: boolean) => {
    if (dead || won) return;
    dead = !success; won = success;
    if (musicTimer !== null) { window.clearTimeout(musicTimer); musicTimer = null; }
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
    if (!dead && !won && !paused) {
      distance += worldSpeed * dt;
      for (const gate of gates) if (distance >= gate.x && distance - worldSpeed * dt < gate.x) { mode = gate.mode; vy = mode === 'ship' ? -150 : 0; tone(720, .16, 'triangle', .25); }
      const previousCubeY = cubeY;
      if (mode === 'ship') { vy += (pressed ? -1750 : 1050) * dt; vy = Math.max(-430, Math.min(430, vy)); cubeY += vy * dt; cubeY = Math.max(50, Math.min(floorY() - cubeSize, cubeY)); rotation = Math.max(-.65, Math.min(.65, vy / 600)); }
      else if (mode === 'ball') { vy += gravity * dt; cubeY += vy * dt; if (cubeY >= floorY() - cubeSize) { cubeY = floorY() - cubeSize; vy = 0; } if (cubeY <= 60) { cubeY = 60; vy = Math.abs(vy); } rotation += dt * 6 * (vy < 0 ? -1 : 1); }
      else { vy += gravity * dt; cubeY += vy * dt; if (cubeY >= floorY() - cubeSize) { cubeY = floorY() - cubeSize; vy = 0; rotation = Math.round(rotation / (Math.PI / 2)) * (Math.PI / 2); } else rotation += dt * 7.8; }
      const px = playerX();
      for (const o of obstacles) {
        const ox = o.x - distance + px;
        if (ox < px + cubeSize && ox + o.w > px + 4) {
          const top = floorY() - o.h;
          if (o.type === 'pad') {
            if (Math.abs(ox - px) < 20 && cubeY + cubeSize >= top - 12 && cubeY + cubeSize <= floorY() + 12 && mode === 'cube') { vy = jumpVelocity * 1.32; cubeY = top - cubeSize; tone(760, .12, 'triangle', .2); }
          } else if (o.type === 'platform') {
            // Land on a platform only while descending through its top surface.
            const previousBottom = previousCubeY + cubeSize;
            const currentBottom = cubeY + cubeSize;
            if (mode === 'cube' && vy >= 0 && previousBottom <= top + 8 && currentBottom >= top && currentBottom <= top + 30) {
              cubeY = top - cubeSize;
              vy = 0;
              rotation = Math.round(rotation / (Math.PI / 2)) * (Math.PI / 2);
            }
          } else if (o.type === 'orb') {
            // Orbs are activated on input near the orb, not by touching their visual ring.
          } else if (o.type !== 'platform') {
            const lethalTop = top + (o.type === 'spike' ? 8 : o.type === 'saw' ? 4 : 0);
            if (px + cubeSize - 5 > ox && cubeY + cubeSize - 5 > lethalTop && cubeY + 5 < floorY()) finish(false);
          }
        }
      }
      if (distance >= totalDistance) finish(true);
    }
    // sky and subtle rhythm grid
    const beatPulse = .5 + .5 * Math.sin(time / (60000 / level.bpm) * Math.PI * 2);
    const minecraft = level.theme === 'minecraft';
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    if (minecraft) { bg.addColorStop(0, '#79cfff'); bg.addColorStop(.72, '#b9ecff'); bg.addColorStop(1, '#e5f7ff'); }
    else if (level.theme === 'sunset') { bg.addColorStop(0, '#ffb46f'); bg.addColorStop(.48, '#ec5e9b'); bg.addColorStop(1, '#401f72'); }
    else if (level.theme === 'toxic') { bg.addColorStop(0, '#182d35'); bg.addColorStop(.55, '#163b36'); bg.addColorStop(1, '#080d24'); }
    else { bg.addColorStop(0, '#2589f7'); bg.addColorStop(.7, '#173cc7'); bg.addColorStop(1, '#09115b'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    if (minecraft) {
      // Пиксельные облака и дальние кубические холмы в стиле Minecraft.
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      for (let i = 0; i < 5; i++) { const cx = ((i * 181 - distance * .08) % (width + 180) + width + 180) % (width + 180) - 90; const cy = 70 + (i % 3) * 42; ctx.fillRect(cx, cy, 74, 20); ctx.fillRect(cx + 18, cy - 14, 42, 14); ctx.fillRect(cx + 8, cy + 20, 54, 10); }
      for (let i = 0; i < 12; i++) { const bx = ((i * 113 - distance * .16) % (width + 100) + width + 100) % (width + 100) - 50; const bh = 45 + (i * 31 % 105); ctx.fillStyle = i % 2 ? '#8bd46b' : '#70bd59'; ctx.fillRect(bx, floorY() - bh, 54, bh); ctx.fillStyle = '#4f9c45'; ctx.fillRect(bx, floorY() - bh, 54, 9); }
    }
    if (level.theme === 'sunset') {
      const sunX = width * .76, sunY = height * .25;
      ctx.save(); ctx.shadowColor = '#ffd27b'; ctx.shadowBlur = 35; ctx.fillStyle = '#ffd27b'; ctx.beginPath(); ctx.arc(sunX, sunY, 54, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(111,34,112,.32)'; for (let i=0;i<5;i++) ctx.fillRect(sunX-54,sunY-25+i*17,108,5); ctx.restore();
    } else if (level.theme === 'toxic') {
      ctx.save(); ctx.strokeStyle = 'rgba(183,255,57,.20)'; ctx.lineWidth = 3;
      for (let i=0;i<8;i++) { const tx=((i*149-distance*.12)%(width+80)+width+80)%(width+80)-40; ctx.strokeRect(tx,50,20,height*.42); ctx.fillStyle='rgba(183,255,57,.12)';ctx.fillRect(tx+4,60,12,height*.38); }
      ctx.restore();
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
    // Varied hazards, pads, orbs and platforms; visuals react to each level's palette.
    for (const o of obstacles) {
      const x = o.x - distance + playerX(); if (x < -70 || x > width + 70) continue;
      if (o.type === 'spike') {
        if (minecraft) { ctx.fillStyle = '#d8d8d8'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + o.w / 2, fy - o.h); ctx.lineTo(x + o.w, fy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else drawSpike(x, fy + 1, o.w);
      } else if (o.type === 'saw') {
        const cx = x + o.w / 2, cy = fy - o.h / 2;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(time / 110); ctx.shadowColor = level.color; ctx.shadowBlur = 15;
        ctx.fillStyle = level.theme === 'toxic' ? '#b7ff39' : '#eafaff'; ctx.strokeStyle = '#11152e'; ctx.lineWidth = 3;
        ctx.beginPath(); for (let k=0;k<24;k++){const a=k*Math.PI/12, r=k%2===0?o.w*.52:o.w*.37; const xx=Math.cos(a)*r, yy=Math.sin(a)*r; if(k===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);} ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#28324e';ctx.beginPath();ctx.arc(0,0,o.w*.19,0,Math.PI*2);ctx.fill();ctx.restore();
      } else if (o.type === 'platform') {
        ctx.shadowColor = level.color; ctx.shadowBlur = 10; ctx.fillStyle = minecraft ? '#6a9f42' : level.color; ctx.fillRect(x, fy - o.h, o.w, o.h); ctx.shadowBlur=0; ctx.strokeStyle='#11152e';ctx.lineWidth=3;ctx.strokeRect(x,fy-o.h,o.w,o.h);ctx.fillStyle='rgba(255,255,255,.32)';ctx.fillRect(x+5,fy-o.h+4,o.w-10,3);
      } else if (o.type === 'pad') {
        ctx.save();ctx.shadowColor='#ffe96b';ctx.shadowBlur=18;ctx.fillStyle='#ffe96b';ctx.fillRect(x,fy-o.h,o.w,o.h);ctx.shadowBlur=0;ctx.strokeStyle='#fff7be';ctx.lineWidth=2;ctx.strokeRect(x,fy-o.h,o.w,o.h);ctx.restore();
      } else if (o.type === 'orb') {
        const cy = fy - 94 + Math.sin(time/160 + o.x)*4; ctx.save();ctx.strokeStyle='#ffe76b';ctx.lineWidth=5;ctx.shadowColor='#ffe76b';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(x+o.w/2,cy,o.w*.42,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,231,107,.22)';ctx.beginPath();ctx.arc(x+o.w/2,cy,o.w*.28,0,Math.PI*2);ctx.fill();ctx.restore();
      } else {
        ctx.fillStyle = minecraft ? '#8a5a34' : level.color; ctx.strokeStyle = '#10142d'; ctx.lineWidth = 4; ctx.fillRect(x, fy - o.h, o.w, o.h); ctx.strokeRect(x, fy - o.h, o.w, o.h); ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x+5,fy-o.h+6,8,8);
      }
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
