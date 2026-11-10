import { useMemo } from "react";
import { computeStreak, dayKey, petMood, petStage } from "./engine/rewards";
import { ITEMS } from "./shop";
import { useStore } from "./store";

/** Derived, read-only view of today's status: streak, mood, pet stage and daily goal. */
export function useStatus() {
  const days = useStore((s) => s.days);
  const xp = useStore((s) => s.xp);
  const coins = useStore((s) => s.coins);
  const owned = useStore((s) => s.owned);
  const seenShopItems = useStore((s) => s.seenShopItems);
  const dailyGoal = useStore((s) => s.dailyGoal);
  const today = dayKey();
  return useMemo(() => {
    const log = days[today] ?? { cards: 0, correct: 0, xp: 0, goalReached: false };
    const pet = petStage(xp);
    const seen = seenShopItems ?? [];
    const hasNewShopItem =
      pet.stage.key !== "egg" &&
      ITEMS.some((i) => !owned.includes(i.key) && coins >= i.price && !seen.includes(i.key));
    return {
      today,
      log,
      dailyGoal,
      goalProgress: Math.min(1, log.cards / dailyGoal),
      streak: computeStreak(days, today),
      mood: petMood(days, today),
      pet,
      hasNewShopItem,
    };
  }, [days, xp, coins, owned, seenShopItems, dailyGoal, today]);
}

