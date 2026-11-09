/** Adaptive difficulty and spaced repetition per skill. */

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Leitner box → days until the skill is due for review. */
export const REVIEW_INTERVALS_DAYS = [0, 1, 2, 4, 7, 14];
/** A wrong answer makes the skill come back for review after this long. */
export const RETRY_AFTER_MS = 5 * 60 * 1000;
/** Answers faster than this count as "fast". */
export const FAST_MS = 7000;

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

/*
 * Level changes are tuned so the learner settles where they get roughly 78 % right:
 * +0.2 per correct answer and −0.7 per wrong answer balance at p = 0.7 / 0.9 ≈ 0.78.
 */
const CORRECT_STEP = 0.2;
const FAST_BONUS = 0.1;
const BOSS_BONUS = 0.1;
const WRONG_STEP = 0.7;

export interface SkillProgress {
  /** Mastery level 1–5 (fractional). */
  level: number;
  /** Leitner box 0–5. */
  box: number;
  /** Timestamp (ms) when the skill is due for review. */
  dueAt: number;
  correct: number;
  wrong: number;
  lastSeenAt: number;
  /** The last (up to) 10 results, newest last. */
  recent: boolean[];
}

export function newProgress(level = MIN_LEVEL): SkillProgress {
  return { level: clamp(level, MIN_LEVEL, MAX_LEVEL), box: 0, dueAt: 0, correct: 0, wrong: 0, lastSeenAt: 0, recent: [] };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function updateProgress(
  p: SkillProgress,
  result: { correct: boolean; responseMs: number; boss?: boolean },
  now: number,
): SkillProgress {
  const next: SkillProgress = { ...p, recent: [...p.recent, result.correct].slice(-10), lastSeenAt: now };
  if (result.correct) {
    next.correct++;
    next.level = clamp(
      p.level + CORRECT_STEP + (result.responseMs < FAST_MS ? FAST_BONUS : 0) + (result.boss ? BOSS_BONUS : 0),
      MIN_LEVEL,
      MAX_LEVEL,
    );
    if (p.dueAt <= now) {
      next.box = Math.min(p.box + 1, REVIEW_INTERVALS_DAYS.length - 1);
      next.dueAt = now + REVIEW_INTERVALS_DAYS[next.box] * DAY_MS;
    }
  } else {
    next.wrong++;
    next.level = clamp(p.level - WRONG_STEP, MIN_LEVEL, MAX_LEVEL);
    next.box = 0;
    next.dueAt = now + RETRY_AFTER_MS;
  }
  return next;
}

/** Picks the integer difficulty for the next question, with a little variation. */
export function questionLevel(p: SkillProgress, rng: () => number, bump = 0): number {
  const jitter = (rng() - 0.5) * 0.8;
  return clamp(Math.round(p.level + jitter + bump), MIN_LEVEL, MAX_LEVEL);
}

/** Share of correct answers among the recent ones (null if none yet). */
export function recentAccuracy(p: SkillProgress | undefined): number | null {
  if (!p || p.recent.length === 0) return null;
  return p.recent.filter(Boolean).length / p.recent.length;
}

export function isDue(p: SkillProgress | undefined, now: number): boolean {
  return !!p && p.lastSeenAt > 0 && p.dueAt <= now;
}

