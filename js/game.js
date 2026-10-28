/* 진담 수사대 · 중국 10대 비밀 일기 — 게임 본체
   흐름: 학교를 칸 단위로 걸어 다니며 친구와 이야기(수상한 질문) → 수풀에서 헷갈이를 만나면 배틀(퀴즈로 안개 걷기 → 도장)
        → 도장 6개 → 친구와 메신저 1분 대화 → 비밀 일기 → 내 문장 → 교재 미션 → 잠긴 문이 열림 */
const APP_VERSION = 'v0.3.0 (2026.10.28)';
const KEY = 'jdm1-';

/* ───────── 저장 ───────── */
function newSave() {
  return { v: 3, name: '', look: 'girl', intro: false, x: START_POS.x, y: START_POS.y, dir: START_POS.dir, quiet: {}, due: {},
    L: { 1: 0, 2: 0, 3: 0, 4: 0 }, caught: {}, weak: {}, mastery: {}, grad: 0, candy: 3, catches: 0, pages: {}, boss: false };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(KEY)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
};
let save = Object.assign(newSave(), store.get('save', {}) || {});
if (typeof save.x !== 'number') Object.assign(save, { x: START_POS.x, y: START_POS.y, dir: START_POS.dir });
save.quiet = save.quiet || {}; save.due = save.due || {};
const set = Object.assign({ py: true, ko: true, rate: 0.85, sfx: true, bgm: true, voice: '' }, store.get('set', {}));
const persist = () => store.set('save', save);
const persistSet = () => store.set('set', set);
TTS.setRate(set.rate); TTS.setVoice(set.voice); Sound.setSfx(set.sfx); Sound.setBgm(set.bgm);

/* ───────── 도우미 ───────── */
const $ = (s, r = document) => r.querySelector(s);
const topEl = $('#top'), stage = $('#stage'), tray = $('#tray'), uiRoot = $('#ui');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nm = s => String(s).replace(/\{name\}/g, save.name || '나');
const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const speak = o => TTS.speak(typeof o === 'string' ? o : (o.say || o.zh || o.hz));
function toast(msg) { const t = el(`<div class="toast">${esc(msg)}</div>`); uiRoot.appendChild(t); setTimeout(() => t.remove(), 2300); }
const lessonOf = n => LESSONS[n - 1];
const caughtIn = n => lessonOf(n).chunks.filter(c => save.caught[c.id] && !save.weak[c.id]).length;
const weakList = () => ALL_CHUNKS.filter(c => save.weak[c.id]);
const NPC_NAME = { 1: '李明', 2: '陈晨', 3: '小雨', 4: '王浩' };
const LOOK_OF = { '李明': 'liming', '陈晨': 'chenchen', '小雨': 'xiaoyu', '王浩': 'wanghao', '진아쌤': 'teacher' };
const firstHan = s => (s.match(/[一-鿿]/) || ['?'])[0];
const sealHTML = (c, cls = '') => `<div class="seal ${cls}">${esc(firstHan(c.hz))}</div>`;
const unlocked = n => n === 1 || (n <= 4 ? save.L[n - 1] === 3 : save.L[4] === 3);

/* ───────── 입력 (터치가 기본, 키보드도 됨) ───────── */
const handlers = [];
const pushH = h => handlers.push(h);
const popH = h => { const i = handlers.lastIndexOf(h); if (i >= 0) handlers.splice(i, 1); };
function press(k) {
  Sound.init();
  const h = handlers[handlers.length - 1];
  if (h) { h(k); return; }
  if (screen === 'world') { if (k === 'A') interact(); if (k === 'START' || k === 'B') openMenu(); }
}
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
  ' ': 'A', Enter: 'A', z: 'A', Escape: 'B', x: 'B', m: 'START' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') press('A'); return; }
  const k = KEYMAP[e.key] || KEYMAP[(e.key || '').toLowerCase()]; if (!k) return; e.preventDefault();
  if (held[k] !== undefined) { if (!held[k]) { held[k] = 1; if (handlers.length) press(k); } return; }
  if (!e.repeat) press(k);
});
document.addEventListener('keyup', e => { const k = KEYMAP[e.key] || KEYMAP[(e.key || '').toLowerCase()]; if (held[k] !== undefined) held[k] = 0; });
window.addEventListener('blur', () => Object.keys(held).forEach(k => held[k] = 0));
document.addEventListener('pointerdown', () => Sound.init(), { once: true });

function navigate(root, { cols = 1, onB = null, start = -1 } = {}) {
  let idx = start;
  const items = () => [...root.querySelectorAll('.btn:not([disabled]), .big:not([disabled])')].filter(b => b.offsetParent !== null);
  const mark = () => items().forEach((b, i) => b.classList.toggle('sel', i === idx));
  const h = k => {
    const it = items(); if (!it.length) { if (k === 'B' && onB) onB(); return; }
    if (idx < 0) { idx = 0; mark(); if (k !== 'A') return; }
    if (idx >= it.length) idx = it.length - 1;
    if (k === 'up') idx = Math.max(0, idx - cols);
    else if (k === 'down') idx = Math.min(it.length - 1, idx + cols);
    else if (k === 'left') idx = Math.max(0, idx - 1);
    else if (k === 'right') idx = Math.min(it.length - 1, idx + 1);
    else if (k === 'A') { it[idx].click(); return; }
    else if (k === 'B') { if (onB) onB(); return; }
    Sound.sfx('blip'); mark(); if (it[idx].scrollIntoView) it[idx].scrollIntoView({ block: 'nearest' });
  };
  pushH(h); if (start >= 0) requestAnimationFrame(mark);
  return { stop: () => popH(h), refresh: () => { const n = items().length; if (idx >= n) idx = n - 1; mark(); } };
}

/* ───────── 대화 상자 ───────── */
function lineHTML(l) {
  if (l.t) return `<div class="t">${esc(nm(l.t))}</div>`;
  return `<div class="zh">${esc(l.zh)}</div>${set.py && l.py ? `<div class="py">${esc(l.py)}</div>` : ''}${l.ko ? `<div class="ko ${set.ko ? '' : 'hide'}">${esc(l.ko)}</div>` : ''}
    <button class="mini sp">🔊 다시 듣기</button>`;
}
function box(l) {
  return new Promise(resolve => {
    const who = l.who ? nm(l.who) : '';
    const look = l.who ? LOOK_OF[l.who] : null;
    const b = el(`<div class="box">${look ? Pic.portrait(look) : ''}<div class="body">${who ? `<div class="who">${esc(who)}</div>` : ''}${lineHTML(l)}<div class="more">▼</div></div></div>`);
    uiRoot.appendChild(b);
    const sp = b.querySelector('.sp'); if (sp) sp.onclick = e => { e.stopPropagation(); speak(l); };
    const kh = b.querySelector('.ko.hide'); if (kh) kh.onclick = e => { e.stopPropagation(); kh.classList.remove('hide'); };
    if (l.zh) speak(l);
    const tEl = b.querySelector('.t'); let typing = false, full = '';
    if (tEl) {
      full = tEl.textContent; tEl.textContent = ''; typing = true; let i = 0;
      const tick = () => { if (!typing) return; i += 2; tEl.textContent = full.slice(0, i); if (i >= full.length) typing = false; else setTimeout(tick, 20); };
      tick();
    }
    const h = k => {
      if (k !== 'A' && k !== 'B') return;
      if (typing) { typing = false; tEl.textContent = full; return; }
      popH(h); b.remove(); Sound.sfx('blip'); resolve();
    };
    pushH(h); b.onclick = () => h('A');
  });
}
async function say(lines) { for (const l of [].concat(lines)) await box(l); }

function card(html, cls = '', dimmed = true) {
  const dim = dimmed ? el('<div class="dim"></div>') : null; if (dim) uiRoot.appendChild(dim);
  const c = el(`<div class="card ${cls}">${html}</div>`); uiRoot.appendChild(c);
  c.close = () => { if (dim) dim.remove(); c.remove(); };
  return c;
}
function fade() { const f = el('<div class="fade"></div>'); document.getElementById('app').appendChild(f); setTimeout(() => f.remove(), 520); return sleep(220); }
let busy = false;
async function run(fn) { if (busy) return; busy = true; try { await fn(); } catch (e) { console.error(e); } busy = false; refresh(); }

/* ───────── 걷는 세계 (칸 이동) ───────── */
let screen = 'title';
const cv = document.createElement('canvas'); cv.id = 'world';
const ctx = cv.getContext('2d');
let TP = 40, DPR = 1, layer = null;
const MOVE_MS = 200;
const player = { x: save.x, y: save.y, dir: save.dir, fx: save.x, fy: save.y, moving: null, alt: 0 };
const npcs = NPCS.map(n => Object.assign({}, n, { ox: n.x, oy: n.y, fx: n.x, fy: n.y, moving: null, alt: 0, next: performance.now() + 2000 + Math.random() * 3000 }));
const held = { up: 0, down: 0, left: 0, right: 0 };
let path = [], pendingAct = null, tapMark = null, pop = null, stepsSince = 10, lastBump = 0;

const npcVisible = n => n.kind === 'gate' ? save.L[n.gate] < 3 : true;
const tileAt = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? 'T' : MAP[y][x];
const buildingAt = (x, y) => BUILDINGS.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
const npcAt = (x, y) => npcs.find(n => npcVisible(n) && ((n.x === x && n.y === y) || (n.moving && n.moving.tx === x && n.moving.ty === y)));
const isBush = t => '1234'.includes(t);
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function solid(x, y) { const t = tileAt(x, y); return 'T~FGS'.includes(t) || !!buildingAt(x, y); }
function blocked(x, y, self) {
  if (solid(x, y)) return true;
  const n = npcAt(x, y); if (n && n !== self) return true;
  if (self && self !== player && ((player.x === x && player.y === y) || (player.moving && player.moving.tx === x && player.moving.ty === y))) return true;
  return false;
}
function zoneName(x = player.x, y = player.y) {
  if (y >= 22) return '정문 광장';
  if (y >= 13) return x <= 15 ? '교실동 앞' : '운동장';
  return x <= 15 ? '기숙사 · 도서관' : '매점 앞';
}

