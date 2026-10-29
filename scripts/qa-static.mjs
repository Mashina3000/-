import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => failures.push(message);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

for (const file of ['package.json', 'public/manifest.json']) {
  try { JSON.parse(read(file)); pass(`${file} is valid JSON`); }
  catch (error) { fail(`${file} is invalid JSON: ${error.message}`); }
}

for (const file of [
  'index.html', 'electron.cjs', 'vite.config.ts', 'src/game/index.ts',
  'public/icon.svg', 'public/favicon-16.png', 'public/favicon-32.png',
  'public/icon-192.png', 'public/icon-512.png', 'assets/icons/app-icon.ico',
  'assets/icons/app-icon.png', '.github/workflows/build-windows.yml'
]) {
  if (exists(file)) pass(`${file} exists`); else fail(`Missing required file: ${file}`);
}

const manifest = JSON.parse(read('public/manifest.json'));
for (const icon of manifest.icons ?? []) {
  const file = path.join('public', icon.src.replace(/^\.\//, ''));
  if (exists(file)) pass(`manifest icon exists: ${file}`); else fail(`Manifest points to missing icon: ${file}`);
}

const html = read('index.html');
for (const expected of ['icon.svg', 'favicon-32.png', 'favicon-16.png', 'manifest.json']) {
  if (html.includes(expected)) pass(`index.html references ${expected}`); else fail(`index.html does not reference ${expected}`);
}

// Verify every custom skin points to a PNG copied into Vite's public output.
const skinAssets = read('src/data/skin-assets.ts');
const skinPaths = [...skinAssets.matchAll(/src:\s*['\"](\.\/assets\/icons\/[^'\"]+\.png)['\"]/g)].map(match => match[1]);
if (skinPaths.length !== 26) fail(`Expected 26 custom skin paths, found ${skinPaths.length}`);
for (const skinPath of skinPaths) {
  const publicPath = path.join('public', skinPath.replace(/^\.\//, ''));
  if (exists(publicPath)) pass(`custom skin asset exists: ${publicPath}`);
  else fail(`Missing custom skin asset: ${publicPath}`);
}
if (skinAssets.includes("src: '/assets/icons/")) fail('Custom skin paths must be relative for Electron file:// mode');
else pass('custom skin paths are relative for Electron file:// mode');

const game = read('src/game/index.ts');
for (const [label, token] of [
  ['pause state', 'let last = 0, raf = 0, dead = false, won = false, started = false, paused = false'],
  ['platform landing collision', 'previousBottom <= top + 8'],
  ['orb single-use tracking', 'activatedOrbs.has(o)'],
  ['audio timer cleanup', 'window.clearTimeout(musicTimer)'],
  ['tutorial persistence', 'gd-custom-tutorial-seen']
]) {
  if (game.includes(token)) pass(`${label} is present`); else fail(`Missing expected game feature: ${label}`);
}

// Guard the requested white-and-purple level style against accidental regressions.
for (const [label, token] of [
  ['white level background', "ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height)"],
  ['purple platform palette', "ctx.fillStyle = '#8b2ff0'"],
  ['black circular hazards', "ctx.arc(cx, cy, o.w * .48, 0, Math.PI * 2)"],
  ['orange jump orbs', "ctx.fillStyle = '#ff9f0a'"],
  ['dashed jump trajectory', 'ctx.setLineDash([5, 9])'],
  ['spike drawing function', 'const drawSpike =']
]) {
  if (game.includes(token)) pass(`${label} is present`); else fail(`Missing level style feature: ${label}`);
}

// Ensure the Windows build workflow runs both QA and the actual application build.
const workflow = read('.github/workflows/build-windows.yml');
for (const [label, token] of [
  ['static QA workflow step', 'npm run qa:static'],
  ['TypeScript/Vite build workflow step', 'npm run build'],
  ['Windows installer workflow step', 'electron-builder --win nsis --publish never'],
  ['installer artifact upload', 'actions/upload-artifact@v4']
]) {
  if (workflow.includes(token)) pass(`${label} is configured`); else fail(`Missing workflow step: ${label}`);
}

const electron = read('electron.cjs');
if (electron.includes("'app-icon.ico'")) pass('Electron uses packaged ICO icon');
else fail('Electron icon path is not the packaged ICO file');

for (const file of ['public/favicon-16.png','public/favicon-32.png','public/icon-192.png','public/icon-512.png','assets/icons/app-icon.png']) {
  const b = fs.readFileSync(path.join(root,file));
  const valid = b.length > 24 && b[0] === 0x89 && b.toString('ascii',1,4) === 'PNG' && b.readUInt32BE(16) > 0 && b.readUInt32BE(20) > 0;
  if (valid) pass(`${file} has a valid PNG header`); else fail(`${file} is not a valid PNG`);
}
const ico = fs.readFileSync(path.join(root,'assets/icons/app-icon.ico'));
if (ico.length > 6 && ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) > 0) pass('Windows ICO header is valid');
else fail('Windows ICO header is invalid');

if (failures.length) {
  console.error('\nStatic QA failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nStatic QA passed. This does not replace TypeScript build, in-game playtesting, or Windows installer testing.');
}
