export interface SentenceVocabHint {
  word: string;
  phoneticUk: string;
  pos: string;
  meaningCn: string;
  explanation: string;
  collocations: string[];
}

export interface DictationSentence {
  id: string;
  index: number;
  speaker: string;
  startTime: number;
  endTime: number;
  english: string;
  chinese: string;
  phoneticNote: string;
  grammarNote: string;
  keyWords: SentenceVocabHint[];
}

export interface BBCEpisode {
  id: string;
  programme: '6 Minute English' | 'BBC News Review' | 'The English We Speak' | 'Science in Action';
  title: string;
  chineseTitle: string;
  level: 'B1 Intermediate' | 'B2 Upper-Intermediate' | 'C1 Advanced';
  duration: number;
  publishedDate: string;
  presenters: string;
  accent: string;
  waveformPeaks: number[];
  sentences: DictationSentence[];
}

export interface VocabItem {
  id: string;
  word: string;
  phoneticUk: string;
  pos: string;
  meaningCn: string;
  meaningEn: string;
  episodeId: string;
  episodeTitle: string;
  bbcSentenceEn: string;
  bbcSentenceCn: string;
  detailedExplanation: string;
  listeningTrap: string;
  collocations: string[];
  mastered: boolean;
  addedAt: string;
  reviewCount: number;
  userNote: string;
}

export interface ABBookmark {
  id: string;
  episodeId: string;
  sentenceId: string;
  label: string;
  pointA: number;
  pointB: number;
  note: string;
  createdAt: string;
}

export interface DailyPracticeLog {
  date: string;
  label: string;
  sentencesCompleted: number;
  minutesListened: number;
  avgAccuracy: number;
  wordsCollected: number;
}