/* 크기 맞추기 + 고정 배경 그리기 */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  TP = w / (w < 520 ? 9 : 11);
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  buildLayer();
}
window.addEventListener('resize', () => { if (screen === 'world') resize(); });
function rnd(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function buildLayer() {
  const u = TP * DPR;
  layer = document.createElement('canvas'); layer.width = Math.ceil(MAP_W * u); layer.height = Math.ceil(MAP_H * u);
  const g = layer.getContext('2d');
  const each = (fn) => { for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) fn(x, y, MAP[y][x]); };
  const C = (x, y) => [(x + .5) * u, (y + .5) * u];
  const circ = (cx, cy, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
  const r = rnd(7);
  // 풀밭
  g.fillStyle = '#e4f4d0'; g.fillRect(0, 0, layer.width, layer.height);
  each((x, y) => { for (let i = 0; i < 3; i++) { g.fillStyle = i ? '#d3ecbc' : '#f1fae6'; g.beginPath(); g.ellipse((x + r()) * u, (y + r()) * u, u * .07, u * .04, 0, 0, 7); g.fill(); } });
  // 운동장
  g.fillStyle = '#f6d6ae'; g.beginPath(); g.roundRect(18 * u, 13 * u, 12 * u, 4 * u, u * 1.6); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = u * .08; g.beginPath(); g.roundRect(18.5 * u, 13.5 * u, 11 * u, 3 * u, u * 1.3); g.stroke();
  g.beginPath(); g.moveTo(24 * u, 13.5 * u); g.lineTo(24 * u, 16.5 * u); g.stroke();
  // 길 (둥글게 이어서)
  const isPath = (x, y) => tileAt(x, y) === '=' || (tileAt(x, y) === 'G');
  [['#ecd2ab', .5], ['#f8e6c8', .42]].forEach(([col, rr]) => each((x, y) => {
    if (!isPath(x, y)) return; const [cx, cy] = C(x, y); circ(cx, cy, u * rr, col);
    g.fillStyle = col;
    if (isPath(x + 1, y)) g.fillRect(cx, cy - u * rr, u, u * rr * 2);
    if (isPath(x, y + 1)) g.fillRect(cx - u * rr, cy, u * rr * 2, u);
  }));
  // 연못
  [['#b9dcf6', .62], ['#d3ebfc', .48]].forEach(([col, rr]) => each((x, y) => { if (MAP[y][x] === '~') { const [cx, cy] = C(x, y); circ(cx, cy, u * rr, col); } }));
  // 꽃
  each((x, y) => { if (MAP[y][x] !== 'f') return; for (let i = 0; i < 3; i++) { const fx = (x + .2 + r() * .6) * u, fy = (y + .2 + r() * .6) * u, col = ['#ffadb8', '#fff', '#ffd36e'][i];
    for (let k = 0; k < 5; k++) circ(fx + Math.cos(k * 1.26) * u * .07, fy + Math.sin(k * 1.26) * u * .07, u * .06, col); circ(fx, fy, u * .04, '#f2a03b'); } });
  // 수풀 (과마다 꽃 색이 다름)
  const BUSH = { 1: ['#9fd88a', '#ffadb8'], 2: ['#8fd3a8', '#ffd36e'], 3: ['#a8d98a', '#ffffff'], 4: ['#97cf9f', '#c8b4f0'] };
  each((x, y) => { const t = MAP[y][x]; if (!isBush(t)) return; const [cx, cy] = C(x, y); circ(cx, cy + u * .08, u * .56, '#bfe3a6'); });
  each((x, y) => {
    const t = MAP[y][x]; if (!isBush(t)) return; const [base, fl] = BUSH[t]; const [cx, cy] = C(x, y);
    [[-.22, .05], [.22, .05], [0, -.15]].forEach(([dx, dy]) => circ(cx + dx * u, cy + dy * u, u * .3, base));
    circ(cx - u * .1, cy - u * .22, u * .1, 'rgba(255,255,255,.35)');
    for (let i = 0; i < 3; i++) circ(cx + (r() - .5) * u * .7, cy + (r() - .5) * u * .5, u * .055, fl);
  });
  // 표지판
  each((x, y) => { if (MAP[y][x] !== 'S') return; g.fillStyle = '#c99a6b'; g.fillRect((x + .45) * u, (y + .4) * u, u * .1, u * .5);
    g.fillStyle = '#e8c08f'; g.beginPath(); g.roundRect((x + .12) * u, (y + .15) * u, u * .76, u * .38, u * .08); g.fill();
    g.fillStyle = '#8a5a30'; g.font = `${u * .2}px Jua, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('📋', (x + .5) * u, (y + .34) * u); });
  // 정문
  g.fillStyle = '#ff8a7a'; g.beginPath(); g.roundRect(13.6 * u, 28.4 * u, .5 * u, 1.6 * u, u * .1); g.roundRect(17.9 * u, 28.4 * u, .5 * u, 1.6 * u, u * .1); g.fill();
  g.beginPath(); g.roundRect(13.3 * u, 28.2 * u, 5.4 * u, .55 * u, u * .2); g.fill();
  g.fillStyle = '#fff'; g.font = `bold ${u * .32}px 'Noto Sans SC', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('星光中学', 16 * u, 28.48 * u);
  // 건물
  BUILDINGS.forEach(b => {
    const x = b.x * u, y = b.y * u, w = b.w * u, h = b.h * u, dx = (b.door[0] + .5) * u;
    g.fillStyle = 'rgba(0,0,0,.06)'; g.beginPath(); g.ellipse(x + w / 2, y + h, w * .52, u * .25, 0, 0, 7); g.fill();
    g.fillStyle = b.wall; g.strokeStyle = '#e8d9c2'; g.lineWidth = u * .06; g.beginPath(); g.roundRect(x + u * .1, y + h * .38, w - u * .2, h * .62, u * .25); g.fill(); g.stroke();
    g.fillStyle = b.roof; g.beginPath(); g.moveTo(x - u * .1, y + h * .46); g.quadraticCurveTo(x + w / 2, y - h * .18, x + w + u * .1, y + h * .46); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(x + u * .3, y + h * .36); g.quadraticCurveTo(x + w / 2, y - h * .02, x + w - u * .3, y + h * .36); g.lineTo(x + w - u * .3, y + h * .3); g.quadraticCurveTo(x + w / 2, y - h * .1, x + u * .3, y + h * .3); g.fill();
    for (let wx = x + u * .5; wx < x + w - u * .8; wx += u * 1.1) { if (Math.abs(wx + u * .3 - dx) < u * .8) continue; g.fillStyle = '#cfe8ff'; g.beginPath(); g.roundRect(wx, y + h * .55, u * .6, u * .5, u * .1); g.fill(); }
    g.fillStyle = '#e0a676'; g.beginPath(); g.roundRect(dx - u * .32, y + h - u * .78, u * .64, u * .78, [u * .3, u * .3, 0, 0]); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x + w / 2 - u * 1.1, y + h * .3, u * 2.2, u * .5, u * .25); g.fill();
    g.fillStyle = '#4b3b5c'; g.font = `bold ${u * .3}px 'Noto Sans SC', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.name, x + w / 2, y + h * .3 + u * .26);
  });
  // 나무 (위에서 아래로 겹치게)
  each((x, y) => { if (MAP[y][x] !== 'T') return; const [cx, cy] = C(x, y);
    g.fillStyle = 'rgba(60,90,40,.10)'; g.beginPath(); g.ellipse(cx, cy + u * .38, u * .45, u * .14, 0, 0, 7); g.fill();
    circ(cx, cy, u * .6, '#9fd487'); circ(cx - u * .18, cy - u * .2, u * .26, '#bfe6a6'); });
}

/* 그리기 */
function camera() {
  const vw = cv.width / DPR / TP, vh = cv.height / DPR / TP;
  const cx = player.fx + .5 - vw / 2, cy = player.fy + .5 - vh / 2;
  return [Math.max(0, Math.min(MAP_W - vw, cx)), Math.max(0, Math.min(MAP_H - vh, cy))];
}
function frameOf(o, now) { if (!o.moving) return 0; const p = (now - o.moving.t0) / MOVE_MS; return p < .5 ? (o.alt ? 1 : 2) : 0; }
function drawWorld(now) {
  if (!layer) return;
  const u = TP * DPR, [cx, cy] = camera();
  ctx.fillStyle = '#cfe9b8'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(layer, -cx * u, -cy * u);
  const S = (x, y) => [(x - cx) * u, (y - cy) * u];
  // 잠긴 대나무 문
  npcs.filter(n => n.kind === 'gate' && npcVisible(n)).forEach(n => {
    const [x, y] = S(n.x, n.y);
    ctx.fillStyle = '#9ccf7e'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(x + u * (.06 + i * .23), y + u * .05, u * .18, u * .9, u * .08); ctx.fill(); }
    ctx.fillStyle = '#7fb866'; ctx.fillRect(x, y + u * .3, u, u * .08); ctx.fillRect(x, y + u * .65, u, u * .08);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + u * .5, y + u * .5, u * .26, 0, 7); ctx.fill();
    ctx.font = `${u * .3}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔒', x + u * .5, y + u * .52);
  });
  // 누른 곳 표시
  if (tapMark && now - tapMark.t < 600) { const [x, y] = S(tapMark.x, tapMark.y); ctx.strokeStyle = `rgba(255,170,90,${1 - (now - tapMark.t) / 600})`; ctx.lineWidth = u * .06; ctx.beginPath(); ctx.ellipse(x + u / 2, y + u * .8, u * .35, u * .15, 0, 0, 7); ctx.stroke(); }
  // 사람 (아래쪽이 앞)
  const people = npcs.filter(n => n.kind !== 'gate').concat([Object.assign(player, { look: save.look })]).sort((a, b) => a.fy - b.fy);
  people.forEach(o => {
    const [x, y] = S(o.fx, o.fy);
    if (x < -u || y < -2 * u || x > cv.width + u || y > cv.height + u) return;
    const im = Picimg(o.look, o.dir, frameOf(o, now));
    const w = u * .95, h = w * 122 / 60;
    if (im.complete && im.naturalWidth) ctx.drawImage(im, x + (u - w) / 2, y + u - h + u * .05, w, h);
    const tx = Math.round(o.fx), ty = Math.round(o.fy);
    if (isBush(tileAt(tx, ty))) {   // 수풀에 서 있으면 다리가 가려짐
      const [bx, by] = S(tx, ty); const col = { 1: '#9fd88a', 2: '#8fd3a8', 3: '#a8d98a', 4: '#97cf9f' }[tileAt(tx, ty)];
      ctx.fillStyle = col; [[.25, .82], [.5, .78], [.75, .82]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(bx + a * u, by + b * u, u * .24, 0, 7); ctx.fill(); });
    }
  });
  // 이야기 친구 머리 위 표시
  npcs.forEach(n => {
    if (!n.lesson || !save.intro) return;
    const st = save.L[n.lesson]; if (!unlocked(n.lesson) || st === 3 || (st === 1 && caughtIn(n.lesson) < 6)) return;
    const [x, y] = S(n.fx, n.fy); const by = y - u * 1.15 + Math.sin(now / 220) * u * .06;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = u * .06; ctx.beginPath(); ctx.arc(x + u / 2, by, u * .26, 0, 7); ctx.fill(); ctx.stroke();
    ctx.font = `${u * .3}px Jua, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8574f'; ctx.fillText(st === 0 ? '!' : '💬', x + u / 2, by + u * .02);
  });
  // 바스락! (수풀에서 무언가 나올 때)
  if (pop) {
    const [x, y] = S(player.fx, player.fy), t = Math.min(1, (now - pop) / 300);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#4b3b5c'; ctx.lineWidth = u * .04;
    ctx.beginPath(); ctx.roundRect(x - u * .2, y - u * 1.6 - t * u * .1, u * 1.4, u * .5, u * .25); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4b3b5c'; ctx.font = `${u * .26}px Jua, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('바스락!', x + u * .5, y - u * 1.35 - t * u * .1);
  }
}
const Picimg = (look, dir, frame) => Pic.personImg(look, { dir, frame });
/* 미리 그림 불러오기 */
function preload() { ['boy', 'girl', 'teacher', 'guard', 'liming', 'chenchen', 'xiaoyu', 'wanghao', 'kid', 'kid2'].forEach(l => ['down', 'up', 'left', 'right'].forEach(d => [0, 1, 2].forEach(f => Picimg(l, d, f)))); }

/* 움직임 */
function startMove(o, dir) {
  const [dx, dy] = DIRV[dir]; o.dir = dir;
  if (blocked(o.x + dx, o.y + dy, o)) return false;
  o.moving = { tx: o.x + dx, ty: o.y + dy, t0: performance.now() }; o.alt ^= 1; return true;
}
function updateMover(o, now) {
  if (!o.moving) { o.fx = o.x; o.fy = o.y; return false; }
  const p = Math.min(1, (now - o.moving.t0) / MOVE_MS);
  o.fx = o.x + (o.moving.tx - o.x) * p; o.fy = o.y + (o.moving.ty - o.y) * p;
  if (p >= 1) { o.x = o.moving.tx; o.y = o.moving.ty; o.moving = null; o.fx = o.x; o.fy = o.y; return true; }
  return false;
}
const heldDir = () => ['up', 'down', 'left', 'right'].find(d => held[d]);
function dirTo(x, y) { return x > player.x ? 'right' : x < player.x ? 'left' : y > player.y ? 'down' : 'up'; }
function free() { return screen === 'world' && !busy && !handlers.length; }
function worldUpdate(now) {
  const arrived = updateMover(player, now);
  if (arrived) onArrive();
  if (!player.moving && free()) {
    let d = heldDir(), fromPath = false;
    if (d) { path = []; pendingAct = null; }
    else if (path.length) { d = dirTo(path[0][0], path[0][1]); fromPath = true; }
    if (d) {
      const [dx, dy] = DIRV[d], tx = player.x + dx, ty = player.y + dy;
      const door = BUILDINGS.find(b => b.door[0] === tx && b.door[1] === ty);
      if (door && d === 'up' && !fromPath) { player.dir = 'up'; enterDoor(door); }
      else if (startMove(player, d)) { if (fromPath) path.shift(); }
      else { player.dir = d; path = []; if (!fromPath && now - lastBump > 350) { Sound.sfx('blip'); lastBump = now; } }
    } else if (pendingAct) { const a = pendingAct; pendingAct = null; player.dir = dirTo(a.x, a.y); interactAt(a.x, a.y); }
  }
  npcs.forEach(n => {
    if (n.kind === 'gate') return;
    updateMover(n, now);
    if (n.wander && !n.moving && now > n.next && free()) {
      n.next = now + 1800 + Math.random() * 3000;
      const d = shuffle(['up', 'down', 'left', 'right'])[0], [dx, dy] = DIRV[d];
      if (Math.abs(n.x + dx - n.ox) <= 2 && Math.abs(n.y + dy - n.oy) <= 2 && !isBush(tileAt(n.x + dx, n.y + dy))) startMove(n, d); else n.dir = d;
    }
  });
}
function loop(now) {
  if (screen === 'world') { worldUpdate(now); drawWorld(now); }
  requestAnimationFrame(loop);
}

/* 누른 곳까지 길 찾기 */
function bfs(goals) {
  const key = (x, y) => x + ',' + y, goal = new Set(goals.map(([x, y]) => key(x, y)));
  if (goal.has(key(player.x, player.y))) return [];
  const prev = new Map([[key(player.x, player.y), null]]), q = [[player.x, player.y]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of Object.values(DIRV)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || blocked(nx, ny, player)) continue;
      prev.set(k, [x, y]);
      if (goal.has(k)) { const out = [[nx, ny]]; let c = [x, y]; while (c && key(...c) !== key(player.x, player.y)) { out.unshift(c); c = prev.get(key(...c)); } return out; }
      q.push([nx, ny]);
    }
  }
  return null;
}
function interesting(x, y) {
  return npcAt(x, y) || BUILDINGS.some(b => b.door[0] === x && b.door[1] === y) || 'S~G'.includes(tileAt(x, y));
}
cv.addEventListener('pointerdown', e => {
  Sound.init();
  if (!free()) return;
  const r = cv.getBoundingClientRect(), [cx, cy] = camera();
  const x = Math.floor((e.clientX - r.left) / TP + cx), y = Math.floor((e.clientY - r.top) / TP + cy);
  tapMark = { x, y, t: performance.now() };
  if (interesting(x, y)) {
    const door = BUILDINGS.find(b => b.door[0] === x && b.door[1] === y);
    const goals = door ? [[x, y + 1]] : Object.values(DIRV).map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => !solid(a, b));
    const p = bfs(goals); if (p === null) return;
    path = p; pendingAct = { x, y };
  } else if (!blocked(x, y, player)) { const p = bfs([[x, y]]); if (p) { path = p; pendingAct = null; } }
});

