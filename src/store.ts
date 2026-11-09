/** App state, persisted to localStorage. All game rules live in the engine; this file only wires them together. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nextCard, type CardPick } from "./engine/feed";
import { newProgress, updateProgress, type SkillProgress } from "./engine/mastery";
import { SKILLS_BY_KEY, startLevel } from "./engine/skills";
import {
  coinsFor,
  dayKey,
  DEFAULT_DAILY_GOAL,
  GOAL_BONUS_COINS,
  petStage,
  xpFor,
  type DayLog,
} from "./engine/rewards";
import type { Grade, InfoCard, Question } from "./engine/types";
import { ITEMS_BY_KEY, type ItemSlot } from "./shop";

export type PetColor = "lilla" | "gronn" | "bla" | "oransje" | "rosa";

export interface Profile {
  grade: Grade;
  petName: string;
  petColor: PetColor;
  createdAt: number;
}

export interface AnswerResult {
  xp: number;
  coins: number;
  /** True if this answer made the daily goal. */
  goalReached: boolean;
  /** Set if the pet grew to a new stage. */
  newStage?: string;
}

interface State {
  profile: Profile | null;
  xp: number;
  coins: number;
  progress: Record<string, SkillProgress>;
  days: Record<string, DayLog>;
  recentSkills: string[];
  cardsSinceInfo: number;
  seenFacts: string[];
  dailyGoal: number;
  /** Skills chosen by a parent/teacher. Empty = all skills for the grade. */
  enabledSkills: string[];
  owned: string[];
  equipped: Partial<Record<ItemSlot, string>>;
  sound: boolean;

  setup: (profile: Omit<Profile, "createdAt">) => void;
  draw: () => CardPick;
  answer: (q: Question, correct: boolean, responseMs: number) => AnswerResult;
  seeInfo: (card: InfoCard) => void;
  setGrade: (grade: Grade) => void;
  setPet: (patch: Partial<Pick<Profile, "petName" | "petColor">>) => void;
  setDailyGoal: (goal: number) => void;
  toggleSkill: (key: string, allKeys: string[]) => void;
  buy: (item: string) => boolean;
  equip: (item: string) => void;
  setSound: (on: boolean) => void;
  reset: () => void;
}

const initial = {
  profile: null,
  xp: 0,
  coins: 0,
  progress: {},
  days: {},
  recentSkills: [],
  cardsSinceInfo: 0,
  seenFacts: [],
  dailyGoal: DEFAULT_DAILY_GOAL,
  enabledSkills: [],
  owned: [],
  equipped: {},
  sound: true,
} satisfies Partial<State>;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      setup: (profile) => set({ profile: { ...profile, createdAt: Date.now() } }),

      draw: () => {
        const s = get();
        return nextCard({
          grade: s.profile?.grade ?? 5,
          progress: s.progress,
          recentSkills: s.recentSkills,
          cardsSinceInfo: s.cardsSinceInfo,
          seenFacts: s.seenFacts,
          enabledSkills: s.enabledSkills,
          now: Date.now(),
        });
      },

      answer: (q, correct, responseMs) => {
        const s = get();
        const now = Date.now();
        const today = dayKey(now);
        const xp = xpFor(correct, q.level, q.boss);
        let coins = coinsFor(correct, q.boss);

        const day: DayLog = { ...(s.days[today] ?? { cards: 0, correct: 0, xp: 0, goalReached: false }) };
        day.cards++;
        if (correct) day.correct++;
        day.xp += xp;
        let goalReached = false;
        if (!day.goalReached && day.cards >= s.dailyGoal) {
          day.goalReached = true;
          goalReached = true;
          coins += GOAL_BONUS_COINS;
        }

        const before = petStage(s.xp).stage;
        const after = petStage(s.xp + xp).stage;

        set({
          xp: s.xp + xp,
          coins: s.coins + coins,
          days: { ...s.days, [today]: day },
          progress: {
            ...s.progress,
            [q.skill]: updateProgress(
              s.progress[q.skill] ?? newProgress(startLevel(SKILLS_BY_KEY[q.skill], s.profile?.grade ?? 5)),
              { correct, responseMs, boss: q.boss },
              now,
            ),
          },
          recentSkills: [...s.recentSkills, q.skill].slice(-10),
          cardsSinceInfo: s.cardsSinceInfo + 1,
        });
        return { xp, coins, goalReached, newStage: after.key !== before.key ? after.name : undefined };
      },

      seeInfo: (card) =>
        set((s) => ({ cardsSinceInfo: 0, seenFacts: [...s.seenFacts.filter((t) => t !== card.title), card.title].slice(-50) })),

      setGrade: (grade) => set((s) => (s.profile ? { profile: { ...s.profile, grade }, enabledSkills: [] } : {})),

      setPet: (patch) => set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {})),

      setDailyGoal: (dailyGoal) => set({ dailyGoal }),

      toggleSkill: (key, allKeys) =>
        set((s) => {
          const current = s.enabledSkills.length ? s.enabledSkills : allKeys;
          const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
          if (next.length === 0) return {}; // at least one skill must stay on
          return { enabledSkills: next.length === allKeys.length ? [] : next };
        }),

      buy: (key) => {
        const item = ITEMS_BY_KEY[key];
        const s = get();
        if (!item || s.owned.includes(key) || s.coins < item.price) return false;
        set({ coins: s.coins - item.price, owned: [...s.owned, key], equipped: { ...s.equipped, [item.slot]: key } });
        return true;
      },

      equip: (key) => {
        const item = ITEMS_BY_KEY[key];
        if (!item) return;
        set((s) => ({
          equipped: { ...s.equipped, [item.slot]: s.equipped[item.slot] === key ? undefined : key },
        }));
      },

      setSound: (sound) => set({ sound }),

      reset: () => set({ ...initial }),
    }),
    {
      // Functions are dropped automatically when the state is serialised to JSON.
      name: "mattedyr",
      version: 1,
    },
  ),
);
