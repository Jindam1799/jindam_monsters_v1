/* 진담 몬스터즈 — 게임 본체 */
const APP_VERSION = 'v0.1.0 (2026.10.28)';
const KEY = 'jdm1-';
const VW = 10, T = 16, SC = 3, MOVE_MS = 170;
let VH = 9;   // 세로 칸 수: 휴대폰 세로 화면이면 더 많이 보여 줌 (9~16)
function fitScreen() {
  const w = Math.min(window.innerWidth, 600);
  const avail = window.innerHeight - 200;
  VH = Math.max(9, Math.min(16, Math.floor(avail / (w / VW))));
  const scr = document.getElementById('screen');
  scr.style.aspectRatio = `${VW} / ${VH}`;
  scr.style.width = `min(100vw, 600px, calc((100dvh - 190px) * ${VW} / ${VH}))`;
  const c = document.getElementById('cv'); c.width = VW * T * SC; c.height = VH * T * SC;
  const ctx2 = c.getContext('2d'); ctx2.imageSmoothingEnabled = false;
  scr.style.setProperty('--qtop', `${Math.round((66 + bOff()) / (VH * T) * 100)}%`);
}
const bOff = () => Math.round((VH * T - 144) * 0.3);   // 배틀 화면에서 상대 쪽을 아래로 내리는 정도

/* ───────── 저장 ───────── */
function newSave() {
  return { v: 1, name: '', look: 'boy', x: START_POS.x, y: START_POS.y, dir: START_POS.dir, intro: false,
    L: { 1: 0, 2: 0, 3: 0, 4: 0 }, caught: {}, weak: {}, mastery: {}, grad: 0, candy: 3, catches: 0,
    pages: {}, boss: false, quietSeen: {} };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(KEY)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
};
let save = Object.assign(newSave(), store.get('save', {}));
const set = Object.assign({ py: true, ko: true, rate: 0.85, sfx: true, bgm: true, voice: '' }, store.get('set', {}));
const persist = () => store.set('save', save);
const persistSet = () => store.set('set', set);
TTS.setRate(set.rate); TTS.setVoice(set.voice); Sound.setSfx(set.sfx); Sound.setBgm(set.bgm);

/* ───────── 도우미 ───────── */
const $ = (s, r = document) => r.querySelector(s);
fitScreen();
const cv = $('#cv'), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
window.addEventListener('resize', () => { fitScreen(); ctx.imageSmoothingEnabled = false; });
const uiRoot = $('#ui');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nm = s => String(s).replace(/\{name\}/g, save.name || '나');
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const speak = (o) => TTS.speak(typeof o === 'string' ? o : (o.say || o.zh || o.hz));
function toast(msg) { const t = el(`<div class="toast">${esc(msg)}</div>`); uiRoot.appendChild(t); setTimeout(() => t.remove(), 2300); }
const monImg = (() => { const c = {}; return (id, sil) => c[id + sil] || (c[id + sil] = Art.monster(id, sil).toDataURL()); })();
const lessonOf = n => LESSONS[n - 1];
const caughtIn = n => lessonOf(n).chunks.filter(c => save.caught[c.id]).length;
const weakList = () => ALL_CHUNKS.filter(c => save.weak[c.id]);
const NPC_NAME = { 1: '李明', 2: '陈晨', 3: '小雨', 4: '王浩' };

/* ───────── 입력 ───────── */
const held = { up: 0, down: 0, left: 0, right: 0 };
const handlers = [];               // 맨 위 핸들러가 A/B/방향 누름을 받음
const pushH = h => handlers.push(h);
const popH = h => { const i = handlers.lastIndexOf(h); if (i >= 0) handlers.splice(i, 1); };
let lastDirPress = 0;
function press(k) {
  Sound.init();
  const h = handlers[handlers.length - 1];
  if (h) { h(k); return; }
  if (mode === 'field') {
    if (k === 'A') interact();
    if (k === 'START') openMenu();
  }
}
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
  z: 'A', ' ': 'A', Enter: 'A', x: 'B', Escape: 'B', Backspace: 'B', m: 'START', Tab: 'START' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') press('A'); return; }
  const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase && e.key.toLowerCase()];
  if (!k) return; e.preventDefault();
  if (held[k] !== undefined) { if (!held[k]) { held[k] = 1; lastDirPress = performance.now(); press(k); } }
  else if (!e.repeat) press(k);
});
document.addEventListener('keyup', e => { const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase && e.key.toLowerCase()]; if (held[k] !== undefined) held[k] = 0; });
document.querySelectorAll('#pad .pb').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); b.classList.add('on'); if (held[k] !== undefined) { held[k] = 1; lastDirPress = performance.now(); } press(k); };
  const up = e => { b.classList.remove('on'); if (held[k] !== undefined) held[k] = 0; };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
});
window.addEventListener('blur', () => Object.keys(held).forEach(k => held[k] = 0));

/* 패널 안 버튼 고르기 (방향키 + A, 터치 클릭 둘 다) */
function navigate(root, { cols = 1, onB = null, start = 0 } = {}) {
  let idx = start;
  const items = () => [...root.querySelectorAll('.btn:not([disabled])')].filter(b => b.offsetParent !== null);
  const mark = () => { const it = items(); it.forEach((b, i) => b.classList.toggle('sel', i === idx)); const s = it[idx]; if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' }); };
  const h = k => {
    const it = items(); if (!it.length) { if (k === 'B' && onB) onB(); return; }
    if (idx >= it.length) idx = it.length - 1;
    if (k === 'up') idx = Math.max(0, idx - cols);
    else if (k === 'down') idx = Math.min(it.length - 1, idx + cols);
    else if (k === 'left') idx = Math.max(0, idx - 1);
    else if (k === 'right') idx = Math.min(it.length - 1, idx + 1);
    else if (k === 'A') { it[idx].click(); return; }
    else if (k === 'B' || k === 'START') { if (onB) onB(); return; }
    Sound.sfx('blip'); mark();
  };
  pushH(h); requestAnimationFrame(mark);
  return { stop: () => popH(h), refresh: () => { idx = Math.min(idx, Math.max(0, items().length - 1)); mark(); }, set: i => { idx = i; mark(); } };
}

/* ───────── 대화 상자 ───────── */
function lineHTML(l) {
  if (l.t) return `<div class="t">${esc(nm(l.t))}</div>`;
  const ko = l.ko ? `<div class="ko ${set.ko ? '' : 'hide'}">${esc(l.ko)}</div>` : '';
  return `<div class="zh">${esc(l.zh)}</div>${set.py && l.py ? `<div class="py">${esc(l.py)}</div>` : ''}${ko}
    <div class="lineTools"><button class="mini sp">🔊 다시 듣기</button></div>`;
}
/* say: 한 줄씩 보여 주고 A(또는 화면 터치)로 넘김. options가 있으면 고른 번호를 돌려줌 */
function box(l, { options = null, cols = 1, cancel = false } = {}) {
  return new Promise(resolve => {
    const who = l.who ? nm(l.who) : '';
    const b = el(`<div class="box ${who ? 'hasWho' : ''}">${who ? `<div class="who">${esc(who)}</div>` : ''}${lineHTML(l)}</div>`);
    uiRoot.appendChild(b);
    const sp = b.querySelector('.sp'); if (sp) sp.onclick = e => { e.stopPropagation(); speak(l); };
    const kh = b.querySelector('.ko.hide'); if (kh) kh.onclick = e => { e.stopPropagation(); kh.classList.remove('hide'); };
    if (l.zh && !l.silent) speak(l);
    const tEl = b.querySelector('.t');
    let typing = false, full = '';
    if (tEl && !options) {
      full = tEl.textContent; tEl.textContent = ''; typing = true; let i = 0;
      const tick = () => { if (!typing) return; i += 2; tEl.textContent = full.slice(0, i); if (i >= full.length) { typing = false; b.appendChild(el('<div class="more">▼</div>')); } else setTimeout(tick, 22); };
      tick();
    } else if (!options) b.appendChild(el('<div class="more">▼</div>'));
    const finish = v => { popH(h); if (nav) nav.stop(); b.remove(); resolve(v); };
    let nav = null;
    const h = k => {
      if (k !== 'A' && k !== 'B') return;
      if (typing) { typing = false; tEl.textContent = full; b.appendChild(el('<div class="more">▼</div>')); return; }
      Sound.sfx('blip'); finish(0);
    };
    if (options) {
      const o = el(`<div class="opts ${cols === 2 ? 'c2' : ''}"></div>`);
      options.forEach((op, i) => {
        const bt = el(`<button class="btn">${typeof op === 'string' ? esc(op) : `<span class="bz">${esc(op.zh)}</span>${set.py && op.py ? `<span class="bp">${esc(op.py)}</span>` : ''}`}</button>`);
        if (op && op.disabled) bt.disabled = true;
        bt.onclick = e => { e.stopPropagation(); Sound.sfx('sel'); finish(i); };
        o.appendChild(bt);
      });
      b.appendChild(o);
      nav = navigate(b, { cols, onB: cancel ? () => finish(-1) : null });
    } else {
      pushH(h);
      b.onclick = () => h('A');
    }
  });
}
async function say(lines) { for (const l of [].concat(lines)) await box(l); }
const ask = (l, options, o = {}) => box(l, Object.assign({ options }, o));

/* 커다란 패널 (퀴즈·카드·메뉴) */
function panel(html, { full = false, cls = '' } = {}) {
  const p = el(`<div class="panel ${full ? 'full' : ''} ${cls}">${html}</div>`);
  uiRoot.appendChild(p); return p;
}
function flash() { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); return sleep(720); }