function onArrive() {
  save.x = player.x; save.y = player.y; save.dir = player.dir; persist();
  stepsSince++;
  updateTop();
  const t = tileAt(player.x, player.y);
  if (!isBush(t)) return;
  const z = +t;
  if (save.L[z] < 1) {
    if (!save.quiet[z]) { save.quiet[z] = 1; persist(); path = []; run(() => say({ t: `수풀이 조용하다…\n먼저 ${NPC_NAME[z]}과 이야기해 보자!` })); }
    return;
  }
  // 오답 카드 헷갈이는 몇 걸음 뒤 꼭 다시 나타남
  let forced = null;
  lessonOf(z).chunks.forEach(c => { if (save.weak[c.id]) { save.due[c.id] = Math.max(0, (save.due[c.id] ?? 4) - 1); if (save.due[c.id] === 0 && !forced) forced = c; } });
  const rate = caughtIn(z) < 6 ? .22 : .12;
  if (forced || (stepsSince >= 3 && Math.random() < rate)) {
    stepsSince = 0; path = []; pendingAct = null;
    const c = forced || pickWild(z);
    run(() => encounter(c));
  }
}
let lastWild = null;
function pickWild(z) {
  const cs = lessonOf(z).chunks;
  const w = cs.map(c => (save.weak[c.id] ? 4 : save.caught[c.id] ? 1 : 3) * (c.id === lastWild ? .2 : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cs.length; i++) { r -= w[i]; if (r <= 0) return cs[i]; }
  return cs[0];
}

/* 말 걸기 · 문 */
function interact() { if (!free() || player.moving) return; const [dx, dy] = DIRV[player.dir]; interactAt(player.x + dx, player.y + dy); }
function interactAt(x, y) {
  const n = npcAt(x, y);
  if (n) { if (n.kind !== 'gate') n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir]; run(() => talk(n)); return; }
  const door = BUILDINGS.find(b => b.door[0] === x && b.door[1] === y);
  if (door) return enterDoor(door);
  const t = tileAt(x, y);
  if (t === 'S') return run(() => say({ t: '📋 ' + (SIGNS[x + ',' + y] || '星光中学') }));
  if (t === '~') return run(() => say([{ t: '연못 속에서 물고기가 헤엄쳐요.' }, { zh: '鱼！', py: 'yú', ko: '물고기!' }]));
  if (t === 'G') return run(() => say({ t: '星光中学 정문이야. 지금은 학교 안을 수사하자!' }));
}
function enterDoor(b) {
  run(async () => {
    Sound.sfx('door');
    if (b.id === 'lib') { if (save.L[4] === 3) return bossMeeting(); return say({ t: '图书馆 (도서관) — 문이 잠겨 있다.\n4과 사건까지 해결하면 열린대.' }); }
    await say({ t: { dorm: '宿舍 (기숙사) — 住校 학생만 들어갈 수 있대요!', shop: '小卖部 (매점) — 오늘은 문을 닫았어요.', class: '教学楼 (교실동) — 안은 午休 시간이라 조용해요… 쉿!' }[b.id] });
  });
}
async function talk(n) {
  if (n.kind === 'gate') return say([{ t: `🔒 대나무 문이 잠겨 있다.` }, { t: `${n.gate}과 비밀 일기를 찾으면 열려요.\n(${NPC_NAME[n.gate]}의 사건을 해결해 보자!)` }]);
  if (n.lesson) return talkLesson(n.lesson);
  if (n.id === 'teacher') return talkTeacher();
  if (n.lines) return say(n.lines.map(l => Object.assign({ who: n.name }, l)));
}

