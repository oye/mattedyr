/** Chooses the next card in the feed. */
import { buildQuestion, newId } from "./build";
import { factsForGrade } from "./facts";
import { isDue, newProgress, questionLevel, type SkillProgress } from "./mastery";
import { chance, defaultRng, pick, weightedIndex, type Rng } from "./rng";
import { skillsForGrade, startLevel } from "./skills";
import type { Card, Grade, InfoCard, Skill } from "./types";

export interface FeedContext {
  grade: Grade;
  progress: Record<string, SkillProgress>;
  /** Skill keys of the most recent questions, newest last. */
  recentSkills: string[];
  /** Number of question cards since the last info card. */
  cardsSinceInfo: number;
  /** Titles of facts already shown, to avoid repeats. */
  seenFacts?: string[];
  now: number;
  /** Only use these skills (e.g. chosen by a parent). Defaults to all for the grade. */
  enabledSkills?: string[];
}

export const REVIEW_SHARE = 0.25;
export const BOSS_SHARE = 0.12;

export type CardPick = { card: Card; mode: "info" | "review" | "focus" | "boss" };

export function nextCard(ctx: FeedContext, rng: Rng = defaultRng): CardPick {
  const facts = factsForGrade(ctx.grade);
  if (facts.length && (ctx.cardsSinceInfo >= 12 || (ctx.cardsSinceInfo >= 7 && chance(rng, 0.3)))) {
    const unseen = facts.filter((f) => !ctx.seenFacts?.includes(f.title));
    const fact = pick(rng, unseen.length ? unseen : facts);
    const card: InfoCard = { kind: "info", id: newId("info"), emoji: fact.emoji, title: fact.title, body: fact.body };
    return { card, mode: "info" };
  }

  let skills = skillsForGrade(ctx.grade);
  if (ctx.enabledSkills?.length) {
    const enabled = skills.filter((s) => ctx.enabledSkills!.includes(s.key));
    if (enabled.length) skills = enabled;
  }
  // Avoid the same skill three times in a row.
  const [prev1, prev2] = ctx.recentSkills.slice(-2).reverse();
  if (prev1 && prev1 === prev2 && skills.length > 1) skills = skills.filter((s) => s.key !== prev1);

  const progressOf = (s: Skill) => ctx.progress[s.key] ?? newProgress(startLevel(s, ctx.grade));
  const r = rng();
  let skill: Skill;
  let mode: CardPick["mode"];

  const due = skills
    .filter((s) => isDue(ctx.progress[s.key], ctx.now))
    .sort((a, b) => progressOf(a).dueAt - progressOf(b).dueAt);

  if (r < REVIEW_SHARE && due.length) {
    skill = due[0];
    mode = "review";
  } else if (r > 1 - BOSS_SHARE) {
    skill = pick(rng, skills);
    mode = "boss";
  } else {
    // Focus: favour skills with low mastery (relative to where the grade starts) and skills not tried yet.
    const weights = skills.map((s) => {
      const p = ctx.progress[s.key];
      const unseenBonus = !p || p.lastSeenAt === 0 ? 1.5 : 0;
      const recentPenalty = s.key === prev1 ? 0.5 : 1;
      const gain = progressOf(s).level - startLevel(s, ctx.grade);
      return (Math.max(1, 5 - gain) + unseenBonus) * recentPenalty;
    });
    skill = skills[weightedIndex(rng, weights)];
    mode = "focus";
  }

  const boss = mode === "boss";
  const level = questionLevel(progressOf(skill), rng, boss ? 1 : 0);
  const core = skill.generate(level, rng);
  return { card: buildQuestion(core, { skill: skill.key, level, boss }, rng), mode };
}

