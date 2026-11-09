import { describe, expect, it } from "vitest";
import { availableFormats, buildQuestion, checkAnswer, cleanDistractors, withUnit } from "./build";
import { nextCard } from "./feed";
import { factsForGrade } from "./facts";
import { fmt, parseNumber, MINUS, NBSP } from "./format";
import { DAY_MS, MAX_LEVEL, MIN_LEVEL, newProgress, updateProgress } from "./mastery";
import { addDays, computeStreak, petMood, petStage, weekKey, type DayLog } from "./rewards";
import { mulberry32 } from "./rng";
import { GRADES, SKILLS, skillsForGrade, startLevel } from "./skills";
import type { Figure, Grade, Question, QuestionFormat } from "./types";

describe("format", () => {
  it("formats numbers the Norwegian way", () => {
    expect(fmt(3.5)).toBe("3,5");
    expect(fmt(-2)).toBe(`${MINUS}2`);
    expect(fmt(1234)).toBe("1234");
    expect(fmt(12000)).toBe(`12${NBSP}000`);
    expect(fmt(0.1 + 0.2)).toBe("0,3");
    expect(fmt(-0)).toBe("0");
  });

  it("parses user input", () => {
    expect(parseNumber("3,5")).toBe(3.5);
    expect(parseNumber("−2")).toBe(-2);
    expect(parseNumber("12 000")).toBe(12000);
    expect(parseNumber("0.25")).toBe(0.25);
    expect(parseNumber(",5")).toBe(0.5);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("1,2,3")).toBeNull();
  });
});

describe("generators", () => {
  const SEEDS = 250;
  for (const skill of SKILLS) {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      it(`${skill.key} level ${level} produces valid questions`, () => {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const rng = mulberry32(seed * 7919 + level);
          const core = skill.generate(level, rng);
          const ctx = `${skill.key} L${level} seed ${seed}: ${core.prompt}`;

          expect(core.prompt.trim(), ctx).not.toBe("");
          expect(core.answer.trim(), ctx).not.toBe("");
          expect(core.explanation.trim(), ctx).not.toBe("");
          expect(core.prompt, ctx).not.toMatch(/NaN|undefined|Infinity/);
          expect(core.explanation, ctx).not.toMatch(/NaN|undefined|Infinity/);
          expect(availableFormats(core).length, ctx).toBeGreaterThan(0);

          for (const d of cleanDistractors(core.answer, core.distractors)) {
            expect(d, ctx).not.toMatch(/NaN|undefined|Infinity/);
          }

          if (core.numeric) {
            const { value } = core.numeric;
            expect(Number.isFinite(value), ctx).toBe(true);
            // The displayed answer must match the numeric value (optionally followed by the unit).
            expect([fmt(value), withUnit(fmt(value), core.numeric.unit)], ctx).toContain(core.answer);
            if (value < 0) expect(core.numeric.allowNegative, ctx).toBe(true);
            if (!Number.isInteger(value)) expect(core.numeric.allowDecimal ?? true, ctx).toBe(true);
          }

          if (core.statement) {
            expect(core.statement(core.answer), ctx).toContain(core.answer);
          }

          if (core.figure) checkFigure(core.figure, ctx);

          // A "rektangel" or "rom" with equal sides is really a square – confusing for learners.
          if (core.figure?.type === "rect" && /rektangel|rom /i.test(core.prompt)) {
            expect(core.figure.w, ctx).not.toBe(core.figure.h);
          }

          // Every format must build and accept the correct answer.
          for (const format of availableFormats(core)) {
            const q = buildQuestion(core, { skill: skill.key, level, boss: false }, rng, format);
            expect(q.format).toBe(format);
            expect(checkAnswer(q, correctInput(q)), `${ctx} [${format}]`).toBe(true);
            if (q.format === "choice") {
              expect(q.choices.length, ctx).toBe(4);
              expect(new Set(q.choices).size, ctx).toBe(4);
              expect(q.choices, ctx).toContain(q.answer);
            }
          }
        }
      });
    }
  }
});