/* ───────── 위·아래 막대 ───────── */
function questText() {
  for (let n = 1; n <= 4; n++) {
    const st = save.L[n], L = lessonOf(n);
    if (st === 3) continue;
    if (st === 0) return `🎯 ${n}과 · ${NPC_NAME[n]} 만나러 가자`;
    if (caughtIn(n) < 6) return `🌿 ${n}과 · ${L.zone.replace('풀숲', '수풀')}에서 헷갈이 찾기`;
    return `💬 ${n}과 · ${NPC_NAME[n]}에게 가서 대화하기`;
  }
  if (!save.boss) return '📚 도서관(图书馆)에서 중간 수사 회의!';
  const w = weakList().length;
  return w ? `🃏 오답 카드 ${w}장 — 수풀에서 다시 만나요` : '🎉 1~4과 수사 완료!';
}
function curLesson() { for (let n = 1; n <= 4; n++) if (save.L[n] < 3) return n; return 0; }
function updateTop() {
  if (screen !== 'world') return;
  topEl.innerHTML = `<span style="font-size:6.4cqw">🔍</span><div class="ttl">진담 수사대<small>${esc(zoneName())}</small></div>
    <span class="chip">💡 ${save.candy}</span><button class="ib" data-a="menu">☰</button>`;
  topEl.querySelector('[data-a="menu"]').onclick = () => openMenu();
}
function drawTray() {
  if (screen !== 'world') return;
  const no = curLesson();
  const seals = no ? lessonOf(no).chunks.map(c => (save.caught[c.id] && save.weak[c.id] === undefined) ? `<div data-id="${c.id}">${sealHTML(c)}</div>` : `<div class="slot" data-id="${c.id}">${save.weak[c.id] ? '!' : '?'}</div>`).join('') : '';
  tray.innerHTML = `<div class="notebook"><div class="nb-head"><span>${esc(questText())}</span>${no ? `<span>도장 ${caughtIn(no)}/6</span>` : ''}</div>
    ${no ? `<div class="seals">${seals}</div>` : ''}</div>`;
}
function refresh() { updateTop(); drawTray(); }
function enterWorld() {
  screen = 'world'; Sound.bgm('map');
  stage.innerHTML = ''; stage.appendChild(cv);
  refresh(); requestAnimationFrame(resize);
}

/* 이야기 장면 그림 (과 시작할 때 위쪽에 보여 줌) */
async function withPicture(no, fn) {
  const p = el(`<div class="storypic">${Pic.scene(no)}</div>`); uiRoot.appendChild(p);
  try { await fn(); } finally { p.remove(); }
}
async function startLesson(no) {
  await withPicture(no, () => say(lessonOf(no).intro));
  save.L[no] = 1; persist(); drawTray();
  await say({ t: `🌿 ${lessonOf(no).zone.replace('풀숲', '수풀')}에 헷갈이 6마리가 단서 쪽지를 들고 숨어 있어요.\n수풀을 걸어 다니다 헷갈이를 만나면, 중국어로 안개를 걷어 내요!` });
}
async function talkLesson(no) {
  const L = lessonOf(no), st = save.L[no];
  if (st === 0) return startLesson(no);
  if (st === 1 && caughtIn(no) < 6) return say([Object.assign({ who: NPC_NAME[no] }, L.waiting), { t: `도장이 아직 ${6 - caughtIn(no)}개 남았어요. 수풀을 더 찾아보자!` }]);
  if (st < 3) {
    save.L[no] = 2; persist();
    await say(Object.assign({}, L.battleStart, { who: NPC_NAME[no] }));
    const r = await chat(L.npc, NPC_NAME[no], L.battle);
    await rewards(no, r);
    return;
  }
  return say(Object.assign({ who: NPC_NAME[no] }, L.after));
}
async function talkTeacher() {
  const w = weakList().length;
  const lines = [{ who: '진아쌤', t: '지금 할 일: ' + questText().replace(/^\S+\s/, '') }];
  if (w) lines.push({ who: '진아쌤', t: `오답 카드가 ${w}장 있어. 수풀에서 다시 만나면 꼭 이기자! 메뉴(☰) → 오답 카드에서 바로 풀 수도 있어.\n틀려도 괜찮아, 모른 채 지나가지만 않으면 돼.` });
  if (save.boss) lines.push({ who: '진아쌤', t: '5~8과 비밀 일기는 다음 업데이트에서 이어져요.' });
  lines.push({ who: '진아쌤', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' });
  await say(lines);
}

/* ───────── 퀴즈 ───────── */
function quizType(c) {
  if (save.weak[c.id]) return shuffle(['k2z', 'fill'])[0];
  const m = save.mastery[c.id] || 0;
  if (m === 0) return shuffle(['k2z', 'z2k', 'listen'])[0];
  if (m === 1) return shuffle(['listen', 'fill'])[0];
  return shuffle(['fill', 'order'])[0];
}
function distractors(c, n = 3) {
  const avoid = new Set([c.id].concat(c.avoid || []));
  let pool = lessonOf(c.lesson).chunks.filter(x => !avoid.has(x.id));
  if (pool.length < n) pool = pool.concat(ALL_CHUNKS.filter(x => !avoid.has(x.id) && x.lesson !== c.lesson));
  return shuffle(pool).slice(0, n);
}
const exText = c => c.ex.join('') + (c.end || '');
function quiz(c, type = quizType(c), opt = {}) {
  return new Promise(resolve => {
    const opts = shuffle([c].concat(distractors(c)));
    const NAME = { k2z: '뜻 → 중국어', z2k: '중국어 → 뜻', listen: '듣고 고르기', fill: '빈칸 채우기', order: '문장 조립' };
    const head = `<div class="qhead"><span>${opt.inBattle ? '🗣' : '🃏'} ${NAME[type]}</span><button class="mini hintb" style="margin:0">💡 힌트 ${save.candy}</button></div>`;
    const hzBtn = o => `<button class="btn" data-id="${o.id}"><span class="bz">${esc(o.hz)}</span>${set.py && type !== 'listen' ? `<span class="bp">${esc(o.py)}</span>` : ''}</button>`;
    let main = '', optHTML = '';
    if (type === 'k2z') { main = `<div class="bigtxt">"${esc(c.ko)}"</div><div class="small">알맞은 중국어 덩어리를 골라요</div>`; optHTML = opts.map(hzBtn).join(''); }
    if (type === 'z2k') { main = `<div class="zh">${esc(c.hz)}</div>${set.py ? `<div class="py">${esc(c.py)}</div>` : ''}<button class="mini sp">🔊 듣기</button>`; optHTML = opts.map(o => `<button class="btn" data-id="${o.id}">${esc(o.ko)}</button>`).join(''); }
    if (type === 'listen') { main = `<button class="speak sp">🔊</button><div class="small">잘 듣고 알맞은 덩어리를 골라요${TTS.ok ? '' : `<br>(소리가 안 나요: ${esc(c.py)})`}</div>`; optHTML = opts.map(hzBtn).join(''); }
    if (type === 'fill') {
      const parts = exText(c).split(c.hz);
      main = `<div class="sent">${esc(parts[0])}<span class="blank">？</span>${esc(parts.slice(1).join(c.hz))}</div><div class="ko">${esc(c.exKo)}</div>`;
      optHTML = opts.map(hzBtn).join('');
    }
    if (type === 'order') main = `<div class="ko" style="font-size:4.2cqw">"${esc(c.exKo)}"</div><div class="small">조각을 순서대로 눌러 문장을 만들어요</div><div class="tiles ans"></div><div class="tiles pool"></div>`;
    const p = card(`${head}<div class="qmain">${main}</div>${optHTML ? `<div class="opts c2">${optHTML}</div>` : ''}`, opt.inBattle ? 'clue-card low' : 'clue-card', !opt.inBattle);
    const sp = p.querySelector('.sp'); if (sp) sp.onclick = () => speak(c);
    if (type === 'z2k' || type === 'listen') speak(c);
    let done = false, nav;
    const end = ok => { if (done) return; done = true; Sound.sfx(ok ? 'good' : 'bad'); setTimeout(() => { nav.stop(); p.close(); resolve(ok); }, ok ? 600 : 1100); };
    const hint = p.querySelector('.hintb');
    const useCandy = () => { if (save.candy <= 0) { toast('힌트 사탕이 없어요'); return false; } save.candy--; persist(); hint.textContent = `💡 힌트 ${save.candy}`; Sound.sfx('sel'); return true; };
    if (type !== 'order') {
      p.querySelectorAll('.opts .btn').forEach(b => b.onclick = () => {
        if (done) return;
        const ok = b.dataset.id === c.id;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) p.querySelector(`.opts .btn[data-id="${c.id}"]`).classList.add('right');
        end(ok);
      });
      hint.onclick = () => {
        const wrong = [...p.querySelectorAll('.opts .btn')].filter(b => b.dataset.id !== c.id && !b.disabled);
        if (wrong.length < 2 || !useCandy()) return;
        shuffle(wrong).slice(0, 2).forEach(b => b.disabled = true); nav.refresh();
      };
    } else {
      const ansEl = p.querySelector('.tiles.ans'), poolEl = p.querySelector('.tiles.pool');
      const toks = c.ex.map((t, i) => ({ t, i }));
      let shuffled = shuffle(toks), tries = 0;
      while (shuffled.every((tk, i) => tk.i === i) && tries++ < 10) shuffled = shuffle(toks);
      let placed = [];
      const check = () => {
        if (placed.length < toks.length) return;
        const ok = placed.map(t => t.t).join('') === c.ex.join('');
        ansEl.querySelectorAll('.btn').forEach(b => b.classList.add(ok ? 'right' : 'wrong'));
        if (!ok) ansEl.insertAdjacentHTML('afterend', `<div class="say center">정답: ${esc(exText(c))}</div>`);
        end(ok);
      };
      const draw = () => {
        ansEl.innerHTML = ''; poolEl.innerHTML = '';
        placed.forEach((tk, k) => { const b = el(`<button class="btn tile">${esc(tk.t)}</button>`); b.onclick = () => { if (done) return; placed.splice(k, 1); Sound.sfx('blip'); draw(); }; ansEl.appendChild(b); });
        shuffled.filter(tk => !placed.includes(tk)).forEach(tk => { const b = el(`<button class="btn tile">${esc(tk.t)}</button>`); b.onclick = () => { if (done) return; placed.push(tk); Sound.sfx('pop'); draw(); check(); }; poolEl.appendChild(b); });
        if (nav) nav.refresh();
      };
      hint.onclick = () => {
        let k = 0; while (k < placed.length && placed[k].i === k) k++;
        if (k >= toks.length || !useCandy()) return;
        placed = placed.slice(0, k); placed.push(toks[k]); draw(); check();
      };
      draw();
    }
    nav = navigate(p, { cols: type === 'order' ? 1 : 2 });
  });
}

/* 덩어리 카드 (도장 받았을 때 / 놓쳤을 때) */
function chunkCard(c, kind) {
  return new Promise(resolve => {
    const badges = [c.gram ? `<span class="badge y">${esc(c.gram)}</span>` : '', c.word ? '<span class="badge">덩어리 단어</span>' : '',
      kind === 'grad' ? '<span class="badge g">🎓 오답 카드 졸업!</span>' : '', kind === 'new' ? '<span class="badge g">🗂 사건 파일에 도장 쾅!</span>' : '',
      kind === 'miss' ? '<span class="badge r">🃏 오답 카드에 적었어요</span>' : ''].join('');
    const p = card(`<div class="center">
      ${kind === 'miss' ? '<div style="font-size:12cqw">🍃</div>' : `<div class="bigseal">${sealHTML(c, 'new')}</div>`}
      <div>${badges}</div>
      <div class="zh" style="font-size:7.4cqw">${esc(c.hz)}</div><div class="py">${esc(c.py)}</div><div class="ko">${esc(c.ko)}</div>
      <div class="ex"><div class="zh">${esc(exText(c))}</div>${set.py ? `<div class="py">${esc(c.exPy)}</div>` : ''}<div class="ko">${esc(c.exKo)}</div></div>
      <div class="say">${kind === 'miss' ? '정답을 소리 내어 따라 말해 보세요. 헷갈이를 다시 만나면 꼭 이겨요!' : '说出来！ 소리 내어 따라 말해 보세요.'}</div>
      <div class="row"><button class="btn s1">🔊 덩어리</button><button class="btn s2">🔊 예문</button><button class="btn go">계속 ▶</button></div></div>`);
    p.querySelector('.s1').onclick = () => speak(c);
    p.querySelector('.s2').onclick = () => TTS.speak(c.exSay || exText(c));
    const nav = navigate(p, { start: 2 });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.close(); resolve(); };
    if (kind !== 'miss') Sound.sfx('stamp');
    speak(c);
  });
}


