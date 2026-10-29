import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { DailyPracticeLog, VocabItem } from '../data/bbcEpisodes';
import { ErrorBreakdown } from '../utils/dictationEngine';

export interface CompletedSentenceRecord {
  id: string;
  episodeId: string;
  episodeTitle: string;
  sentenceIndex: number;
  sentenceEn: string;
  userTyped: string;
  accuracy: number;
  completedAt: string;
  errorBreakdown: ErrorBreakdown;
}

interface ProgressAnalyticsViewProps {
  dailyLogs: DailyPracticeLog[];
  completedHistory: CompletedSentenceRecord[];
  vocabulary: VocabItem[];
  dailyGoalSentences: number;
  onChangeDailyGoal: (goal: number) => void;
  onJumpToSentence: (episodeId: string, sentenceIndex: number) => void;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  dailyLogs,
  completedHistory,
  vocabulary,
  dailyGoalSentences,
  onChangeDailyGoal,
  onJumpToSentence,
}) => {
  const todayLog = dailyLogs[dailyLogs.length - 1] ?? {
    date: '2026-10-28',
    label: '今日',
    sentencesCompleted: 0,
    minutesListened: 0,
    avgAccuracy: 0,
    wordsCollected: 0,
  };

  const totalSentencesAllTime = dailyLogs.reduce(
    (sum, d) => sum + d.sentencesCompleted,
    0
  );
  const totalMinutesAllTime = dailyLogs.reduce((sum, d) => sum + d.minutesListened, 0);
  const overallAvgAccuracy =
    dailyLogs.length > 0
      ? Math.round(
          dailyLogs.reduce((sum, d) => sum + d.avgAccuracy, 0) / dailyLogs.length
        )
      : 0;

  const masteredVocabCount = vocabulary.filter((v) => v.mastered).length;
  const goalProgressPct = Math.min(
    100,
    Math.round((todayLog.sentencesCompleted / Math.max(1, dailyGoalSentences)) * 100)
  );

  // Aggregate error breakdown across completed history
  const totalErrors = completedHistory.reduce(
    (acc, rec) => {
      acc.weakFormMiss += rec.errorBreakdown.weakFormMiss;
      acc.endingMiss += rec.errorBreakdown.endingMiss;
      acc.spellingError += rec.errorBreakdown.spellingError;
      acc.missingWord += rec.errorBreakdown.missingWord;
      return acc;
    },
    { weakFormMiss: 3, endingMiss: 2, spellingError: 2, missingWord: 1 }
  );

  const errorSum = Math.max(
    1,
    totalErrors.weakFormMiss +
      totalErrors.endingMiss +
      totalErrors.spellingError +
      totalErrors.missingWord
  );

  const errorCategories = [
    {
      key: 'weakForm',
      title: '虚词弱读与连读漏听 (Weak Forms & Liaison)',
      count: totalErrors.weakFormMiss,
      pct: Math.round((totalErrors.weakFormMiss / errorSum) * 100),
      advice:
        '英式新闻语流中 of (/əv/)、to (/tə/)、have (/əv/)、and (/ən/) 极度弱化并与前后实词连读。建议使用 A-B 复读功能以 0.75x 慢速专门跟读介词与助动词过渡段。',
      tag: '▲ 高频难点',
    },
    {
      key: 'ending',
      title: '词尾屈折音漏听 (-ed / -s / 失去爆破)',
      count: totalErrors.endingMiss,
      pct: Math.round((totalErrors.endingMiss / errorSum) * 100),
      advice:
        '过去分词 -ed 在辅音前常失去爆破（如 overwhelmed by, that procrastination）。核对听写时请结合语法时态与主谓一致进行双重校验。',
      tag: '● 语法辨音',
    },
    {
      key: 'spelling',
      title: '核心词汇拼写偏差 (British Spelling & Vowels)',
      count: totalErrors.spellingError,
      pct: Math.round((totalErrors.spellingError / errorSum) * 100),
      advice:
        '注意英式拼写习惯（如 programme, unauthorised）以及非重读音节中 schwa /ə/ 对应的元音字母（如 procrastination, momentum）。',
      tag: '● 拼写巩固',
    },
    {
      key: 'missing',
      title: '高阶学术/新闻实词盲区 (Unfamiliar Lexicon)',
      count: totalErrors.missingWord,
      pct: Math.round((totalErrors.missingWord / errorSum) * 100),
      advice:
        '遇到如 stringent、undermine、stifle 等 C1 级政经词汇时，一键加入生词本并开启“生词发音听写自测”建立声音与词形的直接映射。',
      tag: '● 词汇拓展',
    },
  ];

  const maxDailySentences = Math.max(
    12,
    ...dailyLogs.map((d) => d.sentencesCompleted)
  );

  return (
    <div className="space-y-6">
      {/* Header & Daily Target Selector */}
      <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">
            实时记录每一次听写核对数据 · 自动分析英音弱读、连读、失去爆破与拼写薄弱项
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            学习进度统计与听写诊断报告
          </h1>
        </div>

        {/* Interactive Daily Target Control */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#EF4444]" />
            每日精听目标设定:
          </span>
          <div className="flex items-center gap-1 p-1 bg-[#090D16] rounded-lg border border-slate-800">
            {[5, 8, 12].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onChangeDailyGoal(goal)}
                className={`px-3 py-1 rounded-md text-xs font-mono tabular-nums font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dailyGoalSentences === goal
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {goal} 句/日
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>今日精听打卡进度</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {todayLog.sentencesCompleted}
            </span>
            <span className="text-sm font-mono tabular-nums text-slate-400">
              / {dailyGoalSentences} 句 ({goalProgressPct}%)
            </span>
          </div>
          <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EF4444] transition-all duration-300"
              style={{ width: `${goalProgressPct}%` }}
            />
          </div>
        </div>

        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>累计精听句数 / 时长</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {totalSentencesAllTime}
            </span>
            <span className="text-xs text-slate-400">句</span>
            <span className="text-slate-600">·</span>
            <span className="text-lg font-semibold font-mono tabular-nums text-slate-300">
              {totalMinutesAllTime} 分钟
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            已连续坚持打卡 <strong className="font-mono text-slate-200">{dailyLogs.length}</strong> 天
          </div>
        </div>

        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>近7日平均听写准确率</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {overallAvgAccuracy}%
            </span>
            <span className="text-xs font-medium text-emerald-400">
              ✓ 较上周提升 +6.4%
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            今日实时准确率:{' '}
            <strong className="font-mono text-slate-200">{todayLog.avgAccuracy}%</strong>
          </div>
        </div>

        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>BBC 核心生词掌握率</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {masteredVocabCount}
            </span>
            <span className="text-sm font-mono tabular-nums text-slate-400">
              / {vocabulary.length} 词已掌握
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            待重点复习:{' '}
            <strong className="font-mono text-amber-400">
              {vocabulary.length - masteredVocabCount} 词
            </strong>
          </div>
        </div>
      </div>

      {/* Middle Split: 7-Day Trend Chart & Phonetic/Spelling Error Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Columns: 7-Day Practice Bar Chart */}
        <section
          aria-label="近7日精听练习趋势"
          className="lg:col-span-7 bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  近 7 日精听句子量与准确率趋势
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  每次在工作台提交句子核对后，今日统计柱状图与准确率会实时更新
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">单位: 句 / 准确率%</span>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3 items-end h-52 pt-6 px-2 border-b border-slate-800">
              {dailyLogs.map((log, i) => {
                const heightPct = Math.max(
                  14,
                  Math.round((log.sentencesCompleted / maxDailySentences) * 100)
                );
                const isToday = i === dailyLogs.length - 1;
                return (
                  <div
                    key={log.date}
                    className="flex flex-col items-center justify-end h-full group"
                  >
                    <div className="text-[11px] font-mono tabular-nums text-slate-400 mb-1">
                      {log.avgAccuracy}%
                    </div>
                    <div
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                        isToday
                          ? 'bg-[#EF4444]'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${log.label}: 完成 ${log.sentencesCompleted} 句，平均准确率 ${log.avgAccuracy}%`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-3 pt-2.5 px-2 text-center">
              {dailyLogs.map((log, i) => {
                const isToday = i === dailyLogs.length - 1;
                return (
                  <div key={log.date}>
                    <div
                      className={`text-xs font-medium ${
                        isToday ? 'text-[#EF4444] font-bold' : 'text-slate-400'
                      }`}
                    >
                      {log.label}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {log.sentencesCompleted}句 · {log.minutesListened}m
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>● 柱高代表当日完成精听句数，顶部数字代表当日首次核对平均准确率</span>
            <span className="font-mono text-slate-300">
              目标线: 每日 {dailyGoalSentences} 句
            </span>
          </div>
        </section>

        {/* Right 5 Columns: Error Type Breakdown & Listening Diagnosis */}
        <section
          aria-label="听写薄弱点智能诊断"
          className="lg:col-span-5 bg-[#0F172A] rounded-xl border border-slate-800 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">
                听写失分类型与语音诊断
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                基于您的实时纠错对比记录，定位最需强化的英式发音现象
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {errorCategories.map((cat) => (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.title}</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {cat.count} 次 ({cat.pct}%) · {cat.tag}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full"
                      style={{ width: `${Math.max(8, cat.pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{cat.advice}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Completed Dictation Sentence Log Table */}
      <section
        aria-label="近期精听核对记录表"
        className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              最近提交的精听句子核对记录 ({completedHistory.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              包含每次听写的准确率、失误类型汇总，点击“回炉重练”可直接调出该句音频与A-B复读
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090D16] text-xs font-semibold text-slate-400">
                <th className="py-3 px-4">节目与句序</th>
                <th className="py-3 px-4">BBC 标准原文与您的听写</th>
                <th className="py-3 px-4 text-right">准确率</th>
                <th className="py-3 px-4">纠错诊断摘要</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {completedHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="font-semibold text-slate-200">{rec.episodeTitle}</div>
                    <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                      第 #{rec.sentenceIndex} 句 · {rec.completedAt}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <div className="font-medium text-slate-200 line-clamp-1">
                      原文: {rec.sentenceEn}
                    </div>
                    <div className="text-slate-400 line-clamp-1 mt-0.5 font-mono">
                      听写: {rec.userTyped}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        rec.accuracy >= 90
                          ? 'text-emerald-400'
                          : rec.accuracy >= 75
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {rec.accuracy >= 90 ? '✓ ' : '▲ '}
                      {rec.accuracy}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-300 whitespace-nowrap">
                    {rec.accuracy === 100 ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ 全句零失误通过
                      </span>
                    ) : (
                      <span>
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                        弱读漏听 {rec.errorBreakdown.weakFormMiss} · 词尾 {rec.errorBreakdown.endingMiss} · 拼写 {rec.errorBreakdown.spellingError}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onJumpToSentence(rec.episodeId, rec.sentenceIndex - 1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      <span>回炉重练</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
