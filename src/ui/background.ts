import { get } from '../core/store';

interface Sq { x: number; y: number; s: number; v: number; r: number; w: number; a: number }

/** Фон: плывущие вверх полупрозрачные квадраты. Небо и земля — на CSS. */
export function startBackground() {
  const cv = document.getElementById('fx') as HTMLCanvasElement;
  const ctx = cv.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  const resize = () => {
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  addEventListener('resize', resize);
  resize();

  const spawn = (init = false): Sq => ({
    x: Math.random() * w, y: init ? Math.random() * h : h + 80,
    s: 14 + Math.random() * 52, v: 12 + Math.random() * 30,
    r: Math.random() * 6.28, w: (Math.random() - 0.5) * 0.6, a: 0.05 + Math.random() * 0.14,
  });
  const sq = Array.from({ length: 26 }, () => spawn(true));

  let last = performance.now();
  const tick = (t: number) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.clearRect(0, 0, w, h);
    if (get().settings.particles) {
      sq.forEach((p, i) => {
        p.y -= p.v * dt; p.r += p.w * dt;
        if (p.y < -80) sq[i] = spawn();
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = p.a; ctx.fillStyle = '#fff';
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.globalAlpha = p.a * 2; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.strokeRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
      });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
