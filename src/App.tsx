import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  BookmarkCheck,
  BookmarkPlus,
  Send,
  Sparkles,
  RotateCcw,
  Ear,
  BookOpen,
  BarChart3,
  Headphones,
  Subtitles,
} from 'lucide-react';
import {
  BBC_EPISODES,
  INITIAL_VOCABULARY,
  INITIAL_AB_BOOKMARKS,
  INITIAL_DAILY_STATS,
  BBCEpisode,
  VocabItem,
  ABBookmark,
  DailyPracticeLog,
  SentenceVocabHint,
} from './data/bbcEpisodes';
import {
  evaluateDictation,
  clampLoopPoints,
  advancePlaybackTime,
  formatTimestamp,
  cleanWord,
} from './utils/dictationEngine';
import {
  speakBritishText,
  speakSentenceFromTime,
  stopSpeech,
} from './utils/audioPlayer';
import { AudioWaveformDeck } from './components/AudioWaveformDeck';
import { VocabularyNotebookView } from './components/VocabularyNotebookView';
import {
  ProgressAnalyticsView,
  CompletedSentenceRecord,
} from './components/ProgressAnalyticsView';
import { CustomEpisodeModal } from './components/CustomEpisodeModal';
import { CorpusHubView } from './components/CorpusHubView';
import { SubtitleShadowingPanel } from './components/SubtitleShadowingPanel';

type ActiveTab = 'studio' | 'corpus' | 'vocabulary' | 'analytics';
type DictationMode = 'full' | 'cloze' | 'shadowing';