/* ───────── 월드 ───────── */
let mode = 'title';
const player = { x: save.x, y: save.y, dir: save.dir, fx: save.x, fy: save.y, moving: null, alt: 0 };
const npcs = NPCS.map(n => Object.assign({}, n, { ox: n.x, oy: n.y, fx: n.x, fy: n.y, moving: null, alt: 0, next: performance.now() + 2000 + Math.random() * 3000 }));
function npcVisible(n) {
  if (n.gate) return save.L[n.gate] < 3;
  return true;
}
const tileAt = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? 'T' : MAP[y][x];
const buildingAt = (x, y) => BUILDINGS.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
const npcAt = (x, y) => npcs.find(n => npcVisible(n) && ((n.x === x && n.y === y) || (n.moving && n.moving.tx === x && n.moving.ty === y)));
function blocked(x, y, self) {
  const t = tileAt(x, y);
  if ('T~FGS'.includes(t)) return true;
  if (buildingAt(x, y)) return true;
  const n = npcAt(x, y); if (n && n !== self) return true;
  if (self && self !== player && ((player.x === x && player.y === y) || (player.moving && player.moving.tx === x && player.moving.ty === y))) return true;
  return false;
}
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const isGrass = t => '1234'.includes(t);
let lastBump = 0, stepsSince = 10;

function startMove(o, dir) {
  const [dx, dy] = DIRV[dir]; o.dir = dir;
  const tx = o.x + dx, ty = o.y + dy;
  if (blocked(tx, ty, o)) return false;
  o.moving = { tx, ty, t0: performance.now() }; o.alt ^= 1;
  return true;
}
function updateMover(o, now) {
  if (!o.moving) { o.fx = o.x; o.fy = o.y; return false; }
  const p = Math.min(1, (now - o.moving.t0) / MOVE_MS);
  o.fx = o.x + (o.moving.tx - o.x) * p; o.fy = o.y + (o.moving.ty - o.y) * p;
  if (p >= 1) { o.x = o.moving.tx; o.y = o.moving.ty; o.moving = null; o.fx = o.x; o.fy = o.y; return true; }
  return false;
}
function heldDir() { for (const d of ['up', 'down', 'left', 'right']) if (held[d]) return d; return null; }

function fieldUpdate(now) {
  const arrived = updateMover(player, now);
  if (arrived) { onArrive(); if (mode !== 'field' || handlers.length) return; }
  if (!player.moving && !handlers.length && mode === 'field' && !busy) {
    const d = heldDir();
    if (d) {
      const [dx, dy] = DIRV[d];
      const tx = player.x + dx, ty = player.y + dy;
      const door = BUILDINGS.find(b => b.door[0] === tx && b.door[1] === ty);
      if (door && d === 'up') { player.dir = 'up'; enterDoor(door); return; }
      if (!startMove(player, d)) {
        player.dir = d;
        if (now - lastBump > 300) { Sound.sfx('bump'); lastBump = now; }
      }
    }
  }
  // 돌아다니는 친구
  npcs.forEach(n => {
    updateMover(n, now);
    if (n.wander && !n.moving && now > n.next && mode === 'field' && !handlers.length) {
      n.next = now + 1800 + Math.random() * 3000;
      const d = shuffle(['up', 'down', 'left', 'right'])[0];
      const [dx, dy] = DIRV[d];
      if (Math.abs(n.x + dx - n.ox) <= 2 && Math.abs(n.y + dy - n.oy) <= 2 && !isGrass(tileAt(n.x + dx, n.y + dy))) startMove(n, d); else n.dir = d;
    }
  });
}
let busy = false;
async function run(fn) { if (busy) return; busy = true; try { await fn(); } catch (e) { console.error(e); } busy = false; }

function onArrive() {
  save.x = player.x; save.y = player.y; save.dir = player.dir; persist();
  const t = tileAt(player.x, player.y);
  stepsSince++;
  if (!isGrass(t)) return;
  const z = +t;
  if (save.L[z] < 1) {
    if (!save.quietSeen[z]) { save.quietSeen[z] = 1; persist(); run(() => say({ t: `풀숲이 바스락… 하지만 아직 아무것도 나오지 않아.\n먼저 ${NPC_NAME[z]}과(와) 이야기해 보자!` })); }
    return;
  }
  // 오답 카드 몬스터는 몇 걸음 뒤 꼭 다시 나타남
  const dueList = lessonOf(z).chunks.filter(c => save.weak[c.id]);
  let forced = null;
  dueList.forEach(c => { save.weak[c.id] = Math.max(0, (save.weak[c.id] || 1) - 1); if (save.weak[c.id] <= 0 && !forced) forced = c; });
  dueList.forEach(c => { if (save.weak[c.id] <= 0) save.weak[c.id] = 0.0001; });  // 0이 되어도 목록에는 남기기
  if (forced || (stepsSince >= 3 && Math.random() < 0.16)) {
    stepsSince = 0;
    const c = forced || pickWild(z);
    run(() => wildBattle(c));
  }
}
let lastWild = null;
function pickWild(z) {
  const cs = lessonOf(z).chunks;
  const w = cs.map(c => (save.weak[c.id] ? 4 : save.caught[c.id] ? 1 : 3) * (c.id === lastWild ? 0.2 : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cs.length; i++) { r -= w[i]; if (r <= 0) return cs[i]; }
  return cs[0];
}

function facing() { const [dx, dy] = DIRV[player.dir]; return [player.x + dx, player.y + dy]; }
function interact() {
  if (busy || player.moving) return;
  const [x, y] = facing();
  const n = npcAt(x, y);
  if (n) { n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir]; run(() => talk(n)); return; }
  const door = BUILDINGS.find(b => b.door[0] === x && b.door[1] === y);
  if (door) { enterDoor(door); return; }
  const t = tileAt(x, y);
  if (t === 'S') { run(() => say({ t: '📋 ' + (SIGNS[x + ',' + y] || '星光中学') })); return; }
  if (t === '~') { run(() => say([{ t: '연못 속에서 물고기가 헤엄쳐요.' }, { zh: '鱼！', py: 'yú', ko: '물고기!' }])); return; }
  if (t === 'G') { run(() => say({ t: '星光中学 정문이야. 지금은 학교 안을 탐험하자!' })); return; }
}
function enterDoor(b) {
  run(async () => {
    Sound.sfx('door');
    if (b.id === 'lib') {
      if (save.L[4] >= 3) { await bossBattle(); return; }
      await say({ t: '图书馆 (도서관) — 문이 잠겨 있다.' }); return;
    }
    const msg = { dorm: '宿舍 (기숙사) — 住校 학생만 들어갈 수 있대요!', shop: '小卖部 (매점) — 오늘은 문을 닫았어요.', class: '教学楼 (교실동) — 午休 시간이라 조용해요… 쉿!' }[b.id];
    await say({ t: msg });
  });
}

