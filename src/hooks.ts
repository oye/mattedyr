import { useMemo } from "react";
import { computeStreak, dayKey, petMood, petStage } from "./engine/rewards";
import { useStore } from "./store";

/** Derived, read-only view of today's status: streak, mood, pet stage and daily goal. */
export function useStatus() {
  const days = useStore((s) => s.days);
  const xp = useStore((s) => s.xp);
  const dailyGoal = useStore((s) => s.dailyGoal);
  const today = dayKey();
  return useMemo(() => {
    const log = days[today] ?? { cards: 0, correct: 0, xp: 0, goalReached: false };
    return {
      today,
      log,
      dailyGoal,
      goalProgress: Math.min(1, log.cards / dailyGoal),
      streak: computeStreak(days, today),
      mood: petMood(days, today),
      pet: petStage(xp),
    };
  }, [days, xp, dailyGoal, today]);
}