function checkFigure(f: Figure, ctx: string) {
  const positive = (n: number) => expect(Number.isFinite(n) && n > 0, `${ctx}: figure value ${n}`).toBe(true);
  const text = JSON.stringify(f);
  expect(text, ctx).not.toMatch(/NaN|undefined|null/);
  switch (f.type) {
    case "rect":
      positive(f.w);
      positive(f.h);
      break;
    case "right-triangle":
      positive(f.a);
      positive(f.b);
      break;
    case "graph":
      positive(f.range);
      expect(f.lines.length + (f.points?.length ?? 0), ctx).toBeGreaterThan(0);
      break;
    case "marbles": {
      const total = f.groups.reduce((s, g) => s + g.count, 0);
      expect(total, ctx).toBeGreaterThan(0);
      expect(total, ctx).toBeLessThanOrEqual(20);
      break;
    }
  }
}

function correctInput(q: Question): string {
  switch (q.format) {
    case "numeric":
      return fmt(q.value);
    case "choice":
      return q.answer;
    case "truefalse":
      return String(q.answer);
  }
}

describe("checkAnswer", () => {
  const core = {
    prompt: "Hva er 7 · 8?",
    answer: "56",
    numeric: { value: 56 },
    distractors: ["54", "63", "48"],
    statement: (s: string) => `7 · 8 = ${s}`,
    explanation: "",
  };
  const build = (f: QuestionFormat) => buildQuestion(core, { skill: "x", level: 1, boss: false }, mulberry32(1), f);

  it("accepts numeric input with spaces and rejects wrong answers", () => {
    const q = build("numeric");
    expect(checkAnswer(q, "56")).toBe(true);
    expect(checkAnswer(q, " 56 ")).toBe(true);
    expect(checkAnswer(q, "55")).toBe(false);
    expect(checkAnswer(q, "")).toBe(false);
  });

  it("handles true/false", () => {
    const q = build("truefalse");
    if (q.format !== "truefalse") throw new Error("expected truefalse");
    expect(checkAnswer(q, String(q.answer))).toBe(true);
    expect(checkAnswer(q, String(!q.answer))).toBe(false);
  });
});

describe("mastery", () => {
  it("raises the level on correct answers and lowers it on wrong ones", () => {
    let p = newProgress();
    for (let i = 0; i < 10; i++) p = updateProgress(p, { correct: true, responseMs: 3000 }, i);
    expect(p.level).toBeGreaterThan(3);
    const before = p.level;
    p = updateProgress(p, { correct: false, responseMs: 3000 }, 100);
    expect(p.level).toBeLessThan(before);
    expect(p.box).toBe(0);
    expect(p.recent.length).toBe(10);
  });

  it("schedules reviews further apart", () => {
    let p = newProgress();
    p = updateProgress(p, { correct: true, responseMs: 9000 }, 0);
    expect(p.dueAt).toBe(1 * DAY_MS);
    p = updateProgress(p, { correct: true, responseMs: 9000 }, p.dueAt);
    expect(p.box).toBe(2);
  });
});

describe("feed", () => {
  it("never repeats the same skill three times in a row and shows info cards", () => {
    const rng = mulberry32(42);
    const recent: string[] = [];
    let sinceInfo = 0;
    let infos = 0;
    for (let i = 0; i < 400; i++) {
      const { card } = nextCard({ grade: 5, progress: {}, recentSkills: recent, cardsSinceInfo: sinceInfo, now: 0 }, rng);
      if (card.kind === "info") {
        infos++;
        sinceInfo = 0;
        continue;
      }
      sinceInfo++;
      const [a, b] = recent.slice(-2);
      if (a && a === b) expect(card.skill).not.toBe(a);
      recent.push(card.skill);
    }
    expect(infos).toBeGreaterThan(10);
  });

  it("respects enabled skills", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const { card } = nextCard(
        { grade: 8, progress: {}, recentSkills: [], cardsSinceInfo: 0, now: 0, enabledSkills: ["prosent"] },
        rng,
      );
      if (card.kind === "question") expect(card.skill).toBe("prosent");
    }
  });
});

