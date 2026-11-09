import { fmt, NBSP, parseNumber } from "./format";
import { chance, pick, shuffle, weightedIndex, type Rng } from "./rng";
import type { Core, Question, QuestionFormat } from "./types";

let nextId = 1;
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
}

/** Removes duplicates, empty strings and anything equal to the answer. */
export function cleanDistractors(answer: string, distractors: string[]): string[] {
  const seen = new Set<string>([answer.trim()]);
  const out: string[] = [];
  for (const d of distractors) {
    const t = d.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Builds numeric distractors: keeps the given candidates (if valid) and pads with
 * nearby values so that there are always at least `min` unique wrong answers.
 */
export function numDistractors(
  answer: number,
  candidates: number[],
  opts: { allowNegative?: boolean; integer?: boolean; step?: number; min?: number } = {},
): string[] {
  const { allowNegative = false, step = 1, min = 3 } = opts;
  const integer = opts.integer ?? Number.isInteger(answer);
  const ok = (n: number) =>
    Number.isFinite(n) &&
    (allowNegative || n >= 0) &&
    (!integer || Number.isInteger(Math.round(n * 1e6) / 1e6)) &&
    fmt(n) !== fmt(answer);
  const out = cleanDistractors(fmt(answer), candidates.filter(ok).map((n) => fmt(n)));
  const padding = [1, -1, 2, -2, 10, -10, 3, -3, 5, -5].map((k) => answer + k * step);
  for (const p of padding) {
    if (out.length >= min) break;
    if (ok(p) && !out.includes(fmt(p))) out.push(fmt(p));
  }
  return out;
}

export interface BuildMeta {
  skill: string;
  level: number;
  boss: boolean;
}

/** Appends the unit to an answer text unless it is already there (e.g. "25 %"). */
export function withUnit(answer: string, unit?: string): string {
  if (!unit || answer.endsWith(unit)) return answer;
  return `${answer}${NBSP}${unit}`;
}

const FORMAT_WEIGHTS: Record<QuestionFormat, number> = { numeric: 0.45, choice: 0.35, truefalse: 0.2 };

export function availableFormats(core: Core): QuestionFormat[] {
  const distractors = cleanDistractors(core.answer, core.distractors);
  const formats: QuestionFormat[] = [];
  if (core.numeric) formats.push("numeric");
  if (distractors.length >= 3) formats.push("choice");
  if (core.statement && distractors.length >= 1) formats.push("truefalse");
  return core.formats ? formats.filter((f) => core.formats!.includes(f)) : formats;
}

/** Turns a generator result into a concrete card. */
export function buildQuestion(core: Core, meta: BuildMeta, rng: Rng, forceFormat?: QuestionFormat): Question {
  const formats = availableFormats(core);
  if (formats.length === 0) {
    throw new Error(`Skill ${meta.skill} level ${meta.level} produced a question with no usable format`);
  }
  const format =
    forceFormat && formats.includes(forceFormat)
      ? forceFormat
      : formats[weightedIndex(rng, formats.map((f) => FORMAT_WEIGHTS[f]))];
  const distractors = cleanDistractors(core.answer, core.distractors);
  const base = {
    kind: "question" as const,
    id: newId("q"),
    skill: meta.skill,
    level: meta.level,
    boss: meta.boss,
    prompt: core.prompt,
    explanation: core.explanation,
    correctText: withUnit(core.answer, core.numeric?.unit),
    figure: core.figure,
  };

  switch (format) {
    case "numeric":
      return {
        ...base,
        format,
        value: core.numeric!.value,
        allowDecimal: core.numeric!.allowDecimal ?? !Number.isInteger(core.numeric!.value),
        allowNegative: core.numeric!.allowNegative ?? core.numeric!.value < 0,
        unit: core.numeric!.unit,
      };
    case "choice":
      return {
        ...base,
        format,
        answer: core.answer,
        choices: shuffle(rng, [core.answer, ...shuffle(rng, distractors).slice(0, 3)]),
      };
    case "truefalse": {
      const truthful = chance(rng, 0.5);
      const shown = truthful ? core.answer : pick(rng, distractors.slice(0, 3));
      return { ...base, format, prompt: "Stemmer dette?", statement: core.statement!(shown), answer: truthful };
    }
  }
}

/** Checks an answer. Numeric: typed text. Choice: the chosen text. True/false: "true" | "false". */
export function checkAnswer(q: Question, input: string): boolean {
  switch (q.format) {
    case "numeric": {
      const n = parseNumber(input);
      return n !== null && Math.abs(n - q.value) < 1e-9;
    }
    case "choice":
      return input === q.answer;
    case "truefalse":
      return input === String(q.answer);
  }
}

