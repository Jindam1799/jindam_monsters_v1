/* 진담 아침 만두가게 — 메뉴·음료·재료·주문 문장·시장 대화
   주문 문장은 아래 조각을 이어 만듭니다. 병음(py)·뜻(ko)도 같이 이어 붙여요. */

/* 만두 (찜기 한 번 = 4개, 饺子는 2份) */
const FOODS = {
  rou: { zh: '肉包子', py: 'ròu bāozi', ko: '고기 찐빵', unit: 'ge', price: 3, need: 'pork', batch: 4, color: 'bun' },
  cai: { zh: '菜包子', py: 'cài bāozi', ko: '채소 찐빵', unit: 'ge', price: 3, need: 'cabbage', batch: 4, color: 'bunG' },
  mo:  { zh: '蘑菇包子', py: 'mógu bāozi', ko: '버섯 찐빵', unit: 'ge', price: 4, need: 'mushroom', batch: 4, color: 'bunB' },
  jiu: { zh: '韭菜鸡蛋饺子', py: 'jiǔcài jīdàn jiǎozi', ko: '부추계란 물만두', unit: 'fen', price: 8, need: ['chive', 'egg'], batch: 2, color: 'dump' },
  xia: { zh: '虾仁饺子', py: 'xiārén jiǎozi', ko: '새우 물만두', unit: 'fen', price: 9, need: 'shrimp', batch: 2, color: 'dumpP' }
};
/* 음료 (热 = 따뜻한 컵, 冰 = 얼음 컵) */
const DRINKS = {
  hong: { zh: '红茶', py: 'hóngchá', ko: '홍차', price: 4, pot: '#c0392b' },
  dou:  { zh: '豆浆', py: 'dòujiāng', ko: '두유', price: 3, pot: '#f3ead2' },
  lv:   { zh: '绿茶', py: 'lǜchá', ko: '녹차', price: 4, pot: '#58a65c' },
  nai:  { zh: '奶茶', py: 'nǎichá', ko: '밀크티', price: 6, pot: null }   // 红茶 + 牛奶
};
const TEMP = { hot: { zh: '热', py: 'rè', ko: '따뜻한' }, ice: { zh: '冰', py: 'bīng', ko: '아이스' } };

/* 재료 */
const INGR = {
  pork:     { zh: '猪肉', py: 'zhūròu', ko: '돼지고기', icon: '🥩' },
  cabbage:  { zh: '白菜', py: 'báicài', ko: '배추', icon: '🥬' },
  chive:    { zh: '韭菜', py: 'jiǔcài', ko: '부추', icon: '🌿' },
  egg:      { zh: '鸡蛋', py: 'jīdàn', ko: '달걀', icon: '🥚' },
  mushroom: { zh: '蘑菇', py: 'mógu', ko: '버섯', icon: '🍄' },
  shrimp:   { zh: '虾', py: 'xiā', ko: '새우', icon: '🦐' },
  milk:     { zh: '牛奶', py: 'niúnǎi', ko: '우유', icon: '🥛' },
  fish:     { zh: '鱼', py: 'yú', ko: '물고기', icon: '🐟' },
  greentea: { zh: '绿茶叶', py: 'lǜcháyè', ko: '녹차 잎', icon: '🍃' }
};

/* 숫자 + 양사 (一·两 성조 바뀜 반영) */
const NUM = {
  ge:  { 1: ['一个', 'yí ge'], 2: ['两个', 'liǎng ge'], 3: ['三个', 'sān ge'], 4: ['四个', 'sì ge'], ko: '개' },
  fen: { 1: ['一份', 'yí fèn'], 2: ['两份', 'liǎng fèn'], ko: '인분' },
  bei: { 1: ['一杯', 'yì bēi'], 2: ['两杯', 'liǎng bēi'], ko: '잔' }
};
const ORDER_START = [['我要', 'Wǒ yào'], ['老板，我要', 'Lǎobǎn, wǒ yào'], ['给我', 'Gěi wǒ'], ['来', 'Lái']];

/* 손님 말 */
const SAY = {
  hello: [['老板，早！', 'Lǎobǎn, zǎo!', '사장님, 안녕하세요(아침 인사)!'], ['早上好！', 'Zǎoshang hǎo!', '좋은 아침!']],
  thanks: [['好吃！谢谢！', 'Hǎochī! Xièxie!', '맛있어요! 고마워요!'], ['真香！', 'Zhēn xiāng!', '정말 맛있는 냄새!'], ['明天再来！', 'Míngtiān zài lái!', '내일 또 올게요!']],
  wrong: ['不是这个！', 'Bú shì zhège!', '이거 아니에요!'],
  slow: ['太慢了……', 'Tài màn le……', '너무 느려요…'],
  wait: ['快点儿！', 'Kuài diǎnr!', '빨리요!']
};

