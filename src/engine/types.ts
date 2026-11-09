/** Core types for the task engine. */

export type Grade = 5 | 6 | 7 | 8 | 9 | 10;

/** Text labels for the sides of a rectangle. Use "?" for the unknown side. */
export interface SideLabels {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export type MarbleColor = "rod" | "bla" | "gronn" | "gul";

/**
 * A simple drawing shown with a question. Pure data – the UI decides how to draw it.
 * Figures are illustrations, not drawn to scale.
 */
export type Figure =
  | {
      type: "rect";
      /** Horizontal and vertical side lengths (used for proportions and the optional unit grid). */
      w: number;
      h: number;
      labels?: SideLabels;
      /** Text in the middle, e.g. "O = 36 cm". */
      center?: string;
      /** Shade the inside (for area questions). */
      shade?: boolean;
      /** Draw tick marks showing that all sides are equal (squares). */
      equalSides?: boolean;
    }
  | {
      type: "right-triangle";
      /** Horizontal leg, vertical leg (right angle at bottom left). */
      a: number;
      b: number;
      labels: { a?: string; b?: string; c?: string };
    }
  | {
      type: "graph";
      /** Straight lines y = a·x + b. */
      lines: { a: number; b: number }[];
      points?: [number, number][];
      /** The axes go from −range to range. */
      range: number;
    }
  | { type: "marbles"; groups: { color: MarbleColor; count: number }[] };

export interface QuestionBase {
  kind: "question";
  id: string;
  skill: string;
  level: number;
  /** Boss cards are a bit harder and give double rewards. */
  boss: boolean;
  prompt: string;
  explanation: string;
  /** The correct answer as display text (used in feedback). */
  correctText: string;
  figure?: Figure;
}

export interface NumericQuestion extends QuestionBase {
  format: "numeric";
  value: number;
  allowDecimal: boolean;
  allowNegative: boolean;
  unit?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  format: "choice";
  choices: string[];
  answer: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  format: "truefalse";
  statement: string;
  answer: boolean;
}

export type Question = NumericQuestion | ChoiceQuestion | TrueFalseQuestion;
export type QuestionFormat = Question["format"];

export interface InfoCard {
  kind: "info";
  id: string;
  emoji: string;
  title: string;
  body: string;
}

export type Card = Question | InfoCard;

/**
 * What a generator returns. The builder turns it into a concrete card format
 * (numeric input, multiple choice or true/false swipe).
 */
export interface Core {
  prompt: string;
  /** Correct answer as display text, e.g. "56", "3,5", "3/4", "5x". */
  answer: string;
  /** If present, the question can be answered with the number pad. */
  numeric?: { value: number; allowDecimal?: boolean; allowNegative?: boolean; unit?: string };
  /** Plausible wrong answers (display text). Duplicates and the answer itself are filtered out. */
  distractors: string[];
  /** If present, enables true/false: turns a shown answer into a statement, e.g. s => `7 · 8 = ${s}`. */
  statement?: (shown: string) => string;
  explanation: string;
  /** Optional drawing shown with the question. */
  figure?: Figure;
  /** Restrict which formats may be used. */
  formats?: QuestionFormat[];
}

export type Generator = (level: number, rng: import("./rng").Rng) => Core;

export interface Skill {
  key: string;
  title: string;
  emoji: string;
  /** Grades the skill is practised in, mapped to the starting level (1–5) for that grade. */
  grades: Partial<Record<Grade, number>>;
  /** Short reference to the curriculum (LK20). */
  curriculum: string;
  generate: Generator;
}