/* ───────── 수풀 배틀: 헷갈이와 말 대결 ─────────
   헷갈이(안개 요정)가 단서 쪽지를 들고 있음. 퀴즈를 맞히면 중국어 말풍선을 던져 안개를 걷어 냄.
   안개가 다 걷히면 헷갈이 → 빨간 도장 '쾅!'. 틀리면 헷갈이가 쪽지를 들고 도망(오답 카드). */
const FOG_COL = { 1: ['#e3dcf7', '#c9bdf0'], 2: ['#d6ebfb', '#b4d6f3'], 3: ['#fbdde6', '#f3bccd'], 4: ['#dff2e2', '#bfe3c6'] };
const ZONE_BG = { 1: ['#fff4e8', '#e4f4d0'], 2: ['#eef6ff', '#dff1d6'], 3: ['#fff1e6', '#f6e3cf'], 4: ['#f1ecff', '#e2ecd8'] };
const hetName = c => c.mon.replace(/몬$/, '') + ' 헷갈이';
function hetgal(c) {
  const [a, b] = FOG_COL[c.lesson] || FOG_COL[1];
  let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hat = h % 4, eye = (h >> 3) % 3;
  const eyes = eye === 0 ? `<ellipse cx="62" cy="70" rx="5" ry="7" fill="#4b3b5c"/><ellipse cx="88" cy="70" rx="5" ry="7" fill="#4b3b5c"/><circle cx="64" cy="67" r="2" fill="#fff"/><circle cx="90" cy="67" r="2" fill="#fff"/>`
    : eye === 1 ? `<path d="M56 70 Q62 63 68 70 M82 70 Q88 63 94 70" stroke="#4b3b5c" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="62" cy="70" r="7" fill="#fff" stroke="#4b3b5c" stroke-width="2"/><circle cx="88" cy="70" r="7" fill="#fff" stroke="#4b3b5c" stroke-width="2"/><circle cx="64" cy="71" r="3.4" fill="#4b3b5c"/><circle cx="90" cy="71" r="3.4" fill="#4b3b5c"/>`;
  const hats = ['', `<path d="M52 34 Q75 10 98 34 Z" fill="#ff8a7a"/><circle cx="75" cy="16" r="5" fill="#ff8a7a"/>`,
    `<path d="M75 30 Q60 6 72 4 Q80 14 75 30 Z" fill="#8fcf7a"/><path d="M76 30 Q92 10 98 18 Q88 26 76 30 Z" fill="#7cc06a"/>`,
    `<rect x="58" y="22" width="34" height="10" rx="5" fill="#7fb2ec"/><rect x="64" y="8" width="22" height="18" rx="6" fill="#7fb2ec"/>`][hat];
  return `<svg viewBox="0 0 150 150" class="het">
    <ellipse cx="75" cy="140" rx="40" ry="6" fill="#000" opacity=".08"/>
    <g class="het-body">
      <path d="M30 110 Q10 108 16 88 Q8 66 30 58 Q32 32 58 34 Q75 18 94 34 Q120 30 122 56 Q144 64 134 88 Q140 110 118 110 Q110 124 92 118 Q75 128 58 118 Q40 124 30 110 Z" fill="${a}" stroke="${b}" stroke-width="4"/>
      <circle cx="44" cy="62" r="8" fill="#fff" opacity=".6"/><circle cx="108" cy="92" r="5" fill="#fff" opacity=".5"/>
      ${hats}${eyes}
      <ellipse cx="52" cy="82" rx="7" ry="4" fill="#ffadb8" opacity=".8"/><ellipse cx="98" cy="82" rx="7" ry="4" fill="#ffadb8" opacity=".8"/>
      <path d="M66 84 Q75 92 84 84" stroke="#4b3b5c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="75" cy="104" r="13" fill="#fff" opacity=".9"/><text x="75" y="110" text-anchor="middle" font-size="16" font-weight="700" fill="#4b3b5c" class="zh-svg">${esc(firstHan(c.hz))}</text>
      <g class="het-note" transform="translate(118,96) rotate(12)"><rect x="-12" y="-10" width="24" height="20" rx="2" fill="#fff6c8" stroke="#d9b48a" stroke-width="1.5"/><text x="0" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#b07a45">?</text></g>
    </g></svg>`;
}