/* ───────── 사람과 이야기 ───────── */
async function talk(n) {
  if (n.lesson) return talkLesson(n.lesson);
  if (n.gate) {
    const need = n.gate;
    if (need === 4) return say([{ who: n.name, t: '도서관은 지금 중간 수사 회의 준비 중이에요.' }, { who: n.name, t: `${NPC_NAME[4]}의 일기장(4쪽)을 찾으면 들어갈 수 있어요!` }]);
    return say([{ who: n.name, zh: '同学，请等一下！', py: 'Tóngxué, qǐng děng yíxià!', ko: '학생, 잠깐만 기다려!' },
      { who: n.name, t: `이 길은 ${need}과 일기장을 찾은 학생만 지나갈 수 있어.\n${NPC_NAME[need]}과(와) 대화 배틀을 끝내고 와!` }]);
  }
  if (n.id === 'teacher') return talkTeacher();
  if (n.id === 'guard') return say({ who: n.name, zh: '同学，欢迎来到星光中学！', py: 'Tóngxué, huānyíng lái dào Xīngguāng Zhōngxué!', ko: '학생, 星光中学에 온 걸 환영해!' });
  if (n.lines) return say(n.lines.map(l => Object.assign({ who: n.name }, l)));
}
async function talkTeacher() {
  const w = weakList().length;
  const lines = [{ who: '진아쌤', t: questText().replace(/^\S+\s/, '지금 할 일: ') }];
  if (w) lines.push({ who: '진아쌤', t: `오답 카드가 ${w}장 있어. 풀숲에서 다시 만나면 꼭 잡자! 틀려도 괜찮아, 모른 채 지나가지만 않으면 돼.` });
  if (save.boss) lines.push({ who: '진아쌤', t: '1~4과 수사 완료! 5~8과 비밀 일기는 다음 업데이트에서 만나요.' });
  lines.push({ who: '진아쌤', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' });
  await say(lines);
}
async function talkLesson(no) {
  const L = lessonOf(no);
  let st = save.L[no];
  if (st === 0) {
    await say(L.intro);
    save.L[no] = 1; persist();
    await say({ t: `🌿 ${L.zone}에 들어가면 덩어리 몬스터가 나타나요!\n퀴즈를 맞혀서 6마리를 모두 잡아 오자.` });
    return;
  }
  if (st === 1) {
    const c = caughtIn(no);
    if (c < 6) { await say([Object.assign({}, L.waiting, { who: NPC_NAME[no] }), { t: `아직 ${6 - c}마리 남았어! (메뉴 → 덩어리 수첩에서 확인)` }]); return; }
    save.L[no] = st = 2; persist();
  }
  if (st === 2) {
    await say(Object.assign({}, L.battleStart));
    const r = await talkBattle(L.npc, NPC_NAME[no], L.battle);
    await rewards(no, r);
    return;
  }
  await say(Object.assign({ who: NPC_NAME[no] }, L.after));
}

/* ───────── 퀘스트 안내 ───────── */
function questText() {
  if (!save.intro) return '';
  for (let n = 1; n <= 4; n++) {
    const st = save.L[n], L = lessonOf(n);
    if (st === 3) continue;
    if (st === 0) return `🎯 ${n}과 · ${NPC_NAME[n]} 만나러 가자`;
    if (st === 1 && caughtIn(n) < 6) return `🌿 ${n}과 · ${L.zone} 몬스터 ${caughtIn(n)}/6`;
    return `💬 ${n}과 · ${NPC_NAME[n]}에게 가서 대화 배틀!`;
  }
  if (!save.boss) return '📚 도서관(图书馆)에서 중간 수사 회의!';
  const w = weakList().length;
  return `🎉 1~4과 완료! 풀숲에서 복습해요${w ? ` · 오답 카드 ${w}장` : ''}`;
}
let lastQuest = null;
function updateQuest() {
  const q = mode === 'field' ? questText() : '';
  if (q !== lastQuest) { $('#quest').textContent = q; lastQuest = q; }
}

/* ───────── 배틀 화면 ───────── */
let battle = null;
async function enterBattle(b) {
  Sound.bgm('battle'); Sound.sfx('enc');
  await flash();
  mode = 'battle'; battle = Object.assign({ t0: performance.now(), shake: 0, ball: null, hide: false, gauge: 0, gaugeMax: 0, pop: null }, b);
  await sleep(650);
}
function leaveBattle() { battle = null; mode = 'field'; Sound.bgm('field'); }

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

/* 퀴즈 하나 → 맞으면 true */
function quiz(c, type = quizType(c)) {
  return new Promise(resolve => {
    const opts = shuffle([c].concat(distractors(c)));
    const head = `<div class="qhead"><span>${{ k2z: '뜻 → 중국어', z2k: '중국어 → 뜻', listen: '듣고 고르기', fill: '빈칸 채우기', order: '문장 조립' }[type]}</span>
      <button class="mini hint">💡 힌트 사탕 ${save.candy}</button></div>`;
    let main = '', optHTML = '';
    const hzBtn = o => `<button class="btn" data-id="${o.id}"><span class="bz">${esc(o.hz)}</span>${set.py && type !== 'listen' ? `<span class="bp">${esc(o.py)}</span>` : ''}</button>`;
    if (type === 'k2z') { main = `<div class="big">"${esc(c.ko)}"</div><div class="small">알맞은 중국어 덩어리를 골라요</div>`; optHTML = opts.map(hzBtn).join(''); }
    if (type === 'z2k') { main = `<div class="zh">${esc(c.hz)}</div>${set.py ? `<div class="py">${esc(c.py)}</div>` : ''}<button class="mini sp">🔊 듣기</button>`; optHTML = opts.map(o => `<button class="btn" data-id="${o.id}">${esc(o.ko)}</button>`).join(''); }
    if (type === 'listen') { main = `<button class="speak sp">🔊</button><div class="small">잘 듣고 알맞은 덩어리를 골라요${TTS.ok ? '' : `<br>(소리가 안 나요: ${esc(c.py)})`}</div>`; optHTML = opts.map(hzBtn).join(''); }
    if (type === 'fill') {
      const s = exText(c).replace(c.hz, '<span class="blank">？</span>');
      main = `<div class="sent">${s.split(/(<span class="blank">？<\/span>)/).map((p, i) => i % 2 ? p : esc(p)).join('')}</div><div class="ko">${esc(c.exKo)}</div>`;
      optHTML = opts.map(hzBtn).join('');
    }
    if (type === 'order') {
      main = `<div class="ko" style="font-size:4cqw">"${esc(c.exKo)}"</div><div class="small">조각을 순서대로 눌러 문장을 만들어요</div>
        <div class="tiles ans"></div><div class="tiles pool"></div>`;
    }
    const p = panel(`${head}<div class="qmain">${main}</div>${optHTML ? `<div class="opts c2">${optHTML}</div>` : ''}`);
    const sp = p.querySelector('.sp'); if (sp) sp.onclick = () => speak(c);
    if (type === 'z2k' || type === 'listen') speak(c);
    let done = false, nav;
    const end = ok => { if (done) return; done = true; Sound.sfx(ok ? 'good' : 'bad'); setTimeout(() => { nav.stop(); p.remove(); resolve(ok); }, ok ? 550 : 900); };
    const hint = p.querySelector('.hint');
    if (type !== 'order') {
      p.querySelectorAll('.opts .btn').forEach(b => b.onclick = () => {
        if (done) return;
        const ok = b.dataset.id === c.id;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) p.querySelector(`.opts .btn[data-id="${c.id}"]`).classList.add('right');
        end(ok);
      });
      hint.onclick = () => {
        if (save.candy <= 0) { toast('힌트 사탕이 없어요'); return; }
        const wrong = [...p.querySelectorAll('.opts .btn')].filter(b => b.dataset.id !== c.id && !b.disabled);
        if (wrong.length < 2) return;
        save.candy--; persist(); hint.textContent = `💡 힌트 사탕 ${save.candy}`;
        shuffle(wrong).slice(0, 2).forEach(b => b.disabled = true); nav.refresh(); Sound.sfx('sel');
      };
    } else {
      const ansEl = p.querySelector('.tiles.ans'), poolEl = p.querySelector('.tiles.pool');
      const toks = c.ex.map((t, i) => ({ t, i }));
      let placed = [];
      const draw = () => {
        ansEl.innerHTML = ''; poolEl.innerHTML = '';
        placed.forEach((tk, k) => { const b = el(`<button class="btn tile">${esc(tk.t)}</button>`); b.onclick = () => { if (done) return; placed.splice(k, 1); Sound.sfx('blip'); draw(); }; ansEl.appendChild(b); });
        shuffled.filter(tk => !placed.includes(tk)).forEach(tk => { const b = el(`<button class="btn tile">${esc(tk.t)}</button>`); b.onclick = () => { if (done) return; placed.push(tk); Sound.sfx('blip'); draw(); check(); }; poolEl.appendChild(b); });
        if (nav) nav.refresh();
      };
      let shuffled = shuffle(toks); let tries = 0;
      while (shuffled.every((tk, i) => tk.i === i) && tries++ < 10) shuffled = shuffle(toks);
      const check = () => {
        if (placed.length < toks.length) return;
        const ok = placed.map(t => t.t).join('') === c.ex.join('');
        ansEl.querySelectorAll('.btn').forEach(b => b.classList.add(ok ? 'right' : 'wrong'));
        if (!ok) ansEl.insertAdjacentHTML('afterend', `<div class="say" style="text-align:center">정답: ${esc(exText(c))}</div>`);
        end(ok);
      };
      hint.onclick = () => {
        if (save.candy <= 0) { toast('힌트 사탕이 없어요'); return; }
        // 맞게 놓인 앞부분까지만 남기고 다음 조각 하나를 놓아 줌
        let k = 0; while (k < placed.length && placed[k].i === k) k++;
        if (k >= toks.length) return;
        save.candy--; persist(); hint.textContent = `💡 힌트 사탕 ${save.candy}`;
        placed = placed.slice(0, k); placed.push(toks[k]); Sound.sfx('sel'); draw(); check();
      };
      draw();
    }
    nav = navigate(p, { cols: type === 'order' ? 1 : 2, onB: null });
  });
}

/* 몬스터 카드 (잡았을 때 / 놓쳤을 때) */
function chunkCard(c, kind) {
  return new Promise(resolve => {
    const badges = [c.gram ? `<span class="badge y">${esc(c.gram)}</span>` : '', c.word ? '<span class="badge">덩어리 단어</span>' : '',
      kind === 'grad' ? '<span class="badge g">🎓 오답 카드 졸업!</span>' : '', kind === 'new' ? '<span class="badge g">📒 수첩에 등록!</span>' : '',
      kind === 'miss' ? '<span class="badge r">🃏 오답 카드에 적었어요</span>' : ''].join('');
    const p = panel(`<div class="card">
      <img src="${monImg(c.id, false)}" alt=""><div class="name">${esc(c.mon)} · ${c.lesson}과</div>
      <div>${badges}</div>
      <div class="zh">${esc(c.hz)}</div><div class="py">${esc(c.py)}</div><div class="ko">${esc(c.ko)}</div>
      <div class="ex"><div class="zh">${esc(exText(c))}</div>${set.py ? `<div class="py">${esc(c.exPy)}</div>` : ''}<div class="ko">${esc(c.exKo)}</div></div>
      <div class="say">${kind === 'miss' ? '괜찮아! 소리 내어 따라 말해 보고, 다시 만나면 꼭 잡자.' : '说出来！ 소리 내어 따라 말해 보세요.'}</div>
      <div class="row"><button class="btn s1">🔊 덩어리</button><button class="btn s2">🔊 예문</button><button class="btn go">계속 ▶</button></div>
    </div>`, { full: true });
    p.querySelector('.s1').onclick = () => speak(c);
    p.querySelector('.s2').onclick = () => TTS.speak(c.exSay || exText(c));
    const nav = navigate(p, { cols: 1, start: 2, onB: () => p.querySelector('.go').click() });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.remove(); resolve(); };
    speak(c);
  });
}

