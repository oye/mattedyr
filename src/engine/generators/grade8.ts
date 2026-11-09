/** Task generators for lower secondary (ungdomstrinnet), aimed at 8. trinn. */
import { numDistractors } from "../build";
import { coefX, fmt, joinTerms, MINUS, NBSP, pct, sup, term } from "../format";
import { chance, pick, randInt, randNonZero, type Rng } from "../rng";
import type { Core } from "../types";

// ---------------------------------------------------------------------------
// Negative tall
// ---------------------------------------------------------------------------
export function negativeTall(level: number, rng: Rng): Core {
  let expr: string;
  let ans: number;
  let candidates: number[];
  let explanation: string;
  switch (level) {
    case 1: {
      const a = randInt(rng, -10, -1);
      const b = randInt(rng, 1, 15);
      ans = a + b;
      expr = `${fmt(a)} + ${b}`;
      candidates = [-ans, a - b, -a + b, ans + 1, ans - 1];
      explanation = `Start på ${fmt(a)} på tallinja og gå ${b} steg til høyre. Da lander du på ${fmt(ans)}.`;
      break;
    }
    case 2: {
      if (chance(rng, 0.5)) {
        const a = randInt(rng, 1, 10);
        const b = randInt(rng, a + 1, 20);
        ans = a - b;
        expr = `${a} ${MINUS} ${b}`;
        explanation = `Start på ${a} og gå ${b} steg til venstre. Da lander du på ${fmt(ans)}.`;
      } else {
        const a = randInt(rng, 1, 10);
        const b = randInt(rng, 1, 10);
        ans = -a - b;
        expr = `${fmt(-a)} ${MINUS} ${b}`;
        explanation = `Start på ${fmt(-a)} og gå ${b} steg videre til venstre. Da lander du på ${fmt(ans)}.`;
      }
      candidates = [-ans, ans + 2, ans - 2, ans + 1];
      break;
    }
    case 3: {
      const a = randInt(rng, -10, 10);
      const b = randInt(rng, 1, 10);
      ans = a + b;
      expr = `${fmt(a)} ${MINUS} (${fmt(-b)})`;
      candidates = [a - b, -ans, -(a - b), ans + 1];
      explanation = `Å trekke fra et negativt tall er det samme som å legge til: ${fmt(a)} ${MINUS} (${fmt(-b)}) = ${fmt(a)} + ${b} = ${fmt(ans)}.`;
      break;
    }
    case 4: {
      let a = randNonZero(rng, -10, 10);
      let b = randNonZero(rng, -10, 10);
      if (a > 0 && b > 0) a = -a;
      if (Math.abs(a) === 1) a *= 2;
      if (Math.abs(b) === 1) b *= 3;
      ans = a * b;
      expr = `${term(a)} · ${term(b)}`;
      candidates = [-ans, a + b, ans + a, ans - b];
      explanation = `${a < 0 && b < 0 ? "Minus ganger minus blir pluss" : "Minus ganger pluss blir minus"}: ${expr} = ${fmt(ans)}.`;
      break;
    }
    default: {
      if (chance(rng, 0.5)) {
        const q = randNonZero(rng, -9, 9);
        let d = randInt(rng, 2, 9) * (chance(rng, 0.5) ? 1 : -1);
        if (q > 0 && d > 0) d = -d; // make sure at least one sign is negative
        const n = d * q;
        ans = q;
        expr = `${term(n)} : ${term(d)}`;
        candidates = [-q, n - d, q + 1, q - 1];
        explanation = `${(n < 0) === (d < 0) ? "Like fortegn gir pluss" : "Ulike fortegn gir minus"}: ${expr} = ${fmt(q)}.`;
      } else {
        const a = randInt(rng, -6, -2);
        const b = randInt(rng, -6, -2);
        const c = randInt(rng, -10, 10);
        ans = a * b + c;
        expr = `${term(a)} · ${term(b)} + ${term(c)}`;
        candidates = [-a * b + c, a * b - c, a + b + c, -ans];
        explanation = `Gange først: ${term(a)} · ${term(b)} = ${a * b}. Så ${a * b} + ${term(c)} = ${fmt(ans)}.`;
      }
    }
  }
  return {
    prompt: `Hva er ${expr}?`,
    answer: fmt(ans),
    numeric: { value: ans, allowNegative: true },
    distractors: numDistractors(ans, candidates, { allowNegative: true }),
    statement: (s) => `${expr} = ${s}`,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// Prosent
// ---------------------------------------------------------------------------
const FRACTION_PERCENT: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10], [7, 10], [1, 20]];