describe("grades", () => {
  it("every grade has skills with valid start levels and facts", () => {
    for (const grade of GRADES) {
      const skills = skillsForGrade(grade);
      expect(skills.length, `grade ${grade}`).toBeGreaterThanOrEqual(5);
      for (const s of skills) {
        const level = startLevel(s, grade);
        expect(level).toBeGreaterThanOrEqual(MIN_LEVEL);
        expect(level).toBeLessThanOrEqual(MAX_LEVEL);
      }
      expect(factsForGrade(grade).length, `grade ${grade}`).toBeGreaterThan(5);
    }
  });

  it("a skill never starts easier in a higher grade", () => {
    for (const s of SKILLS) {
      const levels = GRADES.filter((g) => s.grades[g] !== undefined).map((g) => s.grades[g]!);
      expect(levels, s.key).toEqual([...levels].sort((a, b) => a - b));
    }
  });

  it("new learners in higher grades get harder questions", () => {
    const avgLevel = (grade: Grade, skill: string) => {
      const rng = mulberry32(grade);
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const { card } = nextCard(
          { grade, progress: {}, recentSkills: [], cardsSinceInfo: 0, now: 0, enabledSkills: [skill] },
          rng,
        );
        if (card.kind === "question") {
          expect(card.skill).toBe(skill);
          sum += card.level;
          n++;
        }
      }
      return sum / n;
    };
    expect(avgLevel(10, "prosent")).toBeGreaterThan(avgLevel(6, "prosent") + 2);
    expect(avgLevel(7, "gangetabell")).toBeGreaterThan(avgLevel(5, "gangetabell") + 2);
  });

  it("only shows skills that belong to the grade", () => {
    const rng = mulberry32(3);
    const allowed = new Set(skillsForGrade(6).map((s) => s.key));
    for (let i = 0; i < 200; i++) {
      const { card } = nextCard({ grade: 6, progress: {}, recentSkills: [], cardsSinceInfo: 0, now: 0 }, rng);
      if (card.kind === "question") expect(allowed.has(card.skill), card.skill).toBe(true);
    }
  });
});

describe("rewards", () => {
  const goal = (cards = 20): DayLog => ({ cards, correct: cards, xp: 100, goalReached: true });

  it("computes pet stages", () => {
    expect(petStage(0).stage.key).toBe("egg");
    expect(petStage(40).stage.key).toBe("baby");
    expect(petStage(10_000).stage.key).toBe("voksen");
    expect(petStage(20).progress).toBeCloseTo(0.5);
  });

  it("weeks start on Monday", () => {
    expect(weekKey("2026-11-01")).toBe("2026-10-26"); // Sunday
    expect(weekKey("2026-11-02")).toBe("2026-11-02"); // Monday
  });

  it("counts a streak and covers missed days with freezes", () => {
    const today = "2026-11-05"; // Thursday
    const days: Record<string, DayLog> = {
      [addDays(today, -1)]: goal(),
      [addDays(today, -2)]: goal(),
      // -3 missed (freeze)
      [addDays(today, -4)]: goal(),
    };
    const s = computeStreak(days, today);
    expect(s.streak).toBe(3);
    expect(s.frozen).toEqual([addDays(today, -3)]);
    expect(s.todayDone).toBe(false);
  });

  it("breaks the streak when there are too many missed days in a week", () => {
    const today = "2026-11-06"; // Friday
    const days: Record<string, DayLog> = {
      [today]: goal(),
      [addDays(today, -4)]: goal(), // Monday; Tue–Thu missed = 3 > 2 freezes
    };
    expect(computeStreak(days, today).streak).toBe(1);
  });

  it("mood is never sad", () => {
    const today = "2026-11-05";
    expect(petMood({}, today)).toBe("sulten");
    expect(petMood({ [today]: goal() }, today)).toBe("glad");
    expect(petMood({ [today]: { cards: 3, correct: 2, xp: 30, goalReached: false } }, today)).toBe("fornoyd");
    expect(petMood({ [addDays(today, -5)]: goal() }, today)).toBe("sovnig");
  });
});
