export type WordMatchStatus =
  | 'correct'
  | 'typing'
  | 'ending_miss'
  | 'spelling_error'
  | 'weak_form_miss'
  | 'missing';

export interface WordDiffToken {
  index: number;
  targetRaw: string;
  targetClean: string;
  typedRaw: string;
  typedClean: string;
  status: WordMatchStatus;
  diagnosis?: string;
  isKeyTerm?: boolean;
  clozeBlank?: boolean;
}

export interface ErrorBreakdown {
  weakFormMiss: number;
  endingMiss: number;
  spellingError: number;
  missingWord: number;
}

export interface DictationEvaluation {
  tokens: WordDiffToken[];
  accuracy: number;
  matchedCount: number;
  totalWords: number;
  isCompleteExact: boolean;
  extraWords: string[];
  errorBreakdown: ErrorBreakdown;
}

const WEAK_FORM_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'for', 'from', 'at', 'in', 'on', 'with',
  'and', 'or', 'but', 'as', 'than', 'that', 'have', 'has', 'had', 'been',
  'be', 'are', 'was', 'were', 'can', 'could', 'would', 'should', 'will',
  'do', 'does', 'did', 'you', 'your', 'his', 'her', 'their', 'our', 'us', 'them'
]);

export function cleanWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, '')
    .replace(/’/g, "'");
}

