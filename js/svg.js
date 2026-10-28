/* 그림: 사람·장면·학교 지도 (모두 SVG로 직접 그림, 이미지 파일 없음) */
const Pic = (() => {
  const LOOKS = {
    boy:      { hair: '#4a2e1c', shirt: '#ff8a7a', pants: '#5b74b8', style: 'short' },
    girl:     { hair: '#6b3a22', shirt: '#ffa9c4', pants: '#6a80c8', style: 'pony' },
    teacher:  { hair: '#2e1d14', shirt: '#ffb38a', pants: '#7d6aa8', style: 'long' },
    liming:   { hair: '#24242c', shirt: '#7fb2ec', pants: '#7fb2ec', style: 'short', uni: 1 },
    chenchen: { hair: '#24242c', shirt: '#7fd6a8', pants: '#7fd6a8', style: 'pony', uni: 1 },
    xiaoyu:   { hair: '#3a2414', shirt: '#ffd36e', pants: '#7fb2ec', style: 'bun' },
    wanghao:  { hair: '#24242c', shirt: '#b49ae6', pants: '#6b6b8f', style: 'short' },
    kid:      { hair: '#24242c', shirt: '#7fb2ec', pants: '#7fb2ec', style: 'short', uni: 1 },
    kid2:     { hair: '#3a2a1a', shirt: '#7fb2ec', pants: '#7fb2ec', style: 'long', uni: 1 },
    guard:    { hair: '#8a8a8a', shirt: '#6f86b8', pants: '#4f5f88', style: 'short' }
  };
  const SKIN = '#ffdcbf', LINE = '#4b3b5c';

  function hair(L, back) {
    const c = L.hair;
    if (back) {
      if (L.style === 'long') return `<path d="M8 30 Q6 70 14 78 L46 78 Q54 70 52 30 Z" fill="${c}"/>`;
      if (L.style === 'pony') return `<path d="M48 22 Q66 30 58 58 Q52 46 46 36 Z" fill="${c}"/>`;
      if (L.style === 'bun') return `<circle cx="30" cy="5" r="9" fill="${c}"/>`;
      return '';
    }
    return `<path d="M8 30 Q8 6 30 6 Q52 6 52 30 Q46 18 34 17 Q26 24 12 26 Z" fill="${c}"/>`;
  }
  function face(mood) {
    let eyes = `<circle cx="22" cy="32" r="2.8" fill="${LINE}"/><circle cx="38" cy="32" r="2.8" fill="${LINE}"/>
      <circle cx="23" cy="31" r="1" fill="#fff"/><circle cx="39" cy="31" r="1" fill="#fff"/>`;
    if (mood === 'closed' || mood === 'happy') eyes = `<path d="M18 33 Q22 29 26 33 M34 33 Q38 29 42 33" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const mouth = mood === 'shh' ? `<circle cx="30" cy="41" r="2" fill="${LINE}"/>`
      : mood === 'wow' ? `<ellipse cx="30" cy="42" rx="3" ry="4" fill="${LINE}"/>`
      : `<path d="M26 40 Q30 44 34 40" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return eyes + `<ellipse cx="17" cy="38" rx="4" ry="2.4" fill="#ffadb8" opacity=".8"/><ellipse cx="43" cy="38" rx="4" ry="2.4" fill="#ffadb8" opacity=".8"/>` + mouth;
  }
  /* 서 있는 사람 (60×120). dir: down | up | left | right, frame: 0 서기 / 1·2 걷기, pose: stand | shh | phone | wave */
  function person(look, { pose = 'stand', mood = 'smile', dir = 'down', frame = 0 } = {}) {
    const L = LOOKS[look] || LOOKS.boy;
    const arm = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${L.shirt}" stroke-width="9" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="5" fill="${SKIN}"/>`;
    const lift = [[0, 0], [-4, 0], [0, -4]][frame] || [0, 0];
    const legs = `<rect x="18" y="90" width="10" height="${24 + lift[0]}" rx="4" fill="${L.pants}"/><rect x="32" y="90" width="10" height="${24 + lift[1]}" rx="4" fill="${L.pants}"/>
      <rect x="16" y="${110 + lift[0]}" width="13" height="7" rx="3" fill="#5a4a6a"/><rect x="31" y="${110 + lift[1]}" width="13" height="7" rx="3" fill="#5a4a6a"/>`;
    const sw = frame === 1 ? 6 : frame === 2 ? -6 : 0;
    const uni = L.uni ? `<path d="M22 52 L30 64 L38 52" fill="#fff"/><rect x="12" y="74" width="36" height="4" fill="#fff" opacity=".8"/>` : '';
    const bob = frame ? -2 : 0;
    if (dir === 'up') {
      return `<g class="person"><ellipse cx="30" cy="117" rx="20" ry="4" fill="#000" opacity=".1"/>${legs}<g transform="translate(0,${bob})">
        <rect x="12" y="50" width="36" height="44" rx="15" fill="${L.shirt}"/>${arm(14, 58, 8, 84 - sw)}${arm(46, 58, 52, 84 + sw)}
        <circle cx="30" cy="30" r="22" fill="${SKIN}"/><circle cx="30" cy="28" r="22.5" fill="${L.hair}"/>
        ${L.style === 'long' || L.style === 'pony' ? `<path d="M10 30 Q8 66 16 74 L44 74 Q52 66 50 30 Z" fill="${L.hair}"/>` : ''}${L.style === 'bun' ? `<circle cx="30" cy="8" r="9" fill="${L.hair}"/>` : ''}
        ${L.style === 'pony' ? `<circle cx="30" cy="14" r="4" fill="#ff8aa6"/>` : ''}</g></g>`;
    }
    if (dir === 'left' || dir === 'right') {
      const body = `<g class="person"><ellipse cx="30" cy="117" rx="18" ry="4" fill="#000" opacity=".1"/>
        <rect x="${24 - sw}" y="90" width="11" height="24" rx="4" fill="${L.pants}"/><rect x="${25 + sw}" y="90" width="11" height="24" rx="4" fill="${L.pants}"/>
        <rect x="${24 - sw}" y="110" width="15" height="7" rx="3" fill="#5a4a6a"/><rect x="${25 + sw}" y="110" width="15" height="7" rx="3" fill="#5a4a6a"/>
        <g transform="translate(0,${bob})">${L.style === 'long' || L.style === 'pony' ? `<path d="M10 26 Q4 60 14 72 L28 72 L26 30 Z" fill="${L.hair}"/>` : ''}
        <rect x="16" y="50" width="30" height="44" rx="14" fill="${L.shirt}"/>${L.uni ? `<rect x="16" y="74" width="30" height="4" fill="#fff" opacity=".8"/>` : ''}
        ${arm(31, 58, 31 + sw, 84)}
        <circle cx="31" cy="30" r="22" fill="${SKIN}"/>
        <path d="M9 32 Q8 6 32 6 Q50 6 53 24 Q40 16 30 20 Q24 34 18 40 Z" fill="${L.hair}"/>
        ${L.style === 'bun' ? `<circle cx="16" cy="10" r="9" fill="${L.hair}"/>` : ''}${L.style === 'pony' ? `<circle cx="13" cy="20" r="4" fill="#ff8aa6"/>` : ''}
        <circle cx="42" cy="31" r="2.8" fill="${LINE}"/><circle cx="43" cy="30" r="1" fill="#fff"/>
        <ellipse cx="44" cy="38" rx="4" ry="2.4" fill="#ffadb8" opacity=".8"/><path d="M45 42 Q48 43 50 41" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>`;
      return dir === 'left' ? `<g transform="translate(60,0) scale(-1,1)">${body}</g>` : body;
    }
    let arms = arm(14, 58, 8, 84 - sw) + arm(46, 58, 52, 84 + sw);
    if (pose === 'shh') { arms = arm(14, 58, 8, 84) + arm(46, 58, 34, 42); mood = 'shh'; }
    if (pose === 'phone') arms = arm(14, 58, 22, 70) + arm(46, 58, 38, 70) + `<rect x="22" y="60" width="16" height="22" rx="3" fill="#3b3b4f"/><rect x="24" y="62" width="12" height="16" rx="2" fill="#bfe6ff"/>`;
    if (pose === 'wave') arms = arm(14, 58, 8, 84) + arm(46, 58, 58, 36);
    return `<g class="person">
      <ellipse cx="30" cy="117" rx="20" ry="4" fill="#000" opacity=".1"/>${legs}
      <g transform="translate(0,${bob})">${hair(L, true)}
      <rect x="12" y="50" width="36" height="44" rx="15" fill="${L.shirt}"/>${uni}
      ${arms}
      <circle cx="30" cy="30" r="22" fill="${SKIN}"/>
      ${hair(L, false)}${face(mood)}</g>
    </g>`;
  }
  /* 사람 그림을 <img>로 (지도 위에 그리기용) */
  const imgCache = {};
  function personImg(look, opt = {}) {
    const key = look + JSON.stringify(opt);
    if (imgCache[key]) return imgCache[key];
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 122" width="120" height="244">${person(look, opt)}</svg>`);
    imgCache[key] = im; return im;
  }
  /* 얼굴만 (대화창 그림) */
  function portrait(look, mood = 'smile') {
    const L = LOOKS[look] || LOOKS.boy;
    return `<svg viewBox="0 0 60 60" class="portrait"><circle cx="30" cy="30" r="29" fill="#fff4e8"/>
      <g transform="translate(0,4)">${hair(L, true)}<rect x="12" y="50" width="36" height="20" rx="12" fill="${L.shirt}"/><circle cx="30" cy="30" r="22" fill="${SKIN}"/>${hair(L, false)}${face(mood)}</g></svg>`;
  }
  /* 책상에 엎드려 자는 학생 */
  function sleeper(x, y, look, flip) {
    const L = LOOKS[look] || LOOKS.kid;
    return `<g transform="translate(${x},${y}) ${flip ? 'scale(-1,1)' : ''}">
      <rect x="-6" y="18" width="62" height="40" rx="14" fill="${L.shirt}"/>
      <ellipse cx="25" cy="16" rx="26" ry="9" fill="${L.shirt}"/>
      <circle cx="30" cy="4" r="16" fill="${SKIN}"/><path d="M14 4 Q16 -14 32 -12 Q48 -10 46 6 Q38 -2 14 4 Z" fill="${L.hair}"/>
      <path d="M22 8 Q26 6 30 8" stroke="${LINE}" stroke-width="1.6" fill="none"/>
    </g>`;
  }
  /* 앉아서 눈 체조 하는 학생 */
  function eyeKid(x, y, look) {
    const L = LOOKS[look] || LOOKS.kid;
    return `<g transform="translate(${x},${y})">
      <rect x="10" y="40" width="40" height="34" rx="14" fill="${L.shirt}"/>
      ${hair(L, true)}<circle cx="30" cy="26" r="20" fill="${SKIN}"/>${hair(L, false)}
      <path d="M19 28 Q23 25 27 28 M33 28 Q37 25 41 28" stroke="${LINE}" stroke-width="2" fill="none"/>
      <path d="M14 46 L18 28" stroke="${L.shirt}" stroke-width="8" stroke-linecap="round"/><path d="M46 46 L42 28" stroke="${L.shirt}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="19" cy="27" r="4.5" fill="${SKIN}" stroke="${LINE}" stroke-width=".8"/><circle cx="41" cy="27" r="4.5" fill="${SKIN}" stroke="${LINE}" stroke-width=".8"/>
      <path d="M26 36 Q30 38 34 36" stroke="${LINE}" stroke-width="1.6" fill="none"/>
    </g>`;
  }
  const place = (svg, x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">${svg}</g>`;
  const desk = (x, y, w = 96) => `<g><rect x="${x}" y="${y}" width="${w}" height="12" rx="4" fill="#d9a877"/><rect x="${x + 6}" y="${y + 12}" width="7" height="46" fill="#b98757"/><rect x="${x + w - 13}" y="${y + 12}" width="7" height="46" fill="#b98757"/></g>`;
  const zzz = (x, y) => `<text x="${x}" y="${y}" class="zzz" font-size="16" fill="#8a7fb3">Z<tspan font-size="12" dy="-8">z</tspan><tspan font-size="9" dy="-6">z</tspan></text>`;
  const floorPlanks = (y, c1, c2) => `<rect x="0" y="${y}" width="400" height="${300 - y}" fill="${c1}"/>` + [0, 1, 2, 3].map(i => `<rect x="0" y="${y + 14 + i * 22}" width="400" height="2" fill="${c2}"/>`).join('');
  const win = (x, y, w, h, sky = '#cfe8ff') => `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="6" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${sky}"/>
    <rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="#fff"/><rect x="${x}" y="${y + h / 2 - 2}" width="${w}" height="4" fill="#fff"/>`;
  const clock = (cx, cy, h, m, r = 20) => {
    const a = (h % 12 + m / 60) * 30 * Math.PI / 180, b = m * 6 * Math.PI / 180;
    return `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#ffd36e"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(a) * r * .5}" y2="${cy - Math.cos(a) * r * .5}" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(b) * r * .8}" y2="${cy - Math.cos(b) * r * .8}" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>`;
  };
  const plant = (x, y) => `<rect x="${x}" y="${y}" width="26" height="24" rx="5" fill="#f2a07b"/><circle cx="${x + 6}" cy="${y - 6}" r="10" fill="#8fcf7a"/><circle cx="${x + 19}" cy="${y - 10}" r="11" fill="#7cc06a"/><circle cx="${x + 13}" cy="${y - 18}" r="9" fill="#9ad986"/>`;

  /* 장면: npc = 친구 위치(누르는 곳), spots = 쪽지 자리(처음 6곳 + 날아갈 곳) — 좌표는 400×300 기준 */
  const SCENES = {
    1: {
      name: '教学楼 1층 · 二班 교실', bg: '#fff4e8',
      npc: { look: 'liming', x: 300, y: 104, s: 1.25, pose: 'shh' },
      spots: [[64, 112], [272, 50], [150, 252], [372, 182], [222, 160], [30, 240], [118, 168], [338, 34], [196, 280], [258, 262]],
      draw: () => `
        <rect width="400" height="300" fill="#fff4e8"/>${floorPlanks(214, '#f3d9b8', '#e9c9a0')}
        ${win(18, 36, 92, 82)}<path d="M14 30 Q30 70 18 124 L10 124 L10 30 Z" fill="#ffc2c2"/><path d="M114 30 Q98 70 110 124 L118 124 L118 30 Z" fill="#ffc2c2"/>
        <rect x="140" y="30" width="150" height="80" rx="6" fill="#8a6a4a"/><rect x="146" y="36" width="138" height="68" rx="3" fill="#4f7d68"/>
        <text x="215" y="70" text-anchor="middle" font-size="26" fill="#f4f1e6" class="zh-svg">午休</text>
        <text x="215" y="94" text-anchor="middle" font-size="12" fill="#dfe9de">12:30 — 13:30 安静！</text>
        ${clock(340, 56, 12, 30)}
        <rect x="330" y="110" width="58" height="104" rx="5" fill="#d29b6b"/><circle cx="376" cy="166" r="3.5" fill="#ffd36e"/>
        ${desk(28, 186)}${desk(150, 192)}${sleeper(40, 150, 'kid')}${sleeper(160, 156, 'kid2', false)}
        ${zzz(98, 140)}${zzz(220, 146)}
        <rect x="250" y="200" width="40" height="30" rx="8" fill="#ff9d7a"/><rect x="258" y="192" width="24" height="10" rx="4" fill="none" stroke="#ff9d7a" stroke-width="4"/>`
    },
    2: {
      name: '教学楼 2층 · 쉬는 시간', bg: '#eef6ff',
      npc: { look: 'chenchen', x: 306, y: 112, s: 1.2, pose: 'wave' },
      spots: [[200, 44], [44, 92], [120, 268], [350, 250], [266, 74], [26, 180], [180, 196], [96, 40], [300, 280], [240, 250]],
      draw: () => `
        <rect width="400" height="300" fill="#eef6ff"/>${floorPlanks(218, '#e3d7f2', '#d4c4ea')}
        ${win(20, 48, 100, 86, '#d8f3c8')}<rect x="20" y="108" width="100" height="26" fill="#bfe6a6"/><circle cx="56" cy="104" r="10" fill="#8fcf7a"/>
        <text x="70" y="128" text-anchor="middle" font-size="10" fill="#5a7a4a" class="zh-svg">操场</text>
        <rect x="178" y="20" width="44" height="34" rx="8" fill="#7d8aa8"/><circle cx="200" cy="37" r="11" fill="#5b6680"/><circle cx="200" cy="37" r="5" fill="#9aa6c2"/>
        <text x="232" y="34" class="note1" font-size="18" fill="#ff8aa6">♪</text><text x="150" y="44" class="note2" font-size="14" fill="#7fb2ec">♫</text>
        <rect x="236" y="62" width="70" height="52" rx="4" fill="#fff"/><rect x="236" y="62" width="70" height="12" rx="4" fill="#7fd6a8"/>
        <text x="271" y="72" text-anchor="middle" font-size="9" fill="#fff" class="zh-svg">眼保健操</text>
        <circle cx="258" cy="92" r="9" fill="#ffdcbf"/><path d="M252 92 Q258 88 264 92" stroke="#4b3b5c" stroke-width="1.5" fill="none"/><text x="284" y="98" font-size="10" fill="#4b3b5c">①②③</text>
        ${desk(30, 210, 110)}${desk(160, 212, 110)}
        ${eyeKid(40, 140, 'kid')}${eyeKid(90, 142, 'kid2')}${eyeKid(172, 142, 'kid2')}${eyeKid(222, 144, 'kid')}
        ${plant(340, 196)}`
    },
    3: {
      name: '小卖部 앞', bg: '#e6f4ff',
      npc: { look: 'xiaoyu', x: 300, y: 128, s: 1.2, pose: 'phone' },
      spots: [[56, 140], [158, 56], [214, 260], [372, 70], [120, 222], [28, 264], [258, 150], [340, 274], [92, 34], [196, 182]],
      draw: () => `
        <defs><linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8ff"/><stop offset="1" stop-color="#fff4e8"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#sky3)"/><rect y="236" width="400" height="64" fill="#f0dcc0"/>
        <circle cx="360" cy="40" r="20" fill="#ffe08a"/>
        <rect x="20" y="70" width="220" height="166" rx="8" fill="#fffaf2"/>
        <rect x="14" y="58" width="232" height="30" rx="8" fill="#ff9d7a"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${20 + i * 32} 88 q16 18 32 0" fill="${i % 2 ? '#fff' : '#ff9d7a'}"/>`).join('')}
        <text x="130" y="80" text-anchor="middle" font-size="18" fill="#fff" class="zh-svg">小卖部</text>
        <rect x="38" y="118" width="184" height="60" rx="5" fill="#cfe8ff"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${48 + i * 34}" y="${128 + (i % 2) * 8}" width="22" height="30" rx="4" fill="${['#ffd36e', '#7fd6a8', '#ffadb8', '#b49ae6', '#7fb2ec'][i]}"/>`).join('')}
        <rect x="30" y="186" width="200" height="50" rx="4" fill="#d9a877"/>
        <rect x="250" y="150" width="34" height="86" rx="4" fill="#b49ae6" opacity=".25"/>
        <g class="bubble1"><rect x="306" y="80" width="56" height="28" rx="14" fill="#fff" stroke="#ffadb8" stroke-width="2"/><text x="334" y="99" text-anchor="middle" font-size="15" fill="#ff6f91" font-weight="700">520</text></g>
        <g class="bubble2"><rect x="260" y="98" width="48" height="26" rx="13" fill="#fff" stroke="#7fd6a8" stroke-width="2"/><text x="284" y="116" text-anchor="middle" font-size="14" fill="#2f9e6a" font-weight="700">666</text></g>
        <g class="bubble3"><rect x="354" y="118" width="40" height="24" rx="12" fill="#fff" stroke="#7fb2ec" stroke-width="2"/><text x="374" y="135" text-anchor="middle" font-size="13" fill="#3a7bd5" font-weight="700">88</text></g>
        <rect x="140" y="246" width="90" height="10" rx="4" fill="#c99a6b"/><rect x="146" y="256" width="6" height="22" fill="#a77a4f"/><rect x="218" y="256" width="6" height="22" fill="#a77a4f"/>`
    },
    4: {
      name: '宿舍 · 506호', bg: '#f1ecff',
      npc: { look: 'wanghao', x: 312, y: 118, s: 1.2, pose: 'stand' },
      spots: [[60, 64], [150, 132], [250, 44], [344, 262], [44, 250], [196, 268], [122, 70], [300, 40], [266, 200], [90, 190]],
      draw: () => {
        const bunk = (x) => `<g><rect x="${x}" y="40" width="8" height="200" fill="#b98757"/><rect x="${x + 104}" y="40" width="8" height="200" fill="#b98757"/>
          <rect x="${x}" y="96" width="112" height="16" rx="4" fill="#d9a877"/><rect x="${x + 6}" y="84" width="100" height="14" rx="6" fill="#ffdbe6"/><rect x="${x + 8}" y="80" width="30" height="12" rx="6" fill="#fff"/>
          <rect x="${x}" y="196" width="112" height="16" rx="4" fill="#d9a877"/><rect x="${x + 6}" y="184" width="100" height="14" rx="6" fill="#d6ecff"/><rect x="${x + 72}" y="180" width="30" height="12" rx="6" fill="#fff"/>
          ${[0, 1, 2, 3].map(i => `<rect x="${x + 104}" y="${120 + i * 18}" width="16" height="4" fill="#b98757"/>`).join('')}</g>`;
        return `<rect width="400" height="300" fill="#f1ecff"/>${floorPlanks(236, '#e4d6c4', '#d6c4ae')}
          ${bunk(14)}${bunk(140)}
          ${win(286, 30, 90, 64, '#3b4a7a')}<circle cx="352" cy="50" r="10" fill="#fff6c8"/><circle cx="347" cy="47" r="10" fill="#3b4a7a"/>
          <text x="310" y="52" font-size="7" fill="#fff">✦</text><text x="330" y="80" font-size="6" fill="#fff">✦</text>
          ${clock(270, 120, 10, 0, 16)}<rect x="244" y="142" width="52" height="16" rx="4" fill="#4b3b5c"/><text x="270" y="154" text-anchor="middle" font-size="9" fill="#ffe08a" class="zh-svg">22:00 熄灯</text>
          <rect x="250" y="170" width="44" height="40" rx="3" fill="#fff"/><rect x="250" y="170" width="44" height="10" fill="#ff9d7a"/>
          <text x="272" y="196" text-anchor="middle" font-size="9" fill="#4b3b5c" class="zh-svg">周末</text><circle cx="272" cy="193" r="11" fill="none" stroke="#ff6f6f" stroke-width="2"/>
          <text x="46" y="78" font-size="10" fill="#8a7fb3">1</text><text x="46" y="178" font-size="10" fill="#8a7fb3">2</text><text x="172" y="78" font-size="10" fill="#8a7fb3">3</text><text x="172" y="178" font-size="10" fill="#8a7fb3">4</text>`;
      }
    },
    5: {
      name: '图书馆 · 수사 회의실', bg: '#fff4e8',
      npc: { look: 'teacher', x: 300, y: 112, s: 1.25, pose: 'wave' },
      spots: [],
      draw: () => {
        const shelf = (x) => `<rect x="${x}" y="30" width="80" height="170" rx="4" fill="#c99a6b"/>` + [0, 1, 2, 3].map(r => `<rect x="${x + 4}" y="${36 + r * 40}" width="72" height="34" fill="#a77a4f"/>` +
          [0, 1, 2, 3, 4, 5].map(i => `<rect x="${x + 7 + i * 11}" y="${42 + r * 40 + (i % 3)}" width="9" height="${28 - (i % 3)}" rx="1" fill="${['#ff9d7a', '#7fb2ec', '#ffd36e', '#7fd6a8', '#b49ae6', '#ffadb8'][(i + r) % 6]}"/>`).join('')).join('');
        return `<rect width="400" height="300" fill="#fff4e8"/>${floorPlanks(214, '#e9d5bb', '#dcc4a6')}${shelf(10)}
          <rect x="110" y="34" width="170" height="110" rx="6" fill="#d9b48a"/><rect x="116" y="40" width="158" height="98" rx="4" fill="#f7e6cf"/>
          ${[0, 1, 2, 3].map(i => `<g transform="translate(${126 + (i % 2) * 76},${48 + Math.floor(i / 2) * 46}) rotate(${[-4, 3, 2, -3][i]})"><rect width="60" height="38" rx="2" fill="#fff"/><circle cx="30" cy="2" r="4" fill="#ff6f6f"/>
            <text x="30" y="26" text-anchor="middle" font-size="12" fill="#4b3b5c">${['午休', '眼保健操', '520', '住校'][i]}</text></g>`).join('')}
          <path d="M156 70 L232 70 M156 116 L232 116 M186 70 L186 116" stroke="#ff6f6f" stroke-width="1.5" stroke-dasharray="3 3"/>
          <rect x="90" y="200" width="200" height="16" rx="5" fill="#b98757"/><rect x="104" y="216" width="10" height="50" fill="#a77a4f"/><rect x="266" y="216" width="10" height="50" fill="#a77a4f"/>
          <text x="150" y="196" font-size="22">🔍</text><rect x="200" y="186" width="34" height="14" rx="2" fill="#fff"/>`;
      }
    }
  };
  function scene(no) {
    const S = SCENES[no];
    const n = S.npc;
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" class="scene-svg">${S.draw()}
      <g class="npc-fig" transform="translate(${n.x},${n.y}) scale(${n.s})">${person(n.look, { pose: n.pose })}</g></svg>`;
  }

  /* 학교 지도 (400×560) — pins: 장소 번호 → 위치 */
  const PINS = { 1: [76, 300], 2: [134, 300], 3: [302, 150], 4: [96, 108], 5: [241, 48] };
  function map() {
    const tree = (x, y, r = 16) => `<circle cx="${x}" cy="${y + 4}" r="${r}" fill="#000" opacity=".06"/><circle cx="${x}" cy="${y}" r="${r}" fill="#a8d98a"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .45}" fill="#c3e8a8"/>`;
    const house = (x, y, w, h, roof, label, ko) => `<g><rect x="${x}" y="${y + 14}" width="${w}" height="${h}" rx="8" fill="#fffaf2" stroke="#e8d9c2" stroke-width="2"/>
      <path d="M${x - 8} ${y + 18} Q${x + w / 2} ${y - 10} ${x + w + 8} ${y + 18} Z" fill="${roof}"/>
      ${[0, 1, 2].map(i => `<rect x="${x + 12 + i * (w - 24) / 3}" y="${y + 30}" width="${(w - 24) / 3 - 8}" height="12" rx="3" fill="#cfe8ff"/>`).join('')}
      <text x="${x + w / 2}" y="${y + h + 2}" text-anchor="middle" font-size="13" fill="#4b3b5c" class="zh-svg">${label}</text>
      <text x="${x + w / 2}" y="${y + h + 16}" text-anchor="middle" font-size="10" fill="#8a7fb3">${ko}</text></g>`;
    return `<svg viewBox="0 0 400 560" preserveAspectRatio="xMidYMid meet" class="map-svg">
      <rect width="400" height="560" fill="#eaf6dc"/>
      <path d="M200 560 C200 470 120 430 100 360 C84 300 120 250 150 236 M150 236 C210 210 270 200 300 168 M100 360 C60 300 70 170 96 120 M150 236 C190 160 220 110 236 64"
        stroke="#f7e3c4" stroke-width="26" fill="none" stroke-linecap="round"/>
      <path d="M200 560 C200 470 120 430 100 360 C84 300 120 250 150 236 M150 236 C210 210 270 200 300 168 M100 360 C60 300 70 170 96 120 M150 236 C190 160 220 110 236 64"
        stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="2 10" stroke-linecap="round"/>
      <ellipse cx="300" cy="420" rx="70" ry="42" fill="#cfe8ff"/><ellipse cx="300" cy="420" rx="56" ry="30" fill="#bfe0fb"/>
      <rect x="230" y="266" width="140" height="90" rx="45" fill="#f6d2a8"/><rect x="246" y="282" width="108" height="58" rx="29" fill="none" stroke="#fff" stroke-width="3"/>
      <text x="300" y="316" text-anchor="middle" font-size="13" fill="#b07a45" class="zh-svg">操场</text>
      ${house(40, 268, 130, 56, '#7fb2ec', '教学楼', '교실동')}
      ${house(264, 128, 76, 44, '#ff9d7a', '小卖部', '매점')}
      ${house(40, 84, 110, 50, '#ff8a8a', '宿舍', '기숙사')}
      ${house(196, 24, 90, 46, '#b49ae6', '图书馆', '도서관')}
      <rect x="168" y="520" width="64" height="16" rx="4" fill="#d9b48a"/><rect x="170" y="500" width="10" height="36" rx="3" fill="#c99a6b"/><rect x="220" y="500" width="10" height="36" rx="3" fill="#c99a6b"/>
      <text x="200" y="514" text-anchor="middle" font-size="11" fill="#4b3b5c" class="zh-svg">星光中学</text>
      ${tree(30, 420)}${tree(60, 470, 20)}${tree(350, 500, 18)}${tree(370, 300, 14)}${tree(20, 200, 14)}${tree(370, 70, 18)}${tree(160, 150, 12)}${tree(330, 230, 12)}${tree(130, 400, 14)}${tree(250, 470, 12)}
      ${[[70, 380], [150, 470], [340, 360], [190, 380]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffadb8"/><circle cx="${x + 7}" cy="${y + 3}" r="3" fill="#fff"/>`).join('')}
    </svg>`;
  }
  return { person, personImg, portrait, scene, map, SCENES, PINS, LOOKS };
})();