export const BBC_EPISODES: BBCEpisode[] = [
  {
    id: 'ep-procrastination',
    programme: '6 Minute English',
    title: 'Why We Procrastinate and How to Reclaim Focus',
    chineseTitle: '为什么我们总是拖延？情绪调节与深度专注的科学',
    level: 'B2 Upper-Intermediate',
    duration: 42.0,
    publishedDate: '2026-10-24',
    presenters: 'Neil & Beth (BBC London Broadcasting House)',
    accent: 'RP / Standard Southern British',
    waveformPeaks: [
      0.32, 0.58, 0.74, 0.61, 0.45, 0.82, 0.91, 0.67, 0.38, 0.52,
      0.79, 0.86, 0.64, 0.41, 0.73, 0.88, 0.94, 0.57, 0.35, 0.69,
      0.83, 0.77, 0.49, 0.62, 0.89, 0.92, 0.71, 0.44, 0.59, 0.81,
      0.75, 0.53, 0.39, 0.76, 0.87, 0.68, 0.47, 0.63, 0.78, 0.42
    ],
    sentences: [
      {
        id: 'proc-s1',
        index: 1,
        speaker: 'Neil',
        startTime: 0.0,
        endTime: 7.5,
        english: 'Hello and welcome to Six Minute English, the programme where we discuss an interesting topic and teach some related vocabulary.',
        chinese: '大家好，欢迎来到《六分钟英语》，在这档节目中我们探讨有趣的话题并教授相关词汇。',
        phoneticNote: '连读与弱读："Hello_and" 中 and 弱读为 /ən/；"welcome to" 中 to 弱读为 /tə/；programme 英音重音在第一音节 /ˈprəʊɡræm/。',
        grammarNote: 'where 引导定语从句修饰 the programme，表示抽象地点“在这档节目里”。',
        keyWords: [
          {
            word: 'programme',
            phoneticUk: '/ˈprəʊ.ɡræm/',
            pos: 'n.',
            meaningCn: '（广播或电视）节目；计划，纲领',
            explanation: '英式英语广播电视节目固定拼写为 programme（美式为 program），但在表示“电脑程序”时英美均用 program。',
            collocations: ['radio programme 广播节目', 'flagship programme 王牌栏目', 'launch a programme 启动计划']
          }
        ]
      },
      {
        id: 'proc-s2',
        index: 2,
        speaker: 'Beth',
        startTime: 7.5,
        endTime: 16.2,
        english: 'Psychologists argue that procrastination is rarely about poor time management, but rather an inability to regulate uncomfortable emotions.',
        chinese: '心理学家认为，拖延很少是因为时间管理不善，而是源于无法调节不适的情绪。',
        phoneticNote: '失爆与连读："that procrastination" 中 that 词尾 /t/ 失去爆破；"rarely_about" 元音连读；"an_inability" 鼻音连读 /ənˌɪnəˈbɪləti/。',
        grammarNote: 'not/rarely about A, but rather B 是极具地道学术表现力的“否定A、强调B”句式。',
        keyWords: [
          {
            word: 'procrastination',
            phoneticUk: '/prəˌkræs.tɪˈneɪ.ʃən/',
            pos: 'n.',
            meaningCn: '拖延，耽搁，迁延',
            explanation: '源自拉丁语 pro-（向前推）+ crastinus（属于明天的）。在BBC科普节目中常用于探讨认知心理学与行为习惯。',
            collocations: ['chronic procrastination 长期拖延', 'overcome procrastination 克服拖延', 'succumb to procrastination 陷入拖延']
          },
          {
            word: 'regulate',
            phoneticUk: '/ˈreɡ.jə.leɪt/',
            pos: 'v.',
            meaningCn: '调节，控制；监管，约束',
            explanation: '既可用于生理/心理层面的“自我调节（regulate emotions/sleep）”，也常用于财经新闻中“监管市场（regulate the market）”。',
            collocations: ['regulate emotions 调节情绪', 'strictly regulate 严格监管', 'self-regulating 自我调节的']
          }
        ]
      },
      {
        id: 'proc-s3',
        index: 3,
        speaker: 'Neil',
        startTime: 16.2,
        endTime: 24.8,
        english: 'When we feel overwhelmed by a daunting task, our brain instinctively seeks immediate relief through trivial distractions.',
        chinese: '当我们被一项令人生畏的任务压得喘不过气时，大脑会本能地通过琐碎的消遣来寻求即时缓解。',
        phoneticNote: '词尾轻音与连读："overwhelmed by" 中 -ed 发 /d/ 轻触即止，听感极易漏掉；"immediate relief" 中 /t/ 失去爆破。',
        grammarNote: 'When 引导时间状语从句，feel overwhelmed by 表示“因……感到不知所措/压力巨大”。',
        keyWords: [
          {
            word: 'daunting',
            phoneticUk: '/ˈdɔːn.tɪŋ/',
            pos: 'adj.',
            meaningCn: '令人畏惧的，使人气馁的，棘手的',
            explanation: '英音中 au 发长元音 /ɔː/（不卷舌）。形容任务规模庞大或难度高，让人在开始前产生心理畏难。',
            collocations: ['a daunting prospect 令人望而生畏的前景', 'daunting challenge 艰巨挑战', 'seem daunting 看起来棘手']
          },
          {
            word: 'trivial',
            phoneticUk: '/ˈtrɪv.i.əl/',
            pos: 'adj.',
            meaningCn: '琐碎的，微不足道的，不重要的',
            explanation: '词源指古罗马三条道路交汇处（tri-via）的街头闲聊，引申为“鸡毛蒜皮的、无足轻重的”。',
            collocations: ['trivial distractions 琐碎的干扰', 'trivial matter 小事一桩', 'dismiss as trivial 视为微不足道']
          }
        ]
      },
      {
        id: 'proc-s4',
        index: 4,
        speaker: 'Beth',
        startTime: 24.8,
        endTime: 33.4,
        english: 'Breaking an ambitious project into manageable milestones can drastically reduce anxiety and restore your sense of momentum.',
        chinese: '将一个宏大的项目拆解为可控的阶段性目标，能显著减轻焦虑并恢复你的行动惯性。',
        phoneticNote: '连读重点："Breaking_an_ambitious" 连续两个鼻音连读；"sense_of" 连读为 /ˈsensəv/，of 弱化为 /əv/。',
        grammarNote: '动名词短语 Breaking an ambitious project into... 作主语，谓语动词并列使用 reduce and restore。',
        keyWords: [
          {
            word: 'milestone',
            phoneticUk: '/ˈmaɪl.stəʊn/',
            pos: 'n.',
            meaningCn: '里程碑，阶段性目标，重大转折点',
            explanation: '原指英国公路旁标注英里数的石碑，现广泛用于项目管理与历史报道中表示“关键节点”。',
            collocations: ['manageable milestones 可控的阶段目标', 'reach a milestone 达成里程碑', 'historic milestone 历史性里程碑']
          },
          {
            word: 'momentum',
            phoneticUk: '/məˈmen.təm/',
            pos: 'n.',
            meaningCn: '势头，冲力，动力，发展惯性',
            explanation: '注意第一音节弱读为 /mə/ 而非 /məʊ/。表示事物一旦启动后持续向前的“推进势头”。',
            collocations: ['gain momentum 势头增强', 'lose momentum 失去动力', 'sense of momentum 前进惯性']
          }
        ]
      },
      {
        id: 'proc-s5',
        index: 5,
        speaker: 'Neil',
        startTime: 33.4,
        endTime: 42.0,
        english: 'Instead of waiting for inspiration to strike, researchers recommend forgiving yourself for past delays and starting with just five minutes of effort.',
        chinese: '研究人员建议，与其干等灵感降临，不如原谅自己过去的拖延，先从投入五分钟的努力开始。',
        phoneticNote: '弱读密集区："Instead_of" (/ɪnˈstedəv/)、"waiting for_inspiration" (/fərˌɪnspɪˈreɪʃən/ 连读 r 音)、"minutes_of_effort" 连续连读。',
        grammarNote: 'Instead of doing A, sb recommend doing B and doing C，结构对称紧凑。',
        keyWords: [
          {
            word: 'inspiration',
            phoneticUk: '/ˌɪn.spɪˈreɪ.ʃən/',
            pos: 'n.',
            meaningCn: '灵感，启迪，鼓舞人心的人或事',
            explanation: '与动词 strike（突然闪现/袭来）搭配是极地道的英语母语表达：when inspiration strikes（当灵感来袭时）。',
            collocations: ['waiting for inspiration to strike 等待灵感迸发', 'draw inspiration from 从……汲取灵感']
          }
        ]
      }
    ]
  },
  {
    id: 'ep-ai-summit',
    programme: 'BBC News Review',
    title: 'London Digital Summit: Balancing AI Innovation and Copyright Law',
    chineseTitle: '伦敦数字峰会：在人工智能创新与版权保护之间寻找平衡',
    level: 'C1 Advanced',
    duration: 38.0,
    publishedDate: '2026-10-26',
    presenters: 'Georgina & Sam (BBC World Service Newsroom)',
    accent: 'BBC News Broadcast RP',
    waveformPeaks: [
      0.48, 0.72, 0.85, 0.63, 0.51, 0.79, 0.93, 0.81, 0.44, 0.66,
      0.88, 0.74, 0.55, 0.39, 0.82, 0.95, 0.71, 0.62, 0.49, 0.77,
      0.84, 0.69, 0.52, 0.86, 0.91, 0.64, 0.43, 0.75, 0.83, 0.58
    ],
    sentences: [
      {
        id: 'ai-s1',
        index: 1,
        speaker: 'Georgina',
        startTime: 0.0,
        endTime: 9.2,
        english: 'Lawmakers in Westminster are debating stringent new transparency rules for technology firms training large language models on copyrighted journalism.',
        chinese: '威斯敏斯特的立法者们正在辩论严格的新透明度规则，针对那些使用受版权保护的新闻报道训练大语言模型的科技公司。',
        phoneticNote: '新闻播报连读："Lawmakers_in" 连读 /zɪn/；"stringent new" 中 /t/ 失去爆破；"copyrighted journalism" 注意 -ed 在辅音 /dʒ/ 前轻触。',
        grammarNote: '现在分词短语 training large language models on... 作后置定语修饰 technology firms。',
        keyWords: [
          {
            word: 'stringent',
            phoneticUk: '/ˈstrɪn.dʒənt/',
            pos: 'adj.',
            meaningCn: '（法规、标准或条件）严格的，严厉的，苛刻的',
            explanation: 'BBC政经新闻高频词，专门修饰法律、安全标准或财政规定“严谨且毫无通融余地”。',
            collocations: ['stringent rules 严格的规定', 'stringent safety standards 严苛的安全标准']
          },
          {
            word: 'transparency',
            phoneticUk: '/trænsˈpær.ən.si/',
            pos: 'n.',
            meaningCn: '透明度，公开性，透明状态',
            explanation: '英音第二音节重读且发短元音 /ˈpær/。在政商语境中指决策、算法或财务数据的公开透明。',
            collocations: ['transparency rules 透明度准则', 'lack of transparency 缺乏透明度', 'promote transparency 提升透明度']
          }
        ]
      },
      {
        id: 'ai-s2',
        index: 2,
        speaker: 'Sam',
        startTime: 9.2,
        endTime: 18.5,
        english: 'Publishers contend that unauthorised scraping undermines investigative reporting and deprives newsrooms of essential licensing revenue.',
        chinese: '出版商坚称，未经授权的数据抓取会削弱深度调查报道，并剥夺新闻编辑室至关重要的授权收入。',
        phoneticNote: '英式拼写与发音：unauthorised（英式拼写 -ised，美式 -ized）；"deprives newsrooms_of_essential" 连续弱读与连读。',
        grammarNote: 'contend that... 引导宾语从句，比 think/say 更正式，意为“据理力争、坚称”；deprive sb of sth 剥夺某人某物。',
        keyWords: [
          {
            word: 'undermine',
            phoneticUk: '/ˌʌn.dəˈmaɪn/',
            pos: 'v.',
            meaningCn: '逐渐削弱，暗中破坏，动摇根基',
            explanation: '原意指在城墙底部挖地道使其坍塌，引申为“从根基上逐步侵蚀或削弱（权威、信任、商业模式）”。',
            collocations: ['undermine confidence 动摇信心', 'undermine reporting 削弱新闻报道', 'seriously undermine 严重损害']
          },
          {
            word: 'deprive',
            phoneticUk: '/dɪˈpraɪv/',
            pos: 'v.',
            meaningCn: '剥夺，使丧失，使不能享有',
            explanation: '固定搭配 deprive A of B（剥夺A的B）。听写时常因为后面的 of 弱读为 /əv/ 而漏掉介词 of。',
            collocations: ['deprive newsrooms of revenue 剥夺编辑室收入', 'sleep-deprived 睡眠不足的']
          }
        ]
      },
      {
        id: 'ai-s3',
        index: 3,
        speaker: 'Georgina',
        startTime: 18.5,
        endTime: 28.0,
        english: 'Meanwhile, startup founders warn that overly restrictive legislation could stifle domestic innovation and drive investment overseas.',
        chinese: '与此同时，初创企业创始人警告称，过度限制性的立法可能会扼杀本土创新并将投资驱赶至海外。',
        phoneticNote: '连读细节："warn that_overly" 连读；"stifle domestic_innovation" 中 domestic_innovation 辅元连读 /kɪn/。',
        grammarNote: 'could stifle... and drive... 虚拟/推测语气，表达政策潜在的连锁负面效应。',
        keyWords: [
          {
            word: 'stifle',
            phoneticUk: '/ˈstaɪ.fəl/',
            pos: 'v.',
            meaningCn: '扼杀，压制，抑制；使窒息',
            explanation: '本义为“让人呼吸困难、窒息”，在BBC评论中常与 innovation / debate / creativity 搭配，表示“束缚、扼杀生机”。',
            collocations: ['stifle innovation 扼杀创新', 'stifle competition 压制竞争', 'stifle a yawn 忍住哈欠']
          }
        ]
      },
      {
        id: 'ai-s4',
        index: 4,
        speaker: 'Sam',
        startTime: 28.0,
        endTime: 38.0,
        english: 'Striking a delicate compromise between creative property rights and technological competitiveness remains the government’s top priority.',
        chinese: '在创意产权与技术竞争力之间达成微妙的妥协，仍然是政府的首要任务。',
        phoneticNote: '同化现象："Striking_a" 连读；"government’s top priority" 中 top 词尾 /p/ 与 priority 词首 /p/ 同化合并（gemination），只爆破一次。',
        grammarNote: '动名词短语 Striking a delicate compromise between A and B 作全句主语，谓语动词用单数 remains。',
        keyWords: [
          {
            word: 'compromise',
            phoneticUk: '/ˈkɒm.prə.maɪz/',
            pos: 'n. / v.',
            meaningCn: '妥协，折中方案；达成妥协，危及',
            explanation: '英音第一音节发短奥音 /ˈkɒm/。strike a compromise / balance 是BBC政论写作最核心的黄金搭配之一。',
            collocations: ['strike a delicate compromise 达成微妙折中', 'reach a compromise 达成妥协']
          }
        ]
      }
    ]
  },
  {
    id: 'ep-idioms',
    programme: 'The English We Speak',
    title: 'Bite the Bullet & Weather the Storm in Business',
    chineseTitle: '地道商务习语：硬着头皮上（Bite the Bullet）与共渡难关',
    level: 'B1 Intermediate',
    duration: 28.0,
    publishedDate: '2026-10-21',
    presenters: 'Feifei & Roy (BBC Learning English)',
    accent: 'Conversational British RP',
    waveformPeaks: [
      0.36, 0.62, 0.78, 0.54, 0.42, 0.81, 0.88, 0.65, 0.49, 0.73,
      0.85, 0.59, 0.41, 0.77, 0.91, 0.68, 0.52, 0.79, 0.84, 0.46
    ],
    sentences: [
      {
        id: 'id-s1',
        index: 1,
        speaker: 'Feifei',
        startTime: 0.0,
        endTime: 9.0,
        english: 'When a company faces inevitable financial restructuring, executives often have to bite the bullet and make tough decisions.',
        chinese: '当一家公司面临不可避免的财务重组时，高管们往往不得不硬着头皮做出艰难决定。',
        phoneticNote: '高频弱读："have to" 在表示“不得不”时发音为 /ˈhæftə/（v 清化为 f）；"bite the bullet" 中 bite 的 /t/ 失去爆破。',
        grammarNote: 'bite the bullet 源自战地医疗史（伤员在无麻醉手术时咬住铅弹忍痛），现指“鼓起勇气面对无法回避的困难局面”。',
        keyWords: [
          {
            word: 'inevitable',
            phoneticUk: '/ɪˈnev.ɪ.tə.bəl/',
            pos: 'adj.',
            meaningCn: '不可避免的，必然发生的',
            explanation: 'in-（不）+ evitable（可避开的）。听写时注意重音在第二音节 nev，后面的 -itable 弱读得非常快。',
            collocations: ['inevitable consequence 必然结果', 'seem inevitable 似乎不可避免']
          }
        ]
      },
      {
        id: 'id-s2',
        index: 2,
        speaker: 'Roy',
        startTime: 9.0,
        endTime: 18.5,
        english: 'Instead of postponing awkward conversations with stakeholders, addressing the issue head-on builds long-term credibility.',
        chinese: '与其推迟与利益相关者的棘手对话，不如迎难而上直接解决问题，这样才能建立长期的公信力。',
        phoneticNote: '连读："postponing_awkward" 中 postponing 里的第一个 t 不发音 /pəʊsˈpəʊnɪŋ/；"head-on" 连读为 /ˌhedˈɒn/。',
        grammarNote: 'address the issue head-on 意为“正面迎击并处理问题”，address 作动词在商务英语中常表示“着手处理、应对”。',
        keyWords: [
          {
            word: 'credibility',
            phoneticUk: '/ˌkred.əˈbɪl.ə.ti/',
            pos: 'n.',
            meaningCn: '可信度，公信力，信誉',
            explanation: '词根 cred-（相信，同 credit）。在新闻与职场中指一个人或机构“让人信服的声誉与可靠程度”。',
            collocations: ['build long-term credibility 建立长期公信力', 'damage credibility 损害信誉']
          }
        ]
      },
      {
        id: 'id-s3',
        index: 3,
        speaker: 'Feifei',
        startTime: 18.5,
        endTime: 28.0,
        english: 'Teams that communicate candidly during turbulent periods are far more likely to weather the storm together.',
        chinese: '在动荡时期能够坦诚沟通的团队，更有可能齐心协力共渡难关。',
        phoneticNote: '英音非卷舌："turbulent" /ˈtɜː.bjə.lənt/ 和 "storm" /stɔːm/ 中的 r 在英音中均不卷舌，而是拉长前面的元音。',
        grammarNote: 'weather the storm 中 weather 作及物动词，意为“经受住、平安度过（风暴或危机）”。',
        keyWords: [
          {
            word: 'candidly',
            phoneticUk: '/ˈkæn.dɪd.li/',
            pos: 'adv.',
            meaningCn: '坦率地，直言不讳地，诚恳地',
            explanation: '形容词 candid 原意为“纯白的”，引申为“毫不掩饰、坦诚相待的”。',
            collocations: ['communicate candidly 坦诚沟通', 'speak candidly 直言不讳']
          },
          {
            word: 'turbulent',
            phoneticUk: '/ˈtɜː.bjə.lənt/',
            pos: 'adj.',
            meaningCn: '动荡的，混乱的，汹涌的',
            explanation: '飞机颠簸的“乱流”就是 turbulence；形容经济或历史时期动荡不安时常用 turbulent periods/times。',
            collocations: ['turbulent periods 动荡时期', 'turbulent market 动荡的市场'],
          },
        ],
      },
    ],
  },
  {
    id: 'ep-coffee',
    programme: '6 Minute English',
    title: 'The Science of Coffee: How Caffeine Tricks the Brain',
    chineseTitle: '咖啡因的脑科学秘密：它如何暂时阻断疲劳受体',
    level: 'B2 Upper-Intermediate',
    duration: 32.0,
    publishedDate: '2026-10-18',
    presenters: 'Neil & Sam (BBC Learning English)',
    accent: 'Standard British RP',
    waveformPeaks: [
      0.34, 0.58, 0.72, 0.65, 0.43, 0.79, 0.92, 0.64, 0.38, 0.59,
      0.84, 0.76, 0.52, 0.45, 0.82, 0.91, 0.66, 0.53, 0.42, 0.71,
    ],
    sentences: [
      {
        id: 'cof-s1',
        index: 1,
        speaker: 'Neil',
        startTime: 0.0,
        endTime: 8.0,
        english: 'Millions of commuters rely on a fresh morning espresso to kick-start their cognitive faculties before a demanding workday.',
        chinese: '数以百万计的通勤族依靠清晨一杯新鲜浓缩咖啡，在开启高强度工作日前唤醒他们的大脑认知功能。',
        phoneticNote: '英音连读："Millions_of_commuters" 连读；"kick-start their" 中 kick 的 /k/ 失去爆破；workday 词尾轻触。',
        grammarNote: 'rely on sth to do sth 依靠某物来做某事；demanding 作形容词意为“要求苛刻、耗费心力的”。',
        keyWords: [
          {
            word: 'commuter',
            phoneticUk: '/kəˈmjuː.tər/',
            pos: 'n.',
            meaningCn: '通勤者，经常往返上下班的人',
            explanation: '英音末尾 -er 弱读为 /ə/ 不卷舌。在伦敦等大都市新闻中极高频出现。',
            collocations: ['daily commuters 每日通勤者', 'commuter train 通勤列车'],
          },
          {
            word: 'cognitive',
            phoneticUk: '/ˈkɒɡ.nə.tɪv/',
            pos: 'adj.',
            meaningCn: '认知的，感知的',
            explanation: '心理学与脑科学核心词汇，指知觉、记忆、判断与思维能力。',
            collocations: ['cognitive faculties 认知功能', 'cognitive decline 认知衰退'],
          },
        ],
      },
      {
        id: 'cof-s2',
        index: 2,
        speaker: 'Sam',
        startTime: 8.0,
        endTime: 16.5,
        english: 'Molecular biologists explain that caffeine mimics adenosine, binding to neural receptors and temporarily preventing sleepiness signals.',
        chinese: '分子生物学家解释称，咖啡因的分子结构模拟了腺苷，能与神经受体结合并暂时阻断困意信号。',
        phoneticNote: '专业术语发音：caffeine /ˈkæf.iːn/；"mimics adenosine" 辅元连读；"binding to neural" 中 -ing 轻快平滑。',
        grammarNote: '现在分词短语 binding to... and preventing... 作伴随状语，表达生理连锁反应机制。',
        keyWords: [
          {
            word: 'mimic',
            phoneticUk: '/ˈmɪm.ɪk/',
            pos: 'v.',
            meaningCn: '模仿，模拟；极其逼真地再现',
            explanation: '过去式和过去分词需加 k 变为 mimicked。在此表示分子层面的拟态。',
            collocations: ['mimic biological processes 模拟生物过程', 'mimic human speech 模仿人类语言'],
          },
        ],
      },
      {
        id: 'cof-s3',
        index: 3,
        speaker: 'Neil',
        startTime: 16.5,
        endTime: 24.2,
        english: 'However, consuming excessive doses late in the afternoon can disrupt your circadian rhythm and deteriorate sleep quality.',
        chinese: '然而，若在午后过量饮用，可能会扰乱你的昼夜生物节律，导致睡眠质量恶化。',
        phoneticNote: '连读与弱读："disrupt your circadian rhythm" 中 disrupt 末尾 /t/ 失去爆破；"circadian" 发音为 /sɜːˈkeɪ.di.ən/。',
        grammarNote: '动名词短语 consuming excessive doses... 作全句主语，谓语动词并列 disrupt and deteriorate。',
        keyWords: [
          {
            word: 'deteriorate',
            phoneticUk: '/dɪˈtɪə.ri.ə.reɪt/',
            pos: 'v.',
            meaningCn: '恶化，退化，变质',
            explanation: '英音音节较多，注意第二音节重读 /tɪə/。用于表示健康状况、天气或经济形势走下坡路。',
            collocations: ['deteriorate rapidly 迅速恶化', 'deteriorating conditions 恶化的条件'],
          },
        ],
      },
      {
        id: 'cof-s4',
        index: 4,
        speaker: 'Sam',
        startTime: 24.2,
        endTime: 32.0,
        english: 'Moderation remains paramount: savoring one or two artisan cups elevates alertness without precipitating an energy crash.',
        chinese: '适度仍然至关重要：品味一两杯高品质手冲咖啡即可提升敏锐度，同时避免引发断崖式精力崩溃。',
        phoneticNote: '同化与英音："paramount" /ˈpær.ə.maʊnt/ 末尾 /t/ 轻触；"elevates alertness" 辅元连读 /tsəˈlɜːt.nəs/。',
        grammarNote: 'colon 引出具体阐述，savoring... elevates alertness without doing... 句式精巧优雅。',
        keyWords: [
          {
            word: 'paramount',
            phoneticUk: '/ˈpær.ə.maʊnt/',
            pos: 'adj.',
            meaningCn: '至关重要的，首要的，最高的',
            explanation: '常用于 of paramount importance（至关重要），是学术与政论中替代 very important 的高分金词。',
            collocations: ['paramount importance 至关重要', 'safety is paramount 安全第一'],
          },
        ],
      },
    ],
  },
];