export function tokenizeSentence(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function isInflectionEndingMiss(target: string, typed: string): boolean {
  if (!typed || !target || target === typed) return false;
  const suffixes = ['ed', 'd', 's', 'es', 'ing', 'ly', 'er', 'est'];
  for (const suffix of suffixes) {
    if (target === typed + suffix && typed.length >= 2) {
      return true;
    }
    if (typed === target + suffix && target.length >= 2) {
      return true;
    }
  }
  // e.g. studies vs study
  if (target.endsWith('ied') && typed.endsWith('y') && target.slice(0, -3) === typed.slice(0, -1)) {
    return true;
  }
  if (target.endsWith('ies') && typed.endsWith('y') && target.slice(0, -3) === typed.slice(0, -1)) {
    return true;
  }
  return false;
}

export function evaluateDictation(
  targetSentence: string,
  userTyped: string,
  options?: { isLiveTyping?: boolean; keyTerms?: string[] }
): DictationEvaluation {
  const targetRawWords = tokenizeSentence(targetSentence);
  const typedRawWords = tokenizeSentence(userTyped);
  const isLiveTyping = options?.isLiveTyping ?? false;
  const keyTermSet = new Set((options?.keyTerms ?? []).map((t) => cleanWord(t)));

  const totalWords = targetRawWords.length;
  if (totalWords === 0) {
    return {
      tokens: [],
      accuracy: 100,
      matchedCount: 0,
      totalWords: 0,
      isCompleteExact: true,
      extraWords: [],
      errorBreakdown: { weakFormMiss: 0, endingMiss: 0, spellingError: 0, missingWord: 0 },
    };
  }

  // Align typed words to target words using dynamic window matching so a single skipped weak-form word
  // doesn't shift the entire rest of the sentence out of alignment.
  const usedTypedIndices = new Set<number>();
  const alignedTypedIndexForTarget: (number | null)[] = new Array(totalWords).fill(null);

  let searchStart = 0;
  for (let tIdx = 0; tIdx < totalWords; tIdx++) {
    const tClean = cleanWord(targetRawWords[tIdx]);
    if (!tClean) continue;

    // Look ahead up to 3 positions in typed words for an exact or close match
    let bestJ: number | null = null;
    let bestScore = Infinity;

    const maxLookahead = Math.min(typedRawWords.length, searchStart + 4);
    for (let j = searchStart; j < maxLookahead; j++) {
      if (usedTypedIndices.has(j)) continue;
      const uClean = cleanWord(typedRawWords[j]);
      if (!uClean) continue;

      if (uClean === tClean) {
        bestJ = j;
        bestScore = 0;
        break;
      }

      const dist = levenshteinDistance(tClean, uClean);
      const threshold = Math.max(1, Math.floor(tClean.length * 0.4));
      const isPrefixWhileTyping =
        isLiveTyping &&
        j === typedRawWords.length - 1 &&
        tClean.startsWith(uClean) &&
        uClean.length >= 1;

      if (isPrefixWhileTyping && dist < bestScore) {
        bestJ = j;
        bestScore = 0.5;
      } else if (dist <= threshold && dist < bestScore) {
        // Also check that uClean isn't an exact match for the very next target word
        const nextTargetClean =
          tIdx + 1 < totalWords ? cleanWord(targetRawWords[tIdx + 1]) : '';
        if (uClean === nextTargetClean && dist > 0) {
          continue;
        }
        bestJ = j;
        bestScore = dist + (j - searchStart) * 0.25;
      }
    }

    if (bestJ !== null) {
      alignedTypedIndexForTarget[tIdx] = bestJ;
      usedTypedIndices.add(bestJ);
      searchStart = bestJ + 1;
    }
  }

  // Second pass: assign remaining unused typed words positionally to adjacent unmatched targets
  for (let tIdx = 0; tIdx < totalWords; tIdx++) {
    if (alignedTypedIndexForTarget[tIdx] !== null) continue;
    // Find nearest unused typed word at same relative slot if available
    if (tIdx < typedRawWords.length && !usedTypedIndices.has(tIdx)) {
      const uClean = cleanWord(typedRawWords[tIdx]);
      // Make sure this typed word wasn't just skipped because of alignment
      alignedTypedIndexForTarget[tIdx] = tIdx;
      usedTypedIndices.add(tIdx);
    }
  }

  const tokens: WordDiffToken[] = [];
  let matchedCount = 0;
  const errorBreakdown: ErrorBreakdown = {
    weakFormMiss: 0,
    endingMiss: 0,
    spellingError: 0,
    missingWord: 0,
  };

  for (let tIdx = 0; tIdx < totalWords; tIdx++) {
    const tRaw = targetRawWords[tIdx];
    const tClean = cleanWord(tRaw);
    const alignedJ = alignedTypedIndexForTarget[tIdx];
    const uRaw = alignedJ !== null ? typedRawWords[alignedJ] : '';
    const uClean = alignedJ !== null ? cleanWord(uRaw) : '';
    const isLastTypedToken = alignedJ === typedRawWords.length - 1 && !userTyped.endsWith(' ');

    let status: WordMatchStatus = 'missing';
    let diagnosis: string | undefined;

    if (uClean && uClean === tClean) {
      status = 'correct';
      matchedCount++;
    } else if (
      isLiveTyping &&
      isLastTypedToken &&
      uClean.length > 0 &&
      tClean.startsWith(uClean)
    ) {
      status = 'typing';
      diagnosis = '正在输入...';
    } else if (uClean.length > 0) {
      if (isInflectionEndingMiss(tClean, uClean)) {
        status = 'ending_miss';
        diagnosis = `词尾变化偏差：应为 "${tRaw.replace(/[.,!?;:"]/g, '')}"（注意英式发音词尾轻读/失去爆破）`;
        errorBreakdown.endingMiss++;
      } else {
        status = 'spelling_error';
        diagnosis = `拼写偏差：您输入了 "${uRaw}"，正确拼写为 "${tRaw.replace(/[.,!?;:"]/g, '')}"`;
        errorBreakdown.spellingError++;
      }
    } else {
      if (WEAK_FORM_WORDS.has(tClean)) {
        status = 'weak_form_miss';
        diagnosis = `虚词弱读漏听："${tClean}" 在语流中弱化，常与前后词连读`;
        errorBreakdown.weakFormMiss++;
      } else {
        status = 'missing';
        diagnosis = `未听写出实词 "${tRaw.replace(/[.,!?;:"]/g, '')}"`;
        errorBreakdown.missingWord++;
      }
    }

    const isKey = keyTermSet.has(tClean) || tClean.length >= 7;

    tokens.push({
      index: tIdx,
      targetRaw: tRaw,
      targetClean: tClean,
      typedRaw: uRaw,
      typedClean: uClean,
      status,
      diagnosis,
      isKeyTerm: isKey,
      clozeBlank: isKey || tIdx % 3 === 1,
    });
  }

  const extraWords: string[] = [];
  for (let j = 0; j < typedRawWords.length; j++) {
    if (!usedTypedIndices.has(j)) {
      extraWords.push(typedRawWords[j]);
    }
  }

  const rawAccuracy = Math.round((matchedCount / totalWords) * 100);
  const penalty = Math.min(20, extraWords.length * 5);
  const accuracy = matchedCount === 0 ? 0 : Math.max(0, rawAccuracy - penalty);
  const isCompleteExact = matchedCount === totalWords && extraWords.length === 0;

  return {
    tokens,
    accuracy,
    matchedCount,
    totalWords,
    isCompleteExact,
    extraWords,
    errorBreakdown,
  };
}

export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe - Math.floor(safe)) * 10);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

