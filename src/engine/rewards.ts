/** Rewards, pet growth, mood and streaks. Pure functions – no UI, no storage. */

export interface DayLog {
  cards: number;
  correct: number;
  xp: number;
  goalReached: boolean;
}

export const DEFAULT_DAILY_GOAL = 20;
export const GOAL_BONUS_COINS = 10;
export const FREEZES_PER_WEEK = 2;

export function xpFor(correct: boolean, level: number, boss: boolean): number {
  if (!correct) return 2; // a little XP for trying
  return (10 + 2 * level) * (boss ? 2 : 1);
}

export function coinsFor(correct: boolean, boss: boolean): number {
  if (!correct) return 0;
  return boss ? 3 : 1;
}

// ---------------------------------------------------------------------------
// Pet growth
// ---------------------------------------------------------------------------
export interface PetStage {
  key: "egg" | "baby" | "barn" | "ungdom" | "voksen";
  name: string;
  minXp: number;
}

export const PET_STAGES: PetStage[] = [
  { key: "egg", name: "Egg", minXp: 0 },
  { key: "baby", name: "Baby", minXp: 40 },
  { key: "barn", name: "Barn", minXp: 400 },
  { key: "ungdom", name: "Ungdom", minXp: 1500 },
  { key: "voksen", name: "Voksen", minXp: 4000 },
];

export function petStage(xp: number): { index: number; stage: PetStage; next?: PetStage; progress: number } {
  let index = 0;
  for (let i = 0; i < PET_STAGES.length; i++) if (xp >= PET_STAGES[i].minXp) index = i;
  const stage = PET_STAGES[index];
  const next = PET_STAGES[index + 1];
  const progress = next ? (xp - stage.minXp) / (next.minXp - stage.minXp) : 1;
  return { index, stage, next, progress };
}

// ---------------------------------------------------------------------------
// Dates (local time, as "YYYY-MM-DD")
// ---------------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(date: Date | number = new Date()): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

/** Key of the Monday that starts the (ISO) week containing the given day. */
export function weekKey(key: string): string {
  const d = parseDayKey(key);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return dayKey(d);
}

// ---------------------------------------------------------------------------
// Streak with automatic freeze days
// ---------------------------------------------------------------------------
export interface StreakInfo {
  /** Number of days with the daily goal reached in the current streak. */
  streak: number;
  /** Missed days that were covered by a freeze. */
  frozen: string[];
  todayDone: boolean;
}

export function computeStreak(days: Record<string, DayLog>, today: string): StreakInfo {
  const keys = Object.keys(days).filter((k) => days[k].goalReached).sort();
  const todayDone = !!days[today]?.goalReached;
  if (keys.length === 0) return { streak: 0, frozen: [], todayDone };

  const earliest = keys[0];
  const freezesUsed = new Map<string, number>();
  const frozen: string[] = [];
  let pending: string[] = []; // freezes only count if an older goal day follows
  let streak = 0;
  // Today only counts once it is done; an unfinished today does not break the streak.
  let cursor = todayDone ? today : addDays(today, -1);

  while (cursor >= earliest) {
    if (days[cursor]?.goalReached) {
      streak++;
      frozen.push(...pending);
      pending = [];
    } else {
      const wk = weekKey(cursor);
      const used = freezesUsed.get(wk) ?? 0;
      if (used >= FREEZES_PER_WEEK) break;
      freezesUsed.set(wk, used + 1);
      pending.push(cursor);
    }
    cursor = addDays(cursor, -1);
  }
  return { streak, frozen, todayDone };
}

// ---------------------------------------------------------------------------
// Mood – the pet is never sad or sick, at most sleepy.
// ---------------------------------------------------------------------------
export type Mood = "glad" | "fornoyd" | "sulten" | "sovnig";

export const MOOD_TEXT: Record<Mood, string> = {
  glad: "er mett og kjempeglad! 🥰",
  fornoyd: "koser seg og vil gjerne ha flere godbiter 😋",
  sulten: "gleder seg til dagens godbiter 🍓",
  sovnig: "har tatt seg en lang lur … 💤 Vekk meg med litt matte!",
};

export function petMood(days: Record<string, DayLog>, today: string): Mood {
  const t = days[today];
  if (t?.goalReached) return "glad";
  if (t && t.cards > 0) return "fornoyd";
  const yesterday = days[addDays(today, -1)];
  const anyActivity = Object.values(days).some((d) => d.cards > 0);
  if (!anyActivity || (yesterday && yesterday.cards > 0)) return "sulten";
  return "sovnig";
}