export interface CuratedTopicRecommendation {
  topic: string;
  chinese: string;
  programme: BBCEpisode['programme'];
  level: BBCEpisode['level'];
  category: '心理生活' | '科技商业' | '英伦习语' | '前沿科普';
  description: string;
}

export const CURATED_BBC_TOPICS: CuratedTopicRecommendation[] = [
  {
    topic: 'British Afternoon Tea Culture & Etiquette',
    chinese: '英式下午茶的文化历史与社交礼仪',
    programme: '6 Minute English',
    level: 'B1 Intermediate',
    category: '英伦习语',
    description: '红茶与司康饼的正确吃法、Cream Tea 的传统发源与英式下午茶的经典社交用语。',
  },
  {
    topic: 'The Psychology of Perfectionism & Burnout',
    chinese: '完美主义心理陷阱与职场倦怠应对',
    programme: '6 Minute English',
    level: 'B2 Upper-Intermediate',
    category: '心理生活',
    description: '为什么过度苛求完美反而阻碍产出？认知行为专家探讨健康设立边界的艺术。',
  },
  {
    topic: 'How Electric Vehicles are Rewriting UK City Planning',
    chinese: '新能源汽车与智能电网如何重塑英国城市规划',
    programme: 'BBC News Review',
    level: 'C1 Advanced',
    category: '科技商业',
    description: '威斯敏斯特新一代绿色交通法规、超快速充电桩普及率与老旧城区电网改建挑战。',
  },
  {
    topic: 'The Power of Vulnerability in Leadership',
    chinese: '领导力中的共情与脆弱性力量',
    programme: 'The English We Speak',
    level: 'B2 Upper-Intermediate',
    category: '科技商业',
    description: '展现真实与倾听如何帮助团队度过危机？地道职场沟通习语与非暴力沟通。',
  },
  {
    topic: 'Gut Microbiome and Mental Health Breakthroughs',
    chinese: '肠道微生态与大脑情绪的“菌脑轴”革命',
    programme: 'Science in Action',
    level: 'C1 Advanced',
    category: '前沿科普',
    description: 'BBC 科学前沿：肠道有益菌群如何通过迷走神经调节血清素分泌与焦虑情绪。',
  },
  {
    topic: 'Mastering Idioms: Cut Corners and Burn the Midnight Oil',
    chinese: '必背英式习语：投机取巧（Cut Corners）与熬夜加班',
    programme: 'The English We Speak',
    level: 'B1 Intermediate',
    category: '英伦习语',
    description: '源自航海与工业革命的历史典故，在日常对话与职场英语中的地道使用场景。',
  },
];

