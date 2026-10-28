/* 星光中学 캠퍼스 맵 (32 × 30칸)
   글자: T 나무 / . 풀밭 / = 길 / s 운동장 / 1~4 그 과의 수풀(들어가면 단서 쪽지가 나옴) / f 꽃 / ~ 연못 / F 울타리 / G 정문 / S 표지판 */
const MAP_W = 32, MAP_H = 30;

const MAP = (() => {
  const g = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
  const set = (x, y, ch) => { g[y][x] = ch; };
  // 테두리 숲
  rect(0, 0, 31, 0, 'T'); rect(0, 29, 31, 29, 'T'); rect(0, 0, 0, 29, 'T'); rect(31, 0, 31, 29, 'T');
  // 구역 나누는 숲
  rect(1, 12, 30, 12, 'T'); rect(1, 21, 30, 21, 'T'); rect(15, 1, 16, 20, 'T');
  // 통로
  set(7, 21, '=');            // 정문 광장 ↔ 교실동 (항상 열림)
  set(25, 21, '=');           // 정문 광장 ↔ 운동장 (1과 뒤)
  set(28, 12, '=');           // 운동장 ↔ 매점 (2과 뒤)
  set(15, 8, '='); set(16, 8, '='); // 매점 ↔ 기숙사 (3과 뒤)

  // ── 정문 광장 (아래) ──
  rect(2, 25, 29, 25, '=');
  rect(7, 22, 7, 24, '='); rect(25, 22, 25, 24, '=');
  rect(15, 26, 16, 28, '=');
  rect(14, 29, 17, 29, 'G');
  rect(2, 23, 4, 24, '~');
  rect(9, 27, 12, 28, 'f'); rect(19, 27, 22, 28, 'f');
  set(20, 23, 'T'); set(11, 23, 'T'); set(28, 27, 'T'); set(3, 27, 'T');
  set(8, 23, 'S'); set(24, 23, 'S');

  // ── 교실동 구역 (왼쪽 가운데) — 1과 ──
  rect(9, 16, 13, 20, '1'); rect(2, 19, 5, 20, '1');
  rect(7, 17, 7, 20, '='); rect(5, 17, 7, 17, '=');
  set(1, 17, 'f'); set(14, 13, 'T'); set(13, 13, 'f');

  // ── 운동장 구역 (오른쪽 가운데) — 2과 ──
  rect(18, 13, 29, 16, 's');
  rect(17, 18, 23, 20, '2'); rect(27, 18, 30, 20, '2');
  rect(25, 17, 25, 20, '='); rect(28, 13, 28, 13, 's');
  set(17, 13, 'T'); set(26, 17, 'f');

  // ── 매점 구역 (오른쪽 위) — 3과 ──
  rect(17, 5, 29, 5, '='); rect(28, 5, 28, 11, '='); rect(17, 5, 17, 8, '=');
  rect(18, 7, 23, 10, '3'); rect(29, 7, 30, 10, '3'); rect(24, 10, 26, 11, '3');
  set(30, 1, 'T'); set(18, 1, 'f'); set(19, 1, 'f'); set(22, 2, 'T');

  // ── 기숙사·도서관 구역 (왼쪽 위) — 4과 ──
  rect(1, 6, 14, 6, '='); rect(14, 6, 14, 8, '='); set(3, 5, '='); set(11, 5, '=');
  rect(1, 8, 7, 11, '4'); rect(10, 9, 13, 11, '4');
  set(8, 2, 'T'); set(14, 1, 'T'); set(8, 10, 'f'); set(9, 8, 'f');
  return g;
})();

/* 건물: 칸 단위. door = 문 칸(건물 맨 아랫줄) */
const BUILDINGS = [
  { id: 'dorm',  x: 1,  y: 1,  w: 6, h: 4, name: '宿舍', ko: '기숙사', roof: '#ff9a9a', wall: '#fffaf2', door: [3, 4] },
  { id: 'lib',   x: 9,  y: 1,  w: 5, h: 4, name: '图书馆', ko: '도서관', roof: '#b49ae6', wall: '#fffaf2', door: [11, 4] },
  { id: 'shop',  x: 24, y: 1,  w: 5, h: 3, name: '小卖部', ko: '매점', roof: '#ffb38a', wall: '#fffaf2', door: [26, 3] },
  { id: 'class', x: 2,  y: 13, w: 7, h: 4, name: '教学楼', ko: '교실동', roof: '#8fbcef', wall: '#fffaf2', door: [5, 16] }
];

/* 사람들. kind:'gate' = 잠긴 대나무 문 (그 과를 해결하면 열림) */
const NPCS = [
  { id: 'teacher', name: '진아쌤', x: 15, y: 24, dir: 'down', look: 'teacher' },
  { id: 'guard',   name: '경비 아저씨', x: 13, y: 27, dir: 'right', look: 'guard',
    lines: [{ zh: '同学，欢迎来到星光中学！', py: 'Tóngxué, huānyíng lái dào Xīngguāng Zhōngxué!', ko: '학생, 星光中学에 온 걸 환영해!' }] },
  { id: 'liming',  name: '李明', x: 8, y: 17, dir: 'down', look: 'liming', lesson: 1 },
  { id: 'chenchen',name: '陈晨', x: 24, y: 17, dir: 'down', look: 'chenchen', lesson: 2 },
  { id: 'xiaoyu',  name: '小雨', x: 26, y: 6, dir: 'down', look: 'xiaoyu', lesson: 3 },
  { id: 'wanghao', name: '王浩', x: 4, y: 7, dir: 'down', look: 'wanghao', lesson: 4 },
  { id: 'gate1', kind: 'gate', x: 25, y: 21, gate: 1 },
  { id: 'gate2', kind: 'gate', x: 28, y: 12, gate: 2 },
  { id: 'gate3', kind: 'gate', x: 16, y: 8, gate: 3 },
  { id: 'kid1',    name: '同学', x: 21, y: 24, dir: 'left', look: 'kid', wander: true,
    lines: [{ zh: '你好！你是韩国人吗？', py: 'Nǐ hǎo! Nǐ shì Hánguó rén ma?', ko: '안녕! 너 한국 사람이야?' }] },
  { id: 'kid2',    name: '同学', x: 21, y: 14, dir: 'down', look: 'kid2', wander: true,
    lines: [{ zh: '我们一起去操场吧！', py: 'Wǒmen yìqǐ qù cāochǎng ba!', ko: '우리 같이 운동장 가자!' }] },
  { id: 'kid3',    name: '同学', x: 20, y: 3, dir: 'down', look: 'kid',
    lines: [{ zh: '小卖部今天不开门。', py: 'Xiǎomàibù jīntiān bù kāimén.', ko: '매점은 오늘 문을 안 열어.' }] }
];

const SIGNS = {
  '8,23': '↑ 教学楼 (교실동) · 李明이 기다려요',
  '24,23': '运动场 (운동장) →'
};

const START_POS = { x: 15, y: 26, dir: 'up' };
