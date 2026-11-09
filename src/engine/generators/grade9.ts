/** Task generators for 9.–10. trinn: Pytagoras, lineære funksjoner, sannsynlighet og standardform. */
import { numDistractors } from "../build";
import { coefX, fmt, gcd, joinTerms, MINUS, NBSP, sup } from "../format";
import { chance, pick, randInt, randNonZero, shuffle, type Rng } from "../rng";
import type { Core, MarbleColor } from "../types";

/** A simplified fraction as text: 6/8 → "3/4", 4/4 → "1". */
export function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const [a, b] = [n / g, d / g];
  return b === 1 ? fmt(a) : `${a}/${b}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------
// Pytagoras
// ---------------------------------------------------------------------------
const EASY_TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [12, 16, 20]];
const TRIPLES: [number, number, number][] = [
  ...EASY_TRIPLES,
  [5, 12, 13], [8, 15, 17], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29],
];

export function pytagoras(level: number, rng: Rng): Core {
  if (level <= 3) {
    let [a, b, c] = pick(rng, level === 1 ? EASY_TRIPLES : TRIPLES);
    if (chance(rng, 0.5)) [a, b] = [b, a];
    if (level <= 2) {
      return {
        prompt: `En rettvinklet trekant har kateter på ${a}${NBSP}cm og ${b}${NBSP}cm. Hvor lang er hypotenusen?`,
        answer: fmt(c),
        numeric: { value: c, unit: "cm" },
        distractors: numDistractors(c, [a + b, c + 1, c - 1, a * a + b * b, Math.max(a, b) + 1]),
        statement: (s) => `Kateter på ${a}${NBSP}cm og ${b}${NBSP}cm gir hypotenus ${s}${NBSP}cm`,
        explanation: `a² + b² = c²: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. Da er c = √${c * c} = ${c}${NBSP}cm.`,
        figure: { type: "right-triangle", a, b, labels: { a: `${a}${NBSP}cm`, b: `${b}${NBSP}cm`, c: "?" } },
      };
    }
    // Level 3: find a leg.
    return {
      prompt: `En rettvinklet trekant har hypotenus ${c}${NBSP}cm og én katet på ${a}${NBSP}cm. Hvor lang er den andre kateten?`,
      answer: fmt(b),
      numeric: { value: b, unit: "cm" },
      distractors: numDistractors(b, [c - a, c + a, b + 1, b - 1, c * c - a * a]),
      statement: (s) => `Hypotenus ${c}${NBSP}cm og katet ${a}${NBSP}cm gir den andre kateten ${s}${NBSP}cm`,
      explanation: `b² = c² − a² = ${c * c} − ${a * a} = ${b * b}. Da er b = √${b * b} = ${b}${NBSP}cm.`,
      figure: { type: "right-triangle", a, b, labels: { a: `${a}${NBSP}cm`, b: "?", c: `${c}${NBSP}cm` } },
    };
  }
  if (level === 4) {
    // Legs that do not give a whole number: round to one decimal.
    let a: number;
    let b: number;
    do {
      a = randInt(rng, 2, 12);
      b = randInt(rng, 2, 12);
    } while (Number.isInteger(Math.sqrt(a * a + b * b)));
    const c = round1(Math.sqrt(a * a + b * b));
    return {
      prompt: `En rettvinklet trekant har kateter på ${a}${NBSP}cm og ${b}${NBSP}cm. Hvor lang er hypotenusen? Svar med én desimal.`,
      answer: fmt(c),
      numeric: { value: c, unit: "cm", allowDecimal: true },
      distractors: numDistractors(c, [a + b, round1(c + 1), round1(c - 0.5), a * a + b * b], { integer: false, step: 0.1 }),
      explanation: `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}. c = √${a * a + b * b} ≈ ${fmt(c)}${NBSP}cm.`,
      figure: { type: "right-triangle", a, b, labels: { a: `${a}${NBSP}cm`, b: `${b}${NBSP}cm`, c: "?" } },
    };
  }
  // Level 5: everyday problems.
  if (chance(rng, 0.5)) {
    const [x, y, z] = pick(rng, TRIPLES.filter(([, , c]) => c <= 17));
    // A ladder against a wall: find the height.
    const [foot, height, ladder] = x < y ? [x, y, z] : [y, x, z];
    const k = ladder > 10 ? 0.5 : 1; // keep ladders realistic (≤ 10 m)
    const [f, h, l] = [foot * k, height * k, ladder * k];
    return {
      prompt: `En stige på ${fmt(l)}${NBSP}m står lent mot en vegg. Foten står ${fmt(f)}${NBSP}m fra veggen. Hvor høyt opp på veggen når stigen?`,
      answer: fmt(h),
      numeric: { value: h, unit: "m", allowDecimal: !Number.isInteger(h) },
      distractors: numDistractors(h, [l - f, l + f, h + 1, l], { integer: false, step: k }),
      statement: (s) => `En stige på ${fmt(l)}${NBSP}m med foten ${fmt(f)}${NBSP}m fra veggen når ${s}${NBSP}m opp`,
      explanation: `Stigen er hypotenusen. h² = ${fmt(l)}² − ${fmt(f)}² = ${fmt(l * l)} − ${fmt(f * f)} = ${fmt(h * h)}. h = √${fmt(h * h)} = ${fmt(h)}${NBSP}m.`,
      figure: { type: "right-triangle", a: f, b: h, labels: { a: `${fmt(f)}${NBSP}m`, b: "?", c: `${fmt(l)}${NBSP}m` } },
    };
  }
  // A TV screen: width and height given, find the diagonal.
  const [x, y, z] = pick(rng, TRIPLES.filter(([, , c]) => c <= 17));
  const k = 10;
  const [w, h, d] = x > y ? [x * k, y * k, z * k] : [y * k, x * k, z * k];
  return {
    prompt: `En TV-skjerm er ${w}${NBSP}cm bred og ${h}${NBSP}cm høy. Hvor lang er diagonalen?`,
    answer: fmt(d),
    numeric: { value: d, unit: "cm" },
    distractors: numDistractors(d, [w + h, d + 10, d - 10, w + h / 2], { step: 10 }),
    statement: (s) => `En skjerm på ${w}${NBSP}cm · ${h}${NBSP}cm har diagonal ${s}${NBSP}cm`,
    explanation: `Diagonalen deler skjermen i to rettvinklede trekanter. d² = ${w}² + ${h}² = ${w * w} + ${h * h} = ${d * d}. d = √${d * d} = ${d}${NBSP}cm.`,
    figure: { type: "right-triangle", a: w, b: h, labels: { a: `${w}${NBSP}cm`, b: `${h}${NBSP}cm`, c: "?" } },
  };
}

// ---------------------------------------------------------------------------
// Lineære funksjoner
// ---------------------------------------------------------------------------
/** "2x + 3", "−x − 4", "3x" */
function linExpr(a: number, b: number): string {
  if (a === 0) return fmt(b);
  return b === 0 ? coefX(a) : joinTerms(coefX(a), b);
}

const pt = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;

export function funksjoner(level: number, rng: Rng): Core {
  if (level === 1) {
    const a = randInt(rng, 1, 5);
    const b = randInt(rng, -5, 9);
    const x = randInt(rng, 0, 6);
    const ans = a * x + b;
    const f = linExpr(a, b);
    return {
      prompt: `f(x) = ${f}. Hva er f(${x})?`,
      answer: fmt(ans),
      numeric: { value: ans, allowNegative: true },
      distractors: numDistractors(ans, [a + x + b, a * (x + b), a * x - b, ans + a], { allowNegative: true }),
      statement: (s) => `Når f(x) = ${f}, er f(${x}) = ${s}`,
      explanation: `Sett inn ${x} for x: f(${x}) = ${a === 1 ? "" : `${a} · `}${x}${b === 0 ? "" : ` ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`} = ${fmt(ans)}.`,
    };
  }

  if (level === 2 || level === 3) {
    const a = level === 2 ? randInt(rng, 1, 3) : randNonZero(rng, -3, 3);
    const b = randInt(rng, level === 2 ? -3 : -4, level === 2 ? 3 : 4);
    const askSlope = level === 2 || chance(rng, 0.5);
    const figure = { type: "graph" as const, lines: [{ a, b }], points: [[0, b], [1, a + b]] as [number, number][], range: 6 };
    const walk = `Fra ${pt(0, b)} går du 1 til høyre, og da går linja ${Math.abs(a)} ${a > 0 ? "opp" : "ned"}`;
    if (askSlope) {
      return {
        prompt: "Hva er stigningstallet til linja?",
        answer: fmt(a),
        numeric: { value: a, allowNegative: true },
        distractors: numDistractors(a, [b, -a, a + 1, a - 1, a * 2], { allowNegative: true }),
        statement: (s) => `Linja har stigningstall ${s}`,
        explanation: `${walk}. Stigningstallet er ${fmt(a)}.`,
        figure,
      };
    }
    return {
      prompt: "Hvor skjærer linja y-aksen? Svar med y-verdien (konstantleddet).",
      answer: fmt(b),
      numeric: { value: b, allowNegative: true },
      distractors: numDistractors(b, [a, -b, b + 1, b - 1, -b / (a || 1)], { allowNegative: true }),
      statement: (s) => `Linja skjærer y-aksen i y = ${s}`,
      explanation: `Linja krysser y-aksen (der x = 0) i punktet ${pt(0, b)}. Konstantleddet er ${fmt(b)}.`,
      figure,
    };
  }

  if (level === 4) {
    const a = randNonZero(rng, -4, 4);
    const b = randInt(rng, -6, 6);
    const x1 = randInt(rng, -3, 3);
    const dx = randInt(rng, 1, 4);
    const x2 = x1 + dx;
    const [y1, y2] = [a * x1 + b, a * x2 + b];
    const dy = y2 - y1;
    return {
      prompt: `En rett linje går gjennom ${pt(x1, y1)} og ${pt(x2, y2)}. Hva er stigningstallet?`,
      answer: fmt(a),
      numeric: { value: a, allowNegative: true },
      distractors: numDistractors(a, [-a, dy, dx, a + 1, a - 1], { allowNegative: true }),
      statement: (s) => `Linja gjennom ${pt(x1, y1)} og ${pt(x2, y2)} har stigningstall ${s}`,
      explanation: `Stigningstall = endring i y : endring i x = (${fmt(y2)} ${MINUS} ${y1 < 0 ? `(${fmt(y1)})` : fmt(y1)}) : (${fmt(x2)} ${MINUS} ${x1 < 0 ? `(${fmt(x1)})` : fmt(x1)}) = ${fmt(dy)} : ${dx} = ${fmt(a)}.`,
    };
  }

  // Level 5: pick the function that matches the graph.
  const a = randNonZero(rng, -3, 3);
  const b = randNonZero(rng, -4, 4);
  const eq = (p: number, q: number) => `y = ${linExpr(p, q)}`;
  const wrong: [number, number][] = [[b, a], [-a, b], [a, -b], [a + 1, b], [a, b + 1], [-a, -b]];
  return {
    prompt: "Hvilken funksjon har denne grafen?",
    answer: eq(a, b),
    distractors: wrong.filter(([p, q]) => p !== 0 && !(p === a && q === b)).map(([p, q]) => eq(p, q)),
    formats: ["choice", "truefalse"],
    statement: (s) => `Grafen viser ${s}`,
    explanation: `Linja skjærer y-aksen i ${fmt(b)} (konstantleddet), og går ${Math.abs(a)} ${a > 0 ? "opp" : "ned"} for hvert steg til høyre (stigningstallet er ${fmt(a)}). Altså ${eq(a, b)}.`,
    figure: { type: "graph", lines: [{ a, b }], range: 6 },
  };
}

// ---------------------------------------------------------------------------
// Sannsynlighet
// ---------------------------------------------------------------------------
const COLOR_NAMES: Record<MarbleColor, { one: string; many: string }> = {
  rod: { one: "rød", many: "røde" },
  bla: { one: "blå", many: "blå" },
  gronn: { one: "grønn", many: "grønne" },
  gul: { one: "gul", many: "gule" },
};

const DIE_EVENTS: { text: string; n: number }[] = [
  { text: "en sekser", n: 1 },
  { text: "et partall", n: 3 },
  { text: "et oddetall", n: 3 },
  { text: "et tall større enn 4", n: 2 },
  { text: "minst 3", n: 4 },
  { text: "et tall mindre enn 3", n: 2 },
  { text: "1 eller 6", n: 2 },
  { text: "noe annet enn 6", n: 5 },
];

const TWO_EVENTS: { prompt: string; event: string; n: number; d: number; why: string; trap: string }[] = [
  { prompt: "Du kaster to mynter. Hva er sannsynligheten for to kron?", event: "to kron med to mynter", n: 1, d: 4, why: "Utfallene er KK, KM, MK og MM. Bare 1 av 4 er to kron.", trap: "1/3" },
  { prompt: "Du kaster to mynter. Hva er sannsynligheten for én kron og én mynt?", event: "én kron og én mynt", n: 2, d: 4, why: "Utfallene er KK, KM, MK og MM. 2 av 4 har én av hver.", trap: "1/3" },
  { prompt: "Du kaster to terninger. Hva er sannsynligheten for to seksere?", event: "to seksere", n: 1, d: 36, why: "Det er 6 · 6 = 36 mulige utfall, og bare (6, 6) gir to seksere.", trap: "1/12" },
  { prompt: "Du kaster to terninger. Hva er sannsynligheten for at summen blir 7?", event: "summen 7 med to terninger", n: 6, d: 36, why: "Av 36 utfall gir 6 summen 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1).", trap: "1/11" },
  { prompt: "Du kaster to terninger. Hva er sannsynligheten for at summen blir 11?", event: "summen 11 med to terninger", n: 2, d: 36, why: "Av 36 utfall gir 2 summen 11: (5,6) og (6,5).", trap: "1/11" },
  { prompt: "Du kaster to terninger. Hva er sannsynligheten for at summen blir 10?", event: "summen 10 med to terninger", n: 3, d: 36, why: "Av 36 utfall gir 3 summen 10: (4,6), (5,5) og (6,4).", trap: "1/11" },
  { prompt: "Du kaster to terninger. Hva er sannsynligheten for å få to like?", event: "to like med to terninger", n: 6, d: 36, why: "Av 36 utfall er 6 to like: (1,1), (2,2), …, (6,6).", trap: "1/36" },
];

const FRACTION_POOL = ["1/36", "1/18", "1/12", "1/9", "1/6", "1/4", "1/3", "1/2", "2/3", "5/6", "5/36", "1/11"];

function bag(rng: Rng, colors: number, maxTotal: number) {
  const palette = shuffle(rng, ["rod", "bla", "gronn", "gul"] as MarbleColor[]).slice(0, colors);
  let groups: { color: MarbleColor; count: number }[];
  do {
    groups = palette.map((color) => ({ color, count: randInt(rng, 1, 6) }));
  } while (groups.reduce((s, g) => s + g.count, 0) > maxTotal);
  return groups;
}

const bagText = (groups: { color: MarbleColor; count: number }[]) => {
  const parts = groups.map((g) => `${g.count} ${g.count === 1 ? COLOR_NAMES[g.color].one : COLOR_NAMES[g.color].many}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} og ${parts.at(-1)}` : parts[0];
};

export function sannsynlighet(level: number, rng: Rng): Core {
  if (level <= 2) {
    const groups = bag(rng, level === 1 ? 2 : 3, level === 1 ? 10 : 12);
    const total = groups.reduce((s, g) => s + g.count, 0);
    const target = pick(rng, groups);
    const not = level === 2 && chance(rng, 0.4);
    const n = not ? total - target.count : target.count;
    const name = COLOR_NAMES[target.color].one;
    const event = not ? `ikke ${name}` : name;
    const question = not ? `at den ikke er ${name}` : `at den er ${name}`;
    const other = total - target.count;
    return {
      prompt: `I en pose er det ${bagText(groups)} kuler. Du trekker én kule uten å se. Hva er sannsynligheten for ${question}?`,
      answer: frac(n, total),
      distractors: [frac(target.count, other), frac(total - n, total), frac(1, total), frac(n + 1, total), frac(n, total + 1), frac(n + 1, total + 1)],
      formats: ["choice", "truefalse"],
      statement: (s) => `P(${event}) = ${s}`,
      explanation: `Det er ${total} kuler i alt, og ${n} av dem er ${not ? "ikke " : ""}${n === 1 ? name : COLOR_NAMES[target.color].many}. P = ${n}/${total}${frac(n, total) !== `${n}/${total}` ? ` = ${frac(n, total)}` : ""}.`,
      figure: { type: "marbles", groups },
    };
  }

  if (level === 3) {
    if (chance(rng, 0.6)) {
      const e = pick(rng, DIE_EVENTS);
      const answer = frac(e.n, 6);
      return {
        prompt: `Du kaster en vanlig terning. Hva er sannsynligheten for å få ${e.text}?`,
        answer,
        distractors: shuffle(rng, [frac(6 - e.n, 6), frac(e.n, 5), ...FRACTION_POOL.filter((f) => f !== answer)]).slice(0, 5),
        formats: ["choice", "truefalse"],
        statement: (s) => `Sannsynligheten for ${e.text} med én terning er ${s}`,
        explanation: `En terning har 6 like sannsynlige utfall, og ${e.n} av dem gir ${e.text}. P = ${e.n}/6${answer !== `${e.n}/6` ? ` = ${answer}` : ""}.`,
      };
    }
    const p10 = randInt(rng, 1, 9);
    const ans = (10 - p10) / 10;
    return {
      prompt: `Sannsynligheten for regn i morgen er ${fmt(p10 / 10)}. Hva er sannsynligheten for at det ikke regner?`,
      answer: fmt(ans),
      numeric: { value: ans, allowDecimal: true },
      distractors: numDistractors(ans, [p10 / 10, 1 + p10 / 10, ans / 2, 10 - p10], { integer: false, step: 0.1 }),
      statement: (s) => `Er sannsynligheten for regn ${fmt(p10 / 10)}, er sannsynligheten for oppholdsvær ${s}`,
      explanation: `Enten regner det, eller så gjør det ikke. Sannsynlighetene blir til sammen 1: 1 ${MINUS} ${fmt(p10 / 10)} = ${fmt(ans)}.`,
    };
  }

  if (level === 4) {
    if (chance(rng, 0.5)) {
      const e = pick(rng, DIE_EVENTS.filter((d) => d.n <= 3));
      const k = randInt(rng, 2, 20);
      const throws = 6 * k;
      const ans = k * e.n;
      return {
        prompt: `Du kaster en terning ${throws} ganger. Omtrent hvor mange ganger kan du vente å få ${e.text}?`,
        answer: fmt(ans),
        numeric: { value: ans },
        distractors: numDistractors(ans, [throws / 2, throws / 6, throws / 3, ans + e.n, throws - ans]),
        statement: (s) => `Med ${throws} terningkast kan du vente ${e.text} omtrent ${s} ganger`,
        explanation: `P(${e.text}) = ${frac(e.n, 6)}. Forventet antall = ${frac(e.n, 6)} · ${throws} = ${ans}.`,
      };
    }
    // Probability as a percentage.
    const total = pick(rng, [4, 5, 10, 20, 25]);
    const groups = (() => {
      const first = randInt(rng, 1, total - 1);
      const colors = shuffle(rng, ["rod", "bla", "gronn", "gul"] as MarbleColor[]);
      return [{ color: colors[0], count: first }, { color: colors[1], count: total - first }];
    })();
    const target = groups[0];
    const ans = (100 * target.count) / total;
    return {
      prompt: `I en pose er det ${bagText(groups)} kuler. Hvor mange prosent sjanse er det for å trekke en ${COLOR_NAMES[target.color].one}?`,
      answer: fmt(ans),
      numeric: { value: ans, unit: "%" },
      distractors: numDistractors(ans, [target.count, 100 - ans, (100 * target.count) / groups[1].count, ans + 10], { step: 5 }),
      statement: (s) => `Sjansen for ${COLOR_NAMES[target.color].one} er ${s}${NBSP}%`,
      explanation: `P = ${target.count}/${total} = ${fmt(target.count / total)} = ${fmt(ans)}${NBSP}%.`,
      figure: total <= 20 ? { type: "marbles", groups } : undefined,
    };
  }

  // Level 5: two events.
  if (chance(rng, 0.6)) {
    const e = pick(rng, TWO_EVENTS);
    const answer = frac(e.n, e.d);
    return {
      prompt: e.prompt,
      answer,
      distractors: shuffle(rng, [e.trap, ...FRACTION_POOL.filter((f) => f !== answer && f !== e.trap)]).slice(0, 4),
      formats: ["choice", "truefalse"],
      statement: (s) => `P(${e.event}) = ${s}`,
      explanation: `${e.why} P = ${e.n}/${e.d}${answer !== `${e.n}/${e.d}` ? ` = ${answer}` : ""}.`,
    };
  }
  // Two marbles without putting the first back.
  const r = randInt(rng, 2, 4);
  const u = randInt(rng, 2, 5);
  const t = r + u;
  const groups = [{ color: "rod" as MarbleColor, count: r }, { color: "bla" as MarbleColor, count: u }];
  const answer = frac(r * (r - 1), t * (t - 1));
  return {
    prompt: `I en pose er det ${r} røde og ${u} blå kuler. Du trekker to kuler uten å legge den første tilbake. Hva er sannsynligheten for at begge er røde?`,
    answer,
    distractors: [frac(r * r, t * t), frac(r, t), frac(r - 1, t - 1), frac(2 * r, t), frac(r * (r - 1), t * t)],
    formats: ["choice", "truefalse"],
    statement: (s) => `P(to røde uten tilbakelegging) = ${s}`,
    explanation: `Første kule rød: ${r}/${t}. Da er det ${r - 1} røde igjen av ${t - 1}: ${r - 1}/${t - 1}. P = ${r}/${t} · ${r - 1}/${t - 1} = ${r * (r - 1)}/${t * (t - 1)}${answer !== `${r * (r - 1)}/${t * (t - 1)}` ? ` = ${answer}` : ""}.`,
    figure: { type: "marbles", groups },
  };
}

// ---------------------------------------------------------------------------
// Standardform
// ---------------------------------------------------------------------------
const std = (m: number, e: number) => `${fmt(m)} · 10${sup(e)}`;

export function standardform(level: number, rng: Rng): Core {
  if (level <= 2) {
    const e = level === 1 ? randInt(rng, 2, 5) : randInt(rng, 3, 7);
    let m: number;
    if (level === 1) m = randInt(rng, 1, 9);
    else {
      let m10: number;
      do m10 = randInt(rng, 11, 99);
      while (m10 % 10 === 0);
      m = m10 / 10;
    }
    const n = Math.round(m * 10 ** e);
    const answer = std(m, e);
    const wrong = [std(m, e + 1), std(m, e - 1), m + 1 < 10 ? std(m + 1, e) : std(m - 1, e)];
    if (Number.isInteger(m) && m !== e && e < 10 && m > 1) wrong.push(std(e, m));
    if (!Number.isInteger(m)) wrong.push(std(m, e - 2));
    return {
      prompt: `Skriv ${fmt(n)} på standardform.`,
      answer,
      distractors: wrong,
      formats: ["choice", "truefalse"],
      statement: (s) => `${fmt(n)} = ${s}`,
      explanation: `På standardform står det ett siffer foran komma, ganget med en tierpotens. Flytt kommaet ${e} plasser til venstre: ${fmt(n)} = ${answer}.`,
    };
  }
  if (level === 3) {
    let m10: number;
    do m10 = randInt(rng, 11, 99);
    while (m10 % 10 === 0);
    const e = randInt(rng, 2, 6);
    const n = m10 * 10 ** (e - 1);
    const m = m10 / 10;
    return {
      prompt: `Skriv ${std(m, e)} som et vanlig tall.`,
      answer: fmt(n),
      numeric: { value: n },
      distractors: numDistractors(n, [n * 10, n / 10, m10 * 10 ** e * 10, m10 * e], { step: n / 10 }),
      statement: (s) => `${std(m, e)} = ${s}`,
      explanation: `10${sup(e)} betyr at kommaet flyttes ${e} plasser mot høyre: ${std(m, e)} = ${fmt(n)}.`,
    };
  }
  if (level === 4) {
    const d = randInt(rng, 1, 9);
    const e = randInt(rng, 2, 4);
    const n = d / 10 ** e;
    const answer = std(d, -e);
    return {
      prompt: `Skriv ${fmt(n)} på standardform.`,
      answer,
      distractors: [std(d, e), std(d, -e - 1), std(d, -e + 1), std(d, e - 1)].filter((x) => x !== answer),
      formats: ["choice", "truefalse"],
      statement: (s) => `${fmt(n)} = ${s}`,
      explanation: `Små tall får negativ eksponent. Flytt kommaet ${e} plasser til høyre for å få ${d}: ${fmt(n)} = ${answer}.`,
    };
  }
  // Level 5: multiply or divide numbers on standard form.
  const a = randInt(rng, 1, 4);
  const b = randInt(rng, 2, Math.floor(9 / a));
  const p = randInt(rng, 2, 8);
  const q = randInt(rng, 2, 8);
  if (chance(rng, 0.5)) {
    const expr = `(${std(a, p)}) · (${std(b, q)})`;
    const answer = std(a * b, p + q);
    return {
      prompt: `Regn ut ${expr}.`,
      answer,
      distractors: [std(a * b, p * q), std(a + b, p + q), std(a * b, p + q + 1), std(a * b, p + q - 1)],
      formats: ["choice", "truefalse"],
      statement: (s) => `${expr} = ${s}`,
      explanation: `Gang tallene for seg og tierpotensene for seg: ${a} · ${b} = ${a * b}, og 10${sup(p)} · 10${sup(q)} = 10${sup(p + q)} (legg sammen eksponentene).`,
    };
  }
  const [hi, lo] = p > q ? [p, q] : [p + q, q];
  const expr = `(${std(a * b, hi)}) : (${std(a, lo)})`;
  const answer = std(b, hi - lo);
  return {
    prompt: `Regn ut ${expr}.`,
    answer,
    distractors: [std(b, hi + lo), std(a * b - a, hi - lo), std(b, hi - lo + 1), std(b, Math.max(1, Math.round(hi / lo)))],
    formats: ["choice", "truefalse"],
    statement: (s) => `${expr} = ${s}`,
    explanation: `Del tallene for seg og tierpotensene for seg: ${a * b} : ${a} = ${b}, og 10${sup(hi)} : 10${sup(lo)} = 10${sup(hi - lo)} (trekk fra eksponentene).`,
  };
}