export function clampLoopPoints(
  pointA: number | null,
  pointB: number | null,
  duration: number,
  minGap = 0.5
): { pointA: number | null; pointB: number | null } {
  const maxDur = Math.max(1, duration);
  const cleanA =
    pointA !== null ? Math.max(0, Math.min(maxDur - minGap, Number(pointA.toFixed(1)))) : null;
  let cleanB =
    pointB !== null ? Math.max(minGap, Math.min(maxDur, Number(pointB.toFixed(1)))) : null;

  if (cleanA !== null && cleanB !== null) {
    if (cleanB < cleanA) {
      // Swap if user set B earlier than A
      const swappedA = Math.max(0, Math.min(maxDur - minGap, cleanB));
      const swappedB = Math.max(swappedA + minGap, Math.min(maxDur, cleanA));
      return {
        pointA: Number(swappedA.toFixed(1)),
        pointB: Number(swappedB.toFixed(1)),
      };
    }
    if (cleanB - cleanA < minGap) {
      cleanB = Math.min(maxDur, Number((cleanA + minGap).toFixed(1)));
    }
  }

  return { pointA: cleanA, pointB: cleanB };
}

export interface LoopPlaybackConfig {
  abLoopEnabled: boolean;
  pointA: number | null;
  pointB: number | null;
  sentenceLoopEnabled: boolean;
  sentenceStart: number;
  sentenceEnd: number;
}

/**
 * Given a sentence's transcript and [startTime, endTime], calculates which word
 * corresponds to `targetTime` and returns the remaining text from that timepoint onward.
 * This allows pausing and resuming (or A-B looping from a mid-sentence Point A)
 * to speak from the current timestamp rather than restarting the whole sentence.
 */
export function sliceSentenceAtTime(
  english: string,
  startTime: number,
  endTime: number,
  targetTime: number
): { remainingText: string; wordStartIndex: number; totalWords: number } {
  const words = english
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return { remainingText: '', wordStartIndex: 0, totalWords: 0 };
  }

  const span = Math.max(0.1, endTime - startTime);
  const rel = Math.max(0, Math.min(span, targetTime - startTime));

  // If within 0.15s of sentence start, read from the first word
  if (rel <= 0.15) {
    return {
      remainingText: words.join(' '),
      wordStartIndex: 0,
      totalWords: words.length,
    };
  }

  const ratio = rel / span;

  // Weight each word by syllable/character length + punctuation pause
  const weights = words.map((w) => {
    const cleanedLen = Math.max(2, cleanWord(w).length);
    const punctBonus = /[,.;:?!—-]/.test(w) ? 3 : 0;
    return cleanedLen + punctBonus;
  });
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  let cumulative = 0;
  let wordStartIndex = 0;
  for (let i = 0; i < words.length; i++) {
    const wordStartRatio = cumulative / totalWeight;
    const wordEndRatio = (cumulative + weights[i]) / totalWeight;
    if (ratio >= wordStartRatio && ratio < wordEndRatio) {
      wordStartIndex = i;
      break;
    }
    cumulative += weights[i];
    if (i === words.length - 1) {
      wordStartIndex = words.length - 1;
    }
  }

  return {
    remainingText: words.slice(wordStartIndex).join(' '),
    wordStartIndex,
    totalWords: words.length,
  };
}

