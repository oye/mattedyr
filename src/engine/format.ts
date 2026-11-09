/** Norwegian number formatting and parsing. */

export const MINUS = "\u2212"; // typographic minus sign "−"
export const NBSP = "\u00a0";

/**
 * Formats a number the Norwegian way: decimal comma, typographic minus and
 * space as thousands separator for numbers with five or more digits.
 */
export function fmt(n: number, maxDecimals = 4): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(n * factor) / factor;
  if (Object.is(rounded, -0) || rounded === 0) return "0";
  const negative = rounded < 0;
  const [intPart, decPart] = Math.abs(rounded).toFixed(maxDecimals).split(".");
  const trimmedDec = (decPart ?? "").replace(/0+$/, "");
  const groupedInt = intPart.length >= 5 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : intPart;
  return (negative ? MINUS : "") + groupedInt + (trimmedDec ? "," + trimmedDec : "");
}

/** Formats a number for use inside an expression, wrapping negatives in parentheses: (−3). */
export function term(n: number): string {
  return n < 0 ? `(${fmt(n)})` : fmt(n);
}

/** Formats a percentage, e.g. "25 %". */
export function pct(n: number): string {
  return `${fmt(n)}${NBSP}%`;
}

/** Parses user input like "3,5", "−2", "12 000" or "0.25". Returns null for invalid input. */
export function parseNumber(input: string): number | null {
  const cleaned = input
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/[\u2212\u2013]/g, "-")
    .replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
};

/** Converts an integer to superscript characters, e.g. 12 → "¹²". */
export function sup(n: number): string {
  return String(n)
    .split("")
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join("");
}

/** Formats an algebraic term like 3x, x, −x, −4x. */
export function coefX(c: number, variable = "x"): string {
  if (c === 1) return variable;
  if (c === -1) return MINUS + variable;
  return fmt(c) + variable;
}

/** Joins terms into an expression with proper signs: ["3x", 5] → "3x + 5", ["3x", -5] → "3x − 5". */
export function joinTerms(first: string, ...rest: number[]): string {
  return rest.reduce<string>((acc, t) => (t < 0 ? `${acc} ${MINUS} ${fmt(-t)}` : `${acc} + ${fmt(t)}`), first);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

