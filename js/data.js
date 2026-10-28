/* 진담 몬스터즈 · 교재 2권 「중국 10대 비밀 일기」 1~4과 콘텐츠
   - chunks: 풀숲 덩어리 몬스터 (hz 한자, py 병음, ko 뜻, say 음성용 글, ex 예문 조각, gram HSK 문법 태그)
   - battle: 과 마지막 '1분 대화 배틀' (reply = 질문에 대답 / ask = 알맞은 질문 고르기, 첫 보기가 정답)
   - 바꾸려면 이 파일만 고치면 됩니다. id는 저장 기록과 연결되니 바꾸지 마세요. */

const LESSONS = [
  {
    no: 1,
    title: '점심 먹고 교실에서 다 같이 잔다고?',
    zone: '교실동 앞 풀숲',
    npc: 'liming',
    chunks: [
      { id: 'L1a', hz: '吃完午饭', py: 'chī wán wǔfàn', ko: '점심을 다 먹고', mon: '냠냠몬',
        ex: ['我们', '吃完午饭', '就', '午休'], end: '。', exPy: 'Wǒmen chī wán wǔfàn jiù wǔxiū.', exKo: '우리는 점심을 다 먹고 바로 쉬는 시간이야.' },
      { id: 'L1b', hz: '趴在桌子上睡', py: 'pā zài zhuōzi shang shuì', ko: '책상에 엎드려 자다', mon: '엎드림몬',
        ex: ['中午', '很多学生', '趴在桌子上睡'], end: '。', exPy: 'Zhōngwǔ hěn duō xuésheng pā zài zhuōzi shang shuì.', exKo: '점심에 많은 학생이 책상에 엎드려 자.' },
      { id: 'L1c', hz: '午休时间', py: 'wǔxiū shíjiān', ko: '점심 휴식 시간', mon: '쿨쿨몬', word: true,
        ex: ['午休时间', '不要', '说话'], end: '。', exPy: 'Wǔxiū shíjiān búyào shuōhuà.', exKo: '점심 휴식 시간에는 말하면 안 돼.' },
      { id: 'L1d', hz: '该午休了', py: 'gāi wǔxiū le', ko: '쉴 시간이 됐다', mon: '째깍몬', gram: '③ 该……了',
        ex: ['十二点半了，', '该', '午休', '了'], end: '。', exPy: 'Shí\'èr diǎn bàn le, gāi wǔxiū le.', exKo: '12시 반이야, 쉴 시간이 됐어.' },
      { id: 'L1e', hz: '从来不睡午觉', py: 'cónglái bú shuì wǔjiào', ko: '낮잠을 한 번도 안 자다', mon: '말똥몬', gram: '④ 从来不',
        ex: ['我', '在韩国', '从来不', '睡午觉'], end: '。', exPy: 'Wǒ zài Hánguó cónglái bú shuì wǔjiào.', exKo: '나는 한국에서 낮잠을 한 번도 안 자.' },
      { id: 'L1f', hz: '睡一会儿', py: 'shuì yíhuìr', ko: '잠깐 자다', mon: '꾸벅몬',
        ex: ['我有点儿累，', '想', '睡一会儿'], end: '。', exPy: 'Wǒ yǒudiǎnr lèi, xiǎng shuì yíhuìr.', exKo: '좀 피곤해서 잠깐 자고 싶어.' }
    ],
    intro: [
      { t: '점심을 먹고 교실에 들어왔더니… 모두 책상에 엎드려 있다!?' },
      { who: '李明', zh: '嘘！该午休了。', py: 'Xū! Gāi wǔxiū le.', ko: '쉿! 쉴 시간이야.' },
      { who: '李明', zh: '我们吃完午饭就午休。', py: 'Wǒmen chī wán wǔfàn jiù wǔxiū.', ko: '우리는 점심을 다 먹고 바로 쉬어.' },
      { who: '李明', zh: '大家都趴在桌子上睡一会儿。', py: 'Dàjiā dōu pā zài zhuōzi shang shuì yíhuìr.', ko: '다들 책상에 엎드려서 잠깐 자.' },
      { t: '(수상한 질문 ①) 점심 먹고 교실에서 다 같이 잔다고?' },
      { who: '李明', t: '아, 너 한국에서 왔구나! 그런데 큰일이야. 午休 이야기가 적힌 일기장이 날아가서, 덩어리 몬스터들이 풀숲에 숨어 버렸어.' },
      { who: '李明', t: '오른쪽 풀숲에서 몬스터 6마리를 모두 잡아 와! 그럼 나랑 중국어로 대화 배틀을 하자.' }
    ],
    waiting: { who: '李明', zh: '加油！', py: 'Jiāyóu!', ko: '힘내!' },
    battleStart: { who: '李明', t: '와, 6마리를 다 모았구나! 이제 나랑 중국어로 이야기해 보자!' },
    battle: [
      { type: 'reply', q: { zh: '你吃完午饭了吗？', py: 'Nǐ chī wán wǔfàn le ma?', ko: '점심 다 먹었어?' },
        opts: [
          { zh: '吃完了，我吃得很饱。', py: 'Chī wán le, wǒ chī de hěn bǎo.', ko: '다 먹었어, 배불러.' },
          { zh: '我十二点上课。', py: 'Wǒ shí\'èr diǎn shàngkè.', ko: '나는 12시에 수업해.' },
          { zh: '我从来不喝咖啡。', py: 'Wǒ cónglái bù hē kāfēi.', ko: '나는 커피를 한 번도 안 마셔.' }
        ], react: { zh: '太好了！', py: 'Tài hǎo le!', ko: '잘됐다!' } },
      { type: 'reply', q: { zh: '十二点半了，现在该做什么了？', py: 'Shí\'èr diǎn bàn le, xiànzài gāi zuò shénme le?', ko: '12시 반이야, 이제 뭐 할 시간이지?' },
        opts: [
          { zh: '该午休了。', py: 'Gāi wǔxiū le.', ko: '쉴 시간이야.' },
          { zh: '我们学校很大。', py: 'Wǒmen xuéxiào hěn dà.', ko: '우리 학교는 커.' },
          { zh: '我不是中国人。', py: 'Wǒ bú shì Zhōngguó rén.', ko: '나는 중국 사람이 아니야.' }
        ], react: { zh: '对！', py: 'Duì!', ko: '맞아!' } },
      { type: 'reply', q: { zh: '你在韩国睡午觉吗？', py: 'Nǐ zài Hánguó shuì wǔjiào ma?', ko: '너는 한국에서 낮잠 자?' },
        opts: [
          { zh: '不睡，我从来不睡午觉。', py: 'Bú shuì, wǒ cónglái bú shuì wǔjiào.', ko: '안 자, 낮잠을 한 번도 안 자.' },
          { zh: '我在韩国上学。', py: 'Wǒ zài Hánguó shàngxué.', ko: '나는 한국에서 학교에 다녀.' },
          { zh: '午饭很好吃。', py: 'Wǔfàn hěn hǎochī.', ko: '점심이 맛있어.' }
        ], react: { zh: '真的吗？从来不睡？', py: 'Zhēn de ma? Cónglái bú shuì?', ko: '정말? 한 번도 안 자?' } },
      { type: 'ask', goal: '중국 학생들이 어떻게 쉬는지 물어보기',
        opts: [
          { zh: '你们怎么午休？', py: 'Nǐmen zěnme wǔxiū?', ko: '너희는 어떻게 쉬어?' },
          { zh: '你们几点吃午饭？', py: 'Nǐmen jǐ diǎn chī wǔfàn?', ko: '너희는 몇 시에 점심 먹어?' },
          { zh: '你们午饭吃什么？', py: 'Nǐmen wǔfàn chī shénme?', ko: '너희는 점심에 뭐 먹어?' }
        ], react: { zh: '我们都趴在桌子上睡一会儿。', py: 'Wǒmen dōu pā zài zhuōzi shang shuì yíhuìr.', ko: '우리는 다 책상에 엎드려서 잠깐 자.' } },
      { type: 'reply', q: { zh: '午休时间可以说话吗？', py: 'Wǔxiū shíjiān kěyǐ shuōhuà ma?', ko: '쉬는 시간에 말해도 돼?' },
        opts: [
          { zh: '不可以，要安静。', py: 'Bù kěyǐ, yào ānjìng.', ko: '안 돼, 조용히 해야 해.' },
          { zh: '可以，我吃完了。', py: 'Kěyǐ, wǒ chī wán le.', ko: '돼, 나 다 먹었어.' },
          { zh: '十二点。', py: 'Shí\'èr diǎn.', ko: '12시.' }
        ], react: { zh: '你说得真好！', py: 'Nǐ shuō de zhēn hǎo!', ko: '정말 잘 말하는구나!' } }
    ],
    page: {
      zh: '今天吃完午饭，我们都趴在桌子上睡了一会儿。韩国朋友吓了一跳！',
      py: 'Jīntiān chī wán wǔfàn, wǒmen dōu pā zài zhuōzi shang shuì le yíhuìr. Hánguó péngyou xià le yí tiào!',
      ko: '오늘 점심을 먹고 우리 모두 책상에 엎드려 잠깐 잤다. 한국 친구가 깜짝 놀랐다!',
      fact: '중국의 많은 학교는 점심을 먹은 뒤 午休(점심 휴식) 시간이 있어요. 교실에서 책상에 엎드려 잠깐 쉬는 학생이 많아요.'
    },
    mySentence: [
      [ { zh: '我们学校', py: 'Wǒmen xuéxiào', ko: '우리 학교는' }, { zh: '我们班', py: 'Wǒmen bān', ko: '우리 반은' } ],
      [ { zh: '吃完午饭', py: 'chī wán wǔfàn', ko: '점심을 다 먹고' } ],
      [ { zh: '就去操场玩儿。', py: 'jiù qù cāochǎng wánr.', ko: '바로 운동장에 가서 놀아.' },
        { zh: '就在教室聊天。', py: 'jiù zài jiàoshì liáotiān.', ko: '바로 교실에서 수다를 떨어.' },
        { zh: '就趴在桌子上睡一会儿。', py: 'jiù pā zài zhuōzi shang shuì yíhuìr.', ko: '바로 책상에 엎드려 잠깐 자.' } ]
    ],
    mission: '우리 학교 점심시간 1분 소개',
    after: { who: '李明', zh: '下次见！', py: 'Xià cì jiàn!', ko: '다음에 봐!' }
  },

  {
    no: 2,
    title: '수업 사이에 다 같이 눈 체조를?',
    zone: '운동장 옆 풀숲',
    npc: 'chenchen',
    chunks: [
      { id: 'L2a', hz: '做眼保健操', py: 'zuò yǎnbǎojiàncāo', ko: '눈 체조를 하다', mon: '깜빡몬',
        ex: ['我们', '每天上午', '做眼保健操'], end: '。', exPy: 'Wǒmen měitiān shàngwǔ zuò yǎnbǎojiàncāo.', exKo: '우리는 매일 오전에 눈 체조를 해.' },
      { id: 'L2b', hz: '课间休息', py: 'kèjiān xiūxi', ko: '쉬는 시간', mon: '딩동몬',
        ex: ['课间休息', '有', '十分钟'], end: '。', exPy: 'Kèjiān xiūxi yǒu shí fēnzhōng.', exKo: '쉬는 시간은 10분이야.' },
      { id: 'L2c', hz: '闭上眼睛', py: 'bìshang yǎnjing', ko: '눈을 감다', mon: '꼭감몬',
        ex: ['请', '大家', '闭上眼睛'], end: '。', exPy: 'Qǐng dàjiā bìshang yǎnjing.', exKo: '모두 눈을 감아 주세요.' },
      { id: 'L2d', hz: '一边听音乐一边做', py: 'yìbiān tīng yīnyuè yìbiān zuò', ko: '음악을 들으면서 하다', mon: '둠칫몬', gram: '③ 一边……一边……',
        ex: ['我们', '一边听音乐', '一边做操'], end: '。', exPy: 'Wǒmen yìbiān tīng yīnyuè yìbiān zuò cāo.', exKo: '우리는 음악을 들으면서 체조를 해.' },
      { id: 'L2e', hz: '往往去操场', py: 'wǎngwǎng qù cāochǎng', ko: '대개 운동장에 가다', mon: '우르르몬', gram: '④ 往往',
        ex: ['课间休息的时候，', '同学们', '往往去操场'], end: '。', exPy: 'Kèjiān xiūxi de shíhou, tóngxuémen wǎngwǎng qù cāochǎng.', exKo: '쉬는 시간에 친구들은 대개 운동장에 가.' },
      { id: 'L2f', hz: '保护眼睛', py: 'bǎohù yǎnjing', ko: '눈을 보호하다', mon: '반짝몬',
        ex: ['做眼保健操', '可以', '保护眼睛'], end: '。', exPy: 'Zuò yǎnbǎojiàncāo kěyǐ bǎohù yǎnjing.', exKo: '눈 체조를 하면 눈을 보호할 수 있어.' }
    ],
    intro: [
      { t: '딩동댕~ 수업이 끝나자 스피커에서 음악이 흘러나온다.' },
      { t: '그런데 모두 자리에 앉아 눈을 감고, 눈 주변을 꾹꾹 누르고 있다!?' },
      { who: '陈晨', zh: '这是眼保健操！', py: 'Zhè shì yǎnbǎojiàncāo!', ko: '이건 눈 보건 체조야!' },
      { who: '陈晨', zh: '我们一边听音乐一边做，可以保护眼睛。', py: 'Wǒmen yìbiān tīng yīnyuè yìbiān zuò, kěyǐ bǎohù yǎnjing.', ko: '우리는 음악을 들으면서 해. 눈을 보호할 수 있어.' },
      { t: '(수상한 질문 ②) 수업 사이에 다 같이 눈 체조를?' },
      { who: '陈晨', t: '나는 체육부장 陈晨이야! 운동장 옆 풀숲에 눈 체조 덩어리 몬스터 6마리가 숨었어. 다 잡아 오면 대화 배틀 시작!' }
    ],
    waiting: { who: '陈晨', zh: '快去吧！', py: 'Kuài qù ba!', ko: '얼른 가 봐!' },
    battleStart: { who: '陈晨', t: '다 잡았네! 그럼 쉬는 시간 이야기로 대화 배틀이야!' },
    battle: [
      { type: 'reply', q: { zh: '下课了！课间休息你想做什么？', py: 'Xià kè le! Kèjiān xiūxi nǐ xiǎng zuò shénme?', ko: '수업 끝! 쉬는 시간에 뭐 하고 싶어?' },
        opts: [
          { zh: '我想去操场玩儿。', py: 'Wǒ xiǎng qù cāochǎng wánr.', ko: '운동장에 가서 놀고 싶어.' },
          { zh: '十分钟。', py: 'Shí fēnzhōng.', ko: '10분.' },
          { zh: '我是韩国人。', py: 'Wǒ shì Hánguó rén.', ko: '나는 한국 사람이야.' }
        ], react: { zh: '好啊，一起去！', py: 'Hǎo a, yìqǐ qù!', ko: '좋아, 같이 가자!' } },
      { type: 'ask', goal: '쉬는 시간이 몇 분인지 물어보기',
        opts: [
          { zh: '课间休息有几分钟？', py: 'Kèjiān xiūxi yǒu jǐ fēnzhōng?', ko: '쉬는 시간은 몇 분이야?' },
          { zh: '你几点下课？', py: 'Nǐ jǐ diǎn xià kè?', ko: '너는 몇 시에 수업이 끝나?' },
          { zh: '操场在哪儿？', py: 'Cāochǎng zài nǎr?', ko: '운동장은 어디야?' }
        ], react: { zh: '十分钟。我们往往去操场。', py: 'Shí fēnzhōng. Wǒmen wǎngwǎng qù cāochǎng.', ko: '10분이야. 우리는 대개 운동장에 가.' } },
      { type: 'reply', q: { zh: '音乐响了！你知道这是什么吗？', py: 'Yīnyuè xiǎng le! Nǐ zhīdào zhè shì shénme ma?', ko: '음악이 나와! 이게 뭔지 알아?' },
        opts: [
          { zh: '是眼保健操吧？', py: 'Shì yǎnbǎojiàncāo ba?', ko: '눈 체조지?' },
          { zh: '是十分钟。', py: 'Shì shí fēnzhōng.', ko: '10분이야.' },
          { zh: '我不想去操场。', py: 'Wǒ bù xiǎng qù cāochǎng.', ko: '나는 운동장에 가기 싫어.' }
        ], react: { zh: '对！一起做吧！', py: 'Duì! Yìqǐ zuò ba!', ko: '맞아! 같이 하자!' } },
      { type: 'reply', q: { zh: '做眼保健操的时候，先要做什么？', py: 'Zuò yǎnbǎojiàncāo de shíhou, xiān yào zuò shénme?', ko: '눈 체조를 할 때 먼저 뭘 해야 해?' },
        opts: [
          { zh: '先闭上眼睛。', py: 'Xiān bìshang yǎnjing.', ko: '먼저 눈을 감아.' },
          { zh: '先看手机。', py: 'Xiān kàn shǒujī.', ko: '먼저 휴대폰을 봐.' },
          { zh: '先吃午饭。', py: 'Xiān chī wǔfàn.', ko: '먼저 점심을 먹어.' }
        ], react: { zh: '没错！', py: 'Méi cuò!', ko: '맞았어!' } },
      { type: 'reply', q: { zh: '你觉得眼保健操有用吗？', py: 'Nǐ juéde yǎnbǎojiàncāo yǒuyòng ma?', ko: '눈 체조가 도움이 되는 것 같아?' },
        opts: [
          { zh: '有用，可以保护眼睛。', py: 'Yǒuyòng, kěyǐ bǎohù yǎnjing.', ko: '도움이 돼, 눈을 보호할 수 있어.' },
          { zh: '有，课间休息。', py: 'Yǒu, kèjiān xiūxi.', ko: '있어, 쉬는 시간.' },
          { zh: '我一边吃一边睡。', py: 'Wǒ yìbiān chī yìbiān shuì.', ko: '나는 먹으면서 자.' }
        ], react: { zh: '你真棒！', py: 'Nǐ zhēn bàng!', ko: '너 정말 최고야!' } }
    ],
    page: {
      zh: '第二节课下课了，音乐一响，我们就闭上眼睛做眼保健操。',
      py: 'Dì-èr jié kè xià kè le, yīnyuè yì xiǎng, wǒmen jiù bìshang yǎnjing zuò yǎnbǎojiàncāo.',
      ko: '둘째 시간이 끝나고 음악이 울리자, 우리는 눈을 감고 눈 체조를 했다.',
      fact: '眼保健操(눈 보건 체조)는 중국 학교에서 오래 이어져 온 일과예요. 음악과 구령에 맞춰 눈 주변을 눌러 눈의 피로를 풀어요.'
    },
    mySentence: [
      [ { zh: '我们', py: 'Wǒmen', ko: '우리는' }, { zh: '我和朋友', py: 'Wǒ hé péngyou', ko: '나와 친구는' } ],
      [ { zh: '课间休息的时候', py: 'kèjiān xiūxi de shíhou', ko: '쉬는 시간에' } ],
      [ { zh: '往往去操场玩儿。', py: 'wǎngwǎng qù cāochǎng wánr.', ko: '대개 운동장에 가서 놀아.' },
        { zh: '往往在教室聊天。', py: 'wǎngwǎng zài jiàoshì liáotiān.', ko: '대개 교실에서 수다를 떨어.' },
        { zh: '往往一边听音乐一边休息。', py: 'wǎngwǎng yìbiān tīng yīnyuè yìbiān xiūxi.', ko: '대개 음악을 들으면서 쉬어.' } ]
    ],
    mission: '우리 반 쉬는 시간 인터뷰',
    after: { who: '陈晨', zh: '明天见！', py: 'Míngtiān jiàn!', ko: '내일 봐!' }
  },

  {
    no: 3,
    title: '숫자로 말을 한다고?',
    zone: '매점 앞 풀숲',
    npc: 'xiaoyu',
    chunks: [
      { id: 'L3a', hz: '发“666”', py: 'fā "liù liù liù"', ko: '"666"을 보내다 (대단해!)', mon: '육육몬', say: '发六六六',
        ex: ['同学们', '都', '发“666”'], end: '。', exSay: '同学们都发六六六。', exPy: 'Tóngxuémen dōu fā "liù liù liù".', exKo: '친구들이 모두 "666(대단해)"을 보내.' },
      { id: 'L3b', hz: '是“我爱你”的意思', py: 'shì "wǒ ài nǐ" de yìsi', ko: '"사랑해"라는 뜻이다', mon: '하트몬', gram: '是……的意思',
        ex: ['“520”', '是“我爱你”的意思'], end: '。', exSay: '五二零是我爱你的意思。', exPy: '"Wǔ èr líng" shì "wǒ ài nǐ" de yìsi.', exKo: '"520"은 "사랑해"라는 뜻이야.' },
      { id: 'L3c', hz: '“88”就是“拜拜”', py: '"bā bā" jiù shì "bàibai"', ko: '"88"은 바로 "바이바이"', mon: '빠빠몬', say: '八八就是拜拜',
        ex: ['在网上，', '“88”', '就是', '“拜拜”'], end: '。', exSay: '在网上，八八就是拜拜。', exPy: 'Zài wǎngshang, "bā bā" jiù shì "bàibai".', exKo: '인터넷에서 "88"은 바로 "바이바이"야.' },
      { id: 'L3d', hz: '发音很像', py: 'fāyīn hěn xiàng', ko: '발음이 비슷하다', mon: '메아리몬',
        ex: ['“520”和“我爱你”', '发音很像'], end: '。', exSay: '五二零和我爱你发音很像。', exPy: '"Wǔ èr líng" hé "wǒ ài nǐ" fāyīn hěn xiàng.', exKo: '"520"과 "我爱你"는 발음이 비슷해.' },
      { id: 'L3e', hz: '互相发消息', py: 'hùxiāng fā xiāoxi', ko: '서로 메시지를 보내다', mon: '톡톡몬', gram: '④ 互相',
        ex: ['我们', '每天', '互相发消息'], end: '。', exPy: 'Wǒmen měitiān hùxiāng fā xiāoxi.', exKo: '우리는 매일 서로 메시지를 보내.' },
      { id: 'L3f', hz: '不但好玩儿，而且很方便', py: 'búdàn hǎowánr, érqiě hěn fāngbiàn', ko: '재미있을 뿐만 아니라 편하기도 하다', mon: '두배몬', gram: '③ 不但……而且……',
        ex: ['数字暗号', '不但好玩儿，', '而且很方便'], end: '。', exPy: 'Shùzì ànhào búdàn hǎowánr, érqiě hěn fāngbiàn.', exKo: '숫자 암호는 재미있을 뿐만 아니라 편하기도 해.' }
    ],
    intro: [
      { t: '띠링! 小雨의 휴대폰에 메시지가 왔다. 그런데… 글자가 아니라 숫자뿐이다!?' },
      { who: '小雨', zh: '你看，同学给我发了“666”。', say: '你看，同学给我发了六六六。', py: 'Nǐ kàn, tóngxué gěi wǒ fā le "liù liù liù".', ko: '봐, 친구가 나한테 "666"을 보냈어.' },
      { who: '小雨', zh: '“666”是“很厉害”的意思！', say: '六六六是很厉害的意思！', py: '"Liù liù liù" shì "hěn lìhai" de yìsi!', ko: '"666"은 "대단해"라는 뜻이야!' },
      { t: '(수상한 질문 ③) 숫자로 말을 한다고?' },
      { who: '小雨', t: '안녕, 나는 小雨야! 이 비밀 일기의 주인이지. 고마워, 벌써 두 쪽이나 찾아 줬구나!' },
      { who: '小雨', t: '매점 앞 풀숲에 숫자 암호 몬스터 6마리가 숨어 있어. 다 잡으면 나랑 숫자 암호로 대화하자!' }
    ],
    waiting: { who: '小雨', zh: '88！啊不，加油！', say: '八八！啊不，加油！', py: 'Bā bā! À bù, jiāyóu!', ko: '88(바이바이)! 아니 아니, 힘내!' },
    battleStart: { who: '小雨', t: '와, 6마리 다 모았어? 그럼 내 숫자 암호를 풀어 봐!' },
    battle: [
      { type: 'reply', q: { zh: '我给你发了“666”，你知道是什么意思吗？', say: '我给你发了六六六，你知道是什么意思吗？', py: 'Wǒ gěi nǐ fā le "liù liù liù", nǐ zhīdào shì shénme yìsi ma?', ko: '내가 "666"을 보냈는데, 무슨 뜻인지 알아?' },
        opts: [
          { zh: '是“很厉害”的意思吧？', py: 'Shì "hěn lìhai" de yìsi ba?', ko: '"대단해"라는 뜻이지?' },
          { zh: '是“拜拜”的意思。', py: 'Shì "bàibai" de yìsi.', ko: '"바이바이"라는 뜻이야.' },
          { zh: '是六百六十六块钱。', py: 'Shì liùbǎi liùshíliù kuài qián.', ko: '666위안이야.' }
        ], react: { zh: '对！你也很厉害！', py: 'Duì! Nǐ yě hěn lìhai!', ko: '맞아! 너도 대단해!' } },
      { type: 'reply', q: { zh: '那“88”呢？', say: '那八八呢？', py: 'Nà "bā bā" ne?', ko: '그럼 "88"은?' },
        opts: [
          { zh: '“88”就是“拜拜”。', say: '八八就是拜拜。', py: '"Bā bā" jiù shì "bàibai".', ko: '"88"은 바로 "바이바이"야.' },
          { zh: '“88”是“我爱你”。', say: '八八是我爱你。', py: '"Bā bā" shì "wǒ ài nǐ".', ko: '"88"은 "사랑해"야.' },
          { zh: '是八十八岁。', py: 'Shì bāshíbā suì.', ko: '88살이야.' }
        ], react: { zh: '哈哈，答对了！', py: 'Hāha, dá duì le!', ko: '하하, 정답!' } },
      { type: 'ask', goal: '"520"이 무슨 뜻인지 물어보기',
        opts: [
          { zh: '“520”是什么意思？', say: '五二零是什么意思？', py: '"Wǔ èr líng" shì shénme yìsi?', ko: '"520"은 무슨 뜻이야?' },
          { zh: '“520”多少钱？', say: '五二零多少钱？', py: '"Wǔ èr líng" duōshao qián?', ko: '"520"은 얼마야?' },
          { zh: '你几岁？', py: 'Nǐ jǐ suì?', ko: '너 몇 살이야?' }
        ], react: { zh: '“520”是“我爱你”的意思，因为发音很像。', say: '五二零是我爱你的意思，因为发音很像。', py: '"Wǔ èr líng" shì "wǒ ài nǐ" de yìsi, yīnwèi fāyīn hěn xiàng.', ko: '"520"은 "사랑해"라는 뜻이야. 발음이 비슷하거든.' } },
      { type: 'reply', q: { zh: '你和韩国朋友也互相发消息吗？', py: 'Nǐ hé Hánguó péngyou yě hùxiāng fā xiāoxi ma?', ko: '너도 한국 친구들이랑 서로 메시지를 보내?' },
        opts: [
          { zh: '对，我们每天互相发消息。', py: 'Duì, wǒmen měitiān hùxiāng fā xiāoxi.', ko: '응, 우리는 매일 서로 메시지를 보내.' },
          { zh: '对，发音很像。', py: 'Duì, fāyīn hěn xiàng.', ko: '응, 발음이 비슷해.' },
          { zh: '不，我爱你。', py: 'Bù, wǒ ài nǐ.', ko: '아니, 사랑해.' }
        ], react: { zh: '我们也是！', py: 'Wǒmen yě shì!', ko: '우리도 그래!' } },
      { type: 'reply', q: { zh: '你觉得数字暗号怎么样？', py: 'Nǐ juéde shùzì ànhào zěnmeyàng?', ko: '숫자 암호 어떤 것 같아?' },
        opts: [
          { zh: '不但好玩儿，而且很方便！', py: 'Búdàn hǎowánr, érqiě hěn fāngbiàn!', ko: '재미있을 뿐만 아니라 편하기도 해!' },
          { zh: '是“拜拜”的意思。', py: 'Shì "bàibai" de yìsi.', ko: '"바이바이"라는 뜻이야.' },
          { zh: '我们每天上课。', py: 'Wǒmen měitiān shàngkè.', ko: '우리는 매일 수업해.' }
        ], react: { zh: '666！', say: '六六六！', py: 'Liù liù liù!', ko: '666(대단해)!' } }
    ],
    page: {
      zh: '今天我教韩国朋友数字暗号：520、666、88。她说不但好玩儿，而且很方便！',
      say: '今天我教韩国朋友数字暗号：五二零、六六六、八八。她说不但好玩儿，而且很方便！',
      py: 'Jīntiān wǒ jiāo Hánguó péngyou shùzì ànhào: wǔ èr líng, liù liù liù, bā bā. Tā shuō búdàn hǎowánr, érqiě hěn fāngbiàn!',
      ko: '오늘 한국 친구에게 숫자 암호를 가르쳐 줬다. 520, 666, 88. 친구는 재미있을 뿐만 아니라 편하기도 하대!',
      fact: '중국 친구들은 발음이 비슷한 숫자로 마음을 전해요. 520(我爱你 사랑해), 666(대단해), 88(拜拜 바이바이)처럼요.'
    },
    mySentence: [
      [ { zh: '在网上，', py: 'Zài wǎngshang,', ko: '인터넷에서' } ],
      [ { zh: '“886”就是“拜拜了”。', say: '八八六就是拜拜了。', py: '"bā bā liù" jiù shì "bàibai le".', ko: '"886"은 바로 "바이바이~"야.' },
        { zh: '“555”就是“呜呜呜”。', say: '五五五就是呜呜呜。', py: '"wǔ wǔ wǔ" jiù shì "wūwūwū".', ko: '"555"는 바로 "엉엉엉(우는 소리)"이야.' },
        { zh: '“1314”就是“一生一世”。', say: '一三一四就是一生一世。', py: '"yī sān yī sì" jiù shì "yìshēng yíshì".', ko: '"1314"는 바로 "평생"이라는 뜻이야.' } ]
    ],
    mission: '나만의 숫자 암호 만들기',
    after: { who: '小雨', zh: '谢谢你！520！', say: '谢谢你！五二零！', py: 'Xièxie nǐ! Wǔ èr líng!', ko: '고마워! 520(사랑해)!' }
  },

  {
    no: 4,
    title: '중학생인데 학교에서 잔다?',
    zone: '기숙사 뒤 풀숲',
    npc: 'wanghao',
    chunks: [
      { id: 'L4a', hz: '住校', py: 'zhùxiào', ko: '학교 기숙사에서 지내다', mon: '베개몬',
        ex: ['很多中学生', '都', '住校'], end: '。', exPy: 'Hěn duō zhōngxuéshēng dōu zhùxiào.', exKo: '많은 중학생이 기숙사에서 지내.' },
      { id: 'L4b', hz: '一个房间住六个人', py: 'yí ge fángjiān zhù liù ge rén', ko: '한 방에 여섯 명이 지내다', mon: '이층침대몬',
        ex: ['我们宿舍', '一个房间住六个人'], end: '。', exPy: 'Wǒmen sùshè yí ge fángjiān zhù liù ge rén.', exKo: '우리 기숙사는 한 방에 여섯 명이 지내.' },
      { id: 'L4c', hz: '周末才回家', py: 'zhōumò cái huí jiā', ko: '주말에야 집에 가다', mon: '기다림몬', gram: '③ 才', avoid: ['L4d'],
        ex: ['住校的学生', '周末才回家'], end: '。', exPy: 'Zhùxiào de xuésheng zhōumò cái huí jiā.', exKo: '기숙사 학생들은 주말에야 집에 가.' },
      { id: 'L4d', hz: '只有周末才能回家', py: 'zhǐyǒu zhōumò cái néng huí jiā', ko: '주말에만 집에 갈 수 있다', mon: '열쇠몬', gram: '③ 只有……才……', avoid: ['L4c'],
        ex: ['我们', '只有周末', '才能回家'], end: '。', exPy: 'Wǒmen zhǐyǒu zhōumò cái néng huí jiā.', exKo: '우리는 주말에만 집에 갈 수 있어.' },
      { id: 'L4e', hz: '偶尔想家', py: 'ǒu\'ěr xiǎng jiā', ko: '가끔 집이 그립다', mon: '몽글몬', gram: '④ 偶尔',
        ex: ['住校的时候，', '我', '偶尔想家'], end: '。', exPy: 'Zhùxiào de shíhou, wǒ ǒu\'ěr xiǎng jiā.', exKo: '기숙사에 있을 때 나는 가끔 집이 그리워.' },
      { id: 'L4f', hz: '晚上十点熄灯', py: 'wǎnshang shí diǎn xīdēng', ko: '밤 10시에 불을 끄다', mon: '반딧불몬', word: true,
        ex: ['宿舍', '晚上十点熄灯'], end: '。', exPy: 'Sùshè wǎnshang shí diǎn xīdēng.', exKo: '기숙사는 밤 10시에 불을 꺼.' }
    ],
    intro: [
      { t: '해가 지는데 학생들이 집에 가지 않고 커다란 건물로 들어간다. 저기는… 宿舍(기숙사)!?' },
      { who: '王浩', zh: '我住校。', py: 'Wǒ zhùxiào.', ko: '나는 기숙사에서 지내.' },
      { who: '王浩', zh: '一个房间住六个人，周末才回家。', py: 'Yí ge fángjiān zhù liù ge rén, zhōumò cái huí jiā.', ko: '한 방에 여섯 명이 지내고, 주말에야 집에 가.' },
      { t: '(수상한 질문 ④) 중학생인데 학교에서 잔다?' },
      { who: '王浩', t: '나는 小雨네 반 王浩야. 기숙사 뒤 풀숲에 몬스터 6마리가 숨었어. 10시에 불 끄기 전에 다 잡아 줘!' }
    ],
    waiting: { who: '王浩', zh: '快点儿，要熄灯了！', py: 'Kuài diǎnr, yào xīdēng le!', ko: '서둘러, 곧 불 꺼져!' },
    battleStart: { who: '王浩', t: '다 모았구나! 그럼 기숙사 생활을 나한테 인터뷰해 봐!' },
    battle: [
      { type: 'reply', q: { zh: '你住校吗？', py: 'Nǐ zhùxiào ma?', ko: '너는 기숙사에서 지내?' },
        opts: [
          { zh: '不住校，我每天回家。', py: 'Bú zhùxiào, wǒ měitiān huí jiā.', ko: '아니, 나는 매일 집에 가.' },
          { zh: '晚上十点。', py: 'Wǎnshang shí diǎn.', ko: '밤 10시.' },
          { zh: '六个人。', py: 'Liù ge rén.', ko: '여섯 명.' }
        ], react: { zh: '每天回家？真好！', py: 'Měitiān huí jiā? Zhēn hǎo!', ko: '매일 집에 가? 좋겠다!' } },
      { type: 'ask', goal: '한 방에 몇 명이 지내는지 물어보기',
        opts: [
          { zh: '你们一个房间住几个人？', py: 'Nǐmen yí ge fángjiān zhù jǐ ge rén?', ko: '너희는 한 방에 몇 명이 지내?' },
          { zh: '你们几点熄灯？', py: 'Nǐmen jǐ diǎn xīdēng?', ko: '너희는 몇 시에 불 꺼?' },
          { zh: '你家在哪儿？', py: 'Nǐ jiā zài nǎr?', ko: '너희 집은 어디야?' }
        ], react: { zh: '一个房间住六个人，很热闹！', py: 'Yí ge fángjiān zhù liù ge rén, hěn rènao!', ko: '한 방에 여섯 명이 지내서 아주 시끌벅적해!' } },
      { type: 'ask', goal: '언제 집에 가는지 물어보기',
        opts: [
          { zh: '你什么时候回家？', py: 'Nǐ shénme shíhou huí jiā?', ko: '너는 언제 집에 가?' },
          { zh: '你家有几口人？', py: 'Nǐ jiā yǒu jǐ kǒu rén?', ko: '너희 집은 몇 식구야?' },
          { zh: '你喜欢宿舍吗？', py: 'Nǐ xǐhuan sùshè ma?', ko: '너는 기숙사가 좋아?' }
        ], react: { zh: '只有周末才能回家。', py: 'Zhǐyǒu zhōumò cái néng huí jiā.', ko: '주말에만 집에 갈 수 있어.' } },
      { type: 'reply', q: { zh: '如果你住校，你会想家吗？', py: 'Rúguǒ nǐ zhùxiào, nǐ huì xiǎng jiā ma?', ko: '네가 기숙사에서 지내면 집이 그리울 것 같아?' },
        opts: [
          { zh: '会，我偶尔会想家。', py: 'Huì, wǒ ǒu\'ěr huì xiǎng jiā.', ko: '응, 가끔 집이 그리울 것 같아.' },
          { zh: '会，一个房间住六个人。', py: 'Huì, yí ge fángjiān zhù liù ge rén.', ko: '응, 한 방에 여섯 명이 지내.' },
          { zh: '晚上十点熄灯。', py: 'Wǎnshang shí diǎn xīdēng.', ko: '밤 10시에 불을 꺼.' }
        ], react: { zh: '我也偶尔想家。', py: 'Wǒ yě ǒu\'ěr xiǎng jiā.', ko: '나도 가끔 집이 그리워.' } },
      { type: 'reply', q: { zh: '你觉得住校好不好？', py: 'Nǐ juéde zhùxiào hǎo bu hǎo?', ko: '기숙사 생활이 좋은 것 같아?' },
        opts: [
          { zh: '我觉得很好，可以跟同学一起住。', py: 'Wǒ juéde hěn hǎo, kěyǐ gēn tóngxué yìqǐ zhù.', ko: '좋은 것 같아, 친구들이랑 같이 지낼 수 있잖아.' },
          { zh: '我们周末吃午饭。', py: 'Wǒmen zhōumò chī wǔfàn.', ko: '우리는 주말에 점심을 먹어.' },
          { zh: '我是宿舍。', py: 'Wǒ shì sùshè.', ko: '나는 기숙사야.' }
        ], react: { zh: '说得好！', py: 'Shuō de hǎo!', ko: '말 잘했어!' } }
    ],
    page: {
      zh: '我们宿舍一个房间住六个人。晚上十点熄灯，只有周末才能回家。我偶尔想家，但是很开心！',
      py: 'Wǒmen sùshè yí ge fángjiān zhù liù ge rén. Wǎnshang shí diǎn xīdēng, zhǐyǒu zhōumò cái néng huí jiā. Wǒ ǒu\'ěr xiǎng jiā, dànshì hěn kāixīn!',
      ko: '우리 기숙사는 한 방에 여섯 명이 지낸다. 밤 10시에 불을 끄고, 주말에만 집에 갈 수 있다. 가끔 집이 그립지만 아주 즐겁다!',
      fact: '중국에는 학교 기숙사에서 지내는(住校) 중·고등학생이 많아요. 한 방을 여러 명이 함께 쓰고, 주말에 집에 가는 학교도 있어요.'
    },
    mySentence: [
      [ { zh: '我想住校，', py: 'Wǒ xiǎng zhùxiào,', ko: '나는 기숙사에서 지내고 싶어,' },
        { zh: '我不想住校，', py: 'Wǒ bù xiǎng zhùxiào,', ko: '나는 기숙사에서 지내고 싶지 않아,' } ],
      [ { zh: '因为可以跟同学一起住。', py: 'yīnwèi kěyǐ gēn tóngxué yìqǐ zhù.', ko: '친구들이랑 같이 지낼 수 있으니까.' },
        { zh: '因为我会想家。', py: 'yīnwèi wǒ huì xiǎng jiā.', ko: '집이 그리울 테니까.' },
        { zh: '因为晚上十点就要熄灯。', py: 'yīnwèi wǎnshang shí diǎn jiù yào xīdēng.', ko: '밤 10시면 불을 꺼야 하니까.' } ]
    ],
    mission: '기숙사 생활 찬반 토론',
    after: { who: '王浩', zh: '周末见！', py: 'Zhōumò jiàn!', ko: '주말에 봐!' }
  }
];

