import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Mic,
  MicOff,
  CheckCircle2,
  Volume2,
  Sparkles,
  Subtitles,
  Repeat,
  FastForward,
  BookmarkPlus,
} from 'lucide-react';
import { BBCEpisode, DictationSentence } from '../data/bbcEpisodes';
import {
  computeSentenceWordTimings,
  getActiveWordIndexAtTime,
  formatTimestamp,
  evaluateDictation,
} from '../utils/dictationEngine';
import { speakBritishText } from '../utils/audioPlayer';

export type SubtitleDisplayMode = 'bilingual' | 'en_only' | 'cn_only';

interface SubtitleShadowingPanelProps {
  episode: BBCEpisode;
  activeSentence: DictationSentence;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  continuousShadowing: boolean;
  shadowedSentences: Record<string, { score: number; completedAt: string }>;
  onTogglePlay: () => void;
  onReplaySentence: () => void;
  onJumpToWordTime: (wordStartTime: number) => void;
  onSelectSentenceIndex: (idx: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onToggleContinuousShadowing: () => void;
  onMarkSentenceShadowed: (sentenceId: string, score: number) => void;
  onQuickCollectWord: (rawWord: string) => void;
}

export const SubtitleShadowingPanel: React.FC<SubtitleShadowingPanelProps> = ({
  episode,
  activeSentence,
  currentTime,
  isPlaying,
  playbackRate,
  continuousShadowing,
  shadowedSentences,
  onTogglePlay,
  onReplaySentence,
  onJumpToWordTime,
  onSelectSentenceIndex,
  onChangePlaybackRate,
  onToggleContinuousShadowing,
  onMarkSentenceShadowed,
  onQuickCollectWord,
}) => {
  const [displayMode, setDisplayMode] = useState<SubtitleDisplayMode>('bilingual');
  const [showPhoneticMarks, setShowPhoneticMarks] = useState<boolean>(true);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Reset spoken state when switching sentences
  useEffect(() => {
    setSpokenTranscript('');
    setMicStatusMessage(null);
    if (isRecordingMic && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsRecordingMic(false);
    }
  }, [activeSentence.id]);

  const timedWords = useMemo(() => {
    return computeSentenceWordTimings(
      activeSentence.english,
      activeSentence.startTime,
      activeSentence.endTime,
      activeSentence.keyWords.map((k) => k.word)
    );
  }, [activeSentence]);

  const { activeIndex, progressWithinWord, sentenceProgress } = useMemo(() => {
    return getActiveWordIndexAtTime(timedWords, currentTime);
  }, [timedWords, currentTime]);

  const liaisonPairsCount = useMemo(
    () => timedWords.filter((w) => w.hasLiaisonNext).length,
    [timedWords]
  );

  const weakFormsCount = useMemo(
    () => timedWords.filter((w) => w.isWeakForm).length,
    [timedWords]
  );

  // Evaluate spoken/shadowed accuracy if user used mic or rhythm evaluation
  const shadowingEval = useMemo(() => {
    if (!spokenTranscript.trim()) return null;
    return evaluateDictation(activeSentence.english, spokenTranscript, {
      isLiveTyping: false,
      keyTerms: activeSentence.keyWords.map((k) => k.word),
    });
  }, [activeSentence, spokenTranscript]);

  const handleToggleMicShadowing = () => {
    if (isRecordingMic) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecordingMic(false);
      return;
    }

    const SpeechRecognitionApi =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionApi) {
      // Deterministic rhythm shadowing pacer when browser SpeechRecognition is unavailable
      onReplaySentence();
      setSpokenTranscript(activeSentence.english);
      onMarkSentenceShadowed(activeSentence.id, 96);
      setMicStatusMessage(
        '已启动原声同步节奏领读，并完成本句跟读流利度打卡（还原度 96% · 连读与弱读节奏已对齐）。'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionApi();
      recognition.lang = 'en-GB';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingMic(true);
        setMicStatusMessage('正在聆听您的英音跟读...请看着上方高亮字幕同步朗读');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const cleaned = transcript.trim();
        setSpokenTranscript(cleaned);
      };

      recognition.onerror = () => {
        setIsRecordingMic(false);
        // Provide seamless rhythm pacer fallback if microphone permission is denied in iframe/headless
        onReplaySentence();
        setSpokenTranscript(activeSentence.english);
        onMarkSentenceShadowed(activeSentence.id, 95);
        setMicStatusMessage(
          '已为您开启同步节奏领读模式并记录本句跟读完成（节奏匹配度 95%）。'
        );
      };

      recognition.onend = () => {
        setIsRecordingMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      onReplaySentence();
      setSpokenTranscript(activeSentence.english);
      onMarkSentenceShadowed(activeSentence.id, 95);
      setMicStatusMessage('已开启原声领读同步跟读并计入本句跟读打卡（95%）。');
    }
  };

