/* 진담 아침 만두가게 — 게임 본체
   하루: 🌅 아침 영업(서빙) → 💰 정산 → 🌄 저녁 활동(시장·강 낚시·농가) 2곳 → 🌙 밤(새 메뉴·가게 꾸미기) → 다음 날 */
const APP_VERSION = 'v0.1.0 (2026.10.28)';
const KEY = 'jmd1-';
const W = 160, KY = 118;

/* ───────── 저장 ───────── */
function newSave() {
  return { v: 1, name: '', look: 'girl', intro: false, day: 1, coins: 30, inv: { pork: 3 }, seen: { pork: 1 },
    foods: ['rou'], drinks: ['hong'], up: { steamer: 2, seat: 3, kettle: 0, lantern: 0, hand: 0 },
    notes: {}, grad: 0, friends: {}, stats: { served: 0, missed: 0 }, phase: 'morning' };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(KEY)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
};
let save = Object.assign(newSave(), store.get('save', {}) || {});
const set = Object.assign({ py: true, ko: true, rate: 0.85, sfx: true, bgm: true }, store.get('set', {}));
const persist = () => store.set('save', save);
const persistSet = () => store.set('set', set);
TTS.setRate(set.rate); Sound.setSfx(set.sfx); Sound.setBgm(set.bgm);

/* ───────── 도우미 ───────── */
const $ = s => document.querySelector(s);
const hud = $('#hud'), stage = $('#stage'), cv = $('#cv'), ov = $('#ov'), bar = $('#bar'), uiRoot = $('#ui');
const ctx = cv.getContext('2d');
let H = 260;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[(Math.random() * a.length) | 0];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const speak = o => TTS.speak(typeof o === 'string' ? o : (o.say || o.zh));
function toast(msg) { const t = el(`<div class="toast">${esc(msg)}</div>`); uiRoot.appendChild(t); setTimeout(() => t.remove(), 1900); }
const inv = k => save.inv[k] || 0;
function addInv(k, n = 1) { save.inv[k] = inv(k) + n; save.seen[k] = 1; }
const DIG = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'], DIGP = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
function numZh(n) {
  if (n < 10) return [DIG[n] || '零', DIGP[n] || 'líng'];
  const t = Math.floor(n / 10), o = n % 10;
  return [(t > 1 ? DIG[t] : '') + '十' + (o ? DIG[o] : ''), (t > 1 ? DIGP[t] : '') + 'shí' + (o ? DIGP[o] : '')];
}
const lineHTML = (l, big) => `<div class="zh ${big ? 'big' : ''}">${esc(l.zh || l[0])}</div>${set.py ? `<div class="py">${esc(l.py || l[1])}</div>` : ''}${set.ko ? `<div class="ko">${esc(l.ko || l[2])}</div>` : ''}`;
const L3 = a => ({ zh: a[0], py: a[1], ko: a[2] });

/* 화면 크기 */
function fit() {
  const app = document.getElementById('app');
  const w = app.clientWidth, avail = app.clientHeight - hud.offsetHeight - 210;
  H = 212;
  cv.width = W; cv.height = H;
  const cw = Math.max(200, Math.min(w, avail * W / H)), ch = cw * H / W;
  cv.style.width = ov.style.width = cw + 'px'; cv.style.height = ov.style.height = ch + 'px';
  stage.style.height = ch + 'px';
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', fit);
const toPct = (x, y) => [x / W * 100, y / H * 100];

/* ───────── 대화·카드 ───────── */
function card(html, cls = '') {
  const dim = el('<div class="dim"></div>'); uiRoot.appendChild(dim);
  const c = el(`<div class="card ${cls}">${html}</div>`); uiRoot.appendChild(c);
  c.close = () => { dim.remove(); c.remove(); };
  return c;
}
let enterHook = null;
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && enterHook) { e.preventDefault(); enterHook(); } });
function say(lines, who) {
  return [].concat(lines).reduce((p, l) => p.then(() => new Promise(res => {
    const isZh = Array.isArray(l) || l.zh;
    const b = el(`<div class="box">${who && who.img ? `<img class="face" src="${who.img}">` : ''}<div class="body">${who ? `<div class="who">${esc(who.name)}</div>` : ''}
      ${isZh ? lineHTML(Array.isArray(l) ? L3(l) : l) + '<button class="mini sp">🔊</button>' : `<div class="t">${esc(String(l.t || l).replace(/\{name\}/g, save.name || '나'))}</div>`}<div class="more">▼</div></div></div>`);
    uiRoot.appendChild(b);
    if (isZh) { const o = Array.isArray(l) ? L3(l) : l; speak(o); b.querySelector('.sp').onclick = e => { e.stopPropagation(); speak(o); }; }
    const done = () => { enterHook = null; b.remove(); Sound.sfx('blip'); res(); };
    b.onclick = done; enterHook = done;
  })), Promise.resolve());
}
/* 중국어로 고르기: line(상대 말) + options [{zh,py}] → 고른 번호 */
function talkChoose(who, line, options, note = '') {
  return new Promise(res => {
    const c = card(`<div class="talk">${who.img ? `<img class="face" src="${who.img}">` : ''}<div><div class="who">${esc(who.name)}</div>${lineHTML(line)}<button class="mini sp">🔊</button></div></div>
      ${note ? `<div class="hintline">${esc(note)}</div>` : ''}
      <div class="opts">${options.map((o, i) => `<button class="btn" data-i="${i}" ${o.dis ? 'disabled' : ''}><span class="bz">${esc(o.zh)}</span>${set.py && o.py ? `<span class="bp">${esc(o.py)}</span>` : ''}${o.sub ? `<span class="bk">${esc(o.sub)}</span>` : ''}</button>`).join('')}</div>`, 'talkcard');
    c.querySelector('.sp').onclick = () => speak(line);
    speak(line);
    c.querySelectorAll('.btn').forEach(b => b.onclick = () => { Sound.sfx('sel'); c.close(); const o = options[+b.dataset.i]; if (o.zh && !o.silent) speak(o); res(+b.dataset.i); });
  });
}
function infoCard(html, btn = '계속 ▶') {
  return new Promise(res => {
    const c = card(html + `<div class="row"><button class="btn go">${btn}</button></div>`);
    c.querySelectorAll('[data-say]').forEach(d => d.onclick = () => TTS.speak(d.dataset.say));
    c.querySelector('.go').onclick = () => { TTS.stop(); c.close(); res(); };
  });
}

/* ───────── 화면 전환 ───────── */
let screen = 'title';
let hits = [];
function setHud() {
  requestAnimationFrame(fit);
  if (screen === 'title') { hud.innerHTML = ''; return; }
  const clock = screen === 'morning' ? clockText() : { evening: '🌄 저녁', market: '🌄 시장', river: '🌄 강가', farm: '🌄 농가', night: '🌙 밤', summary: '💰 정산' }[screen] || '';
  hud.innerHTML = `<span class="day">${save.day}일째</span><span class="clk">${clock}</span><span class="coin">💰 ${save.coins}块</span>${screen === 'evening' ? `<span class="en">🌄 ${'●'.repeat(E.energy)}${'○'.repeat(Math.max(0, 2 - E.energy))}</span>` : ''}<button class="ib" id="mbtn">☰</button>`;
  $('#mbtn').onclick = openMenu;
}
function go(s) { screen = s; ov.innerHTML = ''; bar.innerHTML = ''; hits = []; if (s !== 'title') { save.phase = s; persist(); } setHud(); }

/* 캔버스 누르기 */
let holding = null;
cv.addEventListener('pointerdown', e => {
  Sound.init();
  const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  if (uiRoot.querySelector('.card,.box')) return;
  for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { if (h.hold) { holding = h; h.hold(true); } else h.fn(x, y); return; } }
  if (screen === 'river') riverTap(); if (screen === 'farm') farmTap(x, y);
});
const endHold = () => { if (holding) { holding.hold(false); holding = null; } };
window.addEventListener('pointerup', endHold); window.addEventListener('pointercancel', endHold);
const hit = (x, y, w, h, fn, hold) => hits.push({ x, y, w, h, fn, hold });