export function prosent(level: number, rng: Rng): Core {
  if (level <= 3) {
    let p: number;
    let base: number;
    if (level === 1) {
      p = pick(rng, [10, 50]);
      base = p === 10 ? randInt(rng, 2, 50) * 10 : randInt(rng, 2, 50) * 2;
    } else if (level === 2) {
      p = pick(rng, [20, 25, 1]);
      base = p === 25 ? randInt(rng, 2, 30) * 4 : p === 20 ? randInt(rng, 2, 40) * 5 : randInt(rng, 1, 9) * 100;
    } else {
      p = randInt(rng, 1, 19) * 5;
      base = randInt(rng, 1, 25) * 20;
    }
    const ans = (p * base) / 100;
    const hint =
      p === 10 ? `10${NBSP}% er en tidel: ${base} : 10 = ${fmt(ans)}.`
      : p === 50 ? `50${NBSP}% er halvparten: ${base} : 2 = ${fmt(ans)}.`
      : p === 25 ? `25${NBSP}% er en firedel: ${base} : 4 = ${fmt(ans)}.`
      : p === 20 ? `20${NBSP}% er en femdel: ${base} : 5 = ${fmt(ans)}.`
      : p === 1 ? `1${NBSP}% er en hundredel: ${base} : 100 = ${fmt(ans)}.`
      : `Finn 5${NBSP}% først (${base} : 20 = ${fmt(base / 20)}), og gang med ${p / 5}: ${fmt(ans)}.`;
    return {
      prompt: `Hva er ${pct(p)} av ${base}?`,
      answer: fmt(ans),
      numeric: { value: ans },
      distractors: numDistractors(ans, [base - ans, ans * 2, base / p, ans + p, ans + base / 10]),
      statement: (s) => `${pct(p)} av ${base} er ${s}`,
      explanation: hint,
    };
  }
  if (level === 4) {
    const kind = pick(rng, ["desimal→prosent", "prosent→desimal", "brøk→prosent"]);
    if (kind === "brøk→prosent") {
      const [a, b] = pick(rng, FRACTION_PERCENT);
      const ans = (a / b) * 100;
      return {
        prompt: `Hvor mange prosent er ${a}/${b}?`,
        answer: pct(ans),
        numeric: { value: ans, unit: "%" },
        distractors: [ans / 10, ans * 2, a * 10 + b, 100 - ans].filter((x) => x > 0 && x !== ans).map(pct),
        statement: (s) => `${a}/${b} = ${s}`,
        explanation: `${a}/${b} = ${a} : ${b} = ${fmt(a / b)} = ${pct(ans)}.`,
      };
    }
    const p = randInt(rng, 1, 99);
    if (kind === "desimal→prosent") {
      return {
        prompt: `Skriv ${fmt(p / 100)} som prosent.`,
        answer: pct(p),
        numeric: { value: p, unit: "%" },
        distractors: [p / 10, p * 10, p + 10, p / 100].filter((x) => x !== p).map(pct),
        statement: (s) => `${fmt(p / 100)} = ${s}`,
        explanation: `Gang med 100: ${fmt(p / 100)} · 100 = ${p}, altså ${pct(p)}.`,
      };
    }
    return {
      prompt: `Skriv ${pct(p)} som desimaltall.`,
      answer: fmt(p / 100),
      numeric: { value: p / 100, allowDecimal: true },
      distractors: numDistractors(p / 100, [p / 10, p / 1000, p, (p + 10) / 100], { integer: false }),
      statement: (s) => `${pct(p)} = ${s}`,
      explanation: `Prosent betyr hundredeler: ${pct(p)} = ${p} : 100 = ${fmt(p / 100)}.`,
    };
  }
  // Level 5: new price after a discount or increase.
  const price = randInt(rng, 5, 50) * 20;
  const p = pick(rng, [10, 20, 25, 30, 40, 50]);
  const change = (price * p) / 100;
  const discount = chance(rng, 0.65);
  const ans = discount ? price - change : price + change;
  const item = pick(rng, ["En jakke", "Et par sko", "Et spill", "En sykkelhjelm", "En sekk", "Et par hodetelefoner"]);
  return {
    prompt: discount
      ? `${item} koster ${price}${NBSP}kr og settes ned med ${pct(p)}. Hva blir den nye prisen?`
      : `${item} koster ${price}${NBSP}kr og prisen øker med ${pct(p)}. Hva blir den nye prisen?`,
    answer: fmt(ans),
    numeric: { value: ans, unit: "kr" },
    distractors: numDistractors(ans, [change, discount ? price + change : price - change, price - p, price + p], { step: 10 }),
    explanation: `${pct(p)} av ${price} er ${fmt(change)}${NBSP}kr. ${price} ${discount ? "−" : "+"} ${fmt(change)} = ${fmt(ans)}${NBSP}kr.`,
  };
}