function encounter(c) {
  return new Promise(async resolve => {
    lastWild = c.id;
    const wasWeak = !!save.weak[c.id], wasCaught = !!save.caught[c.id];
    const fresh = !wasCaught || wasWeak;
    let hp = fresh ? 2 : 1;
    const [bg1, bg2] = ZONE_BG[c.lesson] || ZONE_BG[1];
    pop = performance.now(); Sound.sfx('paper'); await sleep(650); pop = null;
    Sound.bgm('chat'); Sound.sfx('wind');
    const B = el(`<div class="battle" style="--bg1:${bg1};--bg2:${bg2}">
      <div class="b-head"><span>🌿 ${esc(zoneName())} 수풀</span><span class="fog">안개 ${'<i class="on"></i>'.repeat(hp)}</span></div>
      <div class="b-stage">
        <div class="b-bush l"></div><div class="b-bush r"></div><div class="b-vs"><div class="seal">查</div></div>
        <div class="b-me"><svg viewBox="0 0 60 122">${Pic.person(save.look, { dir: 'right' })}</svg></div>
        <div class="b-foe">${hetgal(c)}<div class="b-tag">${esc(hetName(c))}<small>${c.lesson}과 · ${wasWeak ? '🃏 오답 카드' : wasCaught ? '복습' : '✨ 처음 만남'}</small></div></div>
        <div class="b-fx"></div>
      </div>
      <div class="b-panel"><div class="b-msg"></div><div class="b-cmd"></div></div></div>`);
    uiRoot.appendChild(B);
    const msgEl = B.querySelector('.b-msg'), cmd = B.querySelector('.b-cmd'), foe = B.querySelector('.b-foe'), fx = B.querySelector('.b-fx'), me = B.querySelector('.b-me');
    const msg = async (t, wait = 900) => { msgEl.textContent = nm(t); await sleep(wait); };
    const choose = (labels) => new Promise(res => {
      cmd.innerHTML = labels.map((l, i) => `<button class="btn" data-i="${i}">${l}</button>`).join('');
      const nav = navigate(cmd, { cols: 2, start: 0 });
      cmd.querySelectorAll('.btn').forEach(b => b.onclick = () => { nav.stop(); cmd.innerHTML = ''; Sound.sfx('sel'); res(+b.dataset.i); });
    });
    const close = () => { B.classList.add('out'); setTimeout(() => B.remove(), 350); Sound.bgm('map'); };
    await sleep(500);
    await msg(wasWeak ? `또 만났다! 오답 카드의 ${hetName(c)}!` : wasCaught ? `${hetName(c)}이 다시 나타났다! 복습 대결!` : `수풀에서 ${hetName(c)}이 쪽지를 들고 튀어나왔다!`, 1100);
    let firstType = null;
    while (hp > 0) {
      msgEl.textContent = hp === 2 ? '중국어로 안개를 걷어 내자!' : (fresh ? '한 번 더! 안개가 조금 남았어.' : '중국어로 안개를 걷어 내자!');
      const k = await choose(['🗣 중국어로 맞서기', '🏃 수풀로 돌아가기']);
      if (k === 1) {
        await msg('살금살금… 수풀로 돌아왔다.', 700);
        if (wasWeak) save.due[c.id] = 2;
        persist(); close(); resolve(); return;
      }
      let type = quizType(c);
      if (firstType && type === firstType) type = ({ k2z: 'listen', z2k: 'k2z', listen: 'fill', fill: (save.mastery[c.id] || 0) >= 1 ? 'order' : 'k2z', order: 'fill' })[type];
      firstType = type;
      B.classList.add('q');
      const ok = await quiz(c, type, { inBattle: true });
      B.classList.remove('q');
      if (ok) {
        // 말풍선 던지기
        const bub = el(`<div class="b-shot">${esc(c.hz)}</div>`); fx.appendChild(bub);
        me.classList.add('throw'); speak(c);
        requestAnimationFrame(() => bub.classList.add('go'));
        await sleep(650); bub.remove(); me.classList.remove('throw');
        foe.classList.add('hit'); Sound.sfx('good');
        for (let i = 0; i < 6; i++) fx.appendChild(el(`<i class="puff" style="--a:${i * 60}deg"></i>`));
        setTimeout(() => { fx.querySelectorAll('.puff').forEach(p => p.remove()); foe.classList.remove('hit'); }, 700);
        hp--; const fogs = B.querySelectorAll('.fog i.on'); if (fogs.length) fogs[fogs.length - 1].classList.remove('on');
        await msg(hp ? '말이 통했다! 안개가 조금 걷혔다.' : '말이 통했다! 안개가 모두 걷혔다!', 900);
      } else {
        foe.classList.add('giggle'); Sound.sfx('bad');
        await msg('헷갈이가 키득키득 웃는다…', 900);
        foe.classList.add('run'); Sound.sfx('wind');
        await msg(`${hetName(c)}이 쪽지를 들고 수풀로 도망갔다!`, 1000);
        save.weak[c.id] = 1; save.due[c.id] = 4; save.mastery[c.id] = Math.max(0, (save.mastery[c.id] || 0) - 1); persist();
        await chunkCard(c, 'miss');
        await msg('🃏 오답 카드에 적었어. 수풀을 몇 걸음 걸으면 다시 나타날 거야!', 1400);
        close(); drawTray(); resolve(); return;
      }
    }
    // 이김 → 도장 쾅!
    foe.classList.add('vanish');
    await sleep(350);
    const st = el(`<div class="b-stamp">${sealHTML(c)}<b>쾅!</b></div>`); fx.appendChild(st); Sound.sfx('stamp');
    await sleep(900);
    save.caught[c.id] = (save.caught[c.id] || 0) + 1;
    save.mastery[c.id] = (save.mastery[c.id] || 0) + 1;
    let kind = wasCaught && !wasWeak ? 'again' : 'new';
    if (wasWeak) { delete save.weak[c.id]; delete save.due[c.id]; save.grad++; kind = 'grad'; }
    if (fresh) { save.catches++; if (save.catches % 3 === 0) { save.candy++; toast('💡 힌트 사탕 +1'); } }
    persist();
    await msg(kind === 'grad' ? '오답 카드 졸업! 🎓 헷갈이가 도장으로 바뀌었다!' : '헷갈이가 도장으로 바뀌었다!', 700);
    await chunkCard(c, kind);
    close(); drawTray();
    const no = c.lesson;
    if (save.L[no] === 1 && caughtIn(no) === 6) {
      save.L[no] = 2; persist(); drawTray();
      await sleep(350);
      await say({ t: `🗂 도장 6개를 모두 모았다!\n${NPC_NAME[no]}에게 돌아가서 대화해 보자.` });
    }
    resolve();
  });
}
async function weakDrill() {
  const list = weakList();
  if (!list.length) return say({ t: '오답 카드가 없어요. 아주 좋아요! 👍' });
  await say({ t: `🃏 오답 카드 ${list.length}장을 다시 풀어요. 맞히면 졸업!` });
  for (const c of list) {
    const ok = await quiz(c);
    if (ok) { delete save.weak[c.id]; delete save.due[c.id]; save.grad++; save.caught[c.id] = (save.caught[c.id] || 0) + 1; save.mastery[c.id] = (save.mastery[c.id] || 0) + 1; persist(); await chunkCard(c, 'grad'); }
    else { persist(); await chunkCard(c, 'miss'); }
  }
  const left = weakList().length;
  await say({ t: left ? `아직 ${left}장 남았어요. 수풀에서 다시 만나요!` : '오답 카드를 모두 졸업시켰어요! 🎓' });
}

/* ───────── 메신저 대화 ───────── */
function chat(look, name, turns) {
  return new Promise(async resolve => {
    Sound.bgm('chat');
    const ph = el(`<div class="phone"><div class="ph-top">${Pic.portrait(look)}<div class="nm">${esc(name)}<small>진담톡 · 1분 대화</small></div>
      <div class="gauge">${turns.map(() => '<i></i>').join('')}</div></div><div class="msgs"></div><div class="replies"></div></div>`);
    uiRoot.appendChild(ph);
    const msgs = ph.querySelector('.msgs'), reps = ph.querySelector('.replies');
    const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };
    const add = html => { const m = el(html); msgs.appendChild(m); scroll(); return m; };
    const bubble = (o, me) => {
      const m = add(`<div class="msg ${me ? 'me' : ''}"><div class="zh">${esc(o.zh)}</div>${set.py && o.py ? `<div class="py">${esc(o.py)}</div>` : ''}
        ${o.ko ? `<div class="ko ${set.ko ? '' : 'hide'}">${esc(o.ko)}</div>` : ''}<div class="sp2">🔊</div></div>`);
      m.querySelector('.sp2').onclick = () => speak(o);
      const kh = m.querySelector('.ko.hide'); if (kh) kh.onclick = () => kh.classList.remove('hide');
      Sound.sfx('pop'); speak(o);
    };
    const friend = async o => { const t = add('<div class="typing"><i></i><i></i><i></i></div>'); await sleep(700); t.remove(); bubble(o, false); await sleep(400); };
    const sys = (t, cls = '') => add(`<div class="sys ${cls}">${esc(t)}</div>`);
    sys(`${name}과 대화를 시작해요. 알맞은 말을 골라 대화를 이어 가요!`);
    let first = 0, gauge = 0;
    for (const tn of turns) {
      const opts = shuffle(tn.opts.map((o, i) => Object.assign({}, o, { right: i === 0 })));
      if (tn.type === 'reply') await friend(tn.q); else sys(`🎯 질문하기: ${tn.goal}`, 'goal');
      let tries = 0;
      while (true) {
        const pick = await new Promise(res => {
          reps.innerHTML = `<div class="lbl">${tn.type === 'reply' ? '💬 대답 고르기' : '❓ 질문 고르기'}</div>` + opts.map((o, i) => `<button class="btn" data-i="${i}" ${o.dis ? 'disabled' : ''}><span class="bz">${esc(o.zh)}</span>${set.py ? `<span class="bp">${esc(o.py)}</span>` : ''}</button>`).join('');
          const nav = navigate(reps);
          reps.querySelectorAll('.btn').forEach(b => b.onclick = () => { nav.stop(); reps.innerHTML = ''; res(opts[+b.dataset.i]); });
          scroll();
        });
        bubble(pick, true); await sleep(900);
        if (pick.right) {
          if (!tries) first++;
          ph.querySelectorAll('.gauge i')[gauge++].classList.add('on'); Sound.sfx('good');
          await friend(tn.react);
          break;
        }
        tries++; pick.dis = true; Sound.sfx('bad');
        await friend({ zh: '嗯？我不太明白……', py: 'Èng? Wǒ bú tài míngbai……', ko: '응? 잘 모르겠어…' });
        sys(tn.type === 'reply' ? `💡 ${name}의 질문: "${tn.q.ko}"\n질문에 맞는 대답을 다시 골라 봐요!` : `💡 "${tn.goal}" — 알맞은 질문을 다시 골라 봐요!`);
      }
    }
    Sound.bgm('win'); Sound.sfx('page');
    sys(`🎉 대화 성공! 한 번에 통한 말 ${first} / ${turns.length}`);
    reps.innerHTML = '<button class="big mint">대화 마치기 ▶</button>';
    const nav = navigate(reps, { start: 0 });
    reps.querySelector('.big').onclick = () => { nav.stop(); TTS.stop(); ph.remove(); Sound.bgm('map'); resolve({ first, total: turns.length }); };
    scroll();
  });
}

