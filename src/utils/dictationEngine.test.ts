import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDictation,
  clampLoopPoints,
  advancePlaybackTime,
  formatTimestamp,
  sliceSentenceAtTime,
  computeSentenceWordTimings,
  getActiveWordIndexAtTime,
} from './dictationEngine';

test('exact dictation match returns 100% accuracy and all correct tokens', () => {
  const result = evaluateDictation(
    'Hello and welcome to Six Minute English from BBC Learning English.',
    'hello and welcome to six minute english from bbc learning english'
  );
  assert.equal(result.accuracy, 100);
  assert.equal(result.isCompleteExact, true);
  assert.equal(result.matchedCount, 11);
  assert.equal(result.tokens.every((t) => t.status === 'correct'), true);
});

test('dictation alignment recovers after a skipped weak-form word and diagnoses weak_form_miss', () => {
  // User skipped "have" and "to" (weak forms) and missed "-ed" on "changed"
  const result = evaluateDictation(
    'Scientists have discovered a new way to recycle plastic.',
    'Scientists discovered a new way recycle plastic'
  );
  assert.equal(result.tokens[0].status, 'correct'); // Scientists
  assert.equal(result.tokens[1].status, 'weak_form_miss'); // have
  assert.equal(result.tokens[2].status, 'correct'); // discovered
  assert.equal(result.tokens[6].status, 'weak_form_miss'); // to
  assert.equal(result.tokens[7].status, 'correct'); // recycle
  assert.equal(result.errorBreakdown.weakFormMiss, 2);
});

test('dictation detects inflection ending miss (-ed / -s) vs general spelling error', () => {
  const result = evaluateDictation(
    'Researchers examined the phenomenon carefully.',
    'Researcher examine the phenomenom carefully'
  );
  assert.equal(result.tokens[0].status, 'ending_miss'); // Researchers vs Researcher
  assert.equal(result.tokens[1].status, 'ending_miss'); // examined vs examine
  assert.equal(result.tokens[3].status, 'spelling_error'); // phenomenon vs phenomenom
  assert.equal(result.tokens[4].status, 'correct'); // carefully
});

test('A-B loop point clamping enforces minimum gap and swaps inverted A/B points', () => {
  const swapped = clampLoopPoints(18.5, 6.2, 30.0, 0.5);
  assert.equal(swapped.pointA, 6.2);
  assert.equal(swapped.pointB, 18.5);

  const tooClose = clampLoopPoints(10.0, 10.2, 30.0, 0.8);
  assert.equal(tooClose.pointA, 10.0);
  assert.equal(tooClose.pointB, 10.8);
});

test('advancePlaybackTime loops back to pointA when A-B loop is enabled', () => {
  const step = advancePlaybackTime(14.8, 0.5, 45.0, {
    abLoopEnabled: true,
    pointA: 8.4,
    pointB: 15.0,
    sentenceLoopEnabled: false,
    sentenceStart: 0,
    sentenceEnd: 45,
  });
  assert.equal(step.didLoop, true);
  assert.equal(step.nextTime, 8.4);
  assert.equal(step.reachedEnd, false);
});

test('sliceSentenceAtTime slices remaining words accurately when paused mid-sentence', () => {
  const sentence =
    'Hello and welcome to Six Minute English, the programme where we discuss an interesting topic.';
  const atStart = sliceSentenceAtTime(sentence, 0, 10, 0);
  assert.equal(atStart.wordStartIndex, 0);
  assert.equal(atStart.remainingText, sentence);

  const atMid = sliceSentenceAtTime(sentence, 0, 10, 5.2);
  assert.ok(atMid.wordStartIndex > 2 && atMid.wordStartIndex < atMid.totalWords - 1);
  assert.equal(atMid.remainingText.startsWith('Hello'), false);
});

test('computeSentenceWordTimings and getActiveWordIndexAtTime synchronize karaoke words and detect liaison', () => {
  const timed = computeSentenceWordTimings(
    'We discuss an interesting topic today.',
    10.0,
    16.0,
    ['interesting']
  );
  assert.equal(timed.length, 6);
  assert.equal(timed[0].startTime, 10.0);
  assert.equal(timed[5].endTime, 16.0);
  // "discuss" -> "an" and "an" -> "interesting" both have consonant-to-vowel liaison
  assert.equal(timed[1].hasLiaisonNext, true);
  assert.equal(timed[2].hasLiaisonNext, true);
  assert.equal(timed[2].isWeakForm, true);
  assert.equal(timed[3].isKeyWord, true);

  const midState = getActiveWordIndexAtTime(timed, 13.0);
  assert.ok(midState.activeIndex >= 1 && midState.activeIndex <= 4);
  assert.equal(midState.sentenceProgress, 50);
});

test('formatTimestamp formats seconds into MM:SS.d tabular string', () => {
  assert.equal(formatTimestamp(5.34), '00:05.3');
  assert.equal(formatTimestamp(65.9), '01:05.9');
});


