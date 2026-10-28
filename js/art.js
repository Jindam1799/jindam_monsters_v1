/* 픽셀 그림 (이미지 파일 없음). 타일 16×16, 사람 16×16, 몬스터 40×40 */
const Art = (() => {
  const T = 16;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const P = {
    g1: '#a6dd72', g2: '#8fcd5e', g3: '#6fb34a', tg1: '#4fa046', tg2: '#357d34', tg3: '#78c65a',
    path: '#efdcab', path2: '#dcc58c', sand: '#e7b97f', sand2: '#d6a067',
    w1: '#5ab4ea', w2: '#8fd3f7', w3: '#3a90cc', tr1: '#3f9a4a', tr2: '#2a7337', tr3: '#6cc263', trunk: '#8a5a2e', ol: '#1f3324',
    wood: '#b07a45', wood2: '#8a5a30'
  };
  // 문자열 그림 → 캔버스
  function paint(x, rows, pal, ox = 0, oy = 0) {
    rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.' || !pal[ch]) continue; x.fillStyle = pal[ch]; x.fillRect(ox + i, oy + y, 1, 1); } });
  }
  function noise(x, base, dots, seed) {
    x.fillStyle = base; x.fillRect(0, 0, T, T);
    let s = seed;
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    dots.forEach(([col, n]) => { x.fillStyle = col; for (let i = 0; i < n; i++) x.fillRect((r() * T) | 0, (r() * T) | 0, 1, 1); });
  }
  const tiles = {};
  function tile(name, frame = 0) {
    const key = name + frame; if (tiles[key]) return tiles[key];
    const [c, x] = mk(T, T);
    const grass = () => {
      noise(x, P.g1, [[P.g2, 10]], 7);
      x.fillStyle = P.g2; [[3, 4], [11, 9], [6, 13]].forEach(([a, b]) => { x.fillRect(a, b, 1, 1); x.fillRect(a + 1, b - 1, 1, 1); x.fillRect(a + 2, b, 1, 1); });
    };
    switch (name) {
      case '.': grass(); break;
      case 'tall': {
        x.fillStyle = P.tg1; x.fillRect(0, 0, T, T);
        const sw = frame ? 1 : 0;
        const tuft = (ox, oy) => paint(x, [
          '..k...k.', '.kgk.kgk', '.kgkkgk.', 'kgglggk.', 'kglgglgk', 'kgglglgk', '.kgggggk', '..kkkkk.'
        ].map(r => sw ? r.slice(1) + r[0] : r), { k: P.tg2, g: P.tg1, l: P.tg3 }, ox, oy);
        tuft(0, 0); tuft(8, 0); tuft(0, 8); tuft(8, 8);
        break;
      }
      case '=': noise(x, P.path, [[P.path2, 14], ['#f7ead0', 6]], 3); break;
      case 's': noise(x, P.sand, [[P.sand2, 16], ['#f0c995', 8]], 5); break;
      case 'f': {
        grass();
        const fl = (ox, oy, col) => paint(x, ['.w.', 'wyw', '.w.'], { w: col, y: '#ffe066' }, ox, oy);
        const o = frame ? 1 : 0;
        fl(2, 2 + o, '#ff7a8a'); fl(10, 4 - o, '#ffffff'); fl(5, 10 - o, '#ffffff'); fl(12, 11 + o, '#ff7a8a');
        break;
      }
      case '~': {
        x.fillStyle = P.w1; x.fillRect(0, 0, T, T);
        x.fillStyle = P.w2; const o = frame * 4;
        [[1 + o, 3], [9 - o, 8], [4 + o, 12]].forEach(([a, b]) => x.fillRect(((a % 14) + 14) % 14, b, 4, 1));
        x.fillStyle = P.w3; x.fillRect(0, 15, T, 1);
        break;
      }
      case 'T': {
        grass();
        paint(x, [
          '.....oooooo.....', '...ooGGGGGGoo...', '..oGGHHGGGGGGo..', '.oGHHHGGGGGGGGo.',
          '.oGHHGGGGGGGgGo.', 'oGGGGGGGGGGggGGo', 'oGGGGGGGGGGgGGGo', 'oGGGGgGGGGGGGGGo',
          'oGGGggGGGGGGGgGo', '.oGGGGGGGGGGggo.', '.oGgGGGGGGGGGGo.', '..ooGGGGGGGGoo..',
          '....oooookoooo..', '......kttk......', '......kttk......', '.....kkkkkk.....'
        ], { o: P.ol, G: P.tr1, H: P.tr3, g: P.tr2, k: '#4a2e16', t: P.trunk });
        break;
      }
      case 'S': {
        grass();
        paint(x, [
          '................', '..kkkkkkkkkkkk..', '..kwwwwwwwwwwk..', '..kwkkkwwkkkwk..', '..kwwwwwwwwwwk..',
          '..kwkkkkkkwwwk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '.......kk.......', '.......kk.......', '.......kk.......'
        ], { k: P.wood2, w: P.wood }, 0, 2);
        break;
      }
      case 'G': {
        noise(x, P.path, [[P.path2, 10]], 9);
        x.fillStyle = '#5b6170'; x.fillRect(0, 2, T, 2); x.fillRect(0, 12, T, 2);
        for (let i = 1; i < T; i += 4) x.fillRect(i, 0, 2, T);
        x.fillStyle = '#9aa3b5'; for (let i = 1; i < T; i += 4) x.fillRect(i, 0, 1, T);
        break;
      }
      default: grass();
    }
    tiles[key] = c; return c;
  }

  /* ── 사람 ── */
  const FRONT = [
    '......kkkk......', '....kkhhhhkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
    '..khhsssssshhk..', '..khsesssseshk..', '..kssssssssssk..', '...kssssssssk...', '....kkcccckk....',
    '...kcccccccck...', '..ksccccccccsk..', '..ksccccccccsk..', '...kppppppppk...'
  ];
  const BACK = [
    '......kkkk......', '....kkhhhhkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '..kshhhhhhhhsk..', '...kssssssssk...', '....kkcccckk....',
    '...kcccccccck...', '..ksccccccccsk..', '..ksccccccccsk..', '...kppppppppk...'
  ];
  const SIDE = [
    '......kkkk......', '....kkhhhhkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
    '..khhhhhsssssk..', '..khhhhsssesk...', '..khhhssssssk...', '...khsssssk.....', '....kkcccck.....',
    '....kcccccck....', '....kccsccck....', '....kccsccck....', '....kppppppk....'
  ];
  const LEGS = {
    front: [['...kppk..kppk...', '...kbbk..kbbk...'], ['...kppk..kbbk...', '...kbbk.........'], ['...kbbk..kppk...', '.........kbbk...']],
    side: [['....kppkkppk....', '....kbbk.kbbk...'], ['...kppk..kppk...', '...kbbk...kbbk..'], ['....kppkkppk....', '....kbbkkbbk....']]
  };
  const LOOKS = {
    boy:      { h: '#4a2e1c', c: '#e2504c', p: '#34508f' },
    girl:     { h: '#6b3a22', c: '#f483a5', p: '#4563ad', long: 1 },
    teacher:  { h: '#2a1a10', c: '#ff9466', p: '#5d4a8c', long: 1 },
    guard:    { h: '#9a9a9a', c: '#27385e', p: '#27385e' },
    liming:   { h: '#1d1d1d', c: '#3a7bd5', p: '#3a7bd5', white: 1 },
    chenchen: { h: '#1d1d1d', c: '#22a86a', p: '#22a86a', long: 1, white: 1 },
    xiaoyu:   { h: '#3a2414', c: '#f3bf35', p: '#3a7bd5', long: 1 },
    wanghao:  { h: '#1d1d1d', c: '#8a5cd0', p: '#3a3a5a' },
    monitor:  { h: '#1d1d1d', c: '#f1f1f1', p: '#2f3e5c', band: 1 },
    librarian:{ h: '#5a4030', c: '#7a9a6a', p: '#4a4a4a', long: 1 },
    kid1:     { h: '#2a2a2a', c: '#3a7bd5', p: '#3a7bd5', white: 1 },
    kid2:     { h: '#3a2a1a', c: '#e85d75', p: '#3a7bd5', long: 1, white: 1 },
    kid3:     { h: '#1d1d1d', c: '#ffb347', p: '#555577' }
  };
  const sprites = {};
  function person(look, dir, frame) {
    const key = look + dir + frame; if (sprites[key]) return sprites[key];
    const L = LOOKS[look] || LOOKS.boy;
    const [c, x] = mk(T, T);
    let body = dir === 'down' ? FRONT : dir === 'up' ? BACK : SIDE;
    const legs = (dir === 'down' || dir === 'up') ? LEGS.front[frame] : LEGS.side[frame];
    let rows = body.concat(legs).map(r => r.split(''));
    if (L.long) {
      if (dir === 'side' || dir === 'left' || dir === 'right') { for (let y = 8; y <= 10; y++) { rows[y][3] = 'h'; rows[y][2] = 'k'; } }
      else for (let y = 8; y <= 10; y++) { rows[y][2] = 'h'; rows[y][13] = 'h'; rows[y][1] = 'k'; rows[y][14] = 'k'; }
    }
    if (L.white && dir !== 'left' && dir !== 'right') { rows[10][5] = 'w'; rows[10][10] = 'w'; }
    if (L.band) { rows[11][dir === 'right' || dir === 'left' ? 7 : 3] = 'r'; }
    rows = rows.map(r => r.join(''));
    paint(x, rows, { k: '#1f1f2a', h: L.h, s: '#f8cfa4', e: '#1f1f2a', c: L.c, p: L.p, b: '#2b2b33', w: '#ffffff', r: '#e23b3b' });
    if (dir === 'left') { const [c2, x2] = mk(T, T); x2.translate(T, 0); x2.scale(-1, 1); x2.drawImage(c, 0, 0); sprites[key] = c2; return c2; }
    sprites[key] = c; return c;
  }

  /* ── 몬스터 (덩어리 id로 모양이 정해짐) ── */
  const MON_COLORS = [
    ['#ffb84d', '#ffe2a8'], ['#7ec8ff', '#d4ecff'], ['#ff8fb1', '#ffd6e3'], ['#9be37a', '#dbf7c9'],
    ['#c49bff', '#ead9ff'], ['#ffd84d', '#fff3b8'], ['#ff8a65', '#ffd2c2'], ['#5fd3c7', '#c8f3ee'],
    ['#f2a7ff', '#fbe0ff'], ['#a3b4ff', '#e0e5ff'], ['#ffa94d', '#ffe0bf'], ['#8fe0a8', '#d6f7e0']
  ];
  const mons = {};
  function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function monster(id, silhouette) {
    const key = id + (silhouette ? 's' : ''); if (mons[key]) return mons[key];
    const S = 40, h = hash(id);
    const [c, x] = mk(S, S);
    const [col, belly] = MON_COLORS[h % MON_COLORS.length];
    const shape = (h >> 4) % 4, ears = (h >> 7) % 5, tail = (h >> 10) % 2;
    x.fillStyle = col;
    const ell = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
    const tri = (pts) => { x.beginPath(); x.moveTo(...pts[0]); pts.slice(1).forEach(p => x.lineTo(...p)); x.closePath(); x.fill(); };
    // 귀·뿔
    if (ears === 0) { tri([[9, 16], [12, 3], [18, 12]]); tri([[31, 16], [28, 3], [22, 12]]); }
    if (ears === 1) { ell(10, 9, 4, 6); ell(30, 9, 4, 6); }
    if (ears === 2) { x.fillStyle = '#6fbf4a'; tri([[20, 10], [14, 1], [21, 4]]); tri([[20, 10], [27, 2], [22, 5]]); x.fillStyle = col; }
    if (ears === 3) { x.fillRect(12, 3, 2, 10); x.fillRect(26, 3, 2, 10); ell(13, 3, 3, 3); ell(27, 3, 3, 3); }
    if (ears === 4) { tri([[14, 12], [20, 2], [26, 12]]); }
    // 꼬리
    if (tail) { ell(34, 27, 5, 3); ell(37, 23, 3, 3); }
    // 몸
    if (shape === 0) ell(20, 23, 15, 13);
    if (shape === 1) { ell(20, 25, 16, 11); ell(20, 18, 11, 9); }
    if (shape === 2) { x.beginPath(); x.moveTo(5, 35); x.quadraticCurveTo(4, 8, 20, 8); x.quadraticCurveTo(36, 8, 35, 35); x.closePath(); x.fill(); }
    if (shape === 3) { ell(20, 22, 14, 14); ell(8, 22, 4, 6); ell(32, 22, 4, 6); }
    // 발
    ell(13, 35, 4, 3); ell(27, 35, 4, 3);
    // 배
    x.fillStyle = belly; ell(20, 27, 9, 7);
    // 알파 정리 → 픽셀 테두리
    const d = x.getImageData(0, 0, S, S), a = d.data;
    for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0;
    const out = new Uint8ClampedArray(a);
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const i = (y * S + xx) * 4; if (a[i + 3]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = xx + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < S && Y < S && a[(Y * S + X) * 4 + 3]; });
      if (n) { out[i] = 40; out[i + 1] = 34; out[i + 2] = 52; out[i + 3] = 255; }
    }
    d.data.set(out); x.putImageData(d, 0, 0);
    // 얼굴
    const eyeY = shape === 2 ? 17 : 18, eye = (h >> 12) % 3;
    x.fillStyle = '#2a2234';
    if (eye === 0) { x.fillRect(13, eyeY, 3, 4); x.fillRect(24, eyeY, 3, 4); x.fillStyle = '#fff'; x.fillRect(13, eyeY, 1, 1); x.fillRect(24, eyeY, 1, 1); }
    if (eye === 1) { x.fillRect(12, eyeY + 1, 4, 1); x.fillRect(13, eyeY, 2, 1); x.fillRect(24, eyeY + 1, 4, 1); x.fillRect(25, eyeY, 2, 1); }
    if (eye === 2) { x.fillRect(13, eyeY, 4, 4); x.fillRect(23, eyeY, 4, 4); x.fillStyle = '#fff'; x.fillRect(14, eyeY, 2, 2); x.fillRect(24, eyeY, 2, 2); }
    x.fillStyle = '#ff9fb4'; x.fillRect(10, eyeY + 4, 3, 2); x.fillRect(27, eyeY + 4, 3, 2);
    x.fillStyle = '#2a2234'; x.fillRect(19, eyeY + 4, 2, 1); x.fillRect(18, eyeY + 3, 1, 1); x.fillRect(21, eyeY + 3, 1, 1);
    if (silhouette) { x.globalCompositeOperation = 'source-in'; x.fillStyle = '#3a3348'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over'; }
    mons[key] = c; return c;
  }
  const firstHan = (s) => (s.match(/[一-鿿]/) || ['?'])[0];

  /* 만두볼 (잡을 때 던지는 공) */
  let bun;
  function bunBall() {
    if (bun) return bun;
    const [c, x] = mk(12, 12);
    paint(x, ['....kkkk....', '..kkwwwwkk..', '.kwwwpwwwwk.', '.kwwpwpwwwk.', 'kwwwwwwwwwwk', 'kwwwrrrwwwwk',
      'kwwwrwrwwwwk', 'kwwwrrrwwwwk', '.kwwwwwwwwk.', '.kwwwwwwwwk.', '..kkwwwwkk..', '....kkkk....'],
      { k: '#5a4632', w: '#fff8ea', p: '#d9c3a0', r: '#e2504c' });
    bun = c; return c;
  }

  /* 건물 (칸 단위 → 16px 그림) */
  const bcache = {};
  function building(b) {
    if (bcache[b.id]) return bcache[b.id];
    const W = b.w * T, H = b.h * T;
    const [c, x] = mk(W, H);
    const roofH = Math.round(H * 0.45);
    // 지붕
    x.fillStyle = '#2a2a33'; x.fillRect(0, 2, W, roofH);
    x.fillStyle = b.roof; x.fillRect(1, 3, W - 2, roofH - 2);
    x.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = 6; yy < roofH; yy += 4) x.fillRect(1, yy, W - 2, 1);
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(1, 3, W - 2, 2);
    // 처마 끝 (중국식 들린 처마)
    x.fillStyle = b.roof; x.fillRect(0, 0, 4, 3); x.fillRect(W - 4, 0, 4, 3);
    x.fillStyle = '#2a2a33'; x.fillRect(0, 0, 2, 1); x.fillRect(W - 2, 0, 2, 1);
    // 벽
    x.fillStyle = '#2a2a33'; x.fillRect(0, roofH + 2, W, H - roofH - 2);
    x.fillStyle = b.wall; x.fillRect(1, roofH + 2, W - 2, H - roofH - 3);
    // 창문
    const dx = (b.door[0] - b.x) * T;
    for (let wx = 4; wx < W - 8; wx += 12) {
      if (Math.abs(wx - dx) < 14) continue;
      x.fillStyle = '#2a2a33'; x.fillRect(wx, roofH + 9, 9, 8);
      x.fillStyle = '#9fd8ff'; x.fillRect(wx + 1, roofH + 10, 7, 6);
      x.fillStyle = '#ffffff'; x.fillRect(wx + 1, roofH + 10, 2, 2);
    }
    // 문
    x.fillStyle = '#2a2a33'; x.fillRect(dx + 2, H - 13, 12, 13);
    x.fillStyle = '#b5652e'; x.fillRect(dx + 3, H - 12, 10, 12);
    x.fillStyle = '#ffd34d'; x.fillRect(dx + 10, H - 7, 1, 2);
    // 간판 자리
    x.fillStyle = '#2a2a33'; x.fillRect(W / 2 - 17, roofH - 4, 34, 9);
    x.fillStyle = '#c0392b'; x.fillRect(W / 2 - 16, roofH - 3, 32, 7);
    bcache[b.id] = { c, roofH }; return bcache[b.id];
  }

  return { T, tile, person, monster, firstHan, bunBall, building, LOOKS };
})();