/* ───────── 🌅 아침 영업 ───────── */
let M = null;
const DUR = 150;
const seatXs = () => { const n = save.up.seat; return Array.from({ length: n }, (_, i) => Math.round(6 + i * (136 / n) + (136 / n - 14) / 2)); };
function clockText() { const m = 6 * 60 + 30 + Math.floor((M ? Math.min(M.t, DUR) : 0) / DUR * 120); return `⏰ ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; }
function startMorning() {
  go('morning'); Sound.bgm('map');
  M = { t: 0, customers: [], steamers: Array.from({ length: save.up.steamer }, () => ({ state: 'idle', p: 0, n: 0, t: 0 })), cup: null, hand: [], spawnT: 3, served: 0, missed: 0, earn: 0, tips: 0,
    focus: null, chefX: 60, chefTX: 60, paused: false, seq: 0, wrongToday: [], talked: {}, done: false, first: save.day === 1 };
  drawBar(); fit();
}
const handMax = () => save.up.hand ? 3 : 2;
function itemName(key) {
  if (FOODS[key]) return { zh: FOODS[key].zh, py: FOODS[key].py, ko: FOODS[key].ko };
  const [b, t] = key.split('-'), d = DRINKS[b], tp = TEMP[t];
  return { zh: tp.zh + d.zh, py: tp.py + ' ' + d.py, ko: tp.ko + ' ' + d.ko };
}
function availFoods() { return save.foods.filter(k => canCook(k) || M.steamers.some(s => s.state === 'ready' && s.food === k)); }
function canCook(k) { const need = [].concat(FOODS[k].need); return need.every(n => inv(n) > 0); }
function availDrinks() { const d = []; save.drinks.forEach(b => { if (b === 'nai' && inv('milk') <= 0) return; d.push(b); }); return d; }
function makeOrder(reg) {
  const day = save.day, foods = availFoods(), drinks = availDrinks();
  const entries = [];
  const noteKeys = Object.keys(save.notes).filter(k => (FOODS[k] ? foods.includes(k) : drinks.includes(k.split('-')[0])));
  const nEntries = M.first && M.seq < 2 ? 1 : day === 1 ? (Math.random() < .5 ? 1 : 2) : 1 + ((Math.random() * Math.min(3, day)) | 0);
  const used = new Set();
  const addFood = k => { if (!k || used.has(k)) return; used.add(k); const u = FOODS[k].unit; entries.push({ key: k, n: u === 'fen' ? 1 : (Math.random() < .55 ? 1 : 2), left: 0 }); };
  const addDrink = k => { if (!k || used.has(k)) return; used.add(k); entries.push({ key: k, n: 1, left: 0 }); };
  const randDrink = () => drinks.length ? pick(drinks) + '-' + (Math.random() < .5 ? 'hot' : 'ice') : null;
  if (noteKeys.length && Math.random() < .5) { const k = pick(noteKeys); FOODS[k] ? addFood(k) : addDrink(k); }
  if (M.first && M.seq < 2) addFood(foods[0] || 'rou');
  while (entries.length < nEntries) {
    const wantDrink = drinks.length && (!foods.length || (M.seq >= 2 || !M.first) && Math.random() < .45);
    if (wantDrink) addDrink(randDrink()); else if (foods.length) addFood(pick(foods)); else break;
    if (used.size >= foods.length + drinks.length * 2) break;
  }
  if (!entries.length) addFood('rou');
  entries.forEach(e => e.left = e.n);
  const st = pick(ORDER_START);
  const parts = entries.map(e => {
    const nm = itemName(e.key), unit = FOODS[e.key] ? FOODS[e.key].unit : 'bei', num = NUM[unit][e.n];
    return { zh: num[0] + nm.zh, py: num[1] + ' ' + nm.py, ko: `${nm.ko} ${e.n}${NUM[unit].ko}` };
  });
  entries.forEach((e, i) => e.zh = parts[i].zh);
  const line = { zh: st[0] + parts.map(p => p.zh).join('，') + '。', py: st[1] + ' ' + parts.map(p => p.py).join(', ') + '.', ko: parts.map(p => p.ko).join(', ') + ' 주세요.' };
  return { entries, line };
}
function spawnGuest() {
  const xs = seatXs(), taken = new Set(M.customers.filter(c => c.state !== 'leave').map(c => c.seat));
  const free = xs.map((_, i) => i).filter(i => !taken.has(i)); if (!free.length) return;
  const seat = free[0];
  let g = pick(GUESTS), reg = false;
  if (save.day >= 2 && Math.random() < .28) { const rs = REGULARS.filter(r => !M.talked[r.id] && !M.customers.some(c => c.g.id === r.id)); if (rs.length) { g = pick(rs); reg = true; } }
  const { entries, line } = makeOrder(reg);
  const max = 32 * g.patience * (save.up.lantern ? 1.3 : 1) * (save.day === 1 ? 1.4 : 1);
  const c = { id: ++M.seq, g, reg, seat, x: 162, tx: xs[seat], state: 'walk', entries, line, pat: max, max, mood: 'ok', t: 0, say: null };
  M.customers.push(c);
  Sound.sfx('door');
}
function bubble(c) {
  if (!c.el) { c.el = el('<div class="bub"></div>'); ov.appendChild(c.el); c.el.onclick = () => { M.focus = c; speak(c.line); drawBar(); }; }
  const [l, t] = toPct(c.x - 4, 28);
  c.el.style.left = l + '%'; c.el.style.top = t + '%'; c.el.style.width = (22 / W * 100) + '%';
  if (c.state === 'walk') { c.el.style.display = 'none'; return; }
  c.el.style.display = '';
  const ratio = Math.max(0, c.pat / c.max);
  const html = c.say ? `<div class="sayl">${esc(c.say.zh)}</div>` :
    c.state === 'order' ? c.entries.map(e => `<div class="ol ${e.left ? '' : 'ok'}">${esc(e.zh)}${e.left && e.n > 1 && e.left < e.n ? ` <small>(${e.left} 남음)</small>` : ''}</div>`).join('') + `<div class="pat"><i style="width:${ratio * 100}%;background:${ratio > .5 ? '#7fd6a8' : ratio > .25 ? '#ffd36e' : '#ff8a7a'}"></i></div>` :
    c.state === 'eat' ? '<div class="sayl">😋 …</div>' : '';
  if (c._h !== html) { c.el.innerHTML = html; c._h = html; }
  c.el.classList.toggle('focus', M.focus === c);
  c.el.classList.toggle('hurry', c.state === 'order' && ratio < .25);
}
function guestSay(c, arr, ms = 1600) { c.say = L3(arr); speak(c.say); setTimeout(() => { if (c.say && c.say.zh === arr[0]) c.say = null; }, ms); }
function deliver(c) {
  if (c.state !== 'order') return;
  M.focus = c; M.chefTX = c.x;
  if (!M.hand.length) { speak(c.line); drawBar(); return; }
  const hi = M.hand.findIndex(k => c.entries.some(e => e.key === k && e.left > 0));
  if (hi < 0) {
    c.pat -= c.max * .18; c.mood = 'angry'; setTimeout(() => c.mood = 'ok', 900); Sound.sfx('bad');
    guestSay(c, SAY.wrong);
    const e = c.entries.find(e => e.left > 0); if (e) noteWrong(e.key);
    drawBar(); return;
  }
  const k = M.hand.splice(hi, 1)[0]; const e = c.entries.find(e => e.key === k && e.left > 0); e.left--;
  Sound.sfx('pop');
  if (save.notes[k] && e.left === 0) { save.notes[k].ok = (save.notes[k].ok || 0) + 1; if (save.notes[k].ok >= 1) { delete save.notes[k]; save.grad++; floatText(c.x + 7, 40, '🎓 졸업!'); } }
  if (c.entries.every(e => e.left === 0)) { c.state = 'eat'; c.t = 0; c.mood = 'eat'; }
  drawBar();
}
function noteWrong(key) {
  const n = itemName(key);
  save.notes[key] = Object.assign(save.notes[key] || {}, n, { ok: 0 });
  if (!M.wrongToday.includes(key)) M.wrongToday.push(key);
  persist();
}
function floatText(x, y, t) { const f = el(`<div class="float">${esc(t)}</div>`); const [l, tt] = toPct(x, y); f.style.left = l + '%'; f.style.top = tt + '%'; ov.appendChild(f); setTimeout(() => f.remove(), 1300); }
async function payAndLeave(c) {
  const sum = c.entries.reduce((s, e) => s + (FOODS[e.key] ? FOODS[e.key].price : DRINKS[e.key.split('-')[0]].price) * e.n, 0);
  const tip = Math.ceil(Math.max(0, c.pat / c.max) * 4);
  M.earn += sum; M.tips += tip; save.coins += sum + tip; M.served++; save.stats.served++;
  floatText(c.x + 7, 52, `+${sum + tip}块`); Sound.sfx('good');
  c.mood = 'happy'; guestSay(c, pick(SAY.thanks), 1500);
  persist(); setHud();
  if (c.reg && !M.talked[c.g.id]) { M.talked[c.g.id] = 1; await sleep(900); await smallTalk(c); }
  setTimeout(() => { c.state = 'leave'; c.tx = 170; c.say = null; }, 900);
}
async function smallTalk(c) {
  M.paused = true;
  const L = LESSONS[c.g.lesson - 1]; const tn = pick(L.battle.filter(t => t.type === 'reply'));
  const who = { name: c.g.name, img: Pix.bustImg(c.g, 'happy') };
  const opts = shuffle(tn.opts.map((o, i) => Object.assign({}, o, { right: i === 0 })));
  let tries = 0;
  while (true) {
    const i = await talkChoose(who, tn.q, opts, tries ? `💡 "${tn.q.ko}" — 알맞은 대답을 다시 골라요` : '💬 단골 손님이 말을 걸어요! 알맞은 대답을 골라요');
    if (opts[i].right) break;
    opts[i].dis = true; tries++; Sound.sfx('bad');
    await say([['嗯？我不太明白……', 'Èng? Wǒ bú tài míngbai……', '응? 잘 모르겠어…']], who);
  }
  Sound.sfx('good');
  await say([tn.react], who);
  const tip = tries ? 2 : 6; save.coins += tip; M.tips += tip; save.friends[c.g.id] = (save.friends[c.g.id] || 0) + 1; persist(); setHud();
  toast(`💛 ${c.g.name}과 더 친해졌어요! 팁 +${tip}块`);
  M.paused = false;
}
function tapSteamer(s) {
  M.chefTX = 6 + M.steamers.indexOf(s) * 26;
  if (s.state === 'steam') return toast('아직 찌는 중이에요');
  if (s.state === 'burnt') { s.state = 'idle'; Sound.sfx('bad'); return toast('타 버려서 버렸어요'); }
  if (s.state === 'ready') {
    if (M.hand.length >= handMax()) return toast('손이 가득 찼어요');
    M.hand.push(s.food); s.n--; if (s.n <= 0) s.state = 'idle'; Sound.sfx('pop'); drawBar(); return;
  }
  const can = save.foods.filter(canCook);
  if (!can.length) { const k = save.foods[0]; return toast(`재료가 없어요! (${[].concat(FOODS[k].need).map(n => INGR[n].zh).join('·')}) 저녁에 시장에 가요`); }
  const start = k => { [].concat(FOODS[k].need).forEach(n => save.inv[n]--); s.state = 'steam'; s.food = k; s.p = 0; s.t = 0; Sound.sfx('paper'); persist(); drawBar(); };
  if (can.length === 1) return start(can[0]);
  M.paused = true;
  const c = card(`<h3>무엇을 찔까요?</h3><div class="opts">${can.map(k => `<button class="btn" data-k="${k}"><img class="ic" src="${Pix.icon(k)}"><span class="bz">${esc(FOODS[k].zh)}</span>${set.py ? `<span class="bp">${esc(FOODS[k].py)}</span>` : ''}<span class="bk">${esc(FOODS[k].ko)} · 재료 ${Math.min(...[].concat(FOODS[k].need).map(inv))}번</span></button>`).join('')}</div>`, 'small-card');
  c.querySelectorAll('.btn').forEach(b => b.onclick = () => { c.close(); M.paused = false; speak(FOODS[b.dataset.k].zh); start(b.dataset.k); });
}
function tapCupStack(temp) {
  M.chefTX = temp === 'hot' ? 88 : 100;
  if (M.cup) return toast('컵이 이미 놓여 있어요');
  M.cup = { temp, base: null, fill: 0, milk: false }; Sound.sfx('pop'); drawBar();
}
function holdPot(kind, on) {
  M.chefTX = 110;
  if (!on) { M.pouring = null; drawBar(); return; }
  if (!M.cup) { toast('먼저 컵을 놓아요 (热 따뜻한 컵 / 冰 얼음 컵)'); return; }
  if (M.cup.base && M.cup.base !== kind && M.cup.fill > .05) { M.cup = null; Sound.sfx('bad'); toast('다른 차가 섞여 버렸어요!'); return; }
  M.cup.base = kind; M.pouring = kind;
}
function tapMilk() {
  if (!M.cup || M.cup.base !== 'hong' || M.cup.fill < .6) return toast('홍차를 먼저 선까지 따라요');
  if (M.cup.milk) return;
  if (inv('milk') <= 0) return toast('우유가 없어요');
  save.inv.milk--; M.cup.milk = true; Sound.sfx('pop'); persist(); drawBar();
}
function tapCup() {
  if (!M.cup) return;
  if (!M.cup.base || M.cup.fill < .7) return toast('선까지 따라요');
  if (M.hand.length >= handMax()) return toast('손이 가득 찼어요');
  M.hand.push((M.cup.milk ? 'nai' : M.cup.base) + '-' + M.cup.temp); M.cup = null; Sound.sfx('pop'); drawBar();
}
function hint() {
  if (save.day > 2) return '';
  const f = M.focus && M.focus.state === 'order' ? M.focus : M.customers.find(c => c.state === 'order');
  if (M.cup && M.cup.fill < .7) return '주전자를 꾹 누르고 있다가, 하얀 선까지 차면 손을 떼요';
  if (M.cup && M.cup.fill >= .7) return M.cup.base === 'hong' && save.drinks.includes('nai') && f && f.entries.some(e => e.left && e.key.startsWith('nai')) && !M.cup.milk ? '밀크티는 홍차에 우유병을 눌러 넣어요' : '컵을 눌러 손에 들어요';
  if (M.hand.length) return '주문한 손님을 눌러 건네요 (말풍선을 누르면 다시 들려줘요)';
  if (M.steamers.some(s => s.state === 'ready')) return '다 쪄졌어요! 찜기를 눌러 만두를 들어요';
  if (f && f.entries.some(e => e.left && !FOODS[e.key])) return '음료 주문! 热 = 따뜻한 컵, 冰 = 얼음 컵을 눌러요';
  if (M.steamers.every(s => s.state === 'idle')) return '찜기를 눌러 만두를 쪄요 (미리 쪄 두면 빨라요)';
  return '';
}
function drawBar() {
  if (screen !== 'morning') return;
  const f = M.focus && M.customers.includes(M.focus) && M.focus.state === 'order' ? M.focus : M.customers.find(c => c.state === 'order');
  const slots = Array.from({ length: handMax() }, (_, i) => { const k = M.hand[i]; return k ? `<div class="hs"><img src="${Pix.icon(k)}"><span>${esc(itemName(k).zh)}</span></div>` : '<div class="hs empty">빈 손</div>'; }).join('');
  const h = hint();
  bar.innerHTML = `<div class="order">${f ? `<div class="olabel">🧾 ${esc(f.g.name)}의 주문</div>${lineHTML(f.line)}<button class="mini sp">🔊</button>` : '<div class="olabel">손님을 기다리는 중… ☕</div>'}</div>
    ${h ? `<div class="hintline">👉 ${esc(h)}</div>` : ''}
    <div class="hand"><span class="hl">손</span>${slots}<button class="mini trash">🗑 내려놓기</button></div>`;
  const sp = bar.querySelector('.sp'); if (sp) sp.onclick = () => speak(f.line);
  bar.querySelector('.trash').onclick = () => { if (M.hand.length) { M.hand.pop(); Sound.sfx('blip'); drawBar(); } };
  bar._h = h;
}
function updateMorning(dt) {
  if (M.paused || uiRoot.querySelector('.card')) return;
  M.t += dt;
  // 손님 오기
  M.spawnT -= dt;
  const rush = M.t > DUR * .5 && M.t < DUR * .8;
  if (M.t < DUR - 14 && M.spawnT <= 0) { spawnGuest(); M.spawnT = (save.day === 1 ? 12 : 9) * (rush ? .6 : 1) * (.8 + Math.random() * .4); }
  // 찜기
  M.steamers.forEach(s => {
    if (s.state === 'steam') { s.p += dt / 5; if (s.p >= 1) { s.state = 'ready'; s.n = FOODS[s.food].batch; s.t = 0; Sound.sfx('sel'); drawBar(); } }
    else if (s.state === 'ready') { s.t += dt; if (s.t > 25) { s.state = 'burnt'; drawBar(); } }
  });
  // 따르기
  if (M.pouring && M.cup) { M.cup.fill += dt * (save.up.kettle ? .9 : .55); if (M.cup.fill > 1.05) { M.cup = null; M.pouring = null; Sound.sfx('bad'); toast('넘쳤어요! 다시 따라요'); drawBar(); } }
  // 요리사
  M.chefX += Math.sign(M.chefTX - M.chefX) * Math.min(Math.abs(M.chefTX - M.chefX), dt * 90);
  // 손님
  M.customers.forEach(c => {
    if (c.state === 'walk' || c.state === 'leave') {
      c.x += Math.sign(c.tx - c.x) * Math.min(Math.abs(c.tx - c.x), dt * 60);
      if (c.state === 'walk' && c.x === c.tx) { c.state = 'order'; guestSay(c, pick(SAY.hello), 900); setTimeout(() => { if (c.state === 'order') { c.say = null; if (!M.focus || M.focus.state !== 'order') M.focus = c; speak(c.line); drawBar(); } }, 1000); }
    } else if (c.state === 'order') {
      c.pat -= dt;
      if (c.pat < c.max * .25 && !c.warned) { c.warned = 1; guestSay(c, SAY.wait, 1200); }
      if (c.pat <= 0) { c.state = 'leave'; c.tx = 170; c.mood = 'angry'; M.missed++; save.stats.missed++; c.entries.filter(e => e.left).forEach(e => noteWrong(e.key)); guestSay(c, SAY.slow, 1500); Sound.sfx('bad'); if (M.focus === c) M.focus = null; drawBar(); }
    } else if (c.state === 'eat') {
      c.t += dt; if (c.t > 2.2 && !c.paid) { c.paid = 1; payAndLeave(c); }
    }
  });
  M.customers.filter(c => c.state === 'leave' && c.x >= 168).forEach(c => { if (c.el) c.el.remove(); });
  M.customers = M.customers.filter(c => !(c.state === 'leave' && c.x >= 168));
  if (Math.floor(M.t * 2) !== M._ht) { M._ht = Math.floor(M.t * 2); setHud(); if (hint() !== bar._h) drawBar(); }
  if (M.t >= DUR && !M.done) {
    if (!M.customers.length || M.t > DUR + 25) { M.done = true; M.customers.forEach(c => c.el && c.el.remove()); M.customers = []; endMorning(); }
  }
}
function drawMorning(t) {
  hits = [];
  Pix.use(ctx);
  const xs = seatXs();
  Pix.shop(W, KY, t, xs);
  // 손님 (카운터 뒤)
  M.customers.forEach(c => {
    Pix.bust(c.x, 74, c.g, t + c.id * 400, c.mood);
    Pix.r(0, 96, 0, 0, '#000');
    if (c.state === 'order') hit(c.x - 3, 60, 20, 40, () => deliver(c));
    if (c.state === 'eat') { Pix.food(c.x + 3, 92, FOODS[c.entries.find(e => FOODS[e.key])?.key || 'rou']?.color || 'bun'); }
    bubble(c);
  });
  // 카운터 앞부분 다시 (손님 몸 가리기)
  Pix.r(0, 96, W, 3, Pix.OL); Pix.r(0, 99, W, 4, '#e0a86a'); Pix.r(0, 103, W, KY - 103, '#b0703c');
  for (let x = 6; x < W; x += 20) Pix.r(x, 106, 8, KY - 110, '#a3642f');
  // 주방
  Pix.kitchen(W, KY, H);
  M.steamers.forEach((s, i) => { const x = 4 + i * 27, y = KY + 14; Pix.steamer(x, y, s, t); hit(x, y - 6, 25, 34, () => tapSteamer(s)); });
  // 컵 더미
  Pix.cup(90, KY + 12, 'hot'); Pix.cup(103, KY + 11, 'ice');
  hit(88, KY + 8, 13, 16, () => tapCupStack('hot')); hit(101, KY + 8, 13, 16, () => tapCupStack('ice'));
  Pix.r(116, KY + 10, 26, 18, '#b9794a');
  if (M.cup) {
    Pix.cup(121, KY + 13, M.cup.temp, M.cup.base, M.cup.fill, M.cup.milk);
    Pix.r(134, KY + 10, 5, 16, Pix.OL); Pix.r(135, KY + 11, 3, 14, '#fff');
    const fh = Math.min(14, 14 * M.cup.fill); Pix.r(135, KY + 25 - fh, 3, fh, M.cup.fill > 1 ? '#e2504c' : M.cup.fill >= .7 ? '#7fd6a8' : '#ffd36e');
    Pix.r(133, KY + 25 - 14 * .7, 7, 1, '#3b2a35'); Pix.r(133, KY + 25 - 14 * 1, 7, 1, '#e2504c');
    if (M.pouring) Pix.r(126, KY + 6, 2, 8, M.pouring === 'dou' ? '#f3e6c4' : M.pouring === 'lv' ? '#7cbf5a' : '#b2452e');
    hit(117, KY + 9, 17, 18, tapCup);
  }
  // 주전자
  const pots = ['hong', 'dou', 'lv'].filter(k => save.drinks.includes(k));
  pots.forEach((k, i) => { const x = 90 + i * 17, y = KY + 34; Pix.pot(x, y, k); hit(x - 1, y - 2, 18, 20, null, on => holdPot(k, on)); });
  if (save.drinks.includes('nai')) { Pix.pot(141, KY + 34, 'milk'); hit(140, KY + 32, 18, 20, tapMilk); }
  // 요리사
  Pix.chef(Math.round(M.chefX), KY + 52 + Math.min(20, H - KY - 80), t, Math.abs(M.chefTX - M.chefX) > 1, save.look);
  labels([[16, KY + 47, '찜기'], [95, KY + 28, '热 / 冰 컵'], [121, KY + 54, '주전자 (꾹)']]);
}
let labelKey = '';
function labels(list) {
  const k = list.map(a => a.join()).join('|'); if (k === labelKey && ov.querySelector('.lbl')) return; labelKey = k;
  ov.querySelectorAll('.lbl').forEach(x => x.remove());
  list.forEach(([x, y, t]) => { const d = el(`<div class="lbl">${esc(t)}</div>`); const [l, tt] = toPct(x, y); d.style.left = l + '%'; d.style.top = tt + '%'; ov.appendChild(d); });
}
async function endMorning() {
  Sound.bgm('win');
  go('summary');
  const notes = M.wrongToday.map(k => itemName(k));
  await infoCard(`<h2>💰 ${save.day}일째 아침 영업 끝!</h2>
    <div class="sum"><div>😋 손님 <b>${M.served}</b>명</div><div>😢 놓친 손님 <b>${M.missed}</b>명</div><div>💰 매출 <b>${M.earn}块</b> + 팁 <b>${M.tips}块</b></div></div>
    ${notes.length ? `<h3>🧾 다시 익힐 주문 (내일 또 나와요)</h3><div class="notes">${notes.map(n => `<div class="note" data-say="${esc(n.zh)}"><b>${esc(n.zh)}</b> <span>${esc(n.py)}</span> · ${esc(n.ko)} 🔊</div>`).join('')}</div>` : '<div class="good">👏 틀린 주문 없이 해냈어요!</div>'}`, '🌄 저녁 시간으로');
  startEvening();
}

/* ───────── 🌄 저녁: 마을 ───────── */
let E = { energy: 2 };
function startEvening() { E = { energy: 2 }; go('evening'); Sound.bgm('title'); eveningBar(); }
function eveningBar() {
  bar.innerHTML = `<div class="order"><div class="olabel">🌄 저녁에는 두 곳을 갈 수 있어요 (남은 기회 ${E.energy})</div>
    <div class="small">시장에서 재료를 사고, 강에서 낚시하고, 농가에서 달걀·우유·버섯을 얻어요.</div></div>
    <div class="row"><button class="btn" data-g="market">🏪 시장</button><button class="btn" data-g="river">🎣 강</button><button class="btn" data-g="farm">🐔 농가·산</button><button class="btn home" data-g="home">🏠 집으로</button></div>
    <div class="small">📦 ${Object.keys(save.inv).filter(k => inv(k) > 0).map(k => `${INGR[k].zh}×${inv(k)}`).join(' · ') || '창고가 비었어요'}</div>`;
  bar.querySelectorAll('[data-g]').forEach(b => { if (b.dataset.g !== 'home' && E.energy <= 0) b.disabled = true; b.onclick = () => goPlace(b.dataset.g); });
}
function goPlace(p) {
  if (p === 'home') return startNight();
  if (E.energy <= 0) return;
  E.energy--; Sound.sfx('door');
  if (p === 'market') startMarket(); if (p === 'river') startRiver(); if (p === 'farm') startFarm();
}
function drawEvening(t) {
  hits = []; Pix.use(ctx); const r = Pix.r;
  r(0, 0, W, H, '#f7c89a'); r(0, 0, W, 40, '#f4a98a'); Pix.disc(120, 34, 10, '#ffd36e');
  r(0, 40, W, 30, '#a7c98a'); for (let x = 0; x < W; x += 24) Pix.disc(x + 10, 44, 12, '#8fb877');
  r(0, 70, W, H - 70, '#bfe0a0');
  r(70, 70, 20, H - 70, '#ecd2ab');                     // 길
  r(110, 70, 50, H - 70, '#7fb6e8'); for (let y = 80; y < H; y += 14) r(116 + (y % 28 ? 8 : 0), y, 14, 2, '#bfe0ff'); // 강
  [[10, 90, 'market'], [10, 170, 'farm'], [118, 120, 'river'], [64, H - 46, 'home']].forEach(([x, y, k]) => {
    if (k === 'market') { r(x, y, 50, 30, Pix.OL); r(x + 1, y + 1, 48, 28, '#fffaf2'); for (let i = 0; i < 5; i++) r(x + i * 10, y - 6, 10, 7, i % 2 ? '#fff' : '#e2504c'); }
    if (k === 'farm') { r(x, y, 46, 28, Pix.OL); r(x + 1, y + 1, 44, 26, '#e0a86a'); r(x - 2, y - 8, 50, 9, '#c0392b'); r(x + 30, y + 14, 8, 13, '#7a4a28'); }
    if (k === 'river') { r(x, y, 30, 4, '#a3642f'); r(x + 4, y + 4, 2, 10, '#7a4a28'); }
    if (k === 'home') { r(x, y, 32, 26, Pix.OL); r(x + 1, y + 1, 30, 24, '#fff4e8'); r(x - 3, y - 7, 38, 8, '#e2504c'); r(x + 12, y + 12, 8, 13, '#a8693a'); }
  });
  labels([[12, 124, '🏪 시장'], [12, 202, '🐔 농가·산'], [116, 140, '🎣 강'], [62, H - 16, '🏠 집']]);
}

/* 🏪 시장 */
function startMarket() {
  go('market'); Sound.bgm('map');
  bar.innerHTML = `<div class="order"><div class="olabel">🏪 시장 — 가게를 눌러 중국어로 사요</div><div class="small">필요한 재료: ${save.foods.map(k => [].concat(FOODS[k].need).map(n => INGR[n].zh).join('+')).join(', ')}</div></div>
    <div class="row"><button class="btn back">← 마을로</button></div>`;
  bar.querySelector('.back').onclick = () => { go('evening'); eveningBar(); };
}
function drawMarket(t) {
  hits = []; Pix.use(ctx); const r = Pix.r;
  r(0, 0, W, H, '#f7d9b0'); r(0, H - 60, W, 60, '#d9b48a');
  SHOPS.forEach((s, i) => {
    const x = 4 + i * 39, y = 40, cols = ['#e2504c', '#58a65c', '#7fb2ec', '#f2a03b'];
    r(x, y, 36, 70, Pix.OL); r(x + 1, y + 1, 34, 68, '#fffaf2');
    for (let k = 0; k < 4; k++) r(x + k * 9, y - 8, 9, 9, k % 2 ? '#fff' : cols[i]);
    Pix.bust(x + 11, y + 14, { hair: ['#333', '#5a3a22', '#ddd', '#444'][i], shirt: cols[i], pants: '#555', bun: i === 1, cap: i === 3 ? '#3a6ad0' : null }, t + i * 300);
    r(x + 1, y + 38, 34, 4, '#c98b55'); r(x + 1, y + 42, 34, 27, '#b0703c');
    hit(x, y - 8, 37, 80, () => shopTalk(s));
  });
  labels(SHOPS.map((s, i) => [6 + i * 39, 118, s.name]));
}
async function shopTalk(s) {
  const who = { name: `${s.owner} (${s.name})`, img: Pix.bustImg({ hair: '#333', shirt: '#e2504c', pants: '#555' }) };
  if (s.sell) {
    if (inv(s.sell) <= 0) return say([['你有鱼吗？我买鱼！', 'Nǐ yǒu yú ma? Wǒ mǎi yú!', '물고기 있니? 내가 살게!'], { t: '(강에서 물고기를 잡으면 여기서 팔 수 있어요)' }], who);
    const n = inv(s.sell), total = n * s.sellPrice, [tz, tp] = numZh(total);
    await say([['你有鱼吗？我买鱼！', 'Nǐ yǒu yú ma? Wǒ mǎi yú!', '물고기 있니? 내가 살게!'], [`${n}条鱼，一共${tz}块。`, `${numZh(n)[1]} tiáo yú, yígòng ${tp} kuài.`, `물고기 ${n}마리, 모두 ${total}块야.`]], who);
    save.inv[s.sell] = 0; save.coins += total; persist(); setHud(); Sound.sfx('good'); toast(`💰 +${total}块`); return;
  }
  // 1. 무엇을?
  const others = SHOPS.filter(x => x !== s && x.items).flatMap(x => x.items);
  const items = s.items.filter(it => !(it.once && inv(it.k) > 0));
  if (!items.length) return say([['你已经买过了，谢谢！', 'Nǐ yǐjīng mǎi guo le, xièxie!', '이미 샀잖니, 고마워!']], who);
  const wk = pick(others).k;
  const opts = shuffle(items.map(it => ({ it, zh: `我要${INGR[it.k].zh}。`, py: `Wǒ yào ${INGR[it.k].py}.`, sub: INGR[it.k].ko }))
    .concat([{ it: null, zh: `我要${INGR[wk].zh}。`, py: `Wǒ yào ${INGR[wk].py}.`, sub: INGR[wk].ko, wrongK: wk }]))
    .concat([{ zh: '不要了，谢谢。', py: 'Bú yào le, xièxie.', sub: '괜찮아요(안 살래요)', cancel: 1 }]);
  let it;
  while (true) {
    const i = await talkChoose(who, { zh: '你好！要什么？', py: 'Nǐ hǎo! Yào shénme?', ko: '안녕! 뭐 줄까?' }, opts);
    const o = opts[i];
    if (o.cancel) return say([['好，慢走！', 'Hǎo, màn zǒu!', '그래, 살펴 가!']], who);
    if (o.it) { it = o.it; break; }
    o.dis = true; await say([[`我们没有${INGR[o.wrongK].zh}。`, `Wǒmen méiyǒu ${INGR[o.wrongK].py}.`, `우리 가게엔 ${INGR[o.wrongK].ko}가 없어.`]], who);
  }
  // 2. 얼마나?
  let n = 1;
  if (!it.once) {
    const q = [1, 2, 3].map(k => ({ n: k, zh: `${k === 2 ? '两' : numZh(k)[0]}${it.unit}`, py: `${k === 1 ? 'yì' : k === 2 ? 'liǎng' : 'sān'} ${it.unitPy}`, sub: `${k}${it.unit === '斤' ? '근' : '개'} (${it.price * k}块)` }));
    const i = await talkChoose(who, { zh: `要几${it.unit}？`, py: `Yào jǐ ${it.unitPy}?`, ko: `몇 ${it.unit === '斤' ? '근' : '개'} 줄까?` }, q);
    n = q[i].n;
  }
  // 3. 계산 (숫자 듣기)
  const total = it.price * n, [tz, tp] = numZh(total);
  if (save.coins < total) return say([['钱不够哦。', 'Qián bú gòu o.', '돈이 모자라는구나.']], who);
  const pays = shuffle([total, total + 5, Math.max(5, total - 5) === total ? total + 10 : Math.max(5, total - 5)]).map(v => ({ v, zh: `${numZh(v)[0]}块`, py: `${numZh(v)[1]} kuài`, silent: 1 }));
  const line = { zh: `${it.once ? '一' : (n === 2 ? '两' : numZh(n)[0])}${it.unit}${INGR[it.k].zh}，一共${tz}块。`, py: `${it.once ? 'yì' : n === 1 ? 'yì' : n === 2 ? 'liǎng' : 'sān'} ${it.unitPy} ${INGR[it.k].py}, yígòng ${tp} kuài.`, ko: `${INGR[it.k].ko} ${n}${it.unit === '斤' ? '근' : '개'}, 모두 ${total}块야.` };
  let tries = 0;
  while (true) {
    const i = await talkChoose(who, line, pays, tries ? '💡 잘 듣고 말한 금액을 골라요 (🔊 다시 듣기)' : '💰 얼마를 낼까요? 사장님이 말한 금액을 골라요');
    if (pays[i].v === total) break;
    pays[i].dis = true; tries++; Sound.sfx('bad');
    await say([[`不对，是${tz}块。`, `Bú duì, shì ${tp} kuài.`, `아니, ${total}块란다.`]], who);
  }
  save.coins -= total; addInv(it.k, it.once ? 1 : n); persist(); setHud(); Sound.sfx('good');
  await say([['谢谢！慢走！', 'Xièxie! Màn zǒu!', '고마워! 살펴 가!']], who);
  toast(`${INGR[it.k].icon} ${INGR[it.k].zh} +${it.once ? 1 : n}`);
  startMarket();
}

/* 🎣 강 낚시 */
let R = null;
function startRiver() {
  go('river'); Sound.bgm('map');
  R = { casts: 3, st: 'idle', t: 0, wait: 0, bar: 0, dir: 1, got: [] };
  riverBar();
}
function riverBar() {
  const msg = { idle: `🎣 화면을 눌러 낚싯대를 던져요 (남은 기회 ${R.casts})`, wait: '…찌가 움직이면 바로 눌러요!', bite: '❗ 지금 눌러요!', reel: '노란 칸에 오면 눌러요!', done: '오늘 낚시 끝!' }[R.st];
  bar.innerHTML = `<div class="order"><div class="olabel">${msg}</div><div class="small">잡은 것: ${R.got.map(k => k === 'gold' ? GOLD_FISH.zh : INGR[k].zh).join(' · ') || '아직 없어요'}</div></div>
    <div class="row"><button class="btn back">← 마을로</button></div>`;
  bar.querySelector('.back').onclick = () => { go('evening'); eveningBar(); };
}
async function riverTap() {
  if (!R || uiRoot.querySelector('.card,.box')) return;
  if (R.st === 'idle' && R.casts > 0) { R.casts--; R.st = 'wait'; R.wait = 1.5 + Math.random() * 3; Sound.sfx('wind'); riverBar(); return; }
  if (R.st === 'wait') { R.st = 'idle'; R.casts += 0; toast('너무 빨랐어요! 물고기가 도망갔어요'); Sound.sfx('bad'); if (R.casts <= 0) R.st = 'done'; riverBar(); return; }
  if (R.st === 'bite') { R.st = 'reel'; R.bar = 0; R.dir = 1; Sound.sfx('sel'); riverBar(); return; }
  if (R.st === 'reel') {
    const ok = R.bar > .62 && R.bar < .86;
    if (!ok) { toast('놓쳤어요!'); Sound.sfx('bad'); R.st = R.casts > 0 ? 'idle' : 'done'; riverBar(); return; }
    const tot = CATCH.reduce((s, c) => s + c.w, 0); let x = Math.random() * tot, k = 'shrimp';
    for (const c of CATCH) { x -= c.w; if (x <= 0) { k = c.k; break; } }
    R.got.push(k); R.st = 'show'; Sound.sfx('good');
    const n = k === 'gold' ? GOLD_FISH : INGR[k];
    if (k === 'gold') save.coins += 20; else addInv(k, k === 'shrimp' ? 2 : 1);
    persist(); setHud();
    await infoCard(`<div class="center"><div style="font-size:12cqw">${k === 'gold' ? '🐠' : n.icon}</div><h2>잡았다!</h2>${lineHTML(n, true)}<button class="mini" data-say="${esc(n.zh)}">🔊</button>
      <div class="small">${k === 'shrimp' ? '새우 2마리 → 새우 물만두 재료!' : k === 'fish' ? '물고기는 시장 생선 가게에 팔 수 있어요' : '보너스 20块!'}</div></div>`);
    speak(n.zh);
    R.st = R.casts > 0 ? 'idle' : 'done'; riverBar();
  }
}
function updateRiver(dt) {
  if (!R) return;
  if (R.st === 'wait') { R.wait -= dt; if (R.wait <= 0) { R.st = 'bite'; R.t = .9; Sound.sfx('pop'); riverBar(); } }
  else if (R.st === 'bite') { R.t -= dt; if (R.t <= 0) { R.st = R.casts > 0 ? 'idle' : 'done'; toast('놓쳤어요! 더 빨리 눌러요'); riverBar(); } }
  else if (R.st === 'reel') { R.bar += R.dir * dt * 1.3; if (R.bar > 1) { R.bar = 1; R.dir = -1; } if (R.bar < 0) { R.bar = 0; R.dir = 1; } }
}
function drawRiver(t) {
  hits = []; Pix.use(ctx); const r = Pix.r;
  r(0, 0, W, H, '#f4b08a'); Pix.disc(40, 30, 12, '#ffd36e'); r(0, 50, W, 20, '#8fb877');
  r(0, 70, W, H - 70, '#6fa8dc'); for (let y = 80; y < H; y += 12) for (let x = (y % 24); x < W; x += 30) r(x + Math.sin(t / 600 + y) * 3, y, 10, 1, '#a9d1f5');
  r(0, H - 70, 70, 8, '#a3642f'); r(0, H - 62, 70, 62, '#8a5a30');
  Pix.chef(40, H - 92, t, false, save.look);
  r(51, H - 92, 1, -30 + 30, Pix.OL);
  if (R && R.st !== 'idle' && R.st !== 'done') {
    const bx = 110, by = H - 110 + (R.st === 'bite' ? Math.sin(t / 40) * 2 : Math.sin(t / 400));
    ctx.strokeStyle = '#3b2a35'; ctx.beginPath(); ctx.moveTo(52, H - 96); ctx.lineTo(bx, by); ctx.stroke();
    r(bx - 2, by - 2, 4, 4, '#e2504c'); r(bx - 2, by, 4, 2, '#fff');
    if (R.st === 'bite') { r(bx - 2, by - 16, 4, 9, '#e2504c'); r(bx - 2, by - 5, 4, 2, '#e2504c'); }
    if (R.st === 'reel') { r(20, 40, 120, 10, Pix.OL); r(21, 41, 118, 8, '#fff'); r(21 + 118 * .62, 41, 118 * .24, 8, '#ffd36e'); r(21 + 116 * R.bar, 38, 2, 14, '#e2504c'); }
  }
}

/* 🐔 농가·산 채집 */
let F = null;
async function startFarm() {
  go('farm'); Sound.bgm('map');
  F = { t: 22, spots: [], got: {}, started: false };
  bar.innerHTML = `<div class="order"><div class="olabel">🐔 반짝이는 것을 눌러 모아요!</div><div class="small">닭장 → 鸡蛋 · 소 → 牛奶 · 산 → 蘑菇</div></div>`;
  await say([pick(FARM_TALK)], { name: '李奶奶 (농가 할머니)', img: Pix.bustImg({ hair: '#cfcfd6', shirt: '#7fb2ec', pants: '#555', bun: 1 }) });
  F.started = true;
}
const FARM_PTS = { egg: [[18, 150], [34, 160], [26, 140]], milk: [[110, 160], [126, 150], [118, 172]], mushroom: [[20, 70], [60, 80], [100, 66], [140, 78]] };
function updateFarm(dt) {
  if (!F || !F.started || uiRoot.querySelector('.card,.box')) return;
  F.t -= dt;
  if (Math.random() < dt * .9 && F.spots.length < 3) { const k = pick(FARM_ITEMS); const p = pick(FARM_PTS[k]); F.spots.push({ k, x: p[0] + (Math.random() * 8 - 4), y: p[1] + (Math.random() * 6 - 3), life: 2.4 }); }
  F.spots.forEach(s => s.life -= dt); F.spots = F.spots.filter(s => s.life > 0);
  if (F.t <= 0 && F.started) { F.started = false; endFarm(); }
  if (Math.floor(F.t) !== F._s) { F._s = Math.floor(F.t); bar.querySelector('.olabel').textContent = `🐔 반짝이는 것을 눌러 모아요! (${Math.max(0, Math.ceil(F.t))}초)`; }
}
function farmTap(x, y) {
  if (!F || !F.started) return;
  const s = F.spots.find(s => Math.abs(s.x - x) < 9 && Math.abs(s.y - y) < 9); if (!s) return;
  F.spots.splice(F.spots.indexOf(s), 1); F.got[s.k] = (F.got[s.k] || 0) + 1; addInv(s.k, s.k === 'milk' ? 2 : 1);
  Sound.sfx('pop'); floatText(s.x, s.y - 8, INGR[s.k].zh); speak(INGR[s.k].zh); persist();
}
async function endFarm() {
  const got = Object.keys(F.got);
  await infoCard(`<h2>🐔 농가에서 얻은 것</h2>${got.length ? got.map(k => `<div class="note" data-say="${INGR[k].zh}">${INGR[k].icon} <b>${INGR[k].zh}</b> <span>${INGR[k].py}</span> · ${INGR[k].ko} × ${F.got[k] * (k === 'milk' ? 2 : 1)} 🔊</div>`).join('') : '<div class="small">다음엔 더 빨리 눌러 봐요!</div>'}`, '← 마을로');
  go('evening'); eveningBar();
}
function drawFarm(t) {
  hits = []; Pix.use(ctx); const r = Pix.r;
  r(0, 0, W, H, '#f7c89a'); r(0, 40, W, 60, '#7fae6a'); for (let x = 0; x < W; x += 30) { Pix.disc(x + 15, 50, 16, '#6c9a5a'); r(x + 13, 60, 4, 10, '#7a4a28'); }
  r(0, 100, W, H - 100, '#b8dc96');
  r(6, 128, 40, 30, Pix.OL); r(7, 129, 38, 28, '#e0a86a'); r(4, 122, 44, 8, '#c0392b');
  [[16, 160], [30, 166]].forEach(([x, y]) => { r(x, y, 8, 6, '#fff'); r(x + 6, y - 2, 3, 3, '#fff'); r(x + 8, y - 1, 2, 1, '#f2a03b'); r(x + 6, y - 3, 2, 1, '#e2504c'); });
  const cx = 108, cy = 150; r(cx, cy, 26, 14, '#fff'); r(cx + 4, cy + 3, 6, 5, '#3b2a35'); r(cx + 16, cy + 6, 5, 4, '#3b2a35'); r(cx + 24, cy - 4, 9, 9, '#fff'); r(cx + 27, cy, 2, 2, '#3b2a35'); r(cx + 2, cy + 14, 3, 6, '#555'); r(cx + 20, cy + 14, 3, 6, '#555');
  if (F) F.spots.forEach(s => { const a = .5 + .5 * Math.sin(t / 120); r(s.x - 4, s.y - 4, 8, 8, `rgba(255,255,255,${a})`); r(s.x - 1, s.y - 7, 2, 14, '#ffd36e'); r(s.x - 7, s.y - 1, 14, 2, '#ffd36e'); });
}

/* 🌙 밤: 새 메뉴·가게 꾸미기 */
async function startNight() {
  go('night'); Sound.bgm('title');
  // 새 메뉴 연구
  const news = [];
  if (!save.drinks.includes('dou')) { save.drinks.push('dou'); news.push({ k: 'dou', drink: 1, line: '옆집 할머니가 콩을 나눠 주셨다! 이제 두유(豆浆)도 팔 수 있어.' }); }
  UNLOCK.forEach(u => {
    const have = u.drink ? save.drinks.includes(u.k) : save.foods.includes(u.k);
    if (!have && u.by.every(k => save.seen[k])) { (u.drink ? save.drinks : save.foods).push(u.k); news.push(u); }
  });
  persist();
  for (const u of news) {
    const n = u.drink ? DRINKS[u.k] : FOODS[u.k];
    const ex = u.drink ? { zh: `一杯热${n.zh}`, py: `yì bēi rè ${n.py}` } : { zh: `${FOODS[u.k].unit === 'fen' ? '一份' : '两个'}${n.zh}`, py: `${FOODS[u.k].unit === 'fen' ? 'yí fèn' : 'liǎng ge'} ${n.py}` };
    Sound.sfx('page');
    await infoCard(`<div class="center"><h2>🌙 새 메뉴 연구!</h2>${u.drink ? '' : `<img class="bigic" src="${Pix.icon(u.k)}">`}${lineHTML(n, true)}<button class="mini" data-say="${esc(n.zh)}">🔊</button>
      <div class="small">${esc(u.line)}</div><div class="ex">손님은 이렇게 주문해요: <b data-say="${esc(ex.zh)}">${esc(ex.zh)}</b> ${set.py ? esc(ex.py) : ''} 🔊</div></div>`);
  }
  nightBar();
}
function nightBar() {
  bar.innerHTML = `<div class="order"><div class="olabel">🌙 가게 꾸미기 (💰 ${save.coins}块)</div></div>
    <div class="ups">${UPGRADES.map(u => { const lv = save.up[u.id] - u.base; const maxed = save.up[u.id] >= u.max; return `<button class="btn up" data-u="${u.id}" ${maxed || save.coins < u.price ? 'disabled' : ''}><b>${esc(u.name)}</b><span>${maxed ? '완료 ✓' : `${u.price}块`}</span><small>${esc(u.desc)}</small></button>`; }).join('')}</div>
    <div class="row"><button class="btn big sleep">😴 자고 내일 아침으로</button></div>`;
  bar.querySelectorAll('.up').forEach(b => b.onclick = () => { const u = UPGRADES.find(x => x.id === b.dataset.u); if (save.coins < u.price) return; save.coins -= u.price; save.up[u.id]++; Sound.sfx('good'); persist(); setHud(); toast(`✨ ${u.name}!`); nightBar(); });
  bar.querySelector('.sleep').onclick = () => { save.day++; persist(); fadeTo(startMorning); };
}
function drawNight(t) {
  hits = []; Pix.use(ctx); const r = Pix.r;
  r(0, 0, W, H, '#3d3560'); for (let i = 0; i < 20; i++) r((i * 37) % W, (i * 23) % 70, 1, 1, '#fff');
  Pix.disc(130, 24, 9, '#fff6c8'); Pix.disc(126, 21, 8, '#3d3560');
  r(0, 80, W, H - 80, '#a8693a'); r(20, 50, 120, 60, Pix.OL); r(21, 51, 118, 58, '#fff4e8');
  r(30, 60, 30, 20, '#7fb2ec'); r(70, 64, 8, 30, '#c0392b'); r(66, 60, 16, 8, '#ffd36e');
  r(90, 74, 44, 22, '#e2504c'); r(92, 70, 14, 8, '#fff');
  Pix.chef(100, 56, t, false, save.look);
}

/* ───────── 메뉴 ───────── */
function openMenu() {
  const notes = Object.values(save.notes);
  const c = card(`<h2>☰ 만두가게 수첩</h2>
    <h3>📦 창고</h3><div class="small">${Object.keys(save.inv).filter(k => inv(k) > 0).map(k => `<span class="chip" data-say="${INGR[k].zh}">${INGR[k].icon} ${INGR[k].zh} ${set.py ? INGR[k].py : ''} ×${inv(k)}</span>`).join(' ') || '비었어요'}</div>
    <h3>🥟 메뉴</h3><div class="small">${save.foods.map(k => `<span class="chip" data-say="${FOODS[k].zh}">${FOODS[k].zh} ${FOODS[k].ko}</span>`).join(' ')} ${save.drinks.map(k => `<span class="chip" data-say="${DRINKS[k].zh}">${DRINKS[k].zh} ${DRINKS[k].ko}</span>`).join(' ')}</div>
    <h3>🧾 다시 익힐 주문 ${notes.length}개 (졸업 ${save.grad})</h3><div class="notes">${notes.map(n => `<div class="note" data-say="${esc(n.zh)}"><b>${esc(n.zh)}</b> ${esc(n.py)} · ${esc(n.ko)} 🔊</div>`).join('') || '<div class="small">없어요 👍</div>'}</div>
    <h3>⚙️ 설정</h3>
    <div class="setrow">병음 보기 <button class="btn" data-k="py">${set.py ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow">뜻 보기 <button class="btn" data-k="ko">${set.ko ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow">읽기 빠르기 <button class="btn" data-k="rate">${set.rate < .8 ? '느리게' : set.rate > .9 ? '빠르게' : '보통'}</button></div>
    <div class="setrow">효과음 <button class="btn" data-k="sfx">${set.sfx ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow">배경음악 <button class="btn" data-k="bgm">${set.bgm ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow">처음부터 다시 <button class="btn" data-k="reset">초기화</button></div>
    <div class="small">${APP_VERSION} · © 2026 진담중국어(전진아). 무단 복사·배포·수정·판매 금지.<br>문의: <a href="https://pf.kakao.com/_jZYxmxj/chat" target="_blank" rel="noopener">카카오톡 채널</a></div>
    <div class="row"><button class="btn go">닫기</button></div>`);
  if (M && screen === 'morning') M.paused = true;
  c.querySelectorAll('[data-say]').forEach(d => d.onclick = () => TTS.speak(d.dataset.say));
  let arm = 0;
  c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === 'reset') { if (Date.now() - arm < 3000) { store.clear(); location.reload(); } arm = Date.now(); toast('한 번 더 누르면 모든 기록이 지워져요'); return; }
    if (k === 'rate') { set.rate = set.rate < .8 ? .85 : set.rate < .9 ? 1 : .7; TTS.setRate(set.rate); TTS.speak('你好'); }
    else if (k === 'sfx') { set.sfx = !set.sfx; Sound.setSfx(set.sfx); }
    else if (k === 'bgm') { set.bgm = !set.bgm; Sound.setBgm(set.bgm); }
    else set[k] = !set[k];
    persistSet(); c.close(); openMenu();
  });
  c.querySelector('.go').onclick = () => { c.close(); if (M && screen === 'morning') { M.paused = false; drawBar(); } };
}

/* ───────── 타이틀 · 시작 ───────── */
function fadeTo(fn) { const f = el('<div class="fade"></div>'); document.getElementById('app').appendChild(f); setTimeout(fn, 250); setTimeout(() => f.remove(), 600); }
function titleScreen() {
  go('title'); Sound.bgm('title');
  const has = save.intro;
  bar.innerHTML = `<div class="title"><div class="logo">진담 아침 만두가게</div><div class="sub">早餐 · 包子 · 饺子 · 茶</div>
    <div class="tb">${has ? `<button class="btn big" data-k="c">▶ 이어서 하기 (${save.day}일째)</button>` : ''}<button class="btn big ${has ? 'ghost' : ''}" data-k="n">${has ? '처음부터 새로' : '▶ 가게 문 열기'}</button></div>
    <div class="small">${APP_VERSION} · © 2026 진담중국어</div></div>`;
  bar.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    Sound.init(); Sound.sfx('sel');
    if (b.dataset.k === 'n') { store.set('save', null); save = newSave(); fadeTo(newGame); }
    else fadeTo(() => { if (save.phase === 'night') startNight(); else if (['evening', 'market', 'river', 'farm', 'summary'].includes(save.phase)) startEvening(); else startMorning(); });
  });
}
function drawTitle(t) {
  Pix.use(ctx); const r = Pix.r;
  Pix.shop(W, KY, t, [20, 60, 100]);
  Pix.kitchen(W, KY, H);
  [0, 1, 2].forEach(i => Pix.steamer(4 + i * 27, KY + 14, { state: i === 1 ? 'steam' : 'ready', p: .5, n: 4, food: ['rou', 'rou', 'cai'][i] }, t));
  Pix.chef(70, KY + 52, t, false, save.look);
}
async function newGame() {
  go('title'); bar.innerHTML = '';
  await say([
    { t: '여기는 중국의 작은 동네. 할머니가 30년 동안 꾸려 온 아침 만두가게가 있어요.' },
    { t: '"이제 네가 가게를 맡아 주렴." 할머니가 가게 열쇠와 만두 비법을 남겨 주셨어요.' }
  ], { name: '이야기' });
  const p = card(`<h2>새 사장님 등록</h2><input class="name" maxlength="8" placeholder="이름 (8글자까지)">
    <div class="row"><button class="btn" data-l="girl">👩‍🍳 여자 사장님</button><button class="btn" data-l="boy">👨‍🍳 남자 사장님</button></div>`);
  await new Promise(res => p.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { save.name = (p.querySelector('input').value || '').trim().slice(0, 8) || '사장님'; save.look = b.dataset.l; p.close(); res(); }));
  const grandma = { name: '奶奶 (할머니)', img: Pix.bustImg({ hair: '#cfcfd6', shirt: '#e07a9a', pants: '#5a4a7a', bun: 1 }) };
  await say([
    ['早上好！', 'Zǎoshang hǎo!', '좋은 아침!'],
    { t: '{name}아, 아침마다 학생들과 동네 사람들이 아침밥을 먹으러 온단다.' },
    { t: '손님이 중국어로 주문하면, 찜기에서 만두를 쪄서 건네고, 차도 따라 주렴. 热는 따뜻하게, 冰은 얼음 컵이야.' },
    { t: '처음엔 고기 찐빵(肉包子) 하나뿐이지만, 저녁에 시장·강·농가에서 재료를 구하면 메뉴가 늘어난단다.' },
    ['加油！', 'Jiāyóu!', '힘내!']
  ], grandma);
  save.intro = true; persist();
  startMorning();
}

/* ───────── 매 프레임 ───────── */
let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (cv.width !== W) fit();
  if (screen === 'morning' && M) { updateMorning(dt); drawMorning(now); }
  else if (screen === 'evening') drawEvening(now);
  else if (screen === 'market') drawMarket(now);
  else if (screen === 'river') { updateRiver(dt); drawRiver(now); }
  else if (screen === 'farm') { updateFarm(dt); drawFarm(now); }
  else if (screen === 'night') drawNight(now);
  else if (screen === 'title' || screen === 'summary') drawTitle(now);
  requestAnimationFrame(loop);
}
window.__md = { get save() { return save; }, get M() { return M; }, get screen() { return screen; }, startMorning, startEvening, startNight, deliver, tapSteamer, tapCupStack, holdPot, tapCup, tapMilk };
fit(); titleScreen(); requestAnimationFrame(loop);