async function animBall() {
  const b = battle; const t0 = performance.now();
  b.ball = { phase: 'throw', t0 }; Sound.sfx('throw');
  await sleep(520); b.ball = { phase: 'suck', t0: performance.now() }; b.hide = true;
  await sleep(320);
  for (let i = 0; i < 3; i++) { b.ball = { phase: 'wob', t0: performance.now() }; Sound.sfx('wob'); await sleep(420); }
  b.ball = { phase: 'done', t0: performance.now() }; Sound.sfx('catch');
  await sleep(700);
}

async function wildBattle(c) {
  lastWild = c.id;
  const wasWeak = !!save.weak[c.id], wasCaught = !!save.caught[c.id];
  await enterBattle({ kind: 'wild', mon: c });
  await say({ t: wasWeak ? `또 만났다! 오답 카드의 ${c.mon}이 나타났다!` : wasCaught ? `다시 만난 ${c.mon}! 복습 퀴즈로 더 친해지자.` : `앗! 풀숲에서 야생의 ${c.mon}이 나타났다!` });
  const k = await ask({ t: '어떻게 할까?' }, ['🎯 퀴즈로 잡기', '🏃 도망가기']);
  if (k === 1) {
    await say({ t: wasWeak ? '무사히 도망쳤다! (오답 카드 몬스터는 금방 다시 나타나요)' : '무사히 도망쳤다!' });
    if (wasWeak) save.weak[c.id] = 2;
    persist(); leaveBattle(); return;
  }
  const ok = await quiz(c);
  if (ok) {
    await say({ t: '만두볼을 던졌다!' });
    await animBall();
    save.caught[c.id] = (save.caught[c.id] || 0) + 1;
    save.mastery[c.id] = (save.mastery[c.id] || 0) + 1;
    let kind = wasCaught ? 'again' : 'new';
    if (wasWeak) { delete save.weak[c.id]; save.grad++; kind = 'grad'; }
    if (!wasCaught || wasWeak) { save.catches++; if (save.catches % 3 === 0) { save.candy++; toast('💡 힌트 사탕 +1'); } }
    persist();
    await say({ t: `잡았다! ${c.mon}을(를) 덩어리 수첩에 넣었다.` });
    await chunkCard(c, kind);
    const no = c.lesson;
    if (!wasCaught && save.L[no] === 1 && caughtIn(no) === 6) {
      save.L[no] = 2; persist();
      await say({ t: `${no}과 몬스터 6마리를 모두 모았다!\n${NPC_NAME[no]}에게 돌아가서 대화 배틀을 하자!` });
    }
  } else {
    battle.shake = performance.now();
    save.weak[c.id] = 4; save.mastery[c.id] = Math.max(0, (save.mastery[c.id] || 0) - 1); persist();
    await say({ t: `앗! ${c.mon}이 풀숲으로 도망갔다…\n정답을 확인하고 소리 내어 말해 보자.` });
    battle.hide = true;
    await chunkCard(c, 'miss');
    await say({ t: '🃏 오답 카드에 적어 뒀어. 풀숲을 몇 걸음 걸으면 다시 나타날 거야!' });
  }
  leaveBattle();
}

/* 대화 배틀 → { first: 한 번에 통한 수, total } */
async function talkBattle(look, name, turns) {
  await enterBattle({ kind: 'trainer', look, name, gauge: 0, gaugeMax: turns.length });
  await say({ t: `${name}: 대화 배틀 시작! 💬\n알맞은 말로 대화를 이어 가요.` });
  let first = 0;
  for (const tn of turns) {
    const opts = shuffle(tn.opts.map((o, i) => Object.assign({}, o, { right: i === 0 })));
    let tries = 0;
    while (true) {
      const line = tn.type === 'reply' ? Object.assign({ who: name }, tn.q, { silent: tries > 0 && false }) : { t: `🎯 질문하기: ${tn.goal}` };
      const pick = await ask(line, opts);
      const o = opts[pick];
      await box({ who: save.name || '나', zh: o.zh, py: o.py, ko: o.ko, say: o.say });
      if (o.right) {
        if (!tries) first++;
        battle.gauge++; battle.pop = performance.now(); Sound.sfx('good');
        await say(Object.assign({ who: name }, tn.react));
        break;
      }
      tries++; o.disabled = true; battle.shake = performance.now(); Sound.sfx('bad');
      await say([{ who: name, zh: '嗯？我不太明白……', py: 'Èng? Wǒ bú tài míngbai……', ko: '응? 잘 모르겠어…' },
        { t: tn.type === 'reply' ? `💡 질문 뜻: "${tn.q.ko}"\n질문에 맞는 대답을 다시 골라 봐!` : `💡 "${tn.goal}"\n알맞은 질문을 다시 골라 봐!` }]);
    }
  }
  Sound.stopBgm(); Sound.bgm('win');
  await say({ t: `대화 성공! 🎉 한 번에 통한 말: ${first} / ${turns.length}` });
  leaveBattle();
  return { first, total: turns.length };
}

