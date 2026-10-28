/* 도트 그림 도우미 — 낮은 해상도 캔버스에 사각형으로 직접 그림 (이미지 파일 없음) */
const Pix = (() => {
  let g = null;
  const use = c => { g = c; };
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const disc = (cx, cy, rad, c) => { for (let dy = -rad; dy <= rad; dy++) { const w = Math.round(Math.sqrt(rad * rad - dy * dy)); r(cx - w, cy + dy, w * 2 + 1, 1, c); } };
  const OL = '#3b2a35';

  /* 손님 상반신 (카운터 뒤) — 폭 14, 높이 22 */
  function bust(x, y, p, t = 0, mood = 'ok') {
    const bob = Math.sin(t / 300) > .7 ? -1 : 0; y += bob;
    // 몸
    r(x + 1, y + 13, 12, 10, OL); r(x + 2, y + 14, 10, 9, p.shirt);
    if (p.uni) { r(x + 5, y + 14, 4, 2, '#fff'); r(x + 2, y + 18, 10, 1, '#fff'); }
    if (p.tie) { r(x + 6, y + 15, 2, 5, p.tie); r(x + 5, y + 14, 4, 1, '#fff'); }
    // 머리
    if (p.long) { r(x + 1, y + 4, 12, 12, OL); r(x + 2, y + 5, 10, 11, p.hair); }
    if (p.bun) { r(x + 5, y - 2, 4, 3, OL); r(x + 5, y - 1, 4, 2, p.hair); }
    r(x + 2, y + 1, 10, 12, OL); r(x + 3, y + 2, 8, 10, '#ffd9b8');
    r(x + 2, y + 1, 10, 4, p.hair); r(x + 2, y + 5, 1, 3, p.hair); r(x + 11, y + 5, 1, 3, p.hair);
    if (p.cap) { r(x + 1, y, 12, 3, p.cap); r(x + 9, y + 3, 5, 1, p.cap); }
    // 얼굴
    if (mood === 'eat' || mood === 'happy') { r(x + 4, y + 7, 2, 1, OL); r(x + 8, y + 7, 2, 1, OL); }
    else { r(x + 4, y + 6, 2, 2, OL); r(x + 8, y + 6, 2, 2, OL); }
    r(x + 3, y + 9, 1, 1, '#ff9fae'); r(x + 10, y + 9, 1, 1, '#ff9fae');
    if (mood === 'angry') { r(x + 5, y + 10, 4, 1, OL); r(x + 4, y + 5, 2, 1, OL); r(x + 8, y + 5, 2, 1, OL); }
    else if (mood === 'eat') { r(x + 6, y + 10, 2, 1, OL); }
    else r(x + 5, y + 10, 4, 1, '#c0605a');
  }
  /* 주인공 요리사 (전신) — 폭 12, 높이 22 */
  function chef(x, y, t = 0, walking = false, look = 'boy') {
    const f = walking ? (Math.floor(t / 140) % 2) : 0;
    r(x + 1, y - 1, 10, 6, OL); r(x + 2, y, 8, 5, '#ffffff'); r(x + 3, y - 3, 6, 3, OL); r(x + 4, y - 2, 4, 2, '#ffffff');
    r(x + 1, y + 5, 10, 8, OL); r(x + 2, y + 5, 8, 7, '#ffd9b8');
    r(x + 2, y + 5, 8, 2, look === 'girl' ? '#6b3a22' : '#4a2e1c');
    if (look === 'girl') { r(x + 1, y + 6, 1, 6, '#6b3a22'); r(x + 10, y + 6, 1, 6, '#6b3a22'); }
    r(x + 4, y + 8, 1, 2, OL); r(x + 7, y + 8, 1, 2, OL); r(x + 5, y + 11, 2, 1, '#c0605a');
    r(x + 1, y + 13, 10, 7, OL); r(x + 2, y + 13, 8, 6, '#fff'); r(x + 3, y + 15, 6, 4, '#ff8a7a');
    r(x + 3, y + 20, 2, 2 - f, OL); r(x + 7, y + 20, 2, 1 + f, OL);
  }
  /* 음식 아이콘 — 8×7 */
  const FOODCOL = { bun: ['#fffaf0', '#e8dcc4'], bunG: ['#eef8e2', '#c7e3a8'], bunB: ['#f6e6d2', '#c9a27a'], dump: ['#fffdf6', '#e6dcc8'], dumpP: ['#fff4f2', '#f2b8ae'] };
  function food(x, y, kind, burnt) {
    const [a, b] = burnt ? ['#4a3a36', '#2a201e'] : (FOODCOL[kind] || FOODCOL.bun);
    if (kind === 'dump' || kind === 'dumpP') {
      r(x, y + 3, 9, 3, OL); r(x + 1, y + 1, 7, 2, OL); r(x + 1, y + 3, 7, 2, a); r(x + 2, y + 2, 5, 1, a);
      r(x + 2, y + 1, 1, 1, b); r(x + 4, y + 1, 1, 1, b); r(x + 6, y + 1, 1, 1, b);
      return;
    }
    r(x + 1, y + 1, 7, 6, OL); r(x, y + 3, 9, 4, OL); r(x + 1, y + 2, 7, 4, a); r(x + 2, y + 1, 5, 1, a);
    r(x + 4, y + 1, 1, 2, b); r(x + 3, y + 2, 1, 1, b); r(x + 5, y + 2, 1, 1, b); r(x + 1, y + 5, 7, 1, b);
  }
  /* 컵 — 10×11 */
  function cup(x, y, temp, base, fill = 1, milk = false) {
    const liquid = base ? (milk ? '#d9a77a' : base === 'hong' ? '#b2452e' : base === 'lv' ? '#7cbf5a' : '#f3e6c4') : null;
    if (temp === 'hot') {
      r(x, y + 2, 9, 9, OL); r(x + 1, y + 3, 7, 7, '#fff'); r(x + 8, y + 4, 3, 4, OL); r(x + 9, y + 5, 1, 2, '#fff');
      if (liquid && fill > 0) { const h = Math.max(1, Math.round(6 * Math.min(1, fill))); r(x + 1, y + 3 + (6 - h), 7, h, liquid); }
      r(x + 1, y + 9, 7, 1, '#e6e0d6');
    } else {
      r(x, y, 9, 11, OL); r(x + 1, y + 1, 7, 9, '#dff3ff');
      if (liquid && fill > 0) { const h = Math.max(1, Math.round(8 * Math.min(1, fill))); r(x + 1, y + 1 + (8 - h), 7, h, liquid); }
      r(x + 2, y + 3, 2, 2, '#ffffff'); r(x + 5, y + 5, 2, 2, '#ffffff'); r(x + 3, y + 7, 2, 2, '#f4fbff');
    }
  }
  /* 찜기 — 폭 24, 높이 22 */
  function steamer(x, y, st, t) {
    r(x, y + 8, 24, 14, OL); r(x + 1, y + 9, 22, 12, '#d9a35b'); r(x + 1, y + 12, 22, 1, '#b57f3a'); r(x + 1, y + 17, 22, 1, '#b57f3a');
    if (st.state === 'steam') {
      r(x, y + 3, 24, 6, OL); r(x + 1, y + 4, 22, 4, '#e8b870'); r(x + 10, y + 1, 4, 3, OL); r(x + 11, y + 2, 2, 1, '#e8b870');
      for (let i = 0; i < 3; i++) { const ph = ((t / 400) + i * .33) % 1; r(x + 5 + i * 7, y - ph * 10, 2, 2, `rgba(255,255,255,${1 - ph})`); }
      r(x + 1, y + 23, 22, 2, '#e8dccb'); r(x + 1, y + 23, 22 * st.p, 2, '#ffb84d');
    } else if (st.state === 'ready' || st.state === 'burnt') {
      for (let i = 0; i < Math.min(4, st.n); i++) food(x + 2 + (i % 2) * 10, y + 2 + (i > 1 ? -4 : 1) + 2, FOODS[st.food].color, st.state === 'burnt');
      if (st.state === 'ready') for (let i = 0; i < 2; i++) { const ph = ((t / 500) + i * .5) % 1; r(x + 6 + i * 10, y - 3 - ph * 6, 1, 2, `rgba(255,255,255,${1 - ph})`); }
    } else { r(x + 2, y + 6, 20, 3, OL); r(x + 3, y + 7, 18, 2, '#c99252'); }
  }
  /* 주전자·병 — 16×16 */
  function pot(x, y, kind) {
    if (kind === 'milk') { r(x + 4, y, 8, 3, OL); r(x + 5, y + 1, 6, 1, '#7fb2ec'); r(x + 3, y + 3, 10, 13, OL); r(x + 4, y + 4, 8, 11, '#ffffff'); r(x + 4, y + 8, 8, 3, '#7fb2ec'); return; }
    const c = DRINKS[kind].pot;
    r(x + 2, y + 5, 12, 10, OL); r(x + 3, y + 6, 10, 8, c); r(x + 5, y + 2, 6, 4, OL); r(x + 6, y + 3, 4, 2, c);
    r(x + 13, y + 7, 3, 2, OL); r(x + 15, y + 5, 1, 3, OL); r(x, y + 7, 3, 5, OL); r(x + 1, y + 8, 1, 3, c);
    r(x + 4, y + 7, 2, 2, 'rgba(255,255,255,.5)');
  }
  /* 가게 배경 */
  function shop(W, KY, t, seats) {
    r(0, 0, W, KY, '#f6dcb4');
    for (let x = 0; x < W; x += 16) r(x, 0, 1, 70, '#ecd0a4');
    r(0, 70, W, 26, '#c98b55'); for (let x = 0; x < W; x += 10) r(x, 70, 1, 26, '#b9794a');
    // 창문 (아침 해)
    r(8, 12, 40, 30, OL); r(9, 13, 38, 28, '#bfe3ff'); r(9, 30, 38, 11, '#ffe2b8'); disc(36, 26, 5, '#ffd36e'); r(27, 13, 2, 28, OL); r(9, 26, 38, 1, OL);
    r(14, 35, 8, 3, '#9bd38a'); r(30, 36, 10, 3, '#8fc97c');
    // 메뉴판
    r(60, 10, 46, 30, OL); r(61, 11, 44, 28, '#5a3a22'); for (let i = 0; i < 4; i++) r(64, 15 + i * 6, 20 + (i % 2) * 12, 2, '#f6ead2');
    // 홍등
    [116, 136].forEach((lx, i) => { const sw = Math.sin(t / 700 + i) * 1; r(lx + 4, 0, 1, 8, OL); r(lx + sw, 8, 10, 12, OL); r(lx + 1 + sw, 9, 8, 10, '#e2504c'); r(lx + 1 + sw, 12, 8, 1, '#f2c14e'); r(lx + 3 + sw, 20, 4, 3, '#f2c14e'); });
    // 문
    r(146, 30, 14, 66, OL); r(147, 31, 13, 65, '#a8693a'); r(149, 36, 9, 20, '#bfe3ff'); r(148, 60, 2, 3, '#ffd36e');
    // 카운터
    r(0, 96, W, 3, OL); r(0, 99, W, 4, '#e0a86a'); r(0, 103, W, KY - 103, '#b0703c'); for (let x = 6; x < W; x += 20) r(x, 106, 8, KY - 110, '#a3642f');
    // 의자 표시
    seats.forEach(sx => { r(sx + 2, 93, 10, 3, '#7a4a28'); });
  }
  function kitchen(W, KY, H) {
    for (let y = KY; y < H; y += 8) for (let x = 0; x < W; x += 8) r(x, y, 8, 8, ((x + y) / 8) % 2 ? '#efe4d0' : '#e6d8bf');
    r(86, KY + 4, W - 86, 3, OL); r(86, KY + 7, W - 86, 50, '#c98b55'); r(86, KY + 7, W - 86, 2, '#e0a86a');
    r(0, KY + 4, 86, 3, OL); r(0, KY + 7, 86, 34, '#8a8f9c'); r(0, KY + 7, 86, 2, '#b6bcc8');
  }
  /* 손에 든 것 아이콘 (작은 그림 → dataURL) */
  const iconCache = {};
  function icon(key) {
    if (iconCache[key]) return iconCache[key];
    const c = document.createElement('canvas'); c.width = 12; c.height = 12; const x = c.getContext('2d');
    const keep = g; use(x);
    if (FOODS[key]) food(1, 3, FOODS[key].color);
    else { const [base, temp] = key.split('-'); cup(1, 0, temp, base === 'nai' ? 'hong' : base, .85, base === 'nai'); }
    use(keep);
    return iconCache[key] = c.toDataURL();
  }
  function bustImg(p, mood) {
    const c = document.createElement('canvas'); c.width = 16; c.height = 24; const x = c.getContext('2d'); const keep = g; use(x); bust(1, 1, p, 0, mood); use(keep); return c.toDataURL();
  }
  return { use, r, disc, bust, chef, food, cup, steamer, pot, shop, kitchen, icon, bustImg, OL };
})();
