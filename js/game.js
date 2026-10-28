/* 진담 수사대 · 중국 10대 비밀 일기 — 게임 본체
   흐름: 학교 지도 → 장소(그림 장면) → 단서 쪽지 6장 찾기(퀴즈 → 도장) → 친구와 메신저 대화 → 비밀 일기 → 내 문장 → 교재 미션 */
const APP_VERSION = 'v0.2.0 (2026.10.28)';
const KEY = 'jdm1-';

/* ───────── 저장 ───────── */
function newSave() {
  return { v: 2, name: '', look: 'girl', intro: false, here: 0,
    L: { 1: 0, 2: 0, 3: 0, 4: 0 }, caught: {}, weak: {}, mastery: {}, grad: 0, candy: 3, catches: 0, pages: {}, boss: false };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(KEY)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
};
let save = Object.assign(newSave(), store.get('save', {}) || {});
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
function press(k) { Sound.init(); const h = handlers[handlers.length - 1]; if (h) h(k); }
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'A', Enter: 'A', z: 'A', Escape: 'B', x: 'B' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') press('A'); return; }
  const k = KEYMAP[e.key]; if (!k || e.repeat) return; e.preventDefault(); press(k);
});
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

function card(html, cls = '') {
  const dim = el('<div class="dim"></div>'); uiRoot.appendChild(dim);
  const c = el(`<div class="card ${cls}">${html}</div>`); uiRoot.appendChild(c);
  c.close = () => { dim.remove(); c.remove(); };
  return c;
}
function fade() { const f = el('<div class="fade"></div>'); document.getElementById('app').appendChild(f); setTimeout(() => f.remove(), 520); return sleep(220); }
let busy = false;
async function run(fn) { if (busy) return; busy = true; try { await fn(); } catch (e) { console.error(e); } busy = false; refresh(); }

/* ───────── 화면: 학교 지도 ───────── */
let screen = 'title', curScene = 0;
function topBar(title, subt, back) {
  topEl.innerHTML = `${back ? '<button class="ib" data-a="map">← 지도</button>' : '<span style="font-size:7cqw">🔍</span>'}
    <div class="ttl">${esc(title)}<small>${esc(subt)}</small></div>
    <span class="chip">💡 ${save.candy}</span><button class="ib" data-a="menu">☰</button>`;
  topEl.querySelector('[data-a="menu"]').onclick = () => openMenu();
  const m = topEl.querySelector('[data-a="map"]'); if (m) m.onclick = () => { if (!busy) fade().then(showMap); };
}
function questText() {
  for (let n = 1; n <= 4; n++) {
    const st = save.L[n];
    if (st === 3) continue;
    if (st === 0) return `📍 ${n}번 장소로 가서 ${NPC_NAME[n]}을 만나요`;
    if (caughtIn(n) < 6) return `🔍 ${n}번 장소에서 단서 쪽지 찾기 ${caughtIn(n)}/6`;
    return `💬 ${NPC_NAME[n]}과 메신저로 대화해요`;
  }
  if (!save.boss) return '📚 도서관에서 중간 수사 회의!';
  const w = weakList().length;
  return w ? `🃏 오답 카드 ${w}장 — 다시 풀어서 졸업시켜요` : '🎉 1~4과 수사 완료!';
}
function showMap() {
  screen = 'map'; curScene = 0; Sound.bgm('map');
  topBar('진담 수사대', `${save.name || '나'}의 수사 지도`, false);
  let svg = Pic.map();
  const pins = [1, 2, 3, 4, 5].map(n => {
    const [x, y] = Pic.PINS[n], lock = !unlocked(n), done = n <= 4 ? save.L[n] === 3 : save.boss;
    const cur = !lock && !done;
    const col = lock ? '#c9bcae' : done ? '#7fd6a8' : n === 5 ? '#b49ae6' : '#ff8a7a';
    return `<g class="pin ${lock ? 'lock' : ''} ${done ? 'done' : ''}" data-n="${n}">
      <g class="bob"><path d="M${x} ${y + 26} L${x - 11} ${y + 8} A15 15 0 1 1 ${x + 11} ${y + 8} Z" fill="${col}" stroke="#fff" stroke-width="3"/>
      <text x="${x}" y="${y + 9}" text-anchor="middle" font-size="${lock || done || n === 5 ? 12 : 16}" fill="#fff" font-weight="700">${lock ? '🔒' : done ? '✓' : n === 5 ? '🔍' : n}</text></g>
      ${cur ? `<rect x="${x - 22}" y="${y - 30}" width="44" height="16" rx="8" fill="#fff"/><text x="${x}" y="${y - 18}" text-anchor="middle" font-size="11" fill="#4b3b5c" class="zh-svg">${n <= 4 ? NPC_NAME[n] : '회의'}</text>` : ''}</g>`;
  }).join('');
  const here = save.here && Pic.PINS[save.here] ? Pic.PINS[save.here] : [200, 470];
  const me = `<g transform="translate(${here[0] + 12},${here[1] - 4}) scale(.34)" pointer-events="none">${Pic.person(save.look)}</g>`;
  const teacher = `<g class="pin" data-n="t"><g transform="translate(244,452) scale(.42)">${Pic.person('teacher', { pose: 'wave' })}</g>
    <rect x="226" y="436" width="64" height="18" rx="9" fill="#fff"/><text x="258" y="449" text-anchor="middle" font-size="11" fill="#4b3b5c">진아쌤 💡</text></g>`;
  svg = svg.replace('</svg>', pins + teacher + me + '</svg>');
  stage.innerHTML = `<div class="map-wrap">${svg}</div>`;
  stage.querySelectorAll('.pin').forEach(p => p.onclick = () => {
    const n = p.dataset.n;
    if (busy) return;
    if (n === 't') return run(talkTeacher);
    const k = +n;
    if (!unlocked(k)) { Sound.sfx('bad'); toast(k === 5 ? '4번 장소까지 해결하면 열려요' : `먼저 ${k - 1}번 장소의 사건을 해결해요`); return; }
    Sound.sfx('door'); fade().then(() => openScene(k));
  });
  tray.innerHTML = `<div class="notebook"><div class="nb-head"><span>${esc(questText())}</span></div>
    <div class="small">지도의 장소를 눌러 이동해요. 진아쌤을 누르면 힌트를 줘요.</div></div>`;
}

