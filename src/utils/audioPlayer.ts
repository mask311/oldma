// British RP SpeechSynthesis + WebAudio Studio Feedback helper
import { sliceSentenceAtTime } from './dictationEngine';

export function speakBritishText(
  text: string,
  rate = 1.0,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 600);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer British English voices (en-GB) such as Google UK English Male/Female, Daniel, Arthur, Martha
    const ukVoice =
      voices.find(
        (v) =>
          v.lang.includes('en-GB') &&
          (v.name.includes('UK') || v.name.includes('Daniel') || v.name.includes('British'))
      ) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (ukVoice) {
      utterance.voice = ukVoice;
    }
    utterance.lang = 'en-GB';
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) onEnd();
  }
}

export function speakSentenceFromTime(
  sentence: { english: string; startTime: number; endTime: number },
  currentTime: number,
  rate = 1.0,
  onEnd?: () => void
): void {
  const { remainingText } = sliceSentenceAtTime(
    sentence.english,
    sentence.startTime,
    sentence.endTime,
    currentTime
  );
  speakBritishText(remainingText || sentence.english, rate, onEnd);
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