// ---------------------------------------------------------------------------
// Potenser og kvadratrøtter
// ---------------------------------------------------------------------------
export function potenser(level: number, rng: Rng): Core {
  if (level === 3) {
    const a = randInt(rng, 2, 15);
    const sq = a * a;
    return {
      prompt: `Hva er √${sq}?`,
      answer: fmt(a),
      numeric: { value: a },
      distractors: numDistractors(a, [sq / 2, a + 1, a - 1, sq / 4, a * 2]),
      statement: (s) => `√${sq} = ${s}`,
      explanation: `√${sq} = ${a}, fordi ${a} · ${a} = ${sq}.`,
    };
  }
  if (level === 5) {
    const m = randInt(rng, 2, 7);
    const n = randInt(rng, 2, 6);
    const kind = pick(rng, ["gange", "dele", "potens"]);
    let expr: string;
    let exp: number;
    let rule: string;
    let wrong: number[];
    if (kind === "gange") {
      expr = `a${sup(m)} · a${sup(n)}`;
      exp = m + n;
      wrong = [m * n, m + n + 1, m + n - 1];
      rule = `Når vi ganger potenser med samme grunntall, legger vi sammen eksponentene: ${m} + ${n} = ${exp}, så ${expr} = a${sup(exp)}.`;
    } else if (kind === "dele") {
      const big = m + n;
      expr = `a${sup(big)} : a${sup(n)}`;
      exp = m;
      wrong = [big + n, big * n, m + 1];
      rule = `Når vi deler potenser med samme grunntall, trekker vi fra eksponentene: ${big} ${MINUS} ${n} = ${exp}, så ${expr} = a${sup(exp)}.`;
    } else {
      expr = `(a${sup(m)})${sup(n)}`;
      exp = m * n;
      wrong = [m + n, m * n + 1, m * n - 1];
      rule = `En potens opphøyd i en potens: gang eksponentene. ${m} · ${n} = ${exp}, så ${expr} = a${sup(exp)}.`;
    }
    return {
      prompt: `Skriv som én potens: ${expr}`,
      answer: `a${sup(exp)}`,
      distractors: wrong.filter((w) => w !== exp && w > 0).map((w) => `a${sup(w)}`).concat([`${exp}a`]),
      formats: ["choice", "truefalse"],
      statement: (s) => `${expr} = ${s}`,
      explanation: rule,
    };
  }
  let base: number;
  let exp: number;
  if (level === 1) {
    [base, exp] = pick(rng, [[2, randInt(rng, 2, 5)], [10, randInt(rng, 2, 4)], [3, 2], [3, 3], [5, 2], [4, 2]] as [number, number][]);
  } else if (level === 2) {
    base = randInt(rng, 2, 15);
    exp = 2;
  } else {
    [base, exp] = pick(rng, [[randInt(rng, 2, 5), 3], [10, randInt(rng, 3, 6)], [2, randInt(rng, 6, 10)]] as [number, number][]);
  }
  const ans = base ** exp;
  return {
    prompt: `Hva er ${base}${sup(exp)}?`,
    answer: fmt(ans),
    numeric: { value: ans },
    distractors: numDistractors(ans, [base * exp, base + exp, base ** (exp - 1), base ** (exp + 1), exp ** base]),
    statement: (s) => `${base}${sup(exp)} = ${s}`,
    explanation:
      exp <= 4
        ? `${base}${sup(exp)} = ${Array(exp).fill(base).join(" · ")} = ${fmt(ans)}. Eksponenten sier hvor mange ganger vi ganger grunntallet med seg selv.`
        : `${base}${sup(exp)} betyr ${base} ganget med seg selv ${exp} ganger: ${fmt(ans)}.`,
  };
}