/* ───────── 화면: 장소 ───────── */
let notes = [];   // { id, si, spot:[x,y], again }
function buildNotes(no) {
  const S = Pic.SCENES[no], L = lessonOf(no);
  if (save.L[no] === 0) return [];
  const used = new Set(); const list = [];
  L.chunks.forEach((c, i) => {
    if (save.caught[c.id] && !save.weak[c.id]) return;
    let si = i;
    if (save.weak[c.id]) si = shuffle([...S.spots.keys()].filter(k => !used.has(k) && k >= 6))[0] ?? i;
    used.add(si); list.push({ id: c.id, si, spot: S.spots[si], again: !!save.weak[c.id] });
  });
  return list;
}
function sceneSub(no) { return no <= 4 ? `수상한 질문 ${no} · ${lessonOf(no).title}` : '중간 수사 회의'; }
function openScene(no) {
  screen = 'scene'; curScene = no; save.here = no; persist();
  Sound.bgm('map');
  topBar(Pic.SCENES[no].name, sceneSub(no), true);
  stage.innerHTML = `<div class="scene-box"><div class="scene-frame">${Pic.scene(no)}</div></div>`;
  stage.querySelector('.npc-fig').onclick = () => { if (!busy) run(() => tapNpc(no)); };
  notes = no <= 4 ? buildNotes(no) : [];
  drawNotes(); drawTray();
  if (no <= 4 && save.L[no] === 0) run(() => startLesson(no));
  if (no === 5 && !save.boss) run(bossMeeting);
}
function drawNotes() {
  const svg = stage.querySelector('.scene-svg'); if (!svg) return;
  svg.querySelectorAll('.clue').forEach(n => n.remove());
  notes.forEach((n, i) => {
    const [x, y] = n.spot;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'clue'); g.dataset.i = i;
    g.innerHTML = `<circle class="halo" cx="${x}" cy="${y}" r="14" fill="${n.again ? '#ff9d7a' : '#ffd36e'}" opacity=".5"/>
      <g class="wig"><rect x="${x - 11}" y="${y - 9}" width="22" height="18" rx="2" fill="${n.again ? '#ffcfb0' : '#fff6c8'}" stroke="#d9b48a" stroke-width="1.5"/>
      <path d="M${x + 5} ${y - 9} L${x + 11} ${y - 3} L${x + 5} ${y - 3} Z" fill="#e8d4b0"/>
      <text x="${x - 1}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${n.again ? '#d9443c' : '#b07a45'}">${n.again ? '!' : '?'}</text></g>
      <rect x="${x - 20}" y="${y - 20}" width="40" height="40" fill="transparent"/>`;
    g.onclick = () => { if (!busy) run(() => openNote(n)); };
    svg.appendChild(g);
  });
}
function drawTray() {
  if (screen !== 'scene') return;
  const no = curScene;
  if (no === 5) {
    tray.innerHTML = `<div class="notebook"><div class="nb-head"><span>📚 중간 수사 회의</span><span>${save.boss ? '✓ 완료' : ''}</span></div>
      <button class="big ${save.boss ? 'mint' : ''}">${save.boss ? '🔁 회의 다시 하기' : '💬 진아쌤과 회의 시작'}</button></div>`;
    tray.querySelector('.big').onclick = () => run(bossMeeting);
    return;
  }
  const L = lessonOf(no), st = save.L[no];
  const slots = L.chunks.map(c => (save.caught[c.id] && !save.weak[c.id]) ? sealHTML(c) : `<div class="slot">${save.weak[c.id] ? '!' : '?'}</div>`).join('');
  let action = '';
  if (st === 0) action = `<div class="hint">${NPC_NAME[no]}을 눌러 이야기를 들어 봐요</div>`;
  else if (st === 1 && caughtIn(no) < 6) action = `<div class="hint">장면 속에 숨은 <b>단서 쪽지</b>를 찾아 눌러 봐요!${notes.some(n => n.again) ? '<br>🟠 날아간 쪽지도 다시 찾아요.' : ''}</div>`;
  else if (st < 3) action = `<button class="big" data-a="chat">💬 ${NPC_NAME[no]}과 1분 대화하기</button>`;
  else action = `<div class="btnrow"><button class="big ghost" data-a="review">🔁 복습 퀴즈</button><button class="big ghost" data-a="diary">📔 일기 ${no}쪽</button></div>
    ${notes.length ? '<div class="hint">🟠 오답 쪽지가 숨어 있어요. 찾아서 다시 풀어요!</div>' : ''}`;
  tray.innerHTML = `<div class="notebook"><div class="nb-head"><span>🗂 사건 파일 ${no}</span><span>도장 ${caughtIn(no)}/6</span></div>
    <div class="seals">${slots}</div>${action}</div>`;
  tray.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const k = b.dataset.a;
    if (k === 'chat') run(() => tapNpc(no));
    if (k === 'review') run(() => reviewLesson(no));
    if (k === 'diary') run(() => pageCard(no));
  });
  // 친구 머리 위 말풍선
  const svg = stage.querySelector('.scene-svg'); if (!svg) return;
  svg.querySelectorAll('.talk-ic').forEach(x => x.remove());
  if (st === 0 || (st < 3 && caughtIn(no) === 6)) {
    const n = Pic.SCENES[no].npc, cx = n.x + 30 * n.s;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'talk-ic');
    g.innerHTML = `<g class="talkme"><circle cx="${cx}" cy="${n.y - 12}" r="13" fill="#fff" stroke="#ffd36e" stroke-width="3"/><text x="${cx}" y="${n.y - 7}" text-anchor="middle" font-size="14">${st === 0 ? '!' : '💬'}</text></g>`;
    g.onclick = () => { if (!busy) run(() => tapNpc(no)); };
    svg.appendChild(g);
  }
}
function refresh() {
  if (screen === 'scene') { topBar(Pic.SCENES[curScene].name, sceneSub(curScene), true); drawTray(); }
  if (screen === 'map') showMap();
}