/* ───────── 보상: 일기장 → 내 문장 → 교재 미션 ───────── */
function pageCard(no) {
  const L = lessonOf(no), pg = L.page;
  return new Promise(resolve => {
    Sound.sfx('page');
    const p = panel(`<h2>📔 비밀 일기 ${no}쪽을 찾았다!</h2>
      <div class="small">수상한 질문 ${no} · ${esc(L.title)}</div>
      <div class="diary"><div class="zh" style="font-size:4.8cqw">${esc(pg.zh)}</div>${set.py ? `<div class="py">${esc(pg.py)}</div>` : ''}<div class="ko">${esc(pg.ko)}</div></div>
      <div class="fact">🔎 사건 해설<br>${esc(pg.fact)}</div>
      <div class="row"><button class="btn s">🔊 일기 듣기</button><button class="btn go">다음 ▶</button></div>`, { full: true });
    p.querySelector('.s').onclick = () => TTS.speak(pg.say || pg.zh);
    const nav = navigate(p, { start: 1 });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.remove(); resolve(); };
  });
}
function mySentence(no, slots, title = '✏️ 내 문장 만들기') {
  return new Promise(resolve => {
    const pick = slots.map(() => 0);
    let said = 0, heard = false;
    const p = panel(`<h2>${title}</h2><div class="small">조각을 골라 나에게 맞는 문장을 만들고, 소리 내어 3번 말해 봐요.</div>
      <div class="slots"></div><div class="preview"></div>
      <div class="row"><button class="btn s">🔊 내 문장 듣기</button></div>
      <div class="small" style="text-align:center;margin-top:1.4cqw">소리 내어 말할 때마다 눌러요</div>
      <div class="dots"><button class="btn dot">1</button><button class="btn dot">2</button><button class="btn dot">3</button></div>
      <div class="row"><button class="btn go" disabled>완료 ▶</button></div>`, { full: true });
    const sEl = p.querySelector('.slots'), pv = p.querySelector('.preview');
    const sentence = () => slots.map((s, i) => s[pick[i]]);
    const zhOf = () => sentence().map(x => x.zh).join('');
    const sayOf = () => sentence().map(x => x.say || x.zh).join('');
    const draw = () => {
      sEl.innerHTML = '';
      slots.forEach((s, i) => {
        const row = el('<div class="slot"></div>');
        s.forEach((o, j) => { const b = el(`<button class="btn ${pick[i] === j ? 'on' : ''}">${esc(o.zh)}</button>`); if (s.length === 1) b.disabled = true; b.onclick = () => { pick[i] = j; Sound.sfx('blip'); draw(); }; row.appendChild(b); });
        sEl.appendChild(row);
      });
      const s = sentence();
      pv.innerHTML = `<div class="zh" style="font-size:5cqw">${esc(zhOf())}</div><div class="py">${esc(s.map(x => x.py).join(' '))}</div><div class="ko">${esc(s.map(x => x.ko).join(' '))}</div>`;
      if (nav) nav.refresh();
    };
    let nav = null; draw();
    p.querySelector('.s').onclick = () => { heard = true; TTS.speak(sayOf()); };
    p.querySelectorAll('.dot').forEach((d, i) => d.onclick = () => {
      if (d.classList.contains('on')) return;
      d.classList.add('on'); said++; Sound.sfx('sel');
      if (said >= 3) { p.querySelector('.go').disabled = false; toast('잘했어요! 입에 붙었어요 👏'); nav.refresh(); }
    });
    nav = navigate(p, { cols: 1 });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.remove(); resolve(zhOf()); };
  });
}
function missionCard(no, text, sentence) {
  return new Promise(resolve => {
    const p = panel(`<h2>🎤 교재 미션</h2>
      <div class="mission"><b>${no ? `2권 ${no}과 · ` : ''}${esc(text)}</b><br><br>수업 시간에 진아쌤 앞에서 발표해요.<br>오늘 만든 문장으로 시작해 보세요!</div>
      ${sentence ? `<div class="preview"><div class="small">내 문장</div><div class="zh" style="font-size:4.8cqw">${esc(sentence)}</div></div>` : ''}
      <div class="row"><button class="btn go">좋아요 ▶</button></div>`, { full: true });
    const nav = navigate(p);
    p.querySelector('.go').onclick = () => { nav.stop(); p.remove(); resolve(); };
  });
}
const NEXT_TIP = {
  1: '운동장 쪽 선도부가 길을 비켜 주었다!\n정문 광장 오른쪽 길로 가 보자.',
  2: '운동장 위쪽 길이 열렸다!\n매점(小卖部)으로 가 보자.',
  3: '매점 왼쪽 숲길이 열렸다!\n기숙사(宿舍)로 가 보자.',
  4: '도서관(图书馆) 문이 열렸다!\n진아쌤이 중간 수사 회의를 준비하고 있대.'
};
async function rewards(no, r) {
  const L = lessonOf(no);
  await pageCard(no);
  const s = await mySentence(no, L.mySentence);
  await missionCard(no, L.mission, s);
  save.L[no] = 3; save.pages[no] = { sentence: s, first: r.first, total: r.total }; save.candy += 2; persist();
  await say([{ t: '💡 힌트 사탕 2개를 받았다!' }, { t: NEXT_TIP[no] }]);
  Sound.bgm('field');
}

async function bossBattle() {
  await say(BOSS.intro);
  const r = await talkBattle('teacher', '진아쌤', BOSS.battle);
  const s = await mySentence(0, [
    [{ zh: '中国学生', py: 'Zhōngguó xuésheng', ko: '중국 학생들은' }],
    [{ zh: '吃完午饭', py: 'chī wán wǔfàn', ko: '점심을 다 먹고' }, { zh: '课间休息的时候', py: 'kèjiān xiūxi de shíhou', ko: '쉬는 시간에' }, { zh: '在宿舍', py: 'zài sùshè', ko: '기숙사에서' }],
    [{ zh: '趴在桌子上睡一会儿。', py: 'pā zài zhuōzi shang shuì yíhuìr.', ko: '책상에 엎드려 잠깐 자.' }, { zh: '往往去操场玩儿。', py: 'wǎngwǎng qù cāochǎng wánr.', ko: '대개 운동장에 가서 놀아.' },
     { zh: '互相发“666”。', say: '互相发六六六。', py: 'hùxiāng fā "liù liù liù".', ko: '서로 "666"을 보내.' }, { zh: '一个房间住六个人。', py: 'yí ge fángjiān zhù liù ge rén.', ko: '한 방에 여섯 명이 지내.' }]
  ], '✏️ 중간 수사 보고서 한 줄');
  save.boss = true; save.pages.boss = { sentence: s, first: r.first, total: r.total }; persist();
  await certificate(r);
  await missionCard(4, BOSS.mission, s);
  await say([{ who: '진아쌤', t: '정말 잘했어! 5~8과 비밀 일기는 다음 업데이트에서 이어져요.' }, { who: '진아쌤', t: '그동안 풀숲에서 복습하면서 오답 카드를 모두 졸업시켜 보자!' }]);
  Sound.bgm('field');
}
function certificate(r) {
  return new Promise(resolve => {
    Sound.sfx('page');
    const caught = ALL_CHUNKS.filter(c => save.caught[c.id]).length;
    const p = panel(`<div class="card"><h2>🏅 꼬마 수사관 인증서</h2>
      <div class="diary" style="text-align:center"><div style="font-size:5.4cqw">${esc(save.name || '나')}</div>
      <div class="small">교재 2권 「중국 10대 비밀 일기」 1~4과 수사 완료</div>
      <div class="row"><span class="badge g">📒 덩어리 ${caught}/24</span><span class="badge y">🎓 졸업한 오답 카드 ${save.grad}</span><span class="badge">💬 한 번에 통한 말 ${r.first}/${r.total}</span></div>
      <div class="small" style="margin-top:2cqw">진담중국어 · 진아쌤</div></div>
      <div class="row"><button class="btn go">다음 ▶</button></div></div>`, { full: true });
    const nav = navigate(p);
    p.querySelector('.go').onclick = () => { nav.stop(); p.remove(); resolve(); };
  });
}