export function advancePlaybackTime(
  currentTime: number,
  deltaSeconds: number,
  duration: number,
  config: LoopPlaybackConfig
): { nextTime: number; didLoop: boolean; reachedEnd: boolean } {
  const nextRaw = currentTime + deltaSeconds;

  if (
    config.abLoopEnabled &&
    config.pointA !== null &&
    config.pointB !== null &&
    config.pointB > config.pointA
  ) {
    if (nextRaw >= config.pointB) {
      return {
        nextTime: Number(config.pointA.toFixed(2)),
        didLoop: true,
        reachedEnd: false,
      };
    }
  }

  if (config.sentenceLoopEnabled && config.sentenceEnd > config.sentenceStart) {
    if (nextRaw >= config.sentenceEnd) {
      return {
        nextTime: Number(config.sentenceStart.toFixed(2)),
        didLoop: true,
        reachedEnd: false,
      };
    }
  }

  if (
    !config.abLoopEnabled &&
    !config.sentenceLoopEnabled &&
    config.sentenceEnd > config.sentenceStart &&
    nextRaw >= config.sentenceEnd
  ) {
    return {
      nextTime: Number(config.sentenceEnd.toFixed(2)),
      didLoop: false,
      reachedEnd: true,
    };
  }

  if (nextRaw >= duration) {
    return {
      nextTime: duration,
      didLoop: false,
      reachedEnd: true,
    };
  }

  return {
    nextTime: Number(Math.max(0, nextRaw).toFixed(2)),
    didLoop: false,
    reachedEnd: false,
  };
}

export interface TimedSubtitleWord {
  index: number;
  raw: string;
  clean: string;
  startTime: number;
  endTime: number;
  isWeakForm: boolean;
  isKeyWord: boolean;
  hasLiaisonNext: boolean;
}

/**
 * Computes precise per-word time intervals [startTime, endTime] and phonetic
 * linking (consonant-to-vowel liaison + weak-form tags) for real-time subtitle shadowing.
 */
export function computeSentenceWordTimings(
  english: string,
  startTime: number,
  endTime: number,
  keyWords: string[] = []
): TimedSubtitleWord[] {
  const words = english
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [];

  const span = Math.max(0.2, endTime - startTime);
  const keySet = new Set(keyWords.map((w) => cleanWord(w)).filter(Boolean));

  const weights = words.map((w) => {
    const cleanedLen = Math.max(2, cleanWord(w).length);
    const punctBonus = /[,.;:?!—-]/.test(w) ? 3 : 0;
    return cleanedLen + punctBonus;
  });
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  let cumulative = 0;
  return words.map((raw, i) => {
    const clean = cleanWord(raw);
    const wStart = startTime + (cumulative / totalWeight) * span;
    cumulative += weights[i];
    const wEnd =
      i === words.length - 1
        ? endTime
        : startTime + (cumulative / totalWeight) * span;

    // Check consonant-to-vowel liaison with the next word (if no clause punctuation on raw)
    let hasLiaisonNext = false;
    if (i < words.length - 1 && !/[,.;:?!—"-]$/.test(raw)) {
      const nextClean = cleanWord(words[i + 1]);
      if (
        clean.length > 0 &&
        nextClean.length > 0 &&
        /[bcdfghjklmnpqrstvwxz]$/.test(clean) &&
        /^[aeiou]/.test(nextClean)
      ) {
        hasLiaisonNext = true;
      }
    }

    return {
      index: i,
      raw,
      clean,
      startTime: Number(wStart.toFixed(2)),
      endTime: Number(wEnd.toFixed(2)),
      isWeakForm: WEAK_FORM_WORDS.has(clean),
      isKeyWord: keySet.has(clean),
      hasLiaisonNext,
    };
  });
}

export function getActiveWordIndexAtTime(
  timedWords: TimedSubtitleWord[],
  currentTime: number
): {
  activeIndex: number;
  progressWithinWord: number;
  sentenceProgress: number;
} {
  if (timedWords.length === 0) {
    return { activeIndex: -1, progressWithinWord: 0, sentenceProgress: 0 };
  }

  const sStart = timedWords[0].startTime;
  const sEnd = timedWords[timedWords.length - 1].endTime;
  const totalSpan = Math.max(0.1, sEnd - sStart);
  const sentenceProgress = Math.max(
    0,
    Math.min(100, Math.round(((currentTime - sStart) / totalSpan) * 100))
  );

  if (currentTime < sStart) {
    return { activeIndex: -1, progressWithinWord: 0, sentenceProgress: 0 };
  }

  for (let i = 0; i < timedWords.length; i++) {
    const w = timedWords[i];
    if (currentTime >= w.startTime && currentTime < w.endTime) {
      const wSpan = Math.max(0.05, w.endTime - w.startTime);
      const progressWithinWord = Math.max(
        0,
        Math.min(1, (currentTime - w.startTime) / wSpan)
      );
      return { activeIndex: i, progressWithinWord, sentenceProgress };
    }
  }

  return {
    activeIndex: timedWords.length - 1,
    progressWithinWord: 1,
    sentenceProgress: 100,
  };
}