const INITIAL_HISTORY: CompletedSentenceRecord[] = [
  {
    id: 'hist-1',
    episodeId: 'ep-procrastination',
    episodeTitle: '6 Minute English · Why We Procrastinate',
    sentenceIndex: 1,
    sentenceEn:
      'Hello and welcome to Six Minute English, the programme where we discuss an interesting topic and teach some related vocabulary.',
    userTyped:
      'Hello and welcome to Six Minute English, the programme where we discuss an interesting topic and teach some related vocabulary.',
    accuracy: 100,
    completedAt: '今日 08:20',
    errorBreakdown: { weakFormMiss: 0, endingMiss: 0, spellingError: 0, missingWord: 0 },
  },
  {
    id: 'hist-2',
    episodeId: 'ep-ai-summit',
    episodeTitle: 'BBC News Review · London Digital Summit',
    sentenceIndex: 2,
    sentenceEn:
      'Publishers contend that unauthorised scraping undermines investigative reporting and deprives newsrooms of essential licensing revenue.',
    userTyped:
      'Publishers contend that unauthorised scraping undermine investigative reporting and deprive newsrooms essential licensing revenue.',
    accuracy: 80,
    completedAt: '今日 08:35',
    errorBreakdown: { weakFormMiss: 1, endingMiss: 2, spellingError: 0, missingWord: 0 },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Episodes & Active Selection
  const [episodes, setEpisodes] = useState<BBCEpisode[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_episodes_v1');
      return saved ? JSON.parse(saved) : BBC_EPISODES;
    } catch {
      return BBC_EPISODES;
    }
  });
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(BBC_EPISODES[0].id);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(1); // Default to Sentence #2 (rich vocabulary & phonetic notes)

  // Audio & A-B Repeat State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(
    BBC_EPISODES[0].sentences[1]?.startTime ?? 7.5
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [pointA, setPointA] = useState<number | null>(
    BBC_EPISODES[0].sentences[1]?.startTime ?? 7.5
  );
  const [pointB, setPointB] = useState<number | null>(
    BBC_EPISODES[0].sentences[1]?.endTime ?? 16.2
  );
  const [abLoopEnabled, setAbLoopEnabled] = useState<boolean>(true);
  const [sentenceLoopEnabled, setSentenceLoopEnabled] = useState<boolean>(false);
  const [loopCount, setLoopCount] = useState<number>(0);

  // Dictation Input & Mode State — Empty by default, no pre-filled original text
  const [dictationMode, setDictationMode] = useState<DictationMode>('full');
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [userTypedMap, setUserTypedMap] = useState<Record<string, string>>({});
  const [submittedSentences, setSubmittedSentences] = useState<Record<string, boolean>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Vocabulary, Bookmarks & Progress State
  const [vocabulary, setVocabulary] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_vocab_v1');
      return saved ? JSON.parse(saved) : INITIAL_VOCABULARY;
    } catch {
      return INITIAL_VOCABULARY;
    }
  });

  const [bookmarks, setBookmarks] = useState<ABBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_bookmarks_v1');
      return saved ? JSON.parse(saved) : INITIAL_AB_BOOKMARKS;
    } catch {
      return INITIAL_AB_BOOKMARKS;
    }
  });

  const [dailyLogs, setDailyLogs] = useState<DailyPracticeLog[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_daily_v1');
      return saved ? JSON.parse(saved) : INITIAL_DAILY_STATS;
    } catch {
      return INITIAL_DAILY_STATS;
    }
  });

  const [completedHistory, setCompletedHistory] = useState<CompletedSentenceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_history_v1');
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });

  const [dailyGoalSentences, setDailyGoalSentences] = useState<number>(8);
  const [continuousShadowing, setContinuousShadowing] = useState<boolean>(false);
  const [shadowedSentences, setShadowedSentences] = useState<
    Record<string, { score: number; completedAt: string }>
  >(() => {
    try {
      const saved = localStorage.getItem('bbc_studio_shadowed_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bbc_studio_vocab_v1', JSON.stringify(vocabulary));
      localStorage.setItem('bbc_studio_bookmarks_v1', JSON.stringify(bookmarks));
      localStorage.setItem('bbc_studio_daily_v1', JSON.stringify(dailyLogs));
      localStorage.setItem('bbc_studio_history_v1', JSON.stringify(completedHistory));
      localStorage.setItem('bbc_studio_episodes_v1', JSON.stringify(episodes));
      localStorage.setItem('bbc_studio_shadowed_v1', JSON.stringify(shadowedSentences));
    } catch {
      // Ignore storage quota errors
    }
  }, [vocabulary, bookmarks, dailyLogs, completedHistory, episodes, shadowedSentences]);

  const activeEpisode = useMemo(
    () => episodes.find((e) => e.id === activeEpisodeId) ?? episodes[0],
    [episodes, activeEpisodeId]
  );

  const safeSentenceIdx = Math.min(
    activeEpisode.sentences.length - 1,
    Math.max(0, activeSentenceIndex)
  );
  const activeSentence = activeEpisode.sentences[safeSentenceIdx];

  const currentTypedText = userTypedMap[activeSentence.id] ?? '';

  // Real-time evaluation of user's dictation
  const evaluation = useMemo(() => {
    const keyTerms = activeSentence.keyWords.map((k) => k.word);
    return evaluateDictation(activeSentence.english, currentTypedText, {
      isLiveTyping: !submittedSentences[activeSentence.id],
      keyTerms,
    });
  }, [activeSentence, currentTypedText, submittedSentences]);

  // High-precision playback timer + A-B loop & continuous shadowing driver
  useEffect(() => {
    if (!isPlaying) return;

    const tickMs = 200;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const delta = (tickMs / 1000) * playbackRate;

        // If continuous full-episode shadowing is enabled, auto-advance to next sentence at sentenceEnd
        if (
          continuousShadowing &&
          !abLoopEnabled &&
          !sentenceLoopEnabled &&
          prev + delta >= activeSentence.endTime
        ) {
          const nextIdx = safeSentenceIdx + 1;
          if (nextIdx < activeEpisode.sentences.length) {
            const nextSent = activeEpisode.sentences[nextIdx];
            setActiveSentenceIndex(nextIdx);
            setPointA(nextSent.startTime);
            setPointB(nextSent.endTime);
            speakSentenceFromTime(nextSent, nextSent.startTime, playbackRate);
            return nextSent.startTime;
          }
        }

        const step = advancePlaybackTime(prev, delta, activeEpisode.duration, {
          abLoopEnabled,
          pointA,
          pointB,
          sentenceLoopEnabled,
          sentenceStart: activeSentence.startTime,
          sentenceEnd: activeSentence.endTime,
        });

        if (step.didLoop) {
          setLoopCount((c) => c + 1);
          speakSentenceFromTime(activeSentence, step.nextTime, playbackRate);
        } else if (step.reachedEnd) {
          setIsPlaying(false);
          stopSpeech();
        }
        return step.nextTime;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [
    isPlaying,
    playbackRate,
    activeEpisode,
    safeSentenceIdx,
    abLoopEnabled,
    pointA,
    pointB,
    sentenceLoopEnabled,
    continuousShadowing,
    activeSentence,
  ]);

  const handleSelectEpisode = (epId: string) => {
    stopSpeech();
    setIsPlaying(false);
    setActiveEpisodeId(epId);
    setActiveSentenceIndex(0);
    const ep = episodes.find((e) => e.id === epId) ?? episodes[0];
    const firstSent = ep.sentences[0];
    setCurrentTime(firstSent.startTime);
    setPointA(firstSent.startTime);
    setPointB(firstSent.endTime);
    setLoopCount(0);
    setSubmissionFeedback(null);
  };

  const handleSelectSentenceIndex = (idx: number) => {
    stopSpeech();
    setIsPlaying(false);
    const target = activeEpisode.sentences[idx];
    if (!target) return;
    setActiveSentenceIndex(idx);
    setCurrentTime(target.startTime);
    setPointA(target.startTime);
    setPointB(target.endTime);
    setLoopCount(0);
    setSubmissionFeedback(null);
  };

  const handleSeek = (targetTime: number) => {
    const clampedTime = Math.max(
      0,
      Math.min(activeEpisode.duration, Number(targetTime.toFixed(2)))
    );

    // Determine which sentence contains clampedTime
    let targetSent = activeSentence;
    const foundIdx = activeEpisode.sentences.findIndex(
      (s) => clampedTime >= s.startTime && clampedTime < s.endTime
    );
    if (foundIdx >= 0 && foundIdx !== safeSentenceIdx) {
      targetSent = activeEpisode.sentences[foundIdx];
      setActiveSentenceIndex(foundIdx);
      setPointA(targetSent.startTime);
      setPointB(targetSent.endTime);
    } else if (
      abLoopEnabled &&
      pointA !== null &&
      pointB !== null &&
      (clampedTime < pointA || clampedTime >= pointB)
    ) {
      // Expand A-B bounds to target sentence so seeking outside A-B doesn't snap away
      setPointA(targetSent.startTime);
      setPointB(targetSent.endTime);
    }

    setCurrentTime(clampedTime);
    if (isPlaying) {
      speakSentenceFromTime(targetSent, clampedTime, playbackRate);
    }
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      speakSentenceFromTime(activeSentence, currentTime, rate);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeech();
    } else {
      let resumeTime = currentTime;
      if (
        abLoopEnabled &&
        pointA !== null &&
        pointB !== null &&
        pointB > pointA
      ) {
        // Only reset to pointA if playhead is outside [pointA, pointB - 0.15)
        if (currentTime < pointA || currentTime >= pointB - 0.15) {
          resumeTime = pointA;
          setCurrentTime(pointA);
        }
      } else {
        // Only reset to sentence startTime if playhead is outside [startTime, endTime - 0.15)
        if (
          currentTime < activeSentence.startTime ||
          currentTime >= activeSentence.endTime - 0.15
        ) {
          resumeTime = activeSentence.startTime;
          setCurrentTime(activeSentence.startTime);
        }
      }
      setIsPlaying(true);
      speakSentenceFromTime(activeSentence, resumeTime, playbackRate);
    }
  };

  const handleReplaySentence = () => {
    setCurrentTime(activeSentence.startTime);
    if (
      abLoopEnabled &&
      pointA !== null &&
      pointA > activeSentence.startTime
    ) {
      setPointA(activeSentence.startTime);
    }
    setIsPlaying(true);
    speakSentenceFromTime(activeSentence, activeSentence.startTime, playbackRate);
  };

  const handleJumpToWordTime = (wordStartTime: number) => {
    const clamped = Math.max(
      activeSentence.startTime,
      Math.min(activeSentence.endTime - 0.1, Number(wordStartTime.toFixed(2)))
    );
    if (abLoopEnabled && pointA !== null && clamped < pointA) {
      setPointA(clamped);
    }
    setCurrentTime(clamped);
    setIsPlaying(true);
    speakSentenceFromTime(activeSentence, clamped, playbackRate);
  };

  const handleToggleContinuousShadowing = () => {
    setContinuousShadowing((prev) => {
      const next = !prev;
      if (next) {
        setAbLoopEnabled(false);
        setSentenceLoopEnabled(false);
      }
      return next;
    });
  };

  const handleMarkSentenceShadowed = (sentenceId: string, score: number) => {
    const alreadyShadowed = Boolean(shadowedSentences[sentenceId]);
    setShadowedSentences((prev) => ({
      ...prev,
      [sentenceId]: { score, completedAt: '刚刚' },
    }));
    if (!alreadyShadowed) {
      setDailyLogs((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          ...updated[lastIdx],
          minutesListened: updated[lastIdx].minutesListened + 2,
        };
        return updated;
      });
    }
  };

  const handleSetPointA = (newA: number | null) => {
    const clamped = clampLoopPoints(newA, pointB, activeEpisode.duration);
    setPointA(clamped.pointA);
    setPointB(clamped.pointB);
    if (clamped.pointA !== null && clamped.pointB !== null) {
      setAbLoopEnabled(true);
    } else {
      setAbLoopEnabled(false);
    }
  };

  const handleSetPointB = (newB: number | null) => {
    const startA = pointA ?? activeSentence.startTime;
    const clamped = clampLoopPoints(startA, newB, activeEpisode.duration);
    setPointA(clamped.pointA);
    setPointB(clamped.pointB);
    if (clamped.pointA !== null && clamped.pointB !== null) {
      setAbLoopEnabled(true);
    } else {
      setAbLoopEnabled(false);
    }
  };

  const handleLockSentenceAsAb = () => {
    setPointA(activeSentence.startTime);
    setPointB(activeSentence.endTime);
    setCurrentTime(activeSentence.startTime);
    setAbLoopEnabled(true);
  };

  const handleSaveBookmark = (label: string, note: string) => {
    const newBm: ABBookmark = {
      id: `ab-${Date.now()}`,
      episodeId: activeEpisode.id,
      sentenceId: activeSentence.id,
      label,
      pointA: pointA ?? activeSentence.startTime,
      pointB: pointB ?? activeSentence.endTime,
      note,
      createdAt: '刚刚',
    };
    setBookmarks((prev) => [newBm, ...prev]);
  };

  const handleLoadBookmark = (bm: ABBookmark) => {
    const sIdx = activeEpisode.sentences.findIndex((s) => s.id === bm.sentenceId);
    if (sIdx >= 0) {
      setActiveSentenceIndex(sIdx);
    }
    setPointA(bm.pointA);
    setPointB(bm.pointB);
    setCurrentTime(bm.pointA);
    setAbLoopEnabled(true);
    setIsPlaying(true);
    const sent =
      activeEpisode.sentences.find((s) => s.id === bm.sentenceId) ?? activeSentence;
    speakSentenceFromTime(sent, bm.pointA, playbackRate);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleTypeDictation = (text: string) => {
    setUserTypedMap((prev) => ({
      ...prev,
      [activeSentence.id]: text,
    }));
    if (submissionFeedback) setSubmissionFeedback(null);
  };

  const handleSubmitSentenceCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const typed = (userTypedMap[activeSentence.id] ?? '').trim();
    if (!typed) {
      setSubmissionFeedback('请先在听写输入框中输入您听到的英文内容，再点击提交核对。');
      return;
    }

    const finalEval = evaluateDictation(activeSentence.english, typed, {
      isLiveTyping: false,
      keyTerms: activeSentence.keyWords.map((k) => k.word),
    });

    const alreadySubmitted = submittedSentences[activeSentence.id];
    setSubmittedSentences((prev) => ({
      ...prev,
      [activeSentence.id]: true,
    }));
    setShowTranscript(true);

    // Record in completed history
    const newRecord: CompletedSentenceRecord = {
      id: `hist-${Date.now()}`,
      episodeId: activeEpisode.id,
      episodeTitle: `${activeEpisode.programme} · ${activeEpisode.title.slice(0, 26)}`,
      sentenceIndex: activeSentence.index,
      sentenceEn: activeSentence.english,
      userTyped: typed,
      accuracy: finalEval.accuracy,
      completedAt: '刚刚',
      errorBreakdown: finalEval.errorBreakdown,
    };
    setCompletedHistory((prev) => [newRecord, ...prev.slice(0, 19)]);

    // Update today's daily practice log
    setDailyLogs((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      const today = { ...updated[lastIdx] };
      if (!alreadySubmitted) {
        today.sentencesCompleted += 1;
        today.minutesListened += 3;
      }
      today.avgAccuracy = Math.round((today.avgAccuracy + finalEval.accuracy) / 2);
      updated[lastIdx] = today;
      return updated;
    });

    setSubmissionFeedback(
      `✓ 已完成第 #${activeSentence.index} 句核对并计入今日打卡！本句准确率 ${finalEval.accuracy}%（匹配 ${finalEval.matchedCount}/${finalEval.totalWords} 词）。`
    );
  };

  const handleAddKeyWordToVocab = (hint: SentenceVocabHint) => {
    const exists = vocabulary.some(
      (v) => cleanWord(v.word) === cleanWord(hint.word)
    );
    if (exists) {
      setActiveTab('vocabulary');
      return;
    }

    const newItem: VocabItem = {
      id: `voc-${Date.now()}`,
      word: hint.word,
      phoneticUk: hint.phoneticUk,
      pos: hint.pos,
      meaningCn: hint.meaningCn,
      meaningEn: hint.explanation,
      episodeId: activeEpisode.id,
      episodeTitle: `${activeEpisode.programme} · ${activeEpisode.title.slice(0, 24)}`,
      bbcSentenceEn: activeSentence.english,
      bbcSentenceCn: activeSentence.chinese,
      detailedExplanation: hint.explanation,
      listeningTrap: activeSentence.phoneticNote,
      collocations: hint.collocations,
      mastered: false,
      addedAt: '2026-10-28',
      reviewCount: 1,
      userNote: `从第 #${activeSentence.index} 句精听中收录`,
    };

    setVocabulary((prev) => [newItem, ...prev]);
    setDailyLogs((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      updated[lastIdx] = {
        ...updated[lastIdx],
        wordsCollected: updated[lastIdx].wordsCollected + 1,
      };
      return updated;
    });
  };

  const handleQuickCollectToken = (rawWord: string) => {
    const cleaned = cleanWord(rawWord);
    if (!cleaned || cleaned.length < 3) return;
    const existingHint = activeSentence.keyWords.find(
      (k) => cleanWord(k.word) === cleaned
    );
    if (existingHint) {
      handleAddKeyWordToVocab(existingHint);
      return;
    }
    const alreadyInVocab = vocabulary.some((v) => cleanWord(v.word) === cleaned);
    if (alreadyInVocab) return;

    const newItem: VocabItem = {
      id: `voc-${Date.now()}`,
      word: cleaned,
      phoneticUk: `/${cleaned}/`,
      pos: 'n./v.',
      meaningCn: `点击自 BBC 原句词汇（见例句语境）`,
      meaningEn: `Extracted from BBC ${activeEpisode.programme} intensive dictation.`,
      episodeId: activeEpisode.id,
      episodeTitle: `${activeEpisode.programme} · ${activeEpisode.title.slice(0, 24)}`,
      bbcSentenceEn: activeSentence.english,
      bbcSentenceCn: activeSentence.chinese,
      detailedExplanation: activeSentence.grammarNote,
      listeningTrap: activeSentence.phoneticNote,
      collocations: [`in BBC context: "${rawWord.replace(/[.,!?;:]/g, '')}"`],
      mastered: false,
      addedAt: '2026-10-28',
      reviewCount: 1,
      userNote: '精听核对时点击单词快速收录',
    };
    setVocabulary((prev) => [newItem, ...prev]);
  };

  const todayStats = dailyLogs[dailyLogs.length - 1];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-xs border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('studio');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-editorial"
        >
          BBC Dictation Studio
        </a>

        {/* Zone 2: 4 Single-Line Navigation Links */}
        <nav
          aria-label="主导航"
          className="flex items-center gap-6 text-sm font-medium text-slate-400 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'studio'
                ? 'border-[#EF4444] text-white font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            精听听写工作台
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('corpus')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'corpus'
                ? 'border-[#EF4444] text-white font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            BBC语料库与AI扩充
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'border-[#EF4444] text-white font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            生词本与精讲 ({vocabulary.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#EF4444] text-white font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            进度统计与诊断
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'studio' ? 'corpus' : 'studio')
            }
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeTab === 'studio'
              ? `今日已练 ${todayStats?.sentencesCompleted ?? 5}/${dailyGoalSentences} 句`
              : '返回精听工作台'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {activeTab === 'studio' && (
          <>
            {/* Episode Switcher & Daily Quick Metrics Strip */}
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  BBC 精听栏目:
                </span>
                {episodes.map((ep) => {
                  const isSelected = ep.id === activeEpisode.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleSelectEpisode(ep.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-[#B91C1C] text-white border-transparent font-semibold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {ep.programme} · {ep.chineseTitle.slice(0, 10)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setDictationMode((m) => (m === 'shadowing' ? 'full' : 'shadowing'))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    dictationMode === 'shadowing'
                      ? 'bg-emerald-600 text-white border-transparent'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                  }`}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>
                    {dictationMode === 'shadowing'
                      ? '✓ 原文字幕跟读中'
                      : '原文字幕跟读'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('corpus')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ 扩充新语料 / 选题</span>
                </button>
              </div>

              {/* Unboxed Tabular Daily Summary */}
              <div className="flex items-center gap-4 text-xs text-slate-400 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800 shrink-0">
                <div>
                  <span className="text-slate-500 mr-1.5">今日完成:</span>
                  <strong className="font-mono tabular-nums text-sm text-white">
                    {todayStats?.sentencesCompleted ?? 5}/{dailyGoalSentences}句
                  </strong>
                </div>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <div>
                  <span className="text-slate-500 mr-1.5">实时准确率:</span>
                  <strong className="font-mono tabular-nums text-sm text-emerald-400">
                    {todayStats?.avgAccuracy ?? 92}%
                  </strong>
                </div>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <div>
                  <span className="text-slate-500 mr-1.5">生词本:</span>
                  <strong className="font-mono tabular-nums text-sm text-white">
                    {vocabulary.length}词
                  </strong>
                </div>
              </div>
            </div>

            {/* Studio Audio Waveform & A-B Repeat Controller */}
            <AudioWaveformDeck
              episode={activeEpisode}
              activeSentence={activeSentence}
              currentTime={currentTime}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              pointA={pointA}
              pointB={pointB}
              abLoopEnabled={abLoopEnabled}
              sentenceLoopEnabled={sentenceLoopEnabled}
              loopCount={loopCount}
              bookmarks={bookmarks}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onSelectSentenceIndex={handleSelectSentenceIndex}
              onReplaySentence={handleReplaySentence}
              onChangePlaybackRate={handleChangePlaybackRate}
              onSetPointA={handleSetPointA}
              onSetPointB={handleSetPointB}
              onToggleAbLoop={() => setAbLoopEnabled((v) => !v)}
              onToggleSentenceLoop={() => setSentenceLoopEnabled((v) => !v)}
              onLockSentenceAsAb={handleLockSentenceAsAb}
              onSaveBookmark={handleSaveBookmark}
              onLoadBookmark={handleLoadBookmark}
              onDeleteBookmark={handleDeleteBookmark}
            />

            {/* Two-Zone Dictation & Explanation Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 7 Columns: Real-Time Dictation & Word-by-Word Error Correction */}
              <section
                aria-label="实时听写与纠错区"
                className="lg:col-span-7 bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col justify-between space-y-5 text-slate-100"
              >
                <div className="space-y-5">
                  {/* Top Toolbar: Dictation Mode & Transcript Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-white">
                        第 #{activeSentence.index} / {activeEpisode.sentences.length} 句精听听写
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {formatTimestamp(activeSentence.startTime)}–{formatTimestamp(activeSentence.endTime)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>主播: {activeSentence.speaker}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Segmented Mode Control */}
                      <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setDictationMode('full')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            dictationMode === 'full'
                              ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          整句默写
                        </button>
                        <button
                          type="button"
                          onClick={() => setDictationMode('cloze')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            dictationMode === 'cloze'
                              ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          重点词提示模式
                        </button>
                        <button
                          type="button"
                          onClick={() => setDictationMode('shadowing')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            dictationMode === 'shadowing'
                              ? 'bg-[#B91C1C] text-white shadow-2xs font-semibold'
                              : 'text-amber-300 hover:text-white'
                          }`}
                        >
                          <Subtitles className="w-3.5 h-3.5" />
                          <span>原文字幕跟读</span>
                        </button>
                      </div>

                      {dictationMode !== 'shadowing' && (
                        <button
                          type="button"
                          onClick={() => setShowTranscript((v) => !v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {showTranscript ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>隐藏原文盲听</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>显示原文对照</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {dictationMode === 'shadowing' ? (
                    <SubtitleShadowingPanel
                      episode={activeEpisode}
                      activeSentence={activeSentence}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      playbackRate={playbackRate}
                      continuousShadowing={continuousShadowing}
                      shadowedSentences={shadowedSentences}
                      onTogglePlay={handleTogglePlay}
                      onReplaySentence={handleReplaySentence}
                      onJumpToWordTime={handleJumpToWordTime}
                      onSelectSentenceIndex={handleSelectSentenceIndex}
                      onChangePlaybackRate={handleChangePlaybackRate}
                      onToggleContinuousShadowing={handleToggleContinuousShadowing}
                      onMarkSentenceShadowed={handleMarkSentenceShadowed}
                      onQuickCollectWord={handleQuickCollectToken}
                    />
                  ) : (
                    <>

                  {/* Cloze / Context Scaffold when in Cloze Mode */}
                  {dictationMode === 'cloze' && (
                    <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs leading-relaxed text-slate-300">
                      <div className="text-[11px] font-semibold text-amber-400 mb-1">
                        重点词骨架提示（在下方输入框继续完整听写或补全空缺词）：
                      </div>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {evaluation.tokens.map((tok) => (
                          <span key={tok.index}>
                            {tok.clozeBlank && tok.status !== 'correct'
                              ? `[____(${tok.targetClean.length}字母)]`
                              : tok.targetRaw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dictation Textarea Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="dictation-textarea"
                        className="text-xs font-semibold text-slate-200"
                      >
                        在此输入您听到的英文句子（输入时自动进行实时拼写与弱读比对）：
                      </label>
                      <span className="font-mono tabular-nums text-xs font-semibold text-amber-300">
                        实时准确率: {evaluation.accuracy}% ({evaluation.matchedCount}/
                        {evaluation.totalWords} 词匹配)
                      </span>
                    </div>

                    <textarea
                      id="dictation-textarea"
                      rows={3}
                      value={currentTypedText}
                      onChange={(e) => handleTypeDictation(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSubmitSentenceCheck();
                        }
                      }}
                      placeholder="边听边输入英文句子...（支持实时识别漏听的弱读词、词尾 -ed/-s 偏差与拼写错误）"
                      className="w-full p-4 rounded-xl border border-slate-700 bg-[#090D16] text-base text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                    />

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSubmitSentenceCheck()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>提交核对并计入进度</span>
                        </button>
                        <span className="text-xs text-slate-400">
                          快捷键: Ctrl / Cmd + Enter 提交核对
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleTypeDictation('');
                          setSubmittedSentences((prev) => ({
                            ...prev,
                            [activeSentence.id]: false,
                          }));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>清空重写</span>
                      </button>
                    </div>

                    {submissionFeedback && (
                      <div
                        role="status"
                        className="mt-3 p-3 rounded-lg bg-emerald-950/70 border border-emerald-600/70 text-xs font-medium text-emerald-200"
                      >
                        {submissionFeedback}
                      </div>
                    )}
                  </div>

                  {/* Real-Time Word-by-Word Diff & Phonetic Diagnosis Board */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-200">
                        逐词实时纠错矩阵（点击任意词可听英式发音并快速收入生词本）：
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>✓ 准确匹配</span>
                        <span>● 词尾漏音(-ed/-s)</span>
                        <span>▲ 虚词弱读漏听</span>
                        <span>✕ 拼写偏差</span>
                      </div>
                    </div>

                    <div
                      data-testid="live-diff-tokens"
                      className="p-4 rounded-xl bg-[#090D16] border border-slate-800 flex flex-wrap gap-2 items-center"
                    >
                      {evaluation.tokens.map((tok) => {
                        let styleClass =
                          'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600';
                        let prefixSymbol = '';

                        if (tok.status === 'correct') {
                          styleClass =
                            'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 font-medium';
                          prefixSymbol = '✓ ';
                        } else if (tok.status === 'typing') {
                          styleClass =
                            'bg-sky-950/80 border-sky-500/70 text-sky-300 font-medium';
                          prefixSymbol = '… ';
                        } else if (tok.status === 'ending_miss') {
                          styleClass =
                            'bg-amber-950/80 border-amber-500/70 text-amber-300 font-medium';
                          prefixSymbol = '● ';
                        } else if (tok.status === 'spelling_error') {
                          styleClass =
                            'bg-rose-950/80 border-rose-500/70 text-rose-300 font-medium';
                          prefixSymbol = '✕ ';
                        } else if (tok.status === 'weak_form_miss') {
                          styleClass =
                            'bg-slate-800/80 border-slate-600 text-slate-300';
                          prefixSymbol = '▲ ';
                        }

                        const isRevealedOrSubmitted =
                          showTranscript || Boolean(submittedSentences[activeSentence.id]);

                        return (
                          <button
                            key={tok.index}
                            type="button"
                            onClick={() => {
                              speakBritishText(tok.targetClean, 0.9);
                              handleQuickCollectToken(tok.targetRaw);
                            }}
                            title={
                              tok.diagnosis
                                ? `${tok.diagnosis}（点击朗读并加入生词本）`
                                : '点击朗读英式发音并加入生词本'
                            }
                            className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors cursor-pointer ${styleClass}`}
                          >
                            <span>{prefixSymbol}</span>
                            {isRevealedOrSubmitted || tok.status === 'correct' ? (
                              <span>
                                {tok.targetRaw}
                                {(tok.status === 'spelling_error' ||
                                  tok.status === 'ending_miss') &&
                                  tok.typedRaw && (
                                    <span className="line-through text-rose-400 ml-1">
                                      ({tok.typedRaw})
                                    </span>
                                  )}
                              </span>
                            ) : tok.status === 'typing' ||
                              tok.status === 'spelling_error' ||
                              tok.status === 'ending_miss' ? (
                              <span>{tok.typedRaw}</span>
                            ) : (
                              <span>
                                {tok.status === 'weak_form_miss'
                                  ? '[弱读虚词]'
                                  : `[${tok.targetClean.length}字母]`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Specific Error Diagnostics List for Active Sentence */}
                    <div className="space-y-1.5">
                      {evaluation.tokens
                        .filter(
                          (t) =>
                            t.status === 'ending_miss' ||
                            t.status === 'spelling_error' ||
                            (t.status === 'weak_form_miss' &&
                              (showTranscript ||
                                submittedSentences[activeSentence.id] ||
                                currentTypedText.length > 10))
                        )
                        .slice(0, 4)
                        .map((errTok) => (
                          <div
                            key={errTok.index}
                            className="flex items-start gap-2 text-xs text-slate-300 bg-amber-950/40 border border-amber-600/50 rounded-lg px-3 py-2"
                          >
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-white">
                                词位 #{errTok.index + 1} 纠错分析：
                              </span>
                              <span className="text-slate-300">{errTok.diagnosis}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                {/* Bottom Bilingual Reference Box */}
                <div className="pt-4 border-t border-slate-800">
                  {showTranscript || submittedSentences[activeSentence.id] ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-400">
                          BBC 标准原文与中文参考译文：
                        </div>
                        <button
                          type="button"
                          onClick={() => setDictationMode('shadowing')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
                        >
                          <Subtitles className="w-3.5 h-3.5" />
                          <span>进入逐词同步原文字幕跟读 →</span>
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        {activeSentence.english}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {activeSentence.chinese}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        当前处于盲听模式，提交核对、点击“显示原文对照”或切换至“原文字幕跟读”可查看双语字幕。
                      </span>
                      <span className="font-mono text-slate-400">中文提示: {activeSentence.chinese}</span>
                    </div>
                  )}
                </div>
                    </>
                  )}
                </div>
              </section>

              {/* Right 5 Columns: Connected Speech Explanation & Key Vocabulary Collector */}
              <aside
                aria-label="语音连读讲解与本句生词精析"
                className="lg:col-span-5 bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col justify-between space-y-5 text-slate-100"
              >
                <div className="space-y-5">
                  {/* Section 1: British RP Connected Speech & Grammar Analysis */}
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Ear className="w-4 h-4 text-[#EF4444]" />
                        <span>本句英音连读与语法精讲</span>
                      </h3>
                      <span className="text-xs text-slate-400">BBC RP 语音拆解</span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#131C31] border border-slate-800 space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <span className="font-semibold text-[#F87171] block mb-0.5">
                          连读 / 弱读 / 失去爆破提示：
                        </span>
                        <p className="text-slate-300">{activeSentence.phoneticNote}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="font-semibold text-slate-200 block mb-0.5">
                          句法结构与表达亮点：
                        </span>
                        <p className="text-slate-300">{activeSentence.grammarNote}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Key Vocabulary in Current Sentence with Explanations */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#EF4444]" />
                        <span>本句重点词汇与深度讲解</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('vocabulary')}
                        className="text-xs font-medium text-[#F87171] hover:underline cursor-pointer"
                      >
                        打开完整生词本 ({vocabulary.length}) →
                      </button>
                    </div>

                    {activeSentence.keyWords.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">
                        点击左侧逐词纠错矩阵中的任意单词，即可朗读发音并一键收入生词本。
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeSentence.keyWords.map((kw) => {
                          const isSaved = vocabulary.some(
                            (v) => cleanWord(v.word) === cleanWord(kw.word)
                          );
                          return (
                            <div
                              key={kw.word}
                              className="p-4 rounded-xl border border-slate-800 bg-[#131C31] space-y-2"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-base font-bold text-white">
                                    {kw.word}
                                  </span>
                                  <span className="font-mono text-xs text-slate-400">
                                    {kw.phoneticUk}
                                  </span>
                                  <span className="text-xs font-semibold text-[#F87171]">
                                    {kw.pos}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => speakBritishText(kw.word, 0.9)}
                                    aria-label={`朗读单词 ${kw.word}`}
                                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddKeyWordToVocab(kw)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                      isSaved
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/70'
                                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                  >
                                    {isSaved ? (
                                      <>
                                        <BookmarkCheck className="w-3.5 h-3.5" />
                                        <span>✓ 已在生词本</span>
                                      </>
                                    ) : (
                                      <>
                                        <BookmarkPlus className="w-3.5 h-3.5" />
                                        <span>加入生词本</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs font-semibold text-slate-200">
                                释义：{kw.meaningCn}
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed">
                                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                                <strong className="text-white">讲解：</strong>
                                {kw.explanation}
                              </p>

                              {kw.collocations.length > 0 && (
                                <div className="text-[11px] text-slate-400 pt-0.5">
                                  <strong className="text-slate-300">常见搭配：</strong>
                                  {kw.collocations.join(' · ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Studio Practice Tip */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>四步精听法：盲听大意 → 逐句听写 → A-B复读连读 → 收录生词</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium cursor-pointer whitespace-nowrap"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>查看听写统计</span>
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        {activeTab === 'corpus' && (
          <CorpusHubView
            episodes={episodes}
            activeEpisodeId={activeEpisodeId}
            onSelectAndJumpToStudio={(epId) => {
              handleSelectEpisode(epId);
              setActiveTab('studio');
            }}
            onAddNewEpisode={(newEp) => {
              setEpisodes((prev) => [newEp, ...prev]);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyNotebookView
            vocabulary={vocabulary}
            onToggleMastered={(id) =>
              setVocabulary((prev) =>
                prev.map((v) =>
                  v.id === id
                    ? { ...v, mastered: !v.mastered, reviewCount: v.reviewCount + 1 }
                    : v
                )
              )
            }
            onDeleteVocab={(id) =>
              setVocabulary((prev) => prev.filter((v) => v.id !== id))
            }
            onUpdateNote={(id, note) =>
              setVocabulary((prev) =>
                prev.map((v) => (v.id === id ? { ...v, userNote: note } : v))
              )
            }
            onAddCustomVocab={(newItem) =>
              setVocabulary((prev) => [
                {
                  ...newItem,
                  id: `voc-${Date.now()}`,
                  addedAt: '2026-10-28',
                  reviewCount: 1,
                },
                ...prev,
              ])
            }
            onIncrementReview={(id) =>
              setVocabulary((prev) =>
                prev.map((v) =>
                  v.id === id ? { ...v, reviewCount: v.reviewCount + 1 } : v
                )
              )
            }
          />
        )}

        {activeTab === 'analytics' && (
          <ProgressAnalyticsView
            dailyLogs={dailyLogs}
            completedHistory={completedHistory}
            vocabulary={vocabulary}
            dailyGoalSentences={dailyGoalSentences}
            onChangeDailyGoal={(g) => setDailyGoalSentences(g)}
            onJumpToSentence={(epId, sIdx) => {
              handleSelectEpisode(epId);
              setTimeout(() => {
                handleSelectSentenceIndex(sIdx);
              }, 0);
              setActiveTab('studio');
            }}
          />
        )}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F17] mt-12 py-5 px-6">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#EF4444]" />
            <span className="font-semibold text-slate-200">
              BBC Dictation Studio · 英语听力精听与听写训练实验室
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className="hover:text-white cursor-pointer"
            >
              精听工作台
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('corpus')}
              className="hover:text-white cursor-pointer"
            >
              BBC语料库与AI扩充
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('vocabulary')}
              className="hover:text-white cursor-pointer"
            >
              生词本与讲解
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="hover:text-white cursor-pointer"
            >
              进度统计
            </button>
          </div>
        </div>
      </footer>

      <CustomEpisodeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onCreateEpisode={(newEp) => {
          setEpisodes((prev) => [newEp, ...prev]);
          setActiveEpisodeId(newEp.id);
          setActiveSentenceIndex(0);
          setCurrentTime(0);
          setPointA(0);
          setPointB(newEp.sentences[0]?.endTime ?? 6);
          setActiveTab('studio');
        }}
      />
    </div>
  );
}