/* ───────── 메뉴 ───────── */
function openMenu() {
  if (busy) return;
  run(() => new Promise(resolve => {
    Sound.sfx('sel');
    const caught = ALL_CHUNKS.filter(c => save.caught[c.id]).length;
    const m = el(`<div class="menu">
      <button class="btn" data-k="dex">📒 덩어리 수첩 ${caught}/24</button>
      <button class="btn" data-k="weak">🃏 오답 카드 ${weakList().length}</button>
      <button class="btn" data-k="diary">📔 비밀 일기 ${[1, 2, 3, 4].filter(n => save.pages[n]).length}/4</button>
      <button class="btn" data-k="set">⚙️ 설정</button>
      <button class="btn" data-k="x">✖ 닫기</button></div>`);
    uiRoot.appendChild(m);
    const close = () => { nav.stop(); m.remove(); resolve(); };
    const nav = navigate(m, { onB: close });
    m.querySelectorAll('.btn').forEach(b => b.onclick = async () => {
      const k = b.dataset.k;
      if (k === 'x') return close();
      nav.stop(); m.style.display = 'none';
      if (k === 'dex') await dexView(false);
      if (k === 'weak') await dexView(true);
      if (k === 'diary') await diaryView();
      if (k === 'set') await settingsView();
      close();
    });
  }));
}
function subPanel(html) {
  return new Promise(resolve => {
    const p = panel(html + '<div class="row"><button class="btn back">◀ 돌아가기</button></div>', { full: true });
    const close = () => { TTS.stop(); nav.stop(); p.remove(); resolve(); };
    p.querySelector('.back').onclick = close;
    const nav = navigate(p, { cols: p.querySelector('.dex') ? 2 : 1, onB: close });
    p._nav = nav;
    p.querySelectorAll('[data-say]').forEach(d => d.onclick = () => TTS.speak(d.dataset.say));
  });
}
function dexView(onlyWeak) {
  const list = onlyWeak ? weakList() : ALL_CHUNKS;
  const item = c => {
    const got = save.caught[c.id] || save.weak[c.id];
    if (!got) return `<div class="btn dexi"><img src="${monImg(c.id, true)}" alt=""><div>???</div><div class="small">${c.lesson}과</div></div>`;
    return `<div class="btn dexi ${save.weak[c.id] ? 'weak' : ''}" data-say="${esc(c.say || c.hz)}"><img src="${monImg(c.id, false)}" alt="">
      <div class="small">${esc(c.mon)} ${save.caught[c.id] ? '' : '(놓침)'}</div><div class="zh">${esc(c.hz)}</div><div class="py">${esc(c.py)}</div><div class="ko">${esc(c.ko)}</div></div>`;
  };
  const head = onlyWeak
    ? `<h2>🃏 오답 카드</h2><div class="small">틀려도 괜찮아요. 풀숲에서 다시 만나 맞히면 졸업!${list.length ? '' : '<br><br>지금은 오답 카드가 없어요 👍'} (졸업 ${save.grad}장)</div>`
    : `<h2>📒 덩어리 수첩</h2><div class="small">카드를 누르면 소리가 나요. 수첩의 덩어리는 수업 시간 '덩어리 수첩'과 같아요.</div>`;
  let body = '';
  if (onlyWeak) body = `<div class="dex">${list.map(item).join('')}</div>`;
  else LESSONS.forEach(L => { body += `<h3>${L.no}과 · ${esc(L.title)} (${caughtIn(L.no)}/6)</h3><div class="dex">${L.chunks.map(item).join('')}</div>`; });
  return subPanel(head + body);
}
function diaryView() {
  let body = '<h2>📔 小雨의 비밀 일기</h2>';
  LESSONS.forEach(L => {
    const pg = save.pages[L.no];
    if (!pg) { body += `<h3>${L.no}쪽 · ???</h3><div class="small">아직 찾지 못했어요.</div>`; return; }
    body += `<h3>${L.no}쪽 · ${esc(L.title)}</h3><div class="diary btn" data-say="${esc(L.page.say || L.page.zh)}"><div class="zh" style="font-size:4.4cqw">${esc(L.page.zh)}</div><div class="ko">${esc(L.page.ko)}</div></div>
      <div class="preview"><div class="small">✏️ 내 문장 · 🎤 미션: ${esc(L.mission)}</div><div class="zh" style="font-size:4.4cqw">${esc(pg.sentence)}</div></div>`;
  });
  if (save.pages.boss) body += `<h3>🏅 중간 수사 회의</h3><div class="preview"><div class="zh" style="font-size:4.4cqw">${esc(save.pages.boss.sentence)}</div></div>`;
  return subPanel(body);
}
function settingsView() {
  return new Promise(resolve => {
    const rates = [[0.7, '느리게'], [0.85, '보통'], [1, '빠르게']];
    const voices = TTS.voices;
    const p = panel('', { full: true });
    let nav;
    const draw = () => {
      p.innerHTML = `<h2>⚙️ 설정</h2>
      <div class="setrow">병음 보기 <button class="btn" data-k="py">${set.py ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">한국어 뜻 바로 보기 <button class="btn" data-k="ko">${set.ko ? '켜짐' : '눌러서 보기'}</button></div>
      <div class="setrow">중국어 읽기 빠르기 <button class="btn" data-k="rate">${rates.find(r => r[0] === set.rate)?.[1] || '보통'}</button></div>
      <div class="setrow">중국어 목소리 <button class="btn" data-k="voice">${esc(set.voice || '자동')}</button></div>
      <div class="setrow">효과음 <button class="btn" data-k="sfx">${set.sfx ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">배경음악 <button class="btn" data-k="bgm">${set.bgm ? '켜짐' : '꺼짐'}</button></div>
      <div class="setrow">소리 확인 <button class="btn" data-k="test">🔊 你好！</button></div>
      <div class="setrow">처음부터 다시 <button class="btn" data-k="reset">초기화</button></div>
      <div class="small">${APP_VERSION}<br>© 2026 진담중국어(전진아). All rights reserved. 무단 복사·배포·수정·판매 금지.<br>
      문의·버그 제보: <a href="https://pf.kakao.com/_jZYxmxj/chat" target="_blank" rel="noopener">카카오톡 채널</a><br>
      ※ 말하기는 스스로 소리 내어 확인하는 방식이에요. 게임이 발음을 채점하지는 않아요.</div>
      <div class="row"><button class="btn" data-k="back">◀ 돌아가기</button></div>`;
      p.querySelectorAll('.btn').forEach(b => b.onclick = () => act(b.dataset.k));
      if (nav) nav.refresh();
    };
    const act = k => {
      if (k === 'py') set.py = !set.py;
      if (k === 'ko') set.ko = !set.ko;
      if (k === 'rate') { const i = rates.findIndex(r => r[0] === set.rate); set.rate = rates[(i + 1) % 3][0]; TTS.setRate(set.rate); TTS.speak('你好！'); }
      if (k === 'voice') { const names = [''].concat(voices.map(v => v.name)); const i = names.indexOf(set.voice); set.voice = names[(i + 1) % names.length]; TTS.setVoice(set.voice); TTS.speak('你好！'); }
      if (k === 'sfx') { set.sfx = !set.sfx; Sound.setSfx(set.sfx); }
      if (k === 'bgm') { set.bgm = !set.bgm; Sound.setBgm(set.bgm); }
      if (k === 'test') { TTS.speak('你好！').then(okk => { if (!okk) toast('중국어 음성이 나오지 않아요. 크롬에서 열어 보세요.'); }); }
      if (k === 'reset') { if (confirmReset()) return; }
      if (k === 'back') { nav.stop(); p.remove(); resolve(); return; }
      persistSet(); draw();
    };
    let resetArm = 0;
    const confirmReset = () => {
      if (Date.now() - resetArm < 3000) { store.clear(); location.reload(); return true; }
      resetArm = Date.now(); toast('한 번 더 누르면 모든 기록이 지워져요'); return false;
    };
    draw(); nav = navigate(p);
  });
}