// ---------------------------------------------------------------------------
// Algebraiske uttrykk
// ---------------------------------------------------------------------------
export function uttrykk(level: number, rng: Rng): Core {
  switch (level) {
    case 1: {
      const a = randInt(rng, 2, 9);
      const x = randInt(rng, 2, 9);
      const ans = a * x;
      return {
        prompt: `Hva er ${a}x når x = ${x}?`,
        answer: fmt(ans),
        numeric: { value: ans },
        distractors: numDistractors(ans, [a * 10 + x, a + x, ans + a, ans - x]),
        statement: (s) => `Når x = ${x}, er ${a}x = ${s}`,
        explanation: `${a}x betyr ${a} · x. Med x = ${x} blir det ${a} · ${x} = ${ans}.`,
      };
    }
    case 2: {
      const a = randInt(rng, 2, 9);
      const x = randInt(rng, 1, 10);
      const b = randInt(rng, 1, 20);
      const ans = a * x + b;
      return {
        prompt: `Hva er ${a}x + ${b} når x = ${x}?`,
        answer: fmt(ans),
        numeric: { value: ans },
        distractors: numDistractors(ans, [a * (x + b), a + x + b, (a * 10 + x) + b, a * x - b]),
        statement: (s) => `Når x = ${x}, er ${a}x + ${b} = ${s}`,
        explanation: `Gange først: ${a} · ${x} = ${a * x}. Så ${a * x} + ${b} = ${ans}.`,
      };
    }
    case 3: {
      const a = randInt(rng, 1, 9);
      const c = randInt(rng, 1, 9);
      if (chance(rng, 0.5)) {
        const sum = a + c;
        const expr = `${coefX(a)} + ${coefX(c)}`;
        return {
          prompt: `Trekk sammen: ${expr}`,
          answer: coefX(sum),
          distractors: [`${sum}x²`, coefX(a * c), coefX(sum + 1), `${sum}`, `${a}${c}x`],
          formats: ["choice", "truefalse"],
          statement: (s) => `${expr} = ${s}`,
          explanation: `Like ledd kan legges sammen: ${expr} = (${a} + ${c})x = ${coefX(sum)}.`,
        };
      }
      const b = randInt(rng, 1, 15);
      const sum = a + c;
      const expr = `${coefX(a)} + ${b} + ${coefX(c)}`;
      const answer = joinTerms(coefX(sum), b);
      return {
        prompt: `Trekk sammen: ${expr}`,
        answer,
        distractors: [`${sum + b}x`, joinTerms(coefX(sum + b)), joinTerms(coefX(a * c), b), joinTerms(coefX(sum), b + 1)],
        formats: ["choice", "truefalse"],
        statement: (s) => `${expr} = ${s}`,
        explanation: `Bare x-leddene kan slås sammen: ${coefX(a)} + ${coefX(c)} = ${coefX(sum)}. Tallet ${b} står for seg selv: ${answer}.`,
      };
    }
    case 4: {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 9);
      const minus = chance(rng, 0.4);
      const sb = minus ? -b : b;
      const expr = `${a}(x ${minus ? MINUS : "+"} ${b})`;
      const answer = joinTerms(coefX(a), a * sb);
      return {
        prompt: `Multipliser ut: ${expr}`,
        answer,
        distractors: [
          joinTerms(coefX(a), sb),
          joinTerms("x", a * sb),
          joinTerms(coefX(a), -a * sb),
          coefX(a + a * sb),
          joinTerms(coefX(a), a + sb),
        ],
        formats: ["choice", "truefalse"],
        statement: (s) => `${expr} = ${s}`,
        explanation: `Gang ${a} med hvert ledd i parentesen: ${a} · x ${minus ? MINUS : "+"} ${a} · ${b} = ${answer}.`,
      };
    }
    default: {
      const x = randNonZero(rng, -5, 5);
      if (chance(rng, 0.5)) {
        const b = randInt(rng, 1, 6);
        const ans = x * x - b * x;
        const expr = `x² ${MINUS} ${coefX(b)}`;
        return {
          prompt: `Hva er ${expr} når x = ${fmt(x)}?`,
          answer: fmt(ans),
          numeric: { value: ans, allowNegative: true },
          distractors: numDistractors(ans, [-x * x - b * x, x * x + b * x, 2 * x - b * x, -ans], { allowNegative: true }),
          statement: (s) => `Når x = ${fmt(x)}, er ${expr} = ${s}`,
          explanation: `Sett inn x = ${fmt(x)}: ${term(x)}² ${MINUS} ${b} · ${term(x)} = ${x * x} ${-b * x < 0 ? MINUS : "+"} ${Math.abs(b * x)} = ${fmt(ans)}. Husk: ${term(x)}² = ${term(x)} · ${term(x)} = ${x * x}.`,
        };
      }
      const a = randInt(rng, 2, 5);
      const ax = Math.abs(x);
      const ans = a * x * x;
      return {
        prompt: `Hva er ${a}x² når x = ${fmt(x)}?`,
        answer: fmt(ans),
        numeric: { value: ans, allowNegative: true },
        distractors: numDistractors(ans, [(a * x) ** 2, -ans, a * 2 * ax, a * ax], { allowNegative: true }),
        statement: (s) => `Når x = ${fmt(x)}, er ${a}x² = ${s}`,
        explanation: `Potens først: ${term(x)}² = ${x * x}. Så ${a} · ${x * x} = ${ans}. (Ikke (${a} · ${term(x)})²!)`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Ligninger
// ---------------------------------------------------------------------------
export function ligninger(level: number, rng: Rng): Core {
  let eq: string;
  let x: number;
  let steps: string;
  let candidates: number[];
  switch (level) {
    case 1: {
      const a = randInt(rng, 1, 20);
      if (chance(rng, 0.5)) {
        x = randInt(rng, 1, 20);
        eq = `x + ${a} = ${x + a}`;
        steps = `x = ${x + a} ${MINUS} ${a} = ${x}`;
        candidates = [x + 2 * a, a, x + 1];
      } else {
        const b = randInt(rng, 1, 20);
        x = a + b;
        eq = `x ${MINUS} ${a} = ${b}`;
        steps = `x = ${b} + ${a} = ${x}`;
        candidates = [b - a, a, x - 1, x + 1];
      }
      break;
    }
    case 2: {
      const a = randInt(rng, 2, 9);
      x = randInt(rng, 2, 12);
      eq = `${a}x = ${a * x}`;
      steps = `x = ${a * x} : ${a} = ${x}`;
      candidates = [a * x - a, a * x * a, x + 1, x - 1];
      break;
    }
    case 3: {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 20);
      x = randInt(rng, 1, 10);
      const c = a * x + b;
      eq = `${a}x + ${b} = ${c}`;
      steps = `${a}x = ${c} ${MINUS} ${b} = ${c - b}, så x = ${c - b} : ${a} = ${x}`;
      candidates = [(c + b) / a, c - b, c / a - b, x + 1];
      break;
    }
    case 4: {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 20);
      x = randNonZero(rng, -6, 10);
      const c = a * x - b;
      eq = `${a}x ${MINUS} ${b} = ${fmt(c)}`;
      steps = `${a}x = ${fmt(c)} + ${b} = ${fmt(c + b)}, så x = ${fmt(c + b)} : ${a} = ${fmt(x)}`;
      candidates = [(c - b) / a, -x, c + b, x + 1];
      break;
    }
    default: {
      const c = randInt(rng, 1, 6);
      const a = randInt(rng, c + 1, 9);
      const b = randInt(rng, 1, 15);
      x = randNonZero(rng, -4, 10);
      const d = (a - c) * x + b;
      eq = `${coefX(a)} + ${b} = ${joinTerms(coefX(c), d)}`;
      steps = `Trekk fra ${coefX(c)} og ${b} på begge sider: ${coefX(a - c)} = ${fmt(d - b)}, så x = ${fmt(d - b)} : ${a - c} = ${fmt(x)}`;
      candidates = [(d - b) / (a + c), (d + b) / (a - c), -x, d - b];
    }
  }
  return {
    prompt: `Løs ligningen: ${eq}`,
    answer: fmt(x),
    numeric: { value: x, allowNegative: level >= 4 },
    distractors: numDistractors(x, candidates, { allowNegative: level >= 4 }),
    statement: (s) => `${eq}  gir  x = ${s}`,
    explanation: `${steps}. Sjekk: sett inn x = ${fmt(x)} i ligningen.`,
  };
}

// ---------------------------------------------------------------------------
// Proporsjonalitet
// ---------------------------------------------------------------------------
const ITEMS: [string, string][] = [
  ["eple", "epler"], ["bolle", "boller"], ["blyant", "blyanter"], ["is", "iser"],
  ["kinobillett", "kinobilletter"], ["notatbok", "notatbøker"], ["banan", "bananer"],
];

export function proporsjonalitet(level: number, rng: Rng): Core {
  const [one, many] = pick(rng, ITEMS);
  if (level <= 3) {
    const unit = level === 1 ? randInt(rng, 2, 9) : level === 2 ? randInt(rng, 2, 15) : randInt(rng, 3, 19) * 5;
    const n1 = level === 1 ? 1 : randInt(rng, 2, 6);
    let n2 = randInt(rng, 2, 10);
    if (n2 === n1) n2++;
    const cost1 = unit * n1;
    const ans = unit * n2;
    return {
      prompt: n1 === 1
        ? `1 ${one} koster ${unit}${NBSP}kr. Hva koster ${n2} ${many}?`
        : `${n1} ${many} koster ${cost1}${NBSP}kr. Hva koster ${n2} ${many}?`,
      answer: fmt(ans),
      numeric: { value: ans, unit: "kr" },
      distractors: numDistractors(ans, [cost1 + (n2 - n1), cost1 * n2, ans + unit, ans - unit], { step: unit }),
      explanation: n1 === 1
        ? `${n2} · ${unit} = ${ans}${NBSP}kr.`
        : `Finn prisen for én: ${cost1} : ${n1} = ${unit}${NBSP}kr. Så ${n2} · ${unit} = ${ans}${NBSP}kr.`,
    };
  }
  if (level === 4) {
    const v = randInt(rng, 1, 9) * 10;
    const halfHours = randInt(rng, 1, 8);
    const t = halfHours / 2;
    const dist = v * t;
    const vehicle = v <= 20 ? "En syklist" : v <= 50 ? "En moped" : "En bil";
    if (chance(rng, 0.5)) {
      return {
        prompt: `${vehicle} holder en fart på ${v}${NBSP}km/t. Hvor langt kommer den på ${fmt(t)} ${t === 1 ? "time" : "timer"}?`,
        answer: fmt(dist),
        numeric: { value: dist, unit: "km" },
        distractors: numDistractors(dist, [v + t, v / t, dist + v, dist - v / 2], { step: 5 }),
        explanation: `Strekning = fart · tid = ${v} · ${fmt(t)} = ${fmt(dist)}${NBSP}km.`,
      };
    }
    return {
      prompt: `${vehicle} holder en fart på ${v}${NBSP}km/t. Hvor mange timer bruker den på ${fmt(dist)}${NBSP}km?`,
      answer: fmt(t),
      numeric: { value: t, unit: "timer", allowDecimal: true },
      distractors: numDistractors(t, [dist / 10, t + 0.5, t * 2, v / dist], { integer: false, step: 0.5 }),
      explanation: `Tid = strekning : fart = ${fmt(dist)} : ${v} = ${fmt(t)} timer.`,
    };
  }
  // Level 5: inverse proportionality.
  let w2: number;
  let t2: number;
  let divisors: number[];
  do {
    w2 = randInt(rng, 2, 8);
    t2 = randInt(rng, 2, 12);
    const total = w2 * t2;
    divisors = [];
    for (let d = 2; d <= 12; d++) if (total % d === 0 && d !== w2) divisors.push(d);
  } while (divisors.length === 0);
  const total = w2 * t2;
  const w1 = pick(rng, divisors);
  const t1 = total / w1;
  const ctx = pick(rng, [
    { who: "personer", task: "male et gjerde", unit: "timer" },
    { who: "maskiner", task: "pakke en bestilling", unit: "timer" },
    { who: "elever", task: "rydde skolegården", unit: "minutter" },
  ]);
  return {
    prompt: `${w1} ${ctx.who} bruker ${fmt(t1)} ${ctx.unit} på å ${ctx.task}. Hvor lang tid bruker ${w2} ${ctx.who}? (Alle jobber like fort.)`,
    answer: fmt(t2),
    numeric: { value: t2, unit: ctx.unit, allowDecimal: !Number.isInteger(t2) },
    distractors: numDistractors(t2, [(t1 * w2) / w1, t1 + (w1 - w2), t1 - (w1 - w2), t1], { integer: false }),
    explanation: `Hele jobben tar ${w1} · ${fmt(t1)} = ${total} «${ctx.who.slice(0, -2)}-${ctx.unit}». Med ${w2} ${ctx.who}: ${total} : ${w2} = ${t2} ${ctx.unit}. Flere hjelpere gir kortere tid — det kalles omvendt proporsjonalitet.`,
  };
}