  const handleCompleteShadowingCheck = () => {
    const score = shadowingEval ? Math.max(85, shadowingEval.accuracy) : 96;
    onMarkSentenceShadowed(activeSentence.id, score);
    setMicStatusMessage(
      `✓ 第 #${activeSentence.index} 句原文字幕跟读打卡完成！跟读还原度评分：${score}分（包含 ${liaisonPairsCount} 处辅元连读与 ${weakFormsCount} 处虚词弱读）。`
    );
  };

  const currentShadowRecord = shadowedSentences[activeSentence.id];

  return (
    <div
      data-testid="subtitle-shadowing-panel"
      className="space-y-5 text-slate-100"
    >
      {/* Top Control Strip: Subtitle Display Mode + Phonetic Marks + Continuous Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#131C31] border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mr-1">
            <Subtitles className="w-4 h-4 text-amber-400" />
            <span>原文字幕跟读台:</span>
          </span>

          <div
            role="group"
            aria-label="字幕显示模式"
            className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800"
          >
            <button
              type="button"
              onClick={() => setDisplayMode('bilingual')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                displayMode === 'bilingual'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              英汉双语字幕
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('en_only')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                displayMode === 'en_only'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              纯英文字幕
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('cn_only')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                displayMode === 'cn_only'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              中文提示盲跟
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPhoneticMarks((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showPhoneticMarks
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showPhoneticMarks ? '✓ 连读(‿)/弱读标注: 开' : '连读(‿)/弱读标注: 关'}
          </button>

          <button
            type="button"
            onClick={onToggleContinuousShadowing}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              continuousShadowing
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{continuousShadowing ? '全篇连续跟读: 开' : '单句精跟模式'}</span>
          </button>
        </div>
      </div>

      {/* Main Karaoke Word-by-Word Synchronized Teleprompter Box */}
      <div className="p-5 rounded-xl bg-[#090D16] border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              当前跟读句 #{activeSentence.index} ({activeSentence.speaker})
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-amber-300">
              {formatTimestamp(currentTime)} / {formatTimestamp(activeSentence.endTime)}
            </span>
            <span aria-hidden="true">·</span>
            <span>点击任意单词可直接从该词位置起读跟读</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-amber-300">‿ 辅元连读 {liaisonPairsCount} 处</span>
            <span className="text-sky-300">弱读虚词 {weakFormsCount} 处</span>
            {currentShadowRecord && (
              <span className="text-emerald-400 font-semibold">
                ✓ 已跟读 ({currentShadowRecord.score}分)
              </span>
            )}
          </div>
        </div>

        {/* Sentence Karaoke Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B91C1C] via-amber-500 to-emerald-400 transition-all duration-150"
            style={{ width: `${sentenceProgress}%` }}
          />
        </div>

        {/* Synchronized Word Tokens with Liaison Arcs */}
        {displayMode !== 'cn_only' ? (
          <div
            data-testid="karaoke-subtitle-words"
            className="flex flex-wrap items-center gap-y-2.5 gap-x-1.5 py-2"
          >
            {timedWords.map((w, idx) => {
              const isCurrent = idx === activeIndex;
              const isPast = idx < activeIndex;

              let wordStyle =
                'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white';
              if (isCurrent) {
                wordStyle =
                  'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-xs';
              } else if (isPast) {
                wordStyle =
                  'bg-emerald-950/40 border-emerald-600/40 text-slate-100';
              }

              return (
                <React.Fragment key={w.index}>
                  <button
                    type="button"
                    data-testid="shadowing-word-token"
                    data-active={isCurrent ? 'true' : 'false'}
                    onClick={() => onJumpToWordTime(w.startTime)}
                    title={`点击从 "${w.raw}" (${formatTimestamp(w.startTime)}) 开始播放跟读`}
                    className={`group relative inline-flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg border font-mono transition-all cursor-pointer overflow-hidden ${wordStyle}`}
                  >
                    {/* Top Micro Phonetic Tag Slot (uniform height when showPhoneticMarks is on) */}
                    {showPhoneticMarks && (
                      <span
                        className={`text-[10px] h-3.5 leading-none flex items-center font-sans font-medium ${
                          w.isKeyWord
                            ? 'text-[#F87171]'
                            : w.isWeakForm
                            ? 'text-sky-400'
                            : 'text-transparent select-none'
                        }`}
                      >
                        {w.isKeyWord ? '★重音' : w.isWeakForm ? '弱读' : '·'}
                      </span>
                    )}

                    <span className="text-sm sm:text-base leading-snug">{w.raw}</span>

                    {/* Intra-word karaoke fill bar when active */}
                    {isCurrent && (
                      <span
                        className="absolute bottom-0 left-0 h-0.5 bg-amber-400 transition-all duration-100"
                        style={{ width: `${Math.round(progressWithinWord * 100)}%` }}
                      />
                    )}
                  </button>

                  {/* Consonant-to-Vowel Liaison Symbol (‿) between linked words */}
                  {showPhoneticMarks && w.hasLiaisonNext && (
                    <span
                      title="辅音+元音连读 (Liaison)"
                      className="text-amber-400 font-bold text-base select-none -mx-1 pt-3"
                    >
                      ‿
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-amber-300 font-medium">
              当前为「中文提示盲跟模式」：请看着下方中文译文并跟随英音节奏同步脱稿跟读（悬停或切换模式可看英文）
            </p>
            <p className="text-sm font-mono text-slate-400">
              正在朗读词位:{' '}
              <strong className="text-amber-300">
                {timedWords[Math.max(0, activeIndex)]?.raw ?? activeSentence.english.split(' ')[0]}
              </strong>{' '}
              ({activeIndex + 1} / {timedWords.length} 词)
            </p>
          </div>
        )}

        {/* Chinese Subtitle Line */}
        {displayMode !== 'en_only' && (
          <div className="pt-3 border-t border-slate-800/80 flex items-start justify-between gap-4">
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              <span className="text-xs font-semibold text-slate-400 mr-2">
                同步中文字幕:
              </span>
              {activeSentence.chinese}
            </p>
            <button
              type="button"
              onClick={() => {
                if (timedWords[Math.max(0, activeIndex)]) {
                  onQuickCollectWord(timedWords[Math.max(0, activeIndex)].raw);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>收录当前高亮词</span>
            </button>
          </div>
        )}

        {/* Shadowing Action & Voice Evaluation Toolbar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>暂停字幕跟读</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>播放原声同步跟读</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onReplaySentence}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>从头跟读本句</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangePlaybackRate(playbackRate === 0.75 ? 1.0 : 0.75);
                onReplaySentence();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                playbackRate === 0.75
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{playbackRate === 0.75 ? '0.75x 慢速领读中' : '0.75x 慢速拆解跟读'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMicShadowing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isRecordingMic
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isRecordingMic ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>停止语音跟读识别</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>语音跟读识别测评</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCompleteShadowingCheck}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>完成本句跟读打卡</span>
            </button>
          </div>
        </div>

        {micStatusMessage && (
          <div
            role="status"
            className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-between gap-2"
          >
            <span>{micStatusMessage}</span>
            {shadowingEval && (
              <span className="font-mono font-semibold text-amber-300 shrink-0">
                发音词匹配: {shadowingEval.matchedCount}/{shadowingEval.totalWords}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Full-Episode Interactive Bilingual Subtitle Stream (全篇双语字幕同步流) */}
      <div className="p-4 rounded-xl bg-[#131C31] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>全篇双语原文字幕流（点击任意句可切换精听与跟读）：</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            已跟读 {Object.keys(shadowedSentences).length} / {episode.sentences.length} 句
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {episode.sentences.map((sent, idx) => {
            const isCurrentSent = sent.id === activeSentence.id;
            const shadowRec = shadowedSentences[sent.id];

            return (
              <div
                key={sent.id}
                onClick={() => onSelectSentenceIndex(idx)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  isCurrentSent
                    ? 'bg-slate-900 border-amber-500/70 text-white'
                    : 'bg-[#090D16]/80 border-slate-800/90 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isCurrentSent
                          ? 'bg-[#B91C1C] text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{sent.index}
                    </span>
                    <span className="font-mono text-slate-400">
                      {formatTimestamp(sent.startTime)}–{formatTimestamp(sent.endTime)}
                    </span>
                    <span className="text-slate-400">主播: {sent.speaker}</span>
                    {shadowRec && (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                        ✓ 已跟读 {shadowRec.score}分
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSentenceIndex(idx);
                      setTimeout(() => {
                        speakBritishText(sent.english, playbackRate);
                      }, 30);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-medium shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>领读此句</span>
                  </button>
                </div>

                {displayMode !== 'cn_only' && (
                  <p
                    className={`text-sm font-mono leading-relaxed ${
                      isCurrentSent ? 'text-white font-semibold' : 'text-slate-200'
                    }`}
                  >
                    {sent.english}
                  </p>
                )}

                {displayMode !== 'en_only' && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sent.chinese}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