/* ───────── 타이틀 · 처음 시작 ───────── */
function titleScreen() {
  mode = 'title';
  const has = save.intro;
  const t = el(`<div class="title">
    <div class="logo">진담 몬스터즈<small>중국 10대 비밀 일기</small></div>
    <div class="sub">교재 2권 · 1~4과 · 덩어리를 잡아라!</div>
    <div class="blink">화면을 눌러 주세요</div>
    <div class="ver">${APP_VERSION} · © 2026 진담중국어</div></div>`);
  uiRoot.appendChild(t);
  let stage = 0;
  const go = () => {
    if (stage) return; stage = 1; Sound.init(); Sound.bgm('title'); popH(h0);
    t.querySelector('.blink').outerHTML = `<div class="tbtns">${has ? '<button class="btn" data-k="c">▶ 이어하기</button>' : ''}<button class="btn" data-k="n">${has ? '새로 시작' : '▶ 시작하기'}</button></div>`;
    const nav = navigate(t);
    t.querySelectorAll('.tbtns .btn').forEach(b => b.onclick = () => {
      nav.stop(); t.remove();
      if (b.dataset.k === 'n') { if (has) { store.set('save', null); save = newSave(); syncPlayer(); } run(newGame); }
      else { mode = 'field'; Sound.bgm('field'); }
    });
  };
  const h0 = k => { if (k === 'A' || k === 'START') go(); };
  pushH(h0); t.onclick = go;
}
function syncPlayer() { Object.assign(player, { x: save.x, y: save.y, dir: save.dir, fx: save.x, fy: save.y, moving: null }); }
function nameEntry() {
  return new Promise(resolve => {
    const p = panel(`<h2>너의 이름은?</h2><input class="name" maxlength="8" placeholder="이름 (8글자까지)">
      <div class="small">게임 속 대화에 나와요. 실제 이름이 아니어도 괜찮아요.</div>
      <div class="row"><button class="btn" data-l="boy">🧢 남학생</button><button class="btn" data-l="girl">🎀 여학생</button></div>`);
    const inp = p.querySelector('input');
    setTimeout(() => { try { inp.focus(); } catch (e) {} }, 100);
    const nav = navigate(p, { cols: 2 });
    p.querySelectorAll('[data-l]').forEach(b => b.onclick = () => {
      save.name = (inp.value || '').trim().slice(0, 8) || '나'; save.look = b.dataset.l;
      nav.stop(); p.remove(); resolve();
    });
  });
}
async function newGame() {
  mode = 'field'; Sound.bgm('field');
  player.dir = 'up';
  await say([
    { who: '진아쌤', t: '안녕! 나는 진담중국어의 진아쌤이야.' },
    { who: '진아쌤', zh: '你好！欢迎来到中国！', py: 'Nǐ hǎo! Huānyíng lái dào Zhōngguó!', ko: '안녕! 중국에 온 걸 환영해!' },
    { who: '진아쌤', t: '이번 주에 너는 중국 星光中学(별빛 중학교)에 교환학생으로 왔어. 먼저 이름을 알려 줄래?' }
  ]);
  await nameEntry();
  await say([
    { who: '진아쌤', t: '반가워, {name}! 그런데 큰일이 생겼어.' },
    { who: '진아쌤', t: '중국 친구 小雨의 "비밀 일기"가 바람에 날아가서 학교 곳곳에 흩어졌대.' },
    { who: '진아쌤', t: '일기장마다 "수상한 질문"이 하나씩 적혀 있어. 중국 친구들과 이야기하면서 그 비밀을 풀어 보자!' },
    { who: '진아쌤', t: '풀숲에는 덩어리 몬스터가 숨어 있어. 퀴즈를 맞히면 만두볼로 잡아서 "덩어리 수첩"에 모을 수 있지.' },
    { who: '진아쌤', t: '틀려도 괜찮아! 놓친 몬스터는 "오답 카드"에 적어 두고, 다시 만나서 꼭 잡으면 돼.' },
    { who: '진아쌤', t: '자, 덩어리 수첩이랑 힌트 사탕 3개를 줄게. 어려운 문제에서 💡를 누르면 도움이 될 거야.' },
    { t: '📒 덩어리 수첩과 💡 힌트 사탕 3개를 받았다!' },
    { who: '진아쌤', t: '먼저 왼쪽 위 교실동(教学楼)으로 가 봐. 반장 李明이 기다리고 있어. 메뉴 버튼으로 수첩을 볼 수 있어!' },
    { who: '진아쌤', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' }
  ]);
  save.intro = true; persist();
}

/* ───────── 그리기 ───────── */
function camera() {
  const cx = player.fx * T + 8 - VW * T / 2, cy = player.fy * T + 8 - VH * T / 2;
  return [Math.max(0, Math.min(MAP_W * T - VW * T, cx)), Math.max(0, Math.min(MAP_H * T - VH * T, cy))];
}
function frameOf(o, now) {
  if (!o.moving) return 0;
  const p = (now - o.moving.t0) / MOVE_MS;
  return p < 0.5 ? (o.alt ? 1 : 2) : 0;
}
function drawField(now, camOverride) {
  const [cx, cy] = camOverride || camera();
  const anim = Math.floor(now / 500) % 2;
  const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
  const R = v => Math.round(v * SC);
  for (let y = y0; y <= y0 + VH; y++) for (let x = x0; x <= x0 + VW; x++) {
    const t = tileAt(x, y);
    const name = isGrass(t) ? 'tall' : t;
    ctx.drawImage(Art.tile(name, (t === '~' || t === 'f' || isGrass(t)) ? anim : 0), R(x * T - cx), R(y * T - cy), T * SC, T * SC);
    if (t === 's' && (y === 13 || y === 16) && x >= 18 && x <= 29) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(R(x * T - cx), R(y * T - cy + (y === 13 ? 2 : 13)), T * SC, SC); }
  }
  // 건물
  BUILDINGS.forEach(b => {
    const bx = b.x * T - cx, by = b.y * T - cy;
    if (bx > VW * T || by > VH * T || bx + b.w * T < 0 || by + b.h * T < 0) return;
    const im = Art.building(b);
    ctx.drawImage(im.c, R(bx), R(by), b.w * T * SC, b.h * T * SC);
    ctx.fillStyle = '#fff6d0'; ctx.font = `${6 * SC}px 'Noto Sans SC', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.name, R(bx + b.w * T / 2), R(by + im.roofH - 0.3));
  });
  // 사람 (y 순서)
  const people = npcs.filter(npcVisible).concat([Object.assign(player, { look: save.look })]);
  people.sort((a, b) => a.fy - b.fy);
  people.forEach(o => {
    const px = o.fx * T - cx, py = o.fy * T - cy - 2;
    if (px < -T || py < -T || px > VW * T || py > VH * T) return;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(R(px + 8), R(py + 16), 5 * SC, 1.6 * SC, 0, 0, 7); ctx.fill();
    ctx.drawImage(Art.person(o.look, o.dir, frameOf(o, now)), R(px), R(py), T * SC, T * SC);
    const tx = Math.round(o.fx), ty = Math.round(o.fy);
    if (isGrass(tileAt(tx, ty)) && !o.moving) {
      const g = Art.tile('tall', anim);
      ctx.drawImage(g, 0, 9, T, 7, R(tx * T - cx), R(ty * T - cy + 9), T * SC, 7 * SC);
    }
  });
  // 중요한 친구 머리 위 표시
  npcs.forEach(n => {
    if (!n.lesson || !npcVisible(n)) return;
    const st = save.L[n.lesson];
    const prev = n.lesson === 1 || save.L[n.lesson - 1] === 3;
    if (!save.intro || !prev || st === 3 || (st === 1 && caughtIn(n.lesson) < 6)) return;
    const px = n.fx * T - cx + 8, py = n.fy * T - cy - 7 + Math.sin(now / 200) * 1.5;
    ctx.fillStyle = '#2b2340'; ctx.beginPath(); ctx.arc(R(px), R(py), 5 * SC, 0, 7); ctx.fill();
    ctx.fillStyle = st === 0 ? '#f3bf35' : '#ff7a8a'; ctx.beginPath(); ctx.arc(R(px), R(py), 4 * SC, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b2340'; ctx.font = `${7 * SC}px Jua, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(st === 0 ? '!' : '💬', R(px), R(py + 0.5));
  });
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function drawBattle(now) {
  const b = battle, R = v => Math.round(v * SC), H = VH * T, O = bOff(), PY = H - 82;
  const el2 = (now - b.t0) / 600, e = Math.min(1, el2), ease = 1 - Math.pow(1 - e, 3);
  // 배경
  const g = ctx.createLinearGradient(0, 0, 0, cv.height);
  if (b.kind === 'wild') { g.addColorStop(0, '#e9f7d4'); g.addColorStop(1, '#c4e89a'); } else { g.addColorStop(0, '#fbeedc'); g.addColorStop(1, '#ead7bd'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
  if (b.kind === 'trainer') { ctx.fillStyle = 'rgba(160,120,80,.12)'; for (let i = 0; i < 160; i += 16) ctx.fillRect(R(i), R(60 + O), R(1), R(H)); ctx.fillRect(0, R(60 + O), cv.width, R(1)); }
  ctx.fillStyle = b.kind === 'wild' ? '#a8d878' : '#dcc3a0';
  ctx.beginPath(); ctx.ellipse(R(118), R(54 + O), R(32), R(7), 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R(44), R(PY + 44), R(38), R(8), 0, 0, 7); ctx.fill();
  // 상대
  const sh = b.shake && now - b.shake < 400 ? Math.sin((now - b.shake) / 25) * 3 : 0;
  const ex = 118 + (1 - ease) * 80 + sh, bob = Math.sin(now / 300) * 1.2;
  if (b.kind === 'wild') {
    if (!b.hide) {
      let s = 1.45; const im = Art.monster(b.mon.id);
      if (b.ball && b.ball.phase === 'suck') s *= Math.max(0, 1 - (now - b.ball.t0) / 300);
      const w = 40 * s, top = 54 + O - w + 2 + bob;
      ctx.drawImage(im, R(ex - w / 2), R(top), R(w), R(w));
      ctx.fillStyle = '#2b2340'; ctx.font = `bold ${7 * SC * s}px 'Noto Sans SC', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Art.firstHan(b.mon.hz), R(ex), R(top + 27.5 * s));
    }
  } else {
    const w = 48; ctx.drawImage(Art.person(b.look, 'down', 0), R(ex - w / 2), R(54 + O - w + 2), R(w), R(w));
  }
  // 나 (뒷모습)
  const px = 40 - (1 - ease) * 80;
  ctx.drawImage(Art.person(save.look, 'up', 0), R(px - 24), R(PY), R(48), R(48));
  // 만두볼
  if (b.ball) {
    const t = (now - b.ball.t0);
    let bx = 118, by = 48 + O, rot = 0;
    if (b.ball.phase === 'throw') { const p = Math.min(1, t / 500); bx = 50 + (118 - 50) * p; by = (PY + 18) - Math.sin(p * Math.PI) * 50 - ((PY + 18) - (48 + O)) * p; rot = p * 12; }
    if (b.ball.phase === 'wob') { rot = Math.sin(t / 60) * 0.5 * (t < 300 ? 1 : 0); by = 50 + O; }
    if (b.ball.phase === 'done' || b.ball.phase === 'suck') by = 50 + O;
    ctx.save(); ctx.translate(R(bx), R(by)); ctx.rotate(rot); ctx.drawImage(Art.bunBall(), R(-6), R(-6), R(12), R(12)); ctx.restore();
    if (b.ball.phase === 'done') {
      ctx.fillStyle = '#f3bf35'; ctx.font = `${9 * SC}px Jua`; ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.7, d = 8 + Math.min(10, t / 40); ctx.fillText('★', R(bx + Math.cos(a) * d), R(by + Math.sin(a) * d)); }
    }
  }
  // 이름표
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const tag = (x, y, w, h) => { ctx.fillStyle = '#2b2340'; rr(R(x), R(y), R(w), R(h), R(3)); ctx.fill(); ctx.fillStyle = '#fffdf6'; rr(R(x + 1), R(y + 1), R(w - 2), R(h - 2), R(2.5)); ctx.fill(); };
  tag(4, 4, 74, 26);
  ctx.fillStyle = '#2b2340'; ctx.font = `${8 * SC}px Jua, sans-serif`;
  if (b.kind === 'wild') {
    ctx.fillText(b.mon.mon, R(9), R(12));
    ctx.font = `${6 * SC}px Jua, sans-serif`; ctx.fillStyle = '#6a5f80';
    ctx.fillText(`${b.mon.lesson}과 · ${save.weak[b.mon.id] ? '🃏 오답 카드' : save.caught[b.mon.id] ? '📒 잡은 적 있음' : '✨ 처음 만남'}`, R(9), R(23));
  } else {
    ctx.fillText(b.name, R(9), R(12));
    ctx.font = `${6 * SC}px Jua, sans-serif`; ctx.fillStyle = '#6a5f80'; ctx.fillText('대화', R(9), R(23));
    for (let i = 0; i < b.gaugeMax; i++) {
      const pop = b.pop && i === b.gauge - 1 && now - b.pop < 400 ? 1.4 : 1;
      ctx.fillStyle = i < b.gauge ? '#22a86a' : '#e1dac8';
      const w = 46 / b.gaugeMax - 2;
      rr(R(28 + i * (w + 2)), R(21 - (pop - 1) * 2), R(w), R(5 * pop), R(1.5)); ctx.fill();
    }
  }
}
function drawTitle(now) {
  const cx = (Math.sin(now / 9000) * 0.5 + 0.5) * (MAP_W * T - VW * T), cy = Math.min(MAP_H * T - VH * T, 12 * T);
  drawField(now, [cx, cy]);
  ctx.fillStyle = 'rgba(43,35,64,.25)'; ctx.fillRect(0, 0, cv.width, cv.height);
  // 몬스터 몇 마리
  ['L1a', 'L2d', 'L3b', 'L4e'].forEach((id, i) => {
    const x = 20 + i * 38, y = VH * T - 32 + Math.sin(now / 300 + i) * 3;
    ctx.drawImage(Art.monster(id), Math.round(x * SC), Math.round(y * SC), 28 * SC, 28 * SC);
  });
}
function loop(now) {
  if (mode === 'field') fieldUpdate(now);
  if (mode === 'battle' && battle) drawBattle(now);
  else if (mode === 'title') drawTitle(now);
  else drawField(now);
  updateQuest();
  requestAnimationFrame(loop);
}

/* 카카오톡·인스타 안 브라우저에서는 음성이 잘 안 나와서 안내 */
function inAppNotice() {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp/i.test(ua)) setTimeout(() => toast('소리가 안 나면 크롬·사파리에서 열어 주세요'), 1500);
}

/* 확인용 */
window.__jdm = {
  get save() { return save; }, get mode() { return mode; }, get battle() { return battle; }, get busy() { return busy; },
  press, player, npcs, quiz, wildBattle, talkLesson, bossBattle, questText,
  tp(x, y, dir = 'down') { Object.assign(player, { x, y, fx: x, fy: y, dir, moving: null }); },
  setL(n, v) { save.L[n] = v; persist(); },
  catchAll(n) { lessonOf(n).chunks.forEach(c => save.caught[c.id] = 1); if (save.L[n] === 1) save.L[n] = 2; persist(); }
};

inAppNotice();
titleScreen();
requestAnimationFrame(loop);
