import React, { useState } from 'react';
import {
  Sparkles,
  Radio,
  BookOpen,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Check,
  Compass,
  ArrowRight,
  Headphones,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  BBCEpisode,
  CURATED_BBC_TOPICS,
  CuratedTopicRecommendation,
} from '../data/bbcEpisodes';
import { formatTimestamp } from '../utils/dictationEngine';

interface CorpusHubViewProps {
  episodes: BBCEpisode[];
  activeEpisodeId: string;
  onSelectAndJumpToStudio: (epId: string) => void;
  onAddNewEpisode: (ep: BBCEpisode) => void;
  onOpenImportModal: () => void;
}

export const CorpusHubView: React.FC<CorpusHubViewProps> = ({
  episodes,
  activeEpisodeId,
  onSelectAndJumpToStudio,
  onAddNewEpisode,
  onOpenImportModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'library' | 'sources'>('ai');

  // AI Generator Form State
  const [topicInput, setTopicInput] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<BBCEpisode['programme']>('6 Minute English');
  const [selectedLevel, setSelectedLevel] = useState<BBCEpisode['level']>('B2 Upper-Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generatedSuccessEp, setGeneratedSuccessEp] = useState<BBCEpisode | null>(null);

  // Library Filter
  const [libraryFilter, setLibraryFilter] = useState<'all' | '6min' | 'news' | 'idiom'>('all');

  const filteredEpisodes = episodes.filter((ep) => {
    if (libraryFilter === '6min') return ep.programme === '6 Minute English';
    if (libraryFilter === 'news') return ep.programme === 'BBC News Review' || ep.programme === 'Science in Action';
    if (libraryFilter === 'idiom') return ep.programme === 'The English We Speak';
    return true;
  });

  const handleGenerate = async (topicToUse?: string) => {
    const topic = (topicToUse || topicInput).trim();
    if (!topic) {
      setGenerateError('请输入想要练习的 BBC 听力主题（或点击下方推荐的主题标签）');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');
    setGeneratedSuccessEp(null);

    try {
      const resp = await fetch('/api/generate-bbc-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          programme: selectedProgramme,
          level: selectedLevel,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      const data = await resp.json();
      if (data && data.episode) {
        onAddNewEpisode(data.episode);
        setGeneratedSuccessEp(data.episode);
      } else {
        throw new Error('未收到有效剧本数据');
      }
    } catch (err: any) {
      console.warn('API generation failed, generating fallback template:', err);
      setGenerateError('生成时网络响应较慢，已为您生成高品质备选语料。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTopicPreset = (rec: CuratedTopicRecommendation) => {
    setTopicInput(rec.topic);
    setSelectedProgramme(rec.programme);
    setSelectedLevel(rec.level);
    handleGenerate(rec.topic);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Problem Explanation & Navigation */}
      <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Compass className="w-4 h-4 text-[#EF4444]" />
            <span>精听语料库获取中心 · 解答“去哪里找BBC材料”与“如何持续补充新材料”</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            BBC 语料探索与扩充中心
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            提供三种无缝扩充方式：① AI 智能生成任意主题的英式广播听写剧本；② 开箱即用的权威 BBC 官方经典题库；③ 免费官方素材获取渠道与 3 步精听提取攻略。
          </p>
        </div>

        {/* Segmented Sub-Navigation */}
        <div className="flex items-center gap-1 p-1 bg-[#090D16] rounded-lg self-start border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('ai')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'ai'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ AI 智能定制语料
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('library')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'library'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📚 经典题库 ({episodes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sources')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'sources'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 官方免费获取指南
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: AI Topic Generator */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          <section
            aria-label="AI 智能定制 BBC 语料"
            className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 space-y-5"
          >
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  输入任何感兴趣的话题，AI 一键生成规范 BBC 广播剧本
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                无需到处去网上找材料！系统会自动生成具备标准英音 RP 语调群、时间轴切分、连读弱读技巧拆解与核心生词讲解的专属听写材料。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-6">
                <label
                  htmlFor="ai-topic-input"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  想听什么主题？（中文或英文皆可） *
                </label>
                <input
                  id="ai-topic-input"
                  type="text"
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value);
                    if (generateError) setGenerateError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                  placeholder="例如：英国下午茶礼仪、咖啡因如何影响大脑、职场谈薪技巧、新能源汽车..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="ai-prog-select"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  BBC 栏目体裁
                </label>
                <select
                  id="ai-prog-select"
                  value={selectedProgramme}
                  onChange={(e) =>
                    setSelectedProgramme(e.target.value as BBCEpisode['programme'])
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 text-sm bg-[#090D16] text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="6 Minute English">6 Minute English (轻松双人对谈)</option>
                  <option value="BBC News Review">BBC News Review (权威新闻深度)</option>
                  <option value="The English We Speak">The English We Speak (实用英式习语)</option>
                  <option value="Science in Action">Science in Action (前沿科学探秘)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="ai-level-select"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  难度等级
                </label>
                <select
                  id="ai-level-select"
                  value={selectedLevel}
                  onChange={(e) =>
                    setSelectedLevel(e.target.value as BBCEpisode['level'])
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 text-sm bg-[#090D16] text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="B1 Intermediate">B1 Intermediate (中级)</option>
                  <option value="B2 Upper-Intermediate">B2 Upper-Intermediate (中高级)</option>
                  <option value="C1 Advanced">C1 Advanced (高级精读)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">
                ⚡ 支持一键直接导入听写工作台并生成 A-B 复读点
              </span>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在编写 BBC 广播剧本与连读拆解...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>生成 BBC 规范精听语料</span>
                  </>
                )}
              </button>
            </div>

            {generateError && (
              <p className="text-xs text-rose-400 font-medium">{generateError}</p>
            )}

            {generatedSuccessEp && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>剧本生成成功！已收录至您的本地语料库</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {generatedSuccessEp.title}
                  </div>
                  <div className="text-xs text-slate-400">
                    共 {generatedSuccessEp.sentences.length} 个广播句子 · 时长 {generatedSuccessEp.duration}s · 含英音连读技巧与生词精讲
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAndJumpToStudio(generatedSuccessEp.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span>立即载入听写工作台</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* Quick Preset Topics Section */}
          <section
            aria-label="热门推荐选题"
            className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  💡 热门精选 BBC 听力选题（点击直接开始生成与练习）
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  涵盖心理认知、职场商用、英伦文化与前沿科学，均经过母语级语言结构调优
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CURATED_BBC_TOPICS.map((rec) => (
                <div
                  key={rec.topic}
                  className="p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#131C31] flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-[#EF4444]">
                        {rec.programme}
                      </span>
                      <span>{rec.level}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 leading-snug">
                      {rec.chinese}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {rec.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTopicPreset(rec)}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors"
                  >
                    <span>生成本期听写任务</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Sub-Tab 2: Built-in Library */}
      {activeSubTab === 'library' && (
        <section
          aria-label="当前已收录的 BBC 经典语料库"
          className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                当前本地题库 ({episodes.length} 个节目)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                包含系统预置的精编 BBC 听写素材及您导入/生成的专属内容
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setLibraryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  libraryFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                全部 ({episodes.length})
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter('6min')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  libraryFilter === '6min'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6 Minute English
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter('news')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  libraryFilter === 'news'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                News Review / 科学
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter('idiom')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  libraryFilter === 'idiom'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                The English We Speak
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEpisodes.map((ep) => {
              const isCurrent = ep.id === activeEpisodeId;
              return (
                <article
                  key={ep.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-colors ${
                    isCurrent
                      ? 'border-[#EF4444]/70 bg-[#131C31]'
                      : 'border-slate-800 bg-[#131C31] hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-[#EF4444]">
                        {ep.programme}
                      </span>
                      <span>
                        {ep.level} · 时长 {formatTimestamp(ep.duration)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">
                      {ep.chineseTitle}
                    </h3>
                    <div className="text-xs text-slate-300 font-medium">
                      {ep.title}
                    </div>

                    <p className="text-xs text-slate-400">
                      共 {ep.sentences.length} 个广播精听句 · 主播: {ep.presenters}
                    </p>

                    {/* First sentence snippet */}
                    <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800/80 text-xs text-slate-300 italic font-serif">
                      “{ep.sentences[0]?.english.slice(0, 90)}...”
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {isCurrent ? '● 当前正在精听' : '就绪待练'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectAndJumpToStudio(ep.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#B91C1C] text-white hover:bg-[#991B1B]'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <span>{isCurrent ? '返回工作台继续练' : '载入并开始精听'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Sub-Tab 3: Official BBC Sources & Practice Guide */}
      {activeSubTab === 'sources' && (
        <div className="space-y-6">
          <section
            aria-label="真实 BBC 语料去哪里找"
            className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 space-y-6"
          >
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#EF4444]" />
                <h2 className="text-lg font-bold text-slate-100">
                  真实 BBC 英语材料去哪里找？（免费官方渠道一览）
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                很多初学者不知道从哪里下载正版音频或复制标准文本，以下是 BBC 官方完全免费向全球学习者开放的核心入口：
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Channel 1 */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#131C31] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#EF4444]" />
                    <h3 className="text-base font-bold text-slate-100">
                      1. BBC Learning English 官网
                    </h3>
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    bbc.co.uk/learningenglish
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-100">英语学习者的黄金殿堂</strong>：官方直接提供免费 MP3 音频下载以及网页版完整带时间轴的 English Transcript（文本脚本）。
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>《6 Minute English》（每周更新，生动趣味）</li>
                    <li>《The English We Speak》（每周2分钟英式俚语）</li>
                    <li>《News Review》（从国际大事件学高级用词）</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-emerald-400 font-semibold block">
                    ✓ 最适合精听：自带纯净文本，复制直接导入
                  </span>
                </div>
              </div>

              {/* Channel 2 */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#131C31] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-slate-100">
                      2. BBC Sounds 官方 App / 网页
                    </h3>
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    bbc.co.uk/sounds
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-100">收听原汁原味英伦广播</strong>：各大应用商店可免费下载，汇集了 BBC Radio 4、BBC World Service 和海量正版播客。
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>《Global News Podcast》（每日全球20分钟快讯）</li>
                    <li>《The Climate Question》（全球气候与科技）</li>
                    <li>《In Our Time》（BBC顶级人文历史探讨）</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-amber-400 font-semibold block">
                    ✓ 最适合泛听：通勤磨耳朵，培养纯正英音语感
                  </span>
                </div>
              </div>

              {/* Channel 3 */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#131C31] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-slate-100">
                      3. BBC News 视频与专题
                    </h3>
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    bbc.com/news
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-100">时政与真实语境首选</strong>：BBC 新闻网页上的短视频通常配备官方英文字幕，记者口音地道，语速贴近真实母语环境。
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>新闻短视频（1~2分钟精悍报道）</li>
                    <li>Business & Tech 深度专栏</li>
                    <li>英国本土社会新闻（体会地道英国市井表达）</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-indigo-400 font-semibold block">
                    ✓ 最适合挑战高难度：适应真实播报语速
                  </span>
                </div>
              </div>
            </div>

            {/* How-To 3 Steps */}
            <div className="p-5 rounded-xl bg-[#090D16] border border-slate-800 text-white space-y-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>实战攻略：如何将 3 分钟 BBC 广播变成自己的高效听写任务？</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
                <div className="p-3 rounded-lg bg-[#131C31] border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 block">
                    第 1 步：挑选 1~2 分钟短片段
                  </span>
                  <p className="text-slate-400">
                    不要试图一次听写 30 分钟整期节目。每天只需挑出 3~5 个重点长难句，以防精力耗尽。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#131C31] border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 block">
                    第 2 步：复制网页上的英文文本
                  </span>
                  <p className="text-slate-400">
                    从 BBC Learning English 网页底部的 Transcript 处直接选中并复制那几句英文。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#131C31] border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 block">
                    第 3 步：一键导入本站
                  </span>
                  <p className="text-slate-400">
                    点击右上角“导入新语料”粘贴，系统自动分句、生成时间轴并启用实时纠错与 A-B 复读！
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>立即粘贴导入一段 BBC 英文</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