export const INITIAL_VOCABULARY: VocabItem[] = [
  {
    id: 'voc-1',
    word: 'procrastination',
    phoneticUk: '/prəˌkræs.tɪˈneɪ.ʃən/',
    pos: 'n.',
    meaningCn: '拖延，耽搁，惯性推迟',
    meaningEn: 'The action of delaying or postponing something that must be done.',
    episodeId: 'ep-procrastination',
    episodeTitle: '6 Minute English · Why We Procrastinate',
    bbcSentenceEn: 'Psychologists argue that procrastination is rarely about poor time management, but rather an inability to regulate uncomfortable emotions.',
    bbcSentenceCn: '心理学家认为，拖延很少是因为时间管理不善，而是源于无法调节不适的情绪。',
    detailedExplanation: '词根拆解：pro-（向前）+ crastinus（明天的）→ 把事情推到明天。在BBC心理学与职场专题中，常与 emotional regulation（情绪调节）对比讨论。注意动词形式为 procrastinate /prəˈkræs.tɪ.neɪt/。',
    listeningTrap: '首音节弱读为 /prə/ 而非 /prəʊ/，语流中极易把开头的 pro- 听成 per-。',
    collocations: ['chronic procrastination 长期拖延症', 'overcome procrastination 克服拖延', 'procrastination habit 拖延习惯'],
    mastered: false,
    addedAt: '2026-10-28',
    reviewCount: 3,
    userNote: '注意第一音节是 ə，重音在第四音节 -na-。写作和口语Part 3高频词！'
  },
  {
    id: 'voc-2',
    word: 'daunting',
    phoneticUk: '/ˈdɔːn.tɪŋ/',
    pos: 'adj.',
    meaningCn: '令人畏惧的，使人气馁的，艰巨的',
    meaningEn: 'Seeming difficult to deal with in prospect; intimidating.',
    episodeId: 'ep-procrastination',
    episodeTitle: '6 Minute English · Why We Procrastinate',
    bbcSentenceEn: 'When we feel overwhelmed by a daunting task, our brain instinctively seeks immediate relief through trivial distractions.',
    bbcSentenceCn: '当我们被一项令人生畏的任务压得喘不过气时，大脑会本能地通过琐碎的消遣来寻求即时缓解。',
    detailedExplanation: '用于形容某项任务、挑战或前景因为规模大或未知性强，让人在着手之前感到胆怯（intimidating）。比 difficult 更强调“心理上的威慑感”。',
    listeningTrap: '英式发音中 /ɔː/ 饱满低沉，无卷舌音，常与后面的 task 连读时 /ŋ/ 鼻音变短。',
    collocations: ['a daunting task 艰巨的任务', 'daunting prospect 令人生畏的前景', 'daunting challenge 严峻挑战'],
    mastered: false,
    addedAt: '2026-10-28',
    reviewCount: 2,
    userNote: '同义替换：intimidating / formidable'
  },
  {
    id: 'voc-3',
    word: 'stringent',
    phoneticUk: '/ˈstrɪn.dʒənt/',
    pos: 'adj.',
    meaningCn: '（法律、标准、条件）严格的，严厉的，苛刻的',
    meaningEn: 'Strict, precise, and exacting (of regulations, requirements, or conditions).',
    episodeId: 'ep-ai-summit',
    episodeTitle: 'BBC News Review · London Digital Summit',
    bbcSentenceEn: 'Lawmakers in Westminster are debating stringent new transparency rules for technology firms training large language models.',
    bbcSentenceCn: '威斯敏斯特的立法者们正在辩论针对训练大语言模型的科技公司的严格新透明度规则。',
    detailedExplanation: '词源与 strict 同根（拉丁语 stringere 捆紧）。在BBC新闻中几乎只用来修饰客观规章制度（rules, laws, criteria, checks, controls），不用来形容人“严厉”。',
    listeningTrap: '词尾 -gent 发 /dʒənt/，且末尾 /t/ 在辅音前常失去爆破，听起来像“strin-jen”。',
    collocations: ['stringent transparency rules 严格的透明度规则', 'stringent safety checks 严密的安全检查', 'stringent criteria 严苛标准'],
    mastered: false,
    addedAt: '2026-10-27',
    reviewCount: 4,
    userNote: '修饰法规政策必背词，比 strict 正式得多。'
  },
  {
    id: 'voc-4',
    word: 'undermine',
    phoneticUk: '/ˌʌn.dəˈmaɪn/',
    pos: 'v.',
    meaningCn: '暗中破坏，逐渐削弱，动摇根基',
    meaningEn: 'Erode the base or foundation of; lessen the effectiveness, power, or ability of, especially gradually or insidiously.',
    episodeId: 'ep-ai-summit',
    episodeTitle: 'BBC News Review · London Digital Summit',
    bbcSentenceEn: 'Publishers contend that unauthorised scraping undermines investigative reporting and deprives newsrooms of essential licensing revenue.',
    bbcSentenceCn: '出版商坚称，未经授权的数据抓取会削弱深度调查报道，并剥夺新闻编辑室至关重要的授权收入。',
    detailedExplanation: 'under（在……下面）+ mine（挖矿/地道）。不是一次性摧毁（destroy），而是像挖墙脚一样“逐步削弱权威、公信力或制度基础”。',
    listeningTrap: '重音在最后一音节 -mine /ˈmaɪn/，前两个音节 /ˌʌn.də/ 在英音中不卷舌，连读极快。',
    collocations: ['undermine investigative reporting 削弱深度报道', 'undermine public trust 动摇公众信任', 'undermine authority 削弱权威'],
    mastered: true,
    addedAt: '2026-10-26',
    reviewCount: 6,
    userNote: '已掌握，注意第三人称单数 undermines 的 /z/ 音与后面元音连读。'
  },
  {
    id: 'voc-5',
    word: 'stifle',
    phoneticUk: '/ˈstaɪ.fəl/',
    pos: 'v.',
    meaningCn: '扼杀，压制，抑制；使窒息',
    meaningEn: 'Restrain (a reaction) or stop oneself acting on (an emotion); prevent or constrain (an activity or idea).',
    episodeId: 'ep-ai-summit',
    episodeTitle: 'BBC News Review · London Digital Summit',
    bbcSentenceEn: 'Meanwhile, startup founders warn that overly restrictive legislation could stifle domestic innovation and drive investment overseas.',
    bbcSentenceCn: '与此同时，初创企业创始人警告称，过度限制性的立法可能会扼杀本土创新并将投资驱赶至海外。',
    detailedExplanation: '极具画面感的动词：原指因空气不流通而令人窒息，在政经社论中常指“过度的监管或官僚主义让创新、言论或经济增长失去活力”。',
    listeningTrap: '元音是双元音 /aɪ/ 而非短音 /ɪ/，切勿拼写成 stiffle。',
    collocations: ['stifle domestic innovation 扼杀本土创新', 'stifle creativity 扼杀创造力', 'stifle debate 压制讨论'],
    mastered: false,
    addedAt: '2026-10-26',
    reviewCount: 2,
    userNote: 'stifle innovation = 扼杀创新（单字母 f，不要双写！）'
  },
  {
    id: 'voc-6',
    word: 'momentum',
    phoneticUk: '/məˈmen.təm/',
    pos: 'n.',
    meaningCn: '势头，冲力，推进力，发展惯性',
    meaningEn: 'The impetus and driving force gained by the development of a process or course of events.',
    episodeId: 'ep-procrastination',
    episodeTitle: '6 Minute English · Why We Procrastinate',
    bbcSentenceEn: 'Breaking an ambitious project into manageable milestones can drastically reduce anxiety and restore your sense of momentum.',
    bbcSentenceCn: '将一个宏大的项目拆解为可控的阶段性目标，能显著减轻焦虑并恢复你的行动惯性。',
    detailedExplanation: '物理学中指“动量（质量×速度）”，日常与新闻英语中指一旦开始行动后产生的“越做越顺的推进势头”。',
    listeningTrap: '前后两个音节均弱化为央元音 /ə/（/məˈmen.təm/），只有中间的 men 清脆重读。',
    collocations: ['gain momentum 获得势头', 'build momentum 积累推进力', 'lose momentum 失去冲劲'],
    mastered: true,
    addedAt: '2026-10-25',
    reviewCount: 5,
    userNote: '注意首尾都是 schwa /ə/ 弱读音。'
  }
];

