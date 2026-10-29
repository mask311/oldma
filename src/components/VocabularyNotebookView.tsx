import React, { useState, useMemo } from 'react';
import {
  Volume2,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Search,
  BookOpen,
  Sparkles,
  Edit3,
  Check,
  Headphones,
} from 'lucide-react';
import { VocabItem } from '../data/bbcEpisodes';
import { speakBritishText } from '../utils/audioPlayer';
import { cleanWord } from '../utils/dictationEngine';

interface VocabularyNotebookViewProps {
  vocabulary: VocabItem[];
  onToggleMastered: (id: string) => void;
  onDeleteVocab: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddCustomVocab: (item: Omit<VocabItem, 'id' | 'addedAt' | 'reviewCount'>) => void;
  onIncrementReview: (id: string) => void;
}

export const VocabularyNotebookView: React.FC<VocabularyNotebookViewProps> = ({
  vocabulary,
  onToggleMastered,
  onDeleteVocab,
  onUpdateNote,
  onAddCustomVocab,
  onIncrementReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Add New Word Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newPos, setNewPos] = useState('n.');
  const [newMeaningCn, setNewMeaningCn] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newListeningTrap, setNewListeningTrap] = useState('');
  const [newCollocations, setNewCollocations] = useState('');
  const [newSentenceEn, setNewSentenceEn] = useState('');
  const [formError, setFormError] = useState('');

  // Vocabulary Dictation Mini-Quiz State
  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizChecked, setQuizChecked] = useState(false);

  const filteredVocab = useMemo(() => {
    return vocabulary.filter((item) => {
      if (statusFilter === 'learning' && item.mastered) return false;
      if (statusFilter === 'mastered' && !item.mastered) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.word.toLowerCase().includes(q) ||
        item.meaningCn.toLowerCase().includes(q) ||
        item.detailedExplanation.toLowerCase().includes(q) ||
        item.episodeTitle.toLowerCase().includes(q)
      );
    });
  }, [vocabulary, statusFilter, searchQuery]);

  const learningCount = vocabulary.filter((v) => !v.mastered).length;
  const masteredCount = vocabulary.filter((v) => v.mastered).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaningCn.trim()) {
      setFormError('请至少填写“英文单词”和“核心中文释义”');
      return;
    }
    onAddCustomVocab({
      word: newWord.trim(),
      phoneticUk: newPhonetic.trim() || `/${newWord.trim().toLowerCase()}/`,
      pos: newPos,
      meaningCn: newMeaningCn.trim(),
      meaningEn: newMeaningCn.trim(),
      episodeId: 'custom',
      episodeTitle: 'BBC 个人精听积累',
      bbcSentenceEn:
        newSentenceEn.trim() ||
        `This term "${newWord.trim()}" frequently appears in BBC World Service broadcasts.`,
      bbcSentenceCn: '源自日常BBC精听练习句子积累。',
      detailedExplanation:
        newExplanation.trim() ||
        '建议结合BBC新闻语境记忆其地道搭配与感情色彩，注意英式发音重音位置。',
      listeningTrap:
        newListeningTrap.trim() || '注意在语流中的弱读与词尾连读现象。',
      collocations: newCollocations
        .split(/[,，;；]/)
        .map((s) => s.trim())
        .filter(Boolean),
      mastered: false,
      userNote: '个人手动添加重点生词',
    });

    setNewWord('');
    setNewPhonetic('');
    setNewMeaningCn('');
    setNewExplanation('');
    setNewListeningTrap('');
    setNewCollocations('');
    setNewSentenceEn('');
    setFormError('');
    setShowAddForm(false);
  };

  const currentQuizItem = vocabulary[quizIndex % Math.max(1, vocabulary.length)];
  const isQuizCorrect =
    currentQuizItem && cleanWord(quizInput) === cleanWord(currentQuizItem.word);

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">
            BBC 语境生词库 · 包含英音音标、词源辨析、听力吞音连读陷阱与原句例句
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            生词本与深度词汇讲解
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setQuizActive((v) => !v);
              setQuizChecked(false);
              setQuizInput('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>{quizActive ? '退出生词听写自测' : '生词发音听写自测'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? '收起添加表单' : '录入新词与讲解'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Vocabulary Listening Dictation Quiz Panel */}
      {quizActive && currentQuizItem && (
        <section
          aria-label="生词听写快测"
          className="bg-[#0F172A] text-white rounded-xl border border-slate-800 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-amber-400 font-semibold">
                生词发音拼写测试 · 第 {(quizIndex % vocabulary.length) + 1} / {vocabulary.length} 词
              </span>
              <h2 className="text-lg font-semibold mt-0.5">
                听英式发音与释义提示，默写出准确单词拼写
              </h2>
            </div>
            <button
              type="button"
              onClick={() => speakBritishText(currentQuizItem.word, 0.9)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Volume2 className="w-4 h-4" />
              <span>播放英式发音 ({currentQuizItem.phoneticUk})</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 space-y-1">
              <div className="text-xs text-slate-400">词性与中文释义提示：</div>
              <div className="text-base font-medium text-slate-100">
                {currentQuizItem.pos} {currentQuizItem.meaningCn}
              </div>
              <div className="text-xs text-slate-400 pt-1">
                听力易错提示：{currentQuizItem.listeningTrap}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                aria-label="输入听写生词拼写"
                value={quizInput}
                onChange={(e) => {
                  setQuizInput(e.target.value);
                  setQuizChecked(false);
                }}
                placeholder="在此输入英文单词拼写..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  setQuizChecked(true);
                  onIncrementReview(currentQuizItem.id);
                }}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                核对拼写
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizIndex((i) => i + 1);
                  setQuizInput('');
                  setQuizChecked(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                下一词 →
              </button>
            </div>
          </div>

          {quizChecked && (
            <div
              className={`mt-4 p-3.5 rounded-lg border text-xs ${
                isQuizCorrect
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-600/60 text-rose-200'
              }`}
            >
              {isQuizCorrect ? (
                <span>
                  ✓ 拼写完全正确！<strong>{currentQuizItem.word}</strong> ({currentQuizItem.phoneticUk}) — {currentQuizItem.detailedExplanation}
                </span>
              ) : (
                <span>
                  ✕ 拼写有误：您输入了 <strong>{quizInput || '（空）'}</strong>，正确拼写为{' '}
                  <strong className="underline">{currentQuizItem.word}</strong> ({currentQuizItem.phoneticUk})。讲解：{currentQuizItem.detailedExplanation}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Collapsible Add Custom Word Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          aria-label="录入新词表单"
          className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              手动录入 BBC 听力生词与用法讲解
            </h2>
            <span className="text-xs text-slate-400">支持自定义音标、听力易错点与搭配</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label htmlFor="vocab-word-input" className="block text-xs font-medium text-slate-300 mb-1">
                英文单词 *
              </label>
              <input
                id="vocab-word-input"
                type="text"
                value={newWord}
                onChange={(e) => {
                  setNewWord(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="例如: resilient"
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="vocab-ipa-input" className="block text-xs font-medium text-slate-300 mb-1">
                英式音标 (UK IPA)
              </label>
              <input
                id="vocab-ipa-input"
                type="text"
                value={newPhonetic}
                onChange={(e) => setNewPhonetic(e.target.value)}
                placeholder="例如: /rɪˈzɪl.i.ənt/"
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="vocab-pos-select" className="block text-xs font-medium text-slate-300 mb-1">
                词性
              </label>
              <select
                id="vocab-pos-select"
                value={newPos}
                onChange={(e) => setNewPos(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm bg-[#090D16] text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="n.">n. 名词</option>
                <option value="v.">v. 动词</option>
                <option value="adj.">adj. 形容词</option>
                <option value="adv.">adv. 副词</option>
                <option value="idiom">idiom 习语</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="vocab-meaning-input" className="block text-xs font-medium text-slate-300 mb-1">
                核心中文释义 *
              </label>
              <input
                id="vocab-meaning-input"
                type="text"
                value={newMeaningCn}
                onChange={(e) => {
                  setNewMeaningCn(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="例如: 有韧性的；能迅速恢复的"
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="vocab-explanation-input" className="block text-xs font-medium text-slate-300 mb-1">
                深度用法与语境讲解
              </label>
              <input
                id="vocab-explanation-input"
                type="text"
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="词源拆解、BBC政经/科普语境中的常见用法..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="vocab-trap-input" className="block text-xs font-medium text-slate-300 mb-1">
                听力发音陷阱 / 常见搭配（逗号分隔）
              </label>
              <input
                id="vocab-trap-input"
                type="text"
                value={newCollocations}
                onChange={(e) => setNewCollocations(e.target.value)}
                placeholder="例如: resilient economy 韧性经济, remain resilient 保持韧性"
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-12">
              <label htmlFor="vocab-sentence-input" className="block text-xs font-medium text-slate-300 mb-1">
                BBC 原句或例句
              </label>
              <input
                id="vocab-sentence-input"
                type="text"
                value={newSentenceEn}
                onChange={(e) => setNewSentenceEn(e.target.value)}
                placeholder="输入包含该生词的听力原句..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-rose-400 font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
            >
              保存至生词本
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="搜索生词、释义或讲解"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索单词、中文释义、词根讲解或节目名..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全部词汇 ({vocabulary.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('learning')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'learning'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            待重点复习 ({learningCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('mastered')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'mastered'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            已掌握 ({masteredCount})
          </button>
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      {filteredVocab.length === 0 ? (
        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-12 text-center">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-100">未找到匹配的生词记录</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            您可以在“精听听写工作台”点击句子中的重点词汇一键加入生词本，或点击上方“录入新词与讲解”按钮手动添加。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredVocab.map((item) => {
            const isEditing = editingNoteId === item.id;
            return (
              <article
                key={item.id}
                className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Metadata Line (Zero-Pill Unboxed Text) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{item.episodeTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">已复习 {item.reviewCount} 次</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleMastered(item.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer whitespace-nowrap ${
                          item.mastered
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        {item.mastered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ 已掌握</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            <span>▲ 待复习</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteVocab(item.id)}
                        aria-label={`删除生词 ${item.word}`}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Word Headword + UK IPA + Audio Trigger */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                        {item.word}
                      </h3>
                      <span className="font-mono text-sm text-slate-400">
                        {item.phoneticUk}
                      </span>
                      <span className="text-xs font-semibold text-[#EF4444]">
                        {item.pos}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        speakBritishText(item.word, 0.9);
                        onIncrementReview(item.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>英音朗读</span>
                    </button>
                  </div>

                  {/* Core Definition */}
                  <div>
                    <div className="text-base font-semibold text-slate-100">
                      {item.meaningCn}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.meaningEn}</div>
                  </div>

                  {/* Detailed Explanation & Listening Trap */}
                  <div className="bg-[#131C31] rounded-lg p-3.5 border border-slate-800/80 space-y-2 text-xs leading-relaxed">
                    <div>
                      <span className="font-semibold text-slate-200">
                        <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                        词源与用法精讲：
                      </span>
                      <span className="text-slate-300">{item.detailedExplanation}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#EF4444]">
                        听力连读/辨音陷阱：
                      </span>
                      <span className="text-slate-300">{item.listeningTrap}</span>
                    </div>
                    {item.collocations.length > 0 && (
                      <div className="pt-1 text-slate-400">
                        <span className="font-semibold text-slate-200">高频搭配：</span>
                        {item.collocations.join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Authentic BBC Context Sentence */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>BBC 原声例句：</span>
                      <button
                        type="button"
                        onClick={() => speakBritishText(item.bbcSentenceEn, 0.95)}
                        className="text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        朗读整句
                      </button>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-relaxed">
                      “{item.bbcSentenceEn}”
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.bbcSentenceCn}</p>
                  </div>
                </div>

                {/* Personal Study Note Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        aria-label={`编辑 ${item.word} 个人笔记`}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded bg-[#090D16] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateNote(item.id, noteDraft);
                          setEditingNoteId(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3 h-3" />
                        保存
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-400 truncate">
                        <strong className="text-slate-200">个人笔记：</strong>
                        {item.userNote || '暂无笔记'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(item.id);
                          setNoteDraft(item.userNote);
                        }}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>编辑笔记</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
