import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  BookmarkPlus,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react';
import { BBCEpisode, DictationSentence, ABBookmark } from '../data/bbcEpisodes';
import { formatTimestamp } from '../utils/dictationEngine';

interface AudioWaveformDeckProps {
  episode: BBCEpisode;
  activeSentence: DictationSentence;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  pointA: number | null;
  pointB: number | null;
  abLoopEnabled: boolean;
  sentenceLoopEnabled: boolean;
  loopCount: number;
  bookmarks: ABBookmark[];
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSelectSentenceIndex: (idx: number) => void;
  onReplaySentence: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onSetPointA: (time: number | null) => void;
  onSetPointB: (time: number | null) => void;
  onToggleAbLoop: () => void;
  onToggleSentenceLoop: () => void;
  onLockSentenceAsAb: () => void;
  onSaveBookmark: (label: string, note: string) => void;
  onLoadBookmark: (bm: ABBookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5];

export const AudioWaveformDeck: React.FC<AudioWaveformDeckProps> = ({
  episode,
  activeSentence,
  currentTime,
  isPlaying,
  playbackRate,
  pointA,
  pointB,
  abLoopEnabled,
  sentenceLoopEnabled,
  loopCount,
  bookmarks,
  onTogglePlay,
  onSeek,
  onSelectSentenceIndex,
  onReplaySentence,
  onChangePlaybackRate,
  onSetPointA,
  onSetPointB,
  onToggleAbLoop,
  onToggleSentenceLoop,
  onLockSentenceAsAb,
  onSaveBookmark,
  onLoadBookmark,
  onDeleteBookmark,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [bookmarkError, setBookmarkError] = useState('');

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = Number((ratio * episode.duration).toFixed(1));
    onSeek(targetTime);
  };

  const handleSaveBookmarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkLabel.trim()) {
      setBookmarkError('请输入复读时间点名称（例如：Beth连读难点）');
      return;
    }
    onSaveBookmark(
      bookmarkLabel.trim(),
      bookmarkNote.trim() || `区间 ${formatTimestamp(pointA ?? activeSentence.startTime)} - ${formatTimestamp(pointB ?? activeSentence.endTime)} 重点复读`
    );
    setBookmarkLabel('');
    setBookmarkNote('');
    setBookmarkError('');
    setShowBookmarkForm(false);
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / episode.duration) * 100));
  const sentenceStartPct = (activeSentence.startTime / episode.duration) * 100;
  const sentenceWidthPct =
    ((activeSentence.endTime - activeSentence.startTime) / episode.duration) * 100;

  const hasValidAb = pointA !== null && pointB !== null && pointB > pointA;
  const abStartPct = hasValidAb ? (pointA! / episode.duration) * 100 : 0;
  const abWidthPct = hasValidAb ? ((pointB! - pointA!) / episode.duration) * 100 : 0;

  const episodeBookmarks = bookmarks.filter((b) => b.episodeId === episode.id);

  return (
    <section
      aria-label="精听音频与A-B复读控制台"
      className="bg-[#0F172A] text-slate-100 rounded-xl border border-slate-800 p-4 sm:p-5"
    >
      {/* Top Row: Programme Metadata & Active Time Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-[#F87171] font-semibold tracking-wide">
              BBC {episode.programme}
            </span>
            <span aria-hidden="true">·</span>
            <span>{episode.level}</span>
            <span aria-hidden="true">·</span>
            <span>{episode.accent}</span>
            <span aria-hidden="true">·</span>
            <span>主播: {episode.presenters}</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5 tracking-wide">
            {episode.title}
          </h2>
        </div>

        {/* High-Precision Studio Clock */}
        <div className="flex items-center gap-3.5 bg-slate-900/90 border border-slate-800 rounded-lg px-3.5 py-1.5">
          <div>
            <div className="text-[10px] text-slate-400">当前时间轴 / 总时长</div>
            <div className="font-mono tabular-nums text-sm sm:text-base font-semibold text-white">
              {formatTimestamp(currentTime)}{' '}
              <span className="text-slate-500">/ {formatTimestamp(episode.duration)}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" aria-hidden="true" />
          <div>
            <div className="text-[10px] text-slate-400">当前精听句段</div>
            <div className="font-mono tabular-nums text-xs sm:text-sm font-medium text-amber-300">
              #{activeSentence.index}/{episode.sentences.length} ({formatTimestamp(activeSentence.startTime)}–{formatTimestamp(activeSentence.endTime)})
            </div>
          </div>
          {loopCount > 0 && (
            <>
              <div className="h-6 w-px bg-slate-800" aria-hidden="true" />
              <div>
                <div className="text-[10px] text-slate-400">已循环次数</div>
                <div className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-emerald-400">
                  {loopCount} 次
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Waveform Timeline with Sentence Segments & A-B Repeat Markers */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>
            点击声波图任意位置可跳转时间点 · 当前句主播:{' '}
            <strong className="text-slate-200">{activeSentence.speaker}</strong>
          </span>
          <span className="font-mono tabular-nums">
            {hasValidAb
              ? `A-B复读区间: [${formatTimestamp(pointA!)} → ${formatTimestamp(pointB!)}] (${(
                  pointB! - pointA!
                ).toFixed(1)}s)`
              : '未设置自定义A-B复读点（默认跟随本句区间）'}
          </span>
        </div>

        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          role="slider"
          aria-label="音频波形时间轴"
          aria-valuemin={0}
          aria-valuemax={episode.duration}
          aria-valuenow={Number(currentTime.toFixed(1))}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') onSeek(Math.min(episode.duration, currentTime + 1));
            if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 1));
          }}
          className="relative h-18 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer overflow-hidden select-none group focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {/* Active Sentence Highlight Band */}
          <div
            className="absolute top-0 bottom-0 bg-slate-800/75 border-x border-slate-600/60 pointer-events-none"
            style={{
              left: `${sentenceStartPct}%`,
              width: `${sentenceWidthPct}%`,
            }}
          />

          {/* A-B Loop Highlight Overlay */}
          {hasValidAb && (
            <div
              data-testid="ab-loop-region"
              className={`absolute top-0 bottom-0 pointer-events-none border-x-2 z-10 ${
                abLoopEnabled
                  ? 'bg-amber-500/20 border-amber-400'
                  : 'bg-amber-500/10 border-amber-500/50'
              }`}
              style={{
                left: `${abStartPct}%`,
                width: `${abWidthPct}%`,
              }}
            >
              <span className="absolute top-1 left-1.5 text-[10px] font-mono font-semibold text-amber-300 bg-slate-950/90 px-1 rounded">
                A: {formatTimestamp(pointA!)}
              </span>
              <span className="absolute top-1 right-1.5 text-[10px] font-mono font-semibold text-amber-300 bg-slate-950/90 px-1 rounded">
                B: {formatTimestamp(pointB!)}
              </span>
            </div>
          )}

          {/* Sentence Boundary Tick Marks at bottom-left so they never collide with A/B top badges */}
          {episode.sentences.map((s) => {
            const leftPct = (s.startTime / episode.duration) * 100;
            return (
              <div
                key={s.id}
                className="absolute top-0 bottom-0 border-l border-slate-800/90 pointer-events-none"
                style={{ left: `${leftPct}%` }}
              >
                <span className="absolute bottom-0.5 left-1 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1 rounded">
                  S{s.index}
                </span>
              </div>
            );
          })}

          {/* Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-3 gap-1 pointer-events-none">
            {episode.waveformPeaks.map((peak, idx) => {
              const barPct = ((idx + 0.5) / episode.waveformPeaks.length) * 100;
              const isPast = barPct <= progressPercent;
              const isInAb =
                hasValidAb &&
                barPct >= abStartPct &&
                barPct <= abStartPct + abWidthPct;
              const isInSentence =
                barPct >= sentenceStartPct &&
                barPct <= sentenceStartPct + sentenceWidthPct;

              let barColor = 'bg-slate-700';
              if (isInAb && abLoopEnabled) {
                barColor = isPast ? 'bg-amber-400' : 'bg-amber-500/60';
              } else if (isPast) {
                barColor = 'bg-[#EF4444]';
              } else if (isInSentence) {
                barColor = 'bg-slate-400';
              }

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-colors duration-150 ${barColor}`}
                  style={{ height: `${Math.max(16, Math.round(peak * 78))}%` }}
                />
              );
            })}
          </div>

          {/* Playhead Vertical Cursor */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Sentence Segment Selector Strip */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
          {episode.sentences.map((s, idx) => {
            const isCurrent = s.id === activeSentence.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSentenceIndex(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#B91C1C] text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                第 {s.index} 句 · {formatTimestamp(s.startTime)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transport + A-B Repeat Control Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left: Playback Transport Controls */}
        <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>
              {isPlaying
                ? '暂停播放'
                : currentTime >
                    (abLoopEnabled && pointA !== null ? pointA : activeSentence.startTime) +
                      0.15 &&
                  currentTime <
                    (abLoopEnabled && pointB !== null ? pointB : activeSentence.endTime) -
                      0.15
                ? `继续播放 (${formatTimestamp(currentTime)})`
                : '播放精听语音'}
            </span>
          </button>

          <button
            type="button"
            onClick={onReplaySentence}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="从本句开头重新朗读"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重听本句</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectSentenceIndex(Math.max(0, activeSentence.index - 2))
            }
            disabled={activeSentence.index <= 1}
            aria-label="上一句"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectSentenceIndex(
                Math.min(episode.sentences.length - 1, activeSentence.index)
              )
            }
            disabled={activeSentence.index >= episode.sentences.length}
            aria-label="下一句"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleSentenceLoop}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
              sentenceLoopEnabled
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>单句循环: {sentenceLoopEnabled ? '开启' : '关闭'}</span>
          </button>
        </div>

        {/* Center: A-B Repeat Precision Timepoint Controls */}
        <div className="lg:col-span-5 flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSetPointA(currentTime)}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              [ 设A点 {pointA !== null ? formatTimestamp(pointA) : ''}
            </button>
            {pointA !== null && (
              <button
                type="button"
                onClick={() => onSetPointA(Math.max(0, Number((pointA - 0.5).toFixed(1))))}
                aria-label="A点提前0.5秒"
                className="px-1.5 py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
              >
                -0.5s
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSetPointB(Math.max((pointA ?? 0) + 1.2, currentTime))}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              设B点 {pointB !== null ? formatTimestamp(pointB) : ''} ]
            </button>
            {pointB !== null && (
              <button
                type="button"
                onClick={() =>
                  onSetPointB(Math.min(episode.duration, Number((pointB + 0.5).toFixed(1))))
                }
                aria-label="B点延后0.5秒"
                className="px-1.5 py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
              >
                +0.5s
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onLockSentenceAsAb}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            锁定本句A-B
          </button>

          <button
            type="button"
            onClick={onToggleAbLoop}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              abLoopEnabled
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {abLoopEnabled ? '● A-B复读中' : '启用A-B复读'}
          </button>

          {hasValidAb && (
            <button
              type="button"
              onClick={() => {
                onSetPointA(null);
                onSetPointB(null);
              }}
              className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              清除
            </button>
          )}
        </div>

        {/* Right: Speed Selector */}
        <div className="lg:col-span-2 flex items-center justify-end gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2 py-1 rounded text-xs font-mono tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Saved A-B Repeat Bookmarks Bar for Daily Intensive Review */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            复读时间点书签 ({episodeBookmarks.length}):
          </span>
          {episodeBookmarks.length === 0 ? (
            <span className="text-xs text-slate-500">
              暂无保存的复读区间，设置A-B点后可保存连读/吞音难点供每日回听
            </span>
          ) : (
            episodeBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onLoadBookmark(bm)}
                  className="text-amber-300 hover:text-amber-200 font-medium cursor-pointer whitespace-nowrap"
                >
                  {bm.label}{' '}
                  <span className="font-mono text-slate-400">
                    [{formatTimestamp(bm.pointA)}-{formatTimestamp(bm.pointB)}]
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBookmark(bm.id)}
                  aria-label={`删除复读书签 ${bm.label}`}
                  className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowBookmarkForm((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap shrink-0"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>{showBookmarkForm ? '收起保存面板' : '+ 保存当前复读时间点'}</span>
        </button>
      </div>

      {showBookmarkForm && (
        <form
          onSubmit={handleSaveBookmarkSubmit}
          className="mt-3 p-3.5 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-4">
            <label
              htmlFor="ab-bookmark-label"
              className="block text-xs text-slate-300 mb-1"
            >
              复读点标签 (区间:{' '}
              {formatTimestamp(pointA ?? activeSentence.startTime)} -{' '}
              {formatTimestamp(pointB ?? activeSentence.endTime)})
            </label>
            <input
              id="ab-bookmark-label"
              type="text"
              value={bookmarkLabel}
              onChange={(e) => {
                setBookmarkLabel(e.target.value);
                if (bookmarkError) setBookmarkError('');
              }}
              placeholder="例如：Beth连读 an_inability"
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="sm:col-span-6">
            <label
              htmlFor="ab-bookmark-note"
              className="block text-xs text-slate-300 mb-1"
            >
              发音/听写备注
            </label>
            <input
              id="ab-bookmark-note"
              type="text"
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="记录为什么这里没听清（如：that失去爆破、of弱读）"
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="w-full px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              确认保存时间点
            </button>
          </div>
          {bookmarkError && (
            <p className="sm:col-span-12 text-xs text-rose-400">{bookmarkError}</p>
          )}
        </form>
      )}
    </section>
  );
};