/* ───────── 보상: 일기 → 내 문장 → 미션 ───────── */
function pageCard(no) {
  const L = lessonOf(no), pg = L.page;
  return new Promise(resolve => {
    Sound.sfx('page');
    const p = card(`<h2>📔 비밀 일기 ${no}쪽</h2><div class="small">수상한 질문 ${no} · ${esc(L.title)}</div>
      <div class="diary"><div class="zh" style="font-size:4.8cqw">${esc(pg.zh)}</div>${set.py ? `<div class="py">${esc(pg.py)}</div>` : ''}<div class="ko">${esc(pg.ko)}</div></div>
      <div class="fact">🔎 사건 해설<br>${esc(pg.fact)}</div>
      <div class="row"><button class="btn s">🔊 일기 듣기</button><button class="btn go">다음 ▶</button></div>`);
    p.querySelector('.s').onclick = () => TTS.speak(pg.say || pg.zh);
    const nav = navigate(p, { start: 1 });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.close(); resolve(); };
  });
}
function mySentence(slots, title = '✏️ 내 문장 만들기') {
  return new Promise(resolve => {
    const pick = slots.map(() => 0); let said = 0;
    const p = card(`<h2>${title}</h2><div class="small">조각을 골라 나에게 맞는 문장을 만들고, 소리 내어 3번 말해 봐요.</div>
      <div class="slots"></div><div class="preview"></div>
      <div class="row"><button class="btn s">🔊 내 문장 듣기</button></div>
      <div class="small center" style="margin-top:2cqw">소리 내어 말할 때마다 눌러요</div>
      <div class="dots"><button class="btn dot">1</button><button class="btn dot">2</button><button class="btn dot">3</button></div>
      <div class="row"><button class="btn go" disabled>완료 ▶</button></div>`);
    const sEl = p.querySelector('.slots'), pv = p.querySelector('.preview');
    const sentence = () => slots.map((s, i) => s[pick[i]]);
    const zhOf = () => sentence().map(x => x.zh).join('');
    let nav = null;
    const draw = () => {
      sEl.innerHTML = '';
      slots.forEach((s, i) => {
        const row = el('<div class="pslot"></div>');
        s.forEach((o, j) => { const b = el(`<button class="btn ${pick[i] === j ? 'on' : ''}">${esc(o.zh)}</button>`); if (s.length === 1) b.disabled = true; b.onclick = () => { pick[i] = j; Sound.sfx('pop'); draw(); }; row.appendChild(b); });
        sEl.appendChild(row);
      });
      const s = sentence();
      pv.innerHTML = `<div class="zh" style="font-size:5cqw">${esc(zhOf())}</div><div class="py">${esc(s.map(x => x.py).join(' '))}</div><div class="ko">${esc(s.map(x => x.ko).join(' '))}</div>`;
      if (nav) nav.refresh();
    };
    draw();
    p.querySelector('.s').onclick = () => TTS.speak(sentence().map(x => x.say || x.zh).join(''));
    p.querySelectorAll('.dot').forEach(d => d.onclick = () => {
      if (d.classList.contains('on')) return;
      d.classList.add('on'); said++; Sound.sfx('sel');
      if (said >= 3) { p.querySelector('.go').disabled = false; toast('잘했어요! 입에 붙었어요 👏'); nav.refresh(); }
    });
    nav = navigate(p);
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.close(); resolve(zhOf()); };
  });
}
function missionCard(label, text, sentence) {
  return new Promise(resolve => {
    const p = card(`<h2>🎤 교재 미션</h2>
      <div class="mission"><b>${esc(label)} · ${esc(text)}</b><br><br>수업 시간에 진아쌤 앞에서 발표해요.<br>오늘 만든 문장으로 시작해 보세요!</div>
      ${sentence ? `<div class="preview"><div class="small">내 문장</div><div class="zh" style="font-size:4.8cqw">${esc(sentence)}</div></div>` : ''}
      <div class="row"><button class="btn go">좋아요 ▶</button></div>`);
    const nav = navigate(p, { start: 0 });
    p.querySelector('.go').onclick = () => { nav.stop(); p.close(); resolve(); };
  });
}
const NEXT_TIP = {
  1: '🔓 정문 광장 오른쪽 대나무 문이 열렸다!\n운동장으로 가서 陈晨을 찾아보자.',
  2: '🔓 운동장 위쪽 대나무 문이 열렸다!\n매점(小卖部) 앞에서 小雨를 찾아보자.',
  3: '🔓 매점 왼쪽 숲길의 대나무 문이 열렸다!\n기숙사(宿舍) 앞에서 王浩를 찾아보자.',
  4: '🔓 도서관(图书馆) 문이 열렸다!\n진아쌤이 중간 수사 회의를 준비하고 있대.'
};
async function rewards(no, r) {
  const L = lessonOf(no);
  await pageCard(no);
  const s = await mySentence(L.mySentence);
  await missionCard(`2권 ${no}과`, L.mission, s);
  save.L[no] = 3; save.pages[no] = { sentence: s, first: r.first, total: r.total }; save.candy += 2; persist(); drawTray();
  Sound.sfx('door');
  await say([{ t: '💡 힌트 사탕 2개를 받았다!' }, { t: NEXT_TIP[no] }]);
}

async function bossMeeting() {
  await withPicture(5, () => say(BOSS.intro));
  const r = await chat('teacher', '진아쌤', BOSS.battle);
  const s = await mySentence([
    [{ zh: '中国学生', py: 'Zhōngguó xuésheng', ko: '중국 학생들은' }],
    [{ zh: '吃完午饭', py: 'chī wán wǔfàn', ko: '점심을 다 먹고' }, { zh: '课间休息的时候', py: 'kèjiān xiūxi de shíhou', ko: '쉬는 시간에' }, { zh: '在宿舍', py: 'zài sùshè', ko: '기숙사에서' }],
    [{ zh: '趴在桌子上睡一会儿。', py: 'pā zài zhuōzi shang shuì yíhuìr.', ko: '책상에 엎드려 잠깐 자.' }, { zh: '往往去操场玩儿。', py: 'wǎngwǎng qù cāochǎng wánr.', ko: '대개 운동장에 가서 놀아.' },
     { zh: '互相发“666”。', say: '互相发六六六。', py: 'hùxiāng fā "liù liù liù".', ko: '서로 "666"을 보내.' }, { zh: '一个房间住六个人。', py: 'yí ge fángjiān zhù liù ge rén.', ko: '한 방에 여섯 명이 지내.' }]
  ], '✏️ 수사 보고서 한 줄');
  save.boss = true; save.pages.boss = { sentence: s, first: r.first, total: r.total }; persist();
  await certificate(r);
  await missionCard('2권 4과 끝', BOSS.mission, s);
  await say([{ who: '진아쌤', t: '정말 잘했어, {name}! 5~8과 비밀 일기는 다음 업데이트에서 이어져요.' }, { who: '진아쌤', t: '그동안 복습 퀴즈로 오답 카드를 모두 졸업시켜 보자!' }]);
}
function certificate(r) {
  return new Promise(resolve => {
    Sound.sfx('page');
    const n = ALL_CHUNKS.filter(c => save.caught[c.id] && !save.weak[c.id]).length;
    const p = card(`<div class="center"><h2>🏅 꼬마 수사관 인증서</h2>
      <div class="diary"><div style="font-size:6cqw">${esc(save.name || '나')}</div>
      <div class="small">교재 2권 「중국 10대 비밀 일기」 1~4과 수사 완료</div>
      <div class="row"><span class="badge g">🗂 도장 ${n}/24</span><span class="badge y">🎓 졸업한 오답 카드 ${save.grad}</span><span class="badge">💬 한 번에 통한 말 ${r.first}/${r.total}</span></div>
      <div class="small" style="margin-top:3cqw">진담중국어 · 진아쌤</div></div>
      <div class="row"><button class="btn go">다음 ▶</button></div></div>`);
    const nav = navigate(p, { start: 0 });
    p.querySelector('.go').onclick = () => { nav.stop(); p.close(); resolve(); };
  });
}