/* 손님 모습 (도트 팔레트) */
const GUESTS = [
  { id: 'stu1', name: '학생', hair: '#2a2230', shirt: '#4f7fd0', pants: '#4f7fd0', uni: 1, patience: 1 },
  { id: 'stu2', name: '학생', hair: '#4a2e1c', shirt: '#4f7fd0', pants: '#4f7fd0', uni: 1, long: 1, patience: 1 },
  { id: 'office', name: '회사원', hair: '#222', shirt: '#e8e8f0', pants: '#3a3f55', tie: '#d04040', patience: .85 },
  { id: 'grandma', name: '할머니', hair: '#cfcfd6', shirt: '#e07a9a', pants: '#5a4a7a', bun: 1, patience: 1.25 },
  { id: 'worker', name: '아저씨', hair: '#333', shirt: '#e8a23a', pants: '#4a5a7a', cap: '#3a6ad0', patience: .9 }
];
/* 단골 (교재 2권 친구들) — 서빙이 끝나면 교재 대화로 말을 걸어요 */
const REGULARS = [
  { id: 'liming', name: '李明', lesson: 1, hair: '#1d1d24', shirt: '#4f7fd0', pants: '#4f7fd0', uni: 1, patience: 1.1 },
  { id: 'chenchen', name: '陈晨', lesson: 2, hair: '#1d1d24', shirt: '#2bb673', pants: '#2bb673', uni: 1, long: 1, patience: 1.1 },
  { id: 'xiaoyu', name: '小雨', lesson: 3, hair: '#3a2414', shirt: '#f3bf35', pants: '#4f7fd0', bun: 1, patience: 1.1 },
  { id: 'wanghao', name: '王浩', lesson: 4, hair: '#1d1d24', shirt: '#8a5cd0', pants: '#3a3a5a', patience: 1.1 }
];

/* 시장 가게 */
const SHOPS = [
  { id: 'meat', name: '정육점', zh: '肉店', owner: '张老板', items: [{ k: 'pork', unit: '斤', unitPy: 'jīn', price: 10 }] },
  { id: 'veg', name: '채소가게', zh: '菜店', owner: '王阿姨', items: [{ k: 'cabbage', unit: '斤', unitPy: 'jīn', price: 5 }, { k: 'chive', unit: '斤', unitPy: 'jīn', price: 5 }] },
  { id: 'tea', name: '찻잎가게', zh: '茶叶店', owner: '刘爷爷', items: [{ k: 'greentea', unit: '包', unitPy: 'bāo', price: 20, once: true }] },
  { id: 'fishbuy', name: '생선 사는 곳', zh: '鱼店', owner: '赵叔叔', sell: 'fish', sellPrice: 8 }
];
const ZH_NUM = { 1: ['一', 'yī'], 2: ['两', 'liǎng'], 3: ['三', 'sān'], 4: ['四', 'sì'], 5: ['五', 'wǔ'], 10: ['十', 'shí'], 15: ['十五', 'shíwǔ'], 20: ['二十', 'èrshí'], 25: ['二十五', 'èrshíwǔ'], 30: ['三十', 'sānshí'], 40: ['四十', 'sìshí'], 50: ['五十', 'wǔshí'] };

/* 농가·산에서 얻는 것 */
const FARM_ITEMS = ['egg', 'milk', 'mushroom'];
const FARM_TALK = [
  ['孩子，你来啦！', 'Háizi, nǐ lái la!', '얘야, 왔구나!'],
  ['今天的鸡蛋很新鲜。', 'Jīntiān de jīdàn hěn xīnxiān.', '오늘 달걀은 아주 신선해.'],
  ['山上的蘑菇长出来了。', 'Shān shang de mógu zhǎng chūlái le.', '산에 버섯이 자랐단다.']
];
/* 강에서 잡히는 것 */
const CATCH = [{ k: 'shrimp', w: 6 }, { k: 'fish', w: 3 }, { k: 'gold', w: 1 }];
const GOLD_FISH = { zh: '金鱼', py: 'jīnyú', ko: '금붕어 (보너스 20块)' };

/* 가게 키우기 */
const UPGRADES = [
  { id: 'steamer', name: '찜기 하나 더', desc: '한 번에 더 많이 쪄요', price: 40, max: 3, base: 2 },
  { id: 'seat', name: '자리 하나 더', desc: '손님이 한 명 더 앉아요', price: 60, max: 4, base: 3 },
  { id: 'kettle', name: '큰 주전자', desc: '차를 더 빨리 따라요', price: 35, max: 1, base: 0 },
  { id: 'lantern', name: '빨간 등불', desc: '손님이 더 오래 기다려 줘요', price: 50, max: 1, base: 0 },
  { id: 'hand', name: '큰 쟁반', desc: '한 번에 3개를 들어요', price: 70, max: 1, base: 0 }
];
/* 새 메뉴가 열리는 조건 (재료를 처음 손에 넣으면 그날 밤 연구) */
const UNLOCK = [
  { k: 'cai', by: ['cabbage'], line: '배추로 채소 찐빵을 만들 수 있겠어!' },
  { k: 'jiu', by: ['chive', 'egg'], line: '부추와 달걀이 있으면 물만두를 빚을 수 있어!' },
  { k: 'xia', by: ['shrimp'], line: '강에서 잡은 새우로 새우 물만두를!' },
  { k: 'mo', by: ['mushroom'], line: '산에서 딴 버섯으로 버섯 찐빵을!' },
  { k: 'lv', drink: 1, by: ['greentea'], line: '녹차 잎이 생겼다! 녹차를 팔 수 있어.' },
  { k: 'nai', drink: 1, by: ['milk'], line: '우유가 생겼다! 홍차에 우유를 넣으면 밀크티!' }
];