/* 4과 끝: 중간 수사 회의 (진아쌤) — 1~4과 덩어리를 섞어 말하기 */
const BOSS = {
  intro: [
    { who: '진아쌤', t: '왔구나, 꼬마 수사관! 일기장 네 쪽을 모두 찾았네.' },
    { who: '진아쌤', t: '지금부터 중간 수사 회의를 시작할게. 1~4과에서 모은 덩어리를 섞어서 대답해 봐!' },
    { who: '진아쌤', zh: '准备好了吗？开始！', py: 'Zhǔnbèi hǎo le ma? Kāishǐ!', ko: '준비됐니? 시작!' }
  ],
  battle: [
    { type: 'reply', q: { zh: '中国学生吃完午饭做什么？', py: 'Zhōngguó xuésheng chī wán wǔfàn zuò shénme?', ko: '중국 학생들은 점심을 다 먹고 뭘 해?' },
      opts: [
        { zh: '他们趴在桌子上睡一会儿。', py: 'Tāmen pā zài zhuōzi shang shuì yíhuìr.', ko: '책상에 엎드려 잠깐 자요.' },
        { zh: '他们发“666”。', say: '他们发六六六。', py: 'Tāmen fā "liù liù liù".', ko: '"666"을 보내요.' },
        { zh: '他们周末才回家。', py: 'Tāmen zhōumò cái huí jiā.', ko: '주말에야 집에 가요.' }
      ], react: { zh: '很好！', py: 'Hěn hǎo!', ko: '아주 좋아!' } },
    { type: 'reply', q: { zh: '课间休息的时候，同学们往往做什么？', py: 'Kèjiān xiūxi de shíhou, tóngxuémen wǎngwǎng zuò shénme?', ko: '쉬는 시간에 친구들은 대개 뭘 해?' },
      opts: [
        { zh: '往往去操场玩儿。', py: 'Wǎngwǎng qù cāochǎng wánr.', ko: '대개 운동장에 가서 놀아요.' },
        { zh: '往往住校。', py: 'Wǎngwǎng zhùxiào.', ko: '대개 기숙사에서 지내요.' },
        { zh: '往往是“拜拜”。', py: 'Wǎngwǎng shì "bàibai".', ko: '대개 "바이바이"예요.' }
      ], react: { zh: '对！', py: 'Duì!', ko: '맞아!' } },
    { type: 'ask', goal: '"88"이 무슨 뜻인지 물어보기',
      opts: [
        { zh: '“88”是什么意思？', say: '八八是什么意思？', py: '"Bā bā" shì shénme yìsi?', ko: '"88"은 무슨 뜻이에요?' },
        { zh: '“88”是几点？', say: '八八是几点？', py: '"Bā bā" shì jǐ diǎn?', ko: '"88"은 몇 시예요?' },
        { zh: '你八十八岁吗？', py: 'Nǐ bāshíbā suì ma?', ko: '선생님은 88살이에요?' }
      ], react: { zh: '“88”就是“拜拜”。', say: '八八就是拜拜。', py: '"Bā bā" jiù shì "bàibai".', ko: '"88"은 바로 "바이바이"야.' } },
    { type: 'reply', q: { zh: '住校的学生什么时候回家？', py: 'Zhùxiào de xuésheng shénme shíhou huí jiā?', ko: '기숙사 학생들은 언제 집에 가?' },
      opts: [
        { zh: '只有周末才能回家。', py: 'Zhǐyǒu zhōumò cái néng huí jiā.', ko: '주말에만 집에 갈 수 있어요.' },
        { zh: '十二点半，该午休了。', py: 'Shí\'èr diǎn bàn, gāi wǔxiū le.', ko: '12시 반, 쉴 시간이에요.' },
        { zh: '一边听音乐一边回家。', py: 'Yìbiān tīng yīnyuè yìbiān huí jiā.', ko: '음악을 들으면서 집에 가요.' }
      ], react: { zh: '没错！', py: 'Méi cuò!', ko: '정확해!' } },
    { type: 'reply', q: { zh: '你觉得中国学校的生活怎么样？', py: 'Nǐ juéde Zhōngguó xuéxiào de shēnghuó zěnmeyàng?', ko: '중국 학교생활은 어떤 것 같아?' },
      opts: [
        { zh: '不但有意思，而且很特别！', py: 'Búdàn yǒu yìsi, érqiě hěn tèbié!', ko: '재미있을 뿐만 아니라 아주 특별해요!' },
        { zh: '该午休了。', py: 'Gāi wǔxiū le.', ko: '쉴 시간이에요.' },
        { zh: '一个房间住六个人吗？', py: 'Yí ge fángjiān zhù liù ge rén ma?', ko: '한 방에 여섯 명이 지내요?' }
      ], react: { zh: '说得太好了！', py: 'Shuō de tài hǎo le!', ko: '정말 잘 말했어!' } },
    { type: 'reply', q: { zh: '今天的调查怎么样？', py: 'Jīntiān de diàochá zěnmeyàng?', ko: '오늘 수사는 어땠어?' },
      opts: [
        { zh: '太好玩儿了！我还想知道更多。', py: 'Tài hǎowánr le! Wǒ hái xiǎng zhīdào gèng duō.', ko: '너무 재미있었어요! 더 알고 싶어요.' },
        { zh: '我从来不说话。', py: 'Wǒ cónglái bù shuōhuà.', ko: '저는 한 번도 말을 안 해요.' },
        { zh: '88！', say: '八八！', py: 'Bā bā!', ko: '88(바이바이)!' }
      ], react: { zh: '那我们下次继续！', py: 'Nà wǒmen xià cì jìxù!', ko: '그럼 다음에 계속하자!' } }
  ],
  mission: '중간 수사 회의: 1~4과 덩어리 섞어 말하기'
};

const ALL_CHUNKS = LESSONS.flatMap(l => l.chunks.map(c => Object.assign(c, { lesson: l.no })));
const CHUNK = Object.fromEntries(ALL_CHUNKS.map(c => [c.id, c]));