/* ───────── 메뉴 ───────── */
function openMenu() {
  if (busy) return;
  run(() => new Promise(resolve => {
    Sound.sfx('sel');
    const n = ALL_CHUNKS.filter(c => save.caught[c.id] && !save.weak[c.id]).length;
    const p = card(`<h2>☰ 수사 수첩</h2><div class="menu-list">
      <button class="btn" data-k="dex">🗂 사건 파일 (도장 ${n}/24)</button>
      <button class="btn" data-k="weak">🃏 오답 카드 ${weakList().length}장 — 다시 풀기</button>
      <button class="btn" data-k="diary">📔 비밀 일기 ${[1, 2, 3, 4].filter(k => save.pages[k]).length}/4</button>
      <button class="btn" data-k="set">⚙️ 설정</button>
      <button class="btn" data-k="x">✖ 닫기</button></div>`);
    const close = () => { nav.stop(); p.close(); };
    const nav = navigate(p, { onB: () => { close(); resolve(); }, start: 0 });
    p.querySelectorAll('.btn').forEach(b => b.onclick = async () => {
      const k = b.dataset.k; close();
      if (k === 'dex') await dexView();
      if (k === 'weak') await weakDrill();
      if (k === 'diary') await diaryView();
      if (k === 'set') await settingsView();
      resolve();
    });
  }));
}
function sub(html) {
  return new Promise(resolve => {
    const p = card(html + '<div class="row"><button class="btn back">◀ 닫기</button></div>');
    const close = () => { TTS.stop(); nav.stop(); p.close(); resolve(); };
    p.querySelector('.back').onclick = close;
    const nav = navigate(p, { onB: close });
    p.querySelectorAll('[data-say]').forEach(d => d.onclick = () => TTS.speak(d.dataset.say));
  });
}
function dexView() {
  let body = '<h2>🗂 사건 파일</h2><div class="small">도장을 누르면 소리가 나요. 교재의 \'덩어리 수첩\'과 같은 덩어리예요.</div>';
  LESSONS.forEach(L => {
    body += `<h3>${L.no}과 · ${esc(L.title)} (${caughtIn(L.no)}/6)</h3><div class="dex">${L.chunks.map(c => {
      const got = save.caught[c.id] && !save.weak[c.id];
      if (!got && !save.weak[c.id]) return `<div class="dexi"><div class="slot">?</div><div class="small">아직 못 찾았어요</div></div>`;
      return `<div class="dexi ${save.weak[c.id] ? 'weak' : ''}" data-say="${esc(c.say || c.hz)}">${got ? sealHTML(c) : '<div class="slot">!</div>'}
        <div class="zh">${esc(c.hz)}</div><div class="py">${esc(c.py)}</div><div class="ko">${esc(c.ko)}</div>${c.gram ? `<span class="badge y">${esc(c.gram)}</span>` : ''}</div>`;
    }).join('')}</div>`;
  });
  return sub(body);
}
function diaryView() {
  let body = '<h2>📔 小雨의 비밀 일기</h2>';
  LESSONS.forEach(L => {
    const pg = save.pages[L.no];
    if (!pg) { body += `<h3>${L.no}쪽 · ???</h3><div class="small">아직 찾지 못했어요.</div>`; return; }
    body += `<h3>${L.no}쪽 · ${esc(L.title)}</h3><div class="diary" data-say="${esc(L.page.say || L.page.zh)}"><div class="zh" style="font-size:4.4cqw">${esc(L.page.zh)}</div><div class="ko">${esc(L.page.ko)}</div></div>
      <div class="preview"><div class="small">✏️ 내 문장 · 🎤 ${esc(L.mission)}</div><div class="zh" style="font-size:4.4cqw">${esc(pg.sentence)}</div></div>`;
  });
  if (save.pages.boss) body += `<h3>🏅 중간 수사 회의</h3><div class="preview"><div class="zh" style="font-size:4.4cqw">${esc(save.pages.boss.sentence)}</div></div>`;
  return sub(body);
}
function settingsView() {
  return new Promise(resolve => {
    const rates = [[0.7, '느리게'], [0.85, '보통'], [1, '빠르게']];
    const p = card('');
    let nav = null, resetArm = 0;
    const draw = () => {
      p.innerHTML = `<h2>⚙️ 설정</h2>
      <div class="setrow">병음 보기 <button class="btn" data-k="py">${set.py ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">한국어 뜻 바로 보기 <button class="btn" data-k="ko">${set.ko ? '켜짐' : '눌러서 보기'}</button></div>
      <div class="setrow">중국어 읽기 빠르기 <button class="btn" data-k="rate">${(rates.find(r => r[0] === set.rate) || [0, '보통'])[1]}</button></div>
      <div class="setrow">중국어 목소리 <button class="btn" data-k="voice">${esc(set.voice || '자동')}</button></div>
      <div class="setrow">효과음 <button class="btn" data-k="sfx">${set.sfx ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">배경음악 <button class="btn" data-k="bgm">${set.bgm ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">소리 확인 <button class="btn" data-k="test">🔊 你好！</button></div>
      <div class="setrow">처음부터 다시 <button class="btn" data-k="reset">초기화</button></div>
      <div class="small">${APP_VERSION}<br>© 2026 진담중국어(전진아). All rights reserved. 무단 복사·배포·수정·판매 금지.<br>
      문의·버그 제보: <a href="https://pf.kakao.com/_jZYxmxj/chat" target="_blank" rel="noopener">카카오톡 채널</a><br>
      ※ 말하기는 스스로 소리 내어 확인하는 방식이에요. 게임이 발음을 채점하지는 않아요.</div>
      <div class="row"><button class="btn" data-k="back">◀ 닫기</button></div>`;
      p.querySelectorAll('.btn').forEach(b => b.onclick = () => act(b.dataset.k));
      if (nav) nav.refresh();
    };
    const act = k => {
      if (k === 'py') set.py = !set.py;
      if (k === 'ko') set.ko = !set.ko;
      if (k === 'rate') { const i = rates.findIndex(r => r[0] === set.rate); set.rate = rates[(i + 1) % 3][0]; TTS.setRate(set.rate); TTS.speak('你好！'); }
      if (k === 'voice') { const names = [''].concat(TTS.voices.map(v => v.name)); const i = names.indexOf(set.voice); set.voice = names[(i + 1) % names.length]; TTS.setVoice(set.voice); TTS.speak('你好！'); }
      if (k === 'sfx') { set.sfx = !set.sfx; Sound.setSfx(set.sfx); }
      if (k === 'bgm') { set.bgm = !set.bgm; Sound.setBgm(set.bgm); }
      if (k === 'test') TTS.speak('你好！').then(ok => { if (!ok) toast('중국어 음성이 안 나와요. 크롬에서 열어 보세요.'); });
      if (k === 'reset') { if (Date.now() - resetArm < 3000) { store.clear(); location.reload(); return; } resetArm = Date.now(); toast('한 번 더 누르면 모든 기록이 지워져요'); return; }
      if (k === 'back') { nav.stop(); p.close(); resolve(); return; }
      persistSet(); draw();
    };
    draw(); nav = navigate(p, { onB: () => act('back') });
  });
}

/* ───────── 타이틀 · 처음 시작 ───────── */
function titleScreen() {
  screen = 'title'; topEl.innerHTML = ''; tray.innerHTML = '';
  const has = save.intro;
  stage.innerHTML = `<div class="cover"><div class="book">
    <div class="label"><div class="k">진담중국어 교재 2권 · 1~4과</div><div class="t1">진담 수사대</div><div class="t2">中国十代 · 秘密日记</div>
    <div class="k" style="margin-top:2cqw">중국 친구의 비밀 일기를 찾아라!</div></div>
    <div class="seal" style="aspect-ratio:1">密</div>
    <div class="tb">${has ? '<button class="big" data-k="c">▶ 이어서 하기</button>' : ''}<button class="big ${has ? 'ghost' : ''}" data-k="n">${has ? '처음부터 새로' : '▶ 수사 시작'}</button></div>
    <div class="ver">${APP_VERSION} · © 2026 진담중국어</div></div></div>`;
  const nav = navigate(stage, { start: 0 });
  stage.querySelectorAll('.tb .big').forEach(b => b.onclick = () => {
    nav.stop(); Sound.init(); Sound.sfx('sel');
    if (b.dataset.k === 'n') { store.set('save', null); save = newSave(); Object.assign(player, { x: save.x, y: save.y, dir: save.dir, fx: save.x, fy: save.y, moving: null }); fade().then(() => run(newGame)); }
    else fade().then(enterWorld);
  });
}
function nameEntry() {
  return new Promise(resolve => {
    const p = card(`<h2>꼬마 수사관 등록</h2><div class="small">이름을 적고 내 모습을 골라요. 실제 이름이 아니어도 괜찮아요.</div>
      <input class="name" maxlength="8" placeholder="이름 (8글자까지)">
      <div class="row"><button class="btn" data-l="girl" style="text-align:center"><svg viewBox="0 0 60 120" width="60" height="120">${Pic.person('girl')}</svg><br>이 모습</button>
      <button class="btn" data-l="boy" style="text-align:center"><svg viewBox="0 0 60 120" width="60" height="120">${Pic.person('boy')}</svg><br>이 모습</button></div>`);
    const inp = p.querySelector('input'); setTimeout(() => { try { inp.focus(); } catch (e) {} }, 100);
    const nav = navigate(p, { cols: 2 });
    p.querySelectorAll('[data-l]').forEach(b => b.onclick = () => {
      save.name = (inp.value || '').trim().slice(0, 8) || '나'; save.look = b.dataset.l;
      nav.stop(); p.close(); resolve();
    });
  });
}
async function newGame() {
  enterWorld();
  await sleep(300);
  await say([
    { who: '진아쌤', t: '안녕! 나는 진담중국어의 진아쌤이야.' },
    { who: '진아쌤', zh: '你好！欢迎来到中国！', py: 'Nǐ hǎo! Huānyíng lái dào Zhōngguó!', ko: '안녕! 중국에 온 걸 환영해!' },
    { who: '진아쌤', t: '이번 주에 너는 중국 星光中学(별빛 중학교)에 교환학생으로 왔어. 먼저 수사관 등록부터 하자!' }
  ]);
  await nameEntry(); drawTray();
  await say([
    { who: '진아쌤', t: '반가워, {name}! 그런데 큰일이 생겼어.' },
    { who: '진아쌤', t: '중국 친구 小雨의 "비밀 일기"가 바람에 날아가 버렸대. 일기마다 "수상한 질문"이 하나씩 적혀 있어.' },
    { who: '진아쌤', t: '학교 수풀에는 쪽지를 들고 숨은 "헷갈이"들이 있어. 만나면 중국어로 안개를 걷어 내고 도장을 받아!' },
    { who: '진아쌤', t: '틀려도 괜찮아. 도망간 헷갈이는 오답 카드에 남았다가 다시 나타나. 그때 꼭 이기면 돼!' },
    { who: '진아쌤', t: '도장 6개를 모으면 중국 친구와 메신저로 1분 대화를 해 봐. 그럼 다음 길의 대나무 문이 열려.' },
    { who: '진아쌤', t: '힌트 사탕 3개를 줄게. 어려운 문제에서 💡를 누르면 도움이 돼.' },
    { who: '진아쌤', t: '가고 싶은 곳을 누르면 걸어가고, 사람을 누르면 말을 걸어. 먼저 위쪽 교실동(教学楼) 앞의 반장 李明을 찾아가 봐!' },
    { who: '진아쌤', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' }
  ]);
  save.intro = true; persist(); refresh();
}

/* 카카오톡 등 앱 안 브라우저 안내 */
if (/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp/i.test(navigator.userAgent || '')) setTimeout(() => toast('소리가 안 나면 크롬·사파리에서 열어 주세요'), 1500);

/* 확인용 */
window.__jdm = {
  get save() { return save; }, get busy() { return busy; }, get screen() { return screen; }, player, npcs, press, encounter, questText,
  tp(x, y, dir = 'down') { Object.assign(player, { x, y, fx: x, fy: y, dir, moving: null }); path = []; },
  walkTo(x, y) { const p = bfs([[x, y]]); if (p) path = p; return !!p; },
  catchAll(n) { lessonOf(n).chunks.forEach(c => { save.caught[c.id] = 1; delete save.weak[c.id]; }); if (save.L[n] === 1) save.L[n] = 2; persist(); drawTray(); }
};
preload();
requestAnimationFrame(loop);
titleScreen();