/* ───────── 이야기 ───────── */
async function startLesson(no) {
  await say(lessonOf(no).intro);
  save.L[no] = 1; persist();
  await say({ t: '🔍 이 장면 어딘가에 단서 쪽지 6장이 숨어 있어요.\n쪽지를 찾아 누르고, 문제를 풀면 도장을 받아요!' });
  notes = buildNotes(no); drawNotes();
}
async function tapNpc(no) {
  if (no === 5) return save.boss ? say({ who: '진아쌤', t: '수사 회의 결과는 메뉴 → 비밀 일기에서 다시 볼 수 있어.' }) : bossMeeting();
  const L = lessonOf(no), st = save.L[no];
  if (st === 0) return startLesson(no);
  if (st === 1 && caughtIn(no) < 6) return say([Object.assign({ who: NPC_NAME[no] }, L.waiting), { t: `단서 쪽지가 아직 ${6 - caughtIn(no)}장 남았어요.` }]);
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
  if (w) lines.push({ who: '진아쌤', t: `오답 카드가 ${w}장 있어. 메뉴(☰) → 오답 카드에서 바로 다시 풀 수 있어. 틀려도 괜찮아, 모른 채 지나가지만 않으면 돼!` });
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
function quiz(c, type = quizType(c)) {
  return new Promise(resolve => {
    const opts = shuffle([c].concat(distractors(c)));
    const NAME = { k2z: '뜻 → 중국어', z2k: '중국어 → 뜻', listen: '듣고 고르기', fill: '빈칸 채우기', order: '문장 조립' };
    const head = `<div class="qhead"><span>🔍 단서 쪽지 · ${NAME[type]}</span><button class="mini hintb" style="margin:0">💡 힌트 ${save.candy}</button></div>`;
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
    const p = card(`${head}<div class="qmain">${main}</div>${optHTML ? `<div class="opts c2">${optHTML}</div>` : ''}`, 'clue-card');
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
      <div class="say">${kind === 'miss' ? '앗, 쪽지가 바람에 날아갔어요! 소리 내어 따라 말해 보고, 날아간 쪽지를 다시 찾아요.' : '说出来！ 소리 내어 따라 말해 보세요.'}</div>
      <div class="row"><button class="btn s1">🔊 덩어리</button><button class="btn s2">🔊 예문</button><button class="btn go">계속 ▶</button></div></div>`);
    p.querySelector('.s1').onclick = () => speak(c);
    p.querySelector('.s2').onclick = () => TTS.speak(c.exSay || exText(c));
    const nav = navigate(p, { start: 2 });
    p.querySelector('.go').onclick = () => { TTS.stop(); nav.stop(); p.close(); resolve(); };
    if (kind !== 'miss') Sound.sfx('stamp');
    speak(c);
  });
}

async function openNote(n) {
  const c = CHUNK[n.id];
  Sound.sfx('paper');
  const wasWeak = !!save.weak[c.id], wasCaught = !!save.caught[c.id];
  const ok = await quiz(c);
  const g = stage.querySelector(`.clue[data-i="${notes.indexOf(n)}"]`);
  if (ok) {
    save.caught[c.id] = (save.caught[c.id] || 0) + 1;
    save.mastery[c.id] = (save.mastery[c.id] || 0) + 1;
    let kind = wasCaught && !wasWeak ? 'again' : 'new';
    if (wasWeak) { delete save.weak[c.id]; save.grad++; kind = 'grad'; }
    save.catches++; if (save.catches % 3 === 0) { save.candy++; toast('💡 힌트 사탕 +1'); }
    persist();
    notes = notes.filter(x => x !== n); drawNotes(); drawTray();
    await chunkCard(c, kind);
    const no = c.lesson;
    if (save.L[no] === 1 && caughtIn(no) === 6) {
      save.L[no] = 2; persist(); drawTray();
      await say({ t: `🗂 도장 6개를 모두 모았다!\n이제 ${NPC_NAME[no]}을 눌러 메신저로 대화해 보자.` });
    }
  } else {
    save.weak[c.id] = 1; save.mastery[c.id] = Math.max(0, (save.mastery[c.id] || 0) - 1); persist();
    if (g) { g.classList.add('fly'); Sound.sfx('wind'); await sleep(650); }
    await chunkCard(c, 'miss');
    const S = Pic.SCENES[c.lesson];
    const taken = new Set(notes.filter(x => x !== n).map(x => x.si));
    const free = [...S.spots.keys()].filter(k => !taken.has(k) && k !== n.si);
    n.si = shuffle(free)[0]; n.spot = S.spots[n.si]; n.again = true;
    drawNotes(); drawTray();
  }
}
async function reviewLesson(no) {
  let right = 0;
  await say({ t: `🔁 ${no}과 복습 퀴즈! 6문제를 풀어요. 틀린 덩어리는 오답 쪽지가 되어 장면에 숨어요.` });
  for (const c of shuffle(lessonOf(no).chunks)) {
    const ok = await quiz(c);
    if (ok) { right++; save.mastery[c.id] = (save.mastery[c.id] || 0) + 1; }
    else { save.weak[c.id] = 1; save.mastery[c.id] = Math.max(0, (save.mastery[c.id] || 0) - 1); }
    persist();
  }
  notes = buildNotes(no); drawNotes();
  await say({ t: `복습 끝! ${right} / 6 정답${right < 6 ? '\n🟠 오답 쪽지를 찾아서 다시 풀어 보자.' : ' 👏'}` });
}
async function weakDrill() {
  const list = weakList();
  if (!list.length) return say({ t: '오답 카드가 없어요. 아주 좋아요! 👍' });
  await say({ t: `🃏 오답 카드 ${list.length}장을 다시 풀어요. 맞히면 졸업!` });
  for (const c of list) {
    const ok = await quiz(c);
    if (ok) { delete save.weak[c.id]; save.grad++; save.caught[c.id] = (save.caught[c.id] || 0) + 1; save.mastery[c.id] = (save.mastery[c.id] || 0) + 1; persist(); await chunkCard(c, 'grad'); }
    else { persist(); await chunkCard(c, 'miss'); }
  }
  const left = weakList().length;
  await say({ t: left ? `아직 ${left}장 남았어요. 조금 뒤에 다시 만나요!` : '오답 카드를 모두 졸업시켰어요! 🎓' });
  if (screen === 'scene' && curScene <= 4) { notes = buildNotes(curScene); drawNotes(); }
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
  1: '지도에 2번 장소(교실동 2층)가 열렸어요!',
  2: '지도에 3번 장소(매점 小卖部)가 열렸어요!',
  3: '지도에 4번 장소(기숙사 宿舍)가 열렸어요!',
  4: '도서관(图书馆)이 열렸어요! 진아쌤이 중간 수사 회의를 준비하고 있대요.'
};
async function rewards(no, r) {
  const L = lessonOf(no);
  await pageCard(no);
  const s = await mySentence(L.mySentence);
  await missionCard(`2권 ${no}과`, L.mission, s);
  save.L[no] = 3; save.pages[no] = { sentence: s, first: r.first, total: r.total }; save.candy += 2; persist();
  await say([{ t: '💡 힌트 사탕 2개를 받았다!' }, { t: NEXT_TIP[no] }]);
}

async function bossMeeting() {
  await say(BOSS.intro);
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
    if (b.dataset.k === 'n') { store.set('save', null); save = newSave(); fade().then(() => run(newGame)); }
    else fade().then(showMap);
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
  showMap();
  await say([
    { who: '진아쌤', t: '안녕! 나는 진담중국어의 진아쌤이야.' },
    { who: '진아쌤', zh: '你好！欢迎来到中国！', py: 'Nǐ hǎo! Huānyíng lái dào Zhōngguó!', ko: '안녕! 중국에 온 걸 환영해!' },
    { who: '진아쌤', t: '이번 주에 너는 중국 星光中学(별빛 중학교)에 교환학생으로 왔어. 먼저 수사관 등록부터 하자!' }
  ]);
  await nameEntry();
  await say([
    { who: '진아쌤', t: '반가워, {name}! 그런데 큰일이 생겼어.' },
    { who: '진아쌤', t: '중국 친구 小雨의 "비밀 일기"가 바람에 날아가서 학교 곳곳에 흩어졌대.' },
    { who: '진아쌤', t: '일기마다 "수상한 질문"이 하나씩 적혀 있어. 장소마다 숨은 단서 쪽지를 찾아서 비밀을 풀어 보자!' },
    { who: '진아쌤', t: '쪽지 문제를 맞히면 빨간 도장을 받아. 틀리면 쪽지가 바람에 날아가서 다른 곳에 숨어. 다시 찾아서 꼭 풀자!' },
    { who: '진아쌤', t: '도장 6개를 모으면 중국 친구와 메신저로 1분 대화를 할 수 있어.' },
    { who: '진아쌤', t: '힌트 사탕 3개를 줄게. 어려운 문제에서 💡를 누르면 도움이 될 거야.' },
    { who: '진아쌤', t: '자, 지도에서 1번 장소(교실동 1층)를 눌러 봐!' },
    { who: '진아쌤', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' }
  ]);
  save.intro = true; persist();
}

/* 카카오톡 등 앱 안 브라우저 안내 */
if (/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp/i.test(navigator.userAgent || '')) setTimeout(() => toast('소리가 안 나면 크롬·사파리에서 열어 주세요'), 1500);

/* 확인용 */
window.__jdm = {
  get save() { return save; }, get busy() { return busy; }, get screen() { return screen; }, get notes() { return notes; },
  press, openScene, showMap, questText,
  catchAll(n) { lessonOf(n).chunks.forEach(c => { save.caught[c.id] = 1; delete save.weak[c.id]; }); if (save.L[n] === 1) save.L[n] = 2; persist(); if (screen === 'scene') { notes = buildNotes(curScene); drawNotes(); drawTray(); } }
};
titleScreen();