export const INITIAL_AB_BOOKMARKS: ABBookmark[] = [
  {
    id: 'ab-1',
    episodeId: 'ep-procrastination',
    sentenceId: 'proc-s2',
    label: 'Beth: 情绪调节与连读 (rarely_about / an_inability)',
    pointA: 7.5,
    pointB: 16.2,
    note: '重点跟读 that 失去爆破 + an_inability to regulate 的鼻音连读节奏',
    createdAt: '2026-10-28 08:30'
  },
  {
    id: 'ab-2',
    episodeId: 'ep-procrastination',
    sentenceId: 'proc-s3',
    label: 'Neil: overwhelmed by 过去分词弱读精听',
    pointA: 16.2,
    pointB: 24.8,
    note: '反复听 overwhelmed 词尾 /d/ 在 by 前面的轻触发音，避免漏掉 -ed',
    createdAt: '2026-10-28 08:42'
  },
  {
    id: 'ab-3',
    episodeId: 'ep-ai-summit',
    sentenceId: 'ai-s2',
    label: 'Sam: deprives newsrooms of essential 连读段',
    pointA: 9.2,
    pointB: 18.5,
    note: 'newsrooms_of_essential 三个词在新闻语速下连成一个语调群',
    createdAt: '2026-10-27 21:15'
  }
];

export const INITIAL_DAILY_STATS: DailyPracticeLog[] = [
  { date: '2026-10-22', label: '10/22 周四', sentencesCompleted: 6, minutesListened: 18, avgAccuracy: 81, wordsCollected: 3 },
  { date: '2026-10-23', label: '10/23 周五', sentencesCompleted: 8, minutesListened: 22, avgAccuracy: 84, wordsCollected: 4 },
  { date: '2026-10-24', label: '10/24 周六', sentencesCompleted: 10, minutesListened: 28, avgAccuracy: 86, wordsCollected: 5 },
  { date: '2026-10-25', label: '10/25 周日', sentencesCompleted: 7, minutesListened: 20, avgAccuracy: 88, wordsCollected: 3 },
  { date: '2026-10-26', label: '10/26 周一', sentencesCompleted: 9, minutesListened: 25, avgAccuracy: 89, wordsCollected: 4 },
  { date: '2026-10-27', label: '10/27 周二', sentencesCompleted: 11, minutesListened: 31, avgAccuracy: 91, wordsCollected: 5 },
  { date: '2026-10-28', label: '10/28 今日', sentencesCompleted: 5, minutesListened: 16, avgAccuracy: 92, wordsCollected: 6 },
];
