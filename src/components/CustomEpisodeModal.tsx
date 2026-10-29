import React, { useState } from 'react';
import { X, FileText, PlusCircle } from 'lucide-react';
import { BBCEpisode, DictationSentence } from '../data/bbcEpisodes';

interface CustomEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEpisode: (episode: BBCEpisode) => void;
}

export const CustomEpisodeModal: React.FC<CustomEpisodeModalProps> = ({
  isOpen,
  onClose,
  onCreateEpisode,
}) => {
  const [title, setTitle] = useState('');
  const [programme, setProgramme] = useState<BBCEpisode['programme']>('6 Minute English');
  const [level, setLevel] = useState<BBCEpisode['level']>('B2 Upper-Intermediate');
  const [rawTranscript, setRawTranscript] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawTranscript.trim()) {
      setError('请填写练习标题并粘贴至少一句英文听力文本');
      return;
    }

    const rawLines = rawTranscript
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);

    if (rawLines.length === 0) {
      setError('未能识别到有效英文句子，请输入完整的英文句子');
      return;
    }

    let currentSec = 0;
    const sentences: DictationSentence[] = rawLines.slice(0, 12).map((line, idx) => {
      const wordCount = line.split(/\s+/).length;
      const segDuration = Math.max(4.5, Number((wordCount * 0.55).toFixed(1)));
      const start = Number(currentSec.toFixed(1));
      const end = Number((currentSec + segDuration).toFixed(1));
      currentSec = end;

      return {
        id: `custom-s-${Date.now()}-${idx + 1}`,
        index: idx + 1,
        speaker: idx % 2 === 0 ? 'Presenter A' : 'Presenter B',
        startTime: start,
        endTime: end,
        english: line,
        chinese: '自定义导入精听语料（支持实时纠错与英音朗读）',
        phoneticNote:
          '注意句中弱读虚词（of, to, for, have, and）与前后实词的辅元连读，以及词尾塞音 /t/, /d/ 的失去爆破。',
        grammarNote: '长难句听写时建议先抓主干谓语动词，再通过 A-B 复读补全修饰成分。',
        keyWords: [],
      };
    });

    const newEpisode: BBCEpisode = {
      id: `ep-custom-${Date.now()}`,
      programme,
      title: title.trim(),
      chineseTitle: `自定义每日精听：${title.trim()}`,
      level,
      duration: Number(Math.max(10, currentSec).toFixed(1)),
      publishedDate: '2026-10-28',
      presenters: 'BBC UK Voice Synthesis',
      accent: 'Standard British RP',
      waveformPeaks: [
        0.42, 0.68, 0.81, 0.59, 0.47, 0.85, 0.91, 0.63, 0.45, 0.74,
        0.88, 0.66, 0.51, 0.79, 0.93, 0.72, 0.54, 0.82, 0.76, 0.49,
      ],
      sentences,
    };

    onCreateEpisode(newEpisode);
    setTitle('');
    setRawTranscript('');
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-episode-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
    >
      <div className="bg-[#0F172A] rounded-xl border border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#EF4444]" />
            <h2 id="custom-episode-modal-title" className="text-lg font-bold text-slate-100">
              导入自定义 BBC 精听语料
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭导入窗口"
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="custom-ep-title" className="block text-xs font-medium text-slate-300 mb-1">
              精听材料标题 *
            </label>
            <input
              id="custom-ep-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="例如：BBC Global News - Clean Energy Transition"
              className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-ep-prog" className="block text-xs font-medium text-slate-300 mb-1">
                所属栏目分类
              </label>
              <select
                id="custom-ep-prog"
                value={programme}
                onChange={(e) => setProgramme(e.target.value as BBCEpisode['programme'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm bg-[#090D16] text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="6 Minute English">6 Minute English</option>
                <option value="BBC News Review">BBC News Review</option>
                <option value="The English We Speak">The English We Speak</option>
                <option value="Science in Action">Science in Action</option>
              </select>
            </div>
            <div>
              <label htmlFor="custom-ep-level" className="block text-xs font-medium text-slate-300 mb-1">
                难度等级
              </label>
              <select
                id="custom-ep-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as BBCEpisode['level'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm bg-[#090D16] text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="B1 Intermediate">B1 Intermediate</option>
                <option value="B2 Upper-Intermediate">B2 Upper-Intermediate</option>
                <option value="C1 Advanced">C1 Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="custom-ep-text" className="block text-xs font-medium text-slate-300 mb-1">
              粘贴英文原文（自动按句号分句并生成时间轴与A-B复读点） *
            </label>
            <textarea
              id="custom-ep-text"
              rows={5}
              value={rawTranscript}
              onChange={(e) => {
                setRawTranscript(e.target.value);
                if (error) setError('');
              }}
              placeholder="粘贴一段或多句 BBC 英语新闻或播客原文..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>生成精听听写任务</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
