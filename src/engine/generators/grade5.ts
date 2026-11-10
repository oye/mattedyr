/** Task generators for the middle years (mellomtrinnet), aimed at 5. trinn. */
import { numDistractors } from "../build";
import { fmt, gcd, NBSP } from "../format";
import { chance, pick, randInt, shuffle, type Rng } from "../rng";
import type { Core, Figure } from "../types";

// ---------------------------------------------------------------------------
// Gangetabellen
// ---------------------------------------------------------------------------
export function gangetabell(level: number, rng: Rng): Core {
  let a: number;
  let b: number;
  let twoDigit = false;
  switch (level) {
    case 1: a = pick(rng, [1, 2, 5, 10]); b = randInt(rng, 1, 10); break;
    case 2: a = pick(rng, [2, 3, 4, 5, 10]); b = randInt(rng, 1, 10); break;
    case 3: a = randInt(rng, 2, 10); b = randInt(rng, 2, 10); break;
    case 4: a = randInt(rng, 6, 9); b = randInt(rng, 6, 9); break;
    default:
      if (chance(rng, 0.5)) { a = randInt(rng, 11, 12); b = randInt(rng, 2, 12); }
      else { a = randInt(rng, 13, 49); b = randInt(rng, 3, 9); twoDigit = true; }
  }
  if (!twoDigit && chance(rng, 0.5)) [a, b] = [b, a];
  const ans = a * b;
  let explanation: string;
  if (twoDigit) {
    const tens = Math.floor(a / 10) * 10;
    const ones = a % 10;
    explanation = ones === 0
      ? `${a} · ${b} = ${fmt(ans)}.`
      : `Del opp: ${tens} · ${b} + ${ones} · ${b} = ${tens * b} + ${ones * b} = ${fmt(ans)}.`;
  } else if (b >= 2) {
    explanation = `${a} · ${b} = ${ans}. Tips: ${a} · ${b - 1} = ${a * (b - 1)}, og ${a * (b - 1)} + ${a} = ${ans}.`;
  } else {
    explanation = `${a} · 1 = ${a}. Å gange med 1 endrer ikke tallet.`;
  }
  return {
    prompt: `Hva er ${a} · ${b}?`,
    answer: fmt(ans),
    numeric: { value: ans },
    distractors: numDistractors(ans, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, ans + 10, ans - 10]),
    statement: (s) => `${a} · ${b} = ${s}`,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// Divisjon
// ---------------------------------------------------------------------------
export function divisjon(level: number, rng: Rng): Core {
  let d: number;
  let q: number;
  switch (level) {
    case 1: d = pick(rng, [2, 5, 10]); q = randInt(rng, 1, 10); break;
    case 2: d = pick(rng, [2, 3, 4, 5, 10]); q = randInt(rng, 1, 10); break;
    case 3: d = randInt(rng, 2, 10); q = randInt(rng, 2, 10); break;
    case 4: d = randInt(rng, 6, 9); q = randInt(rng, 6, 12); break;
    default: d = randInt(rng, 3, 9); q = randInt(rng, 11, 30);
  }
  const n = d * q;
  return {
    prompt: `Hva er ${fmt(n)} : ${d}?`,
    answer: fmt(q),
    numeric: { value: q },
    distractors: numDistractors(q, [q + 1, q - 1, q + 2, n - d, d === q ? q * 2 : d, q * 2, q + 10]),
    statement: (s) => `${fmt(n)} : ${d} = ${s}`,
    explanation: `${fmt(n)} : ${d} = ${q}, fordi ${d} · ${q} = ${fmt(n)}.`,
  };
}

// ---------------------------------------------------------------------------
// Plassverdi og avrunding
// ---------------------------------------------------------------------------
const PLACE_NAMES = ["ener", "tier", "hundrer", "tusen", "titusen", "hundretusen", "million"];
const ROUND_NAMES = ["", "tier", "hundre", "tusen", "titusen", "hundretusen"];

export function plassverdi(level: number, rng: Rng): Core {
  const digitsCount = Math.min(7, level + 2); // 3..7 digits
  const digits = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, digitsCount); // distinct, no zeros
  const n = Number(digits.join(""));
  const digitAt = (p: number) => digits[digitsCount - 1 - p];

  const kind = level === 1 ? pick(rng, ["siffer", "verdi"]) : pick(rng, ["verdi", "avrunding", "avrunding"]);

  if (kind === "siffer") {
    const p = randInt(rng, 0, digitsCount - 1);
    const d = digitAt(p);
    return {
      prompt: `Hvilket siffer står på ${PLACE_NAMES[p]}plassen i ${fmt(n)}?`,
      answer: String(d),
      numeric: { value: d },
      distractors: digits.filter((x) => x !== d).map(String),
      explanation: `I ${fmt(n)} står ${d} på ${PLACE_NAMES[p]}plassen.`,
    };
  }

  if (kind === "verdi") {
    const p = randInt(rng, 1, digitsCount - 1);
    const d = digitAt(p);
    const value = d * 10 ** p;
    return {
      prompt: `Hva er verdien av sifferet ${d} i tallet ${fmt(n)}?`,
      answer: fmt(value),
      numeric: { value },
      distractors: numDistractors(value, [d, d * 10 ** (p + 1), d * 10 ** (p - 1), d * 10 ** (p + 2)]),
      explanation: `Sifferet ${d} står på ${PLACE_NAMES[p]}plassen, så verdien er ${fmt(value)}.`,
    };
  }

  // Avrunding
  const p = randInt(rng, 1, Math.min(digitsCount - 1, 5));
  const unit = 10 ** p;
  const ans = Math.round(n / unit) * unit;
  const down = Math.floor(n / unit) * unit;
  const up = down + unit;
  const nextDigit = digitAt(p - 1);
  return {
    prompt: `Rund av ${fmt(n)} til nærmeste ${ROUND_NAMES[p]}.`,
    answer: fmt(ans),
    numeric: { value: ans },
    distractors: numDistractors(ans, [down, up, Math.round(n / (unit * 10)) * unit * 10, Math.round(n / (unit / 10)) * (unit / 10)], { step: unit }),
    statement: (s) => `${fmt(n)} rundet av til nærmeste ${ROUND_NAMES[p]} er ${s}`,
    explanation: `Se på sifferet etter ${PLACE_NAMES[p]}plassen: ${nextDigit}. ${nextDigit >= 5 ? "Det er 5 eller mer, så vi runder opp" : "Det er mindre enn 5, så vi runder ned"} til ${fmt(ans)}.`,
  };
}

// ---------------------------------------------------------------------------
// Desimaltall (calculations are done in whole hundredths to avoid float errors)
// ---------------------------------------------------------------------------
const h = (hundredths: number) => fmt(hundredths / 100);

export function desimaltall(level: number, rng: Rng): Core {
  switch (level) {
    case 1: {
      // Which is largest? Targets the "0,45 > 0,5" misconception, but varies whether the
      // largest number has one or two decimals so "pick the 1-decimal number" is not a shortcut.
      const i = randInt(rng, 0, 3);
      const t = randInt(rng, 2, 8);
      if (chance(rng, 0.5)) {
        // 1-decimal winner (e.g. 0,5 vs 0,48, 0,4, 0,05)
        const biggest = i * 100 + t * 10;
        const misconception = i * 100 + (t - 1) * 10 + randInt(rng, 5, 9);
        const oneDecDistractor = i * 100 + (t - 1) * 10;
        const hundredthDistractor = i * 100 + t;
        return {
          prompt: "Hvilket tall er størst?",
          answer: h(biggest),
          distractors: [h(misconception), h(oneDecDistractor), h(hundredthDistractor)],
          formats: ["choice"],
          explanation: `${h(biggest)} er det samme som ${(biggest / 100).toFixed(2).replace(".", ",")}. Sammenlign tidelene først: ${t} tideler er mer enn ${t - 1} tideler, uansett hvor mange hundredeler som kommer etter.`,
        };
      }
      // 2-decimal winner (e.g. 0,54 vs 0,5, 0,49, 0,6? No: 0,54 vs 0,5, 0,49, 0,4)
      const hun = randInt(rng, 2, 9);
      const biggest = i * 100 + t * 10 + hun;
      const sameTenth = i * 100 + t * 10; // 1 decimal, same tenth (e.g. 0,5 vs 0,54)
      const lowerTenthTwoDec = i * 100 + (t - 1) * 10 + randInt(rng, 6, 9); // 2 decimals, lower tenth (e.g. 0,49)
      const lowerTenthOneDec = i * 100 + (t - 1) * 10; // 1 decimal, lower tenth (e.g. 0,4)
      return {
        prompt: "Hvilket tall er størst?",
        answer: h(biggest),
        distractors: [h(sameTenth), h(lowerTenthTwoDec), h(lowerTenthOneDec)],
        formats: ["choice"],
        explanation: `Sammenlign tidelene først, og så hundredelene: ${h(sameTenth)} er ${(sameTenth / 100).toFixed(2).replace(".", ",")}, så ${h(biggest)} er størst.`,
      };
    }
    case 2: {
      const a = randInt(rng, 1, 99);
      const b = randInt(rng, 1, 99);
      const sum = a + b; // tenths
      return {
        prompt: `Hva er ${fmt(a / 10)} + ${fmt(b / 10)}?`,
        answer: fmt(sum / 10),
        numeric: { value: sum / 10, allowDecimal: true },
        distractors: numDistractors(sum / 10, [(sum + 1) / 10, (sum - 1) / 10, sum / 100, (sum + 10) / 10], { step: 0.1 }),
        statement: (s) => `${fmt(a / 10)} + ${fmt(b / 10)} = ${s}`,
        explanation: `Legg sammen tidelene og enerne hver for seg: ${fmt(a / 10)} + ${fmt(b / 10)} = ${fmt(sum / 10)}.`,
      };
    }
    case 3: {
      const a = randInt(rng, 100, 999);
      const b = randInt(rng, 10, 99);
      const add = chance(rng, 0.5);
      const ans = add ? a + b : a - b;
      const misaligned = add ? a + b * 10 : a - b * 10;
      return {
        prompt: `Hva er ${h(a)} ${add ? "+" : "−"} ${h(b)}?`,
        answer: h(ans),
        numeric: { value: ans / 100, allowDecimal: true },
        distractors: numDistractors(ans / 100, [misaligned / 100, (ans + 10) / 100, (ans - 10) / 100, (ans + 1) / 100], { step: 0.01 }),
        statement: (s) => `${h(a)} ${add ? "+" : "−"} ${h(b)} = ${s}`,
        explanation: `Sett kommaene rett under hverandre: hundredeler under hundredeler og tideler under tideler. Svaret blir ${h(ans)}.`,
      };
    }
    case 4: {
      const x = randInt(rng, 1, 9999); // hundredths
      const f = pick(rng, [10, 100]);
      const multiply = chance(rng, 0.5);
      const value = multiply ? (x * f) / 100 : x / 100 / f;
      return {
        prompt: `Hva er ${h(x)} ${multiply ? "·" : ":"} ${f}?`,
        answer: fmt(value),
        numeric: { value, allowDecimal: true },
        distractors: numDistractors(value, [value * 10, value / 10, multiply ? x / 100 / f : (x * f) / 100, value * 100], { integer: false }),
        statement: (s) => `${h(x)} ${multiply ? "·" : ":"} ${f} = ${s}`,
        explanation: `Når vi ${multiply ? "ganger" : "deler"} med ${f}, flytter vi kommaet ${f === 10 ? "én" : "to"} plass${f === 10 ? "" : "er"} mot ${multiply ? "høyre" : "venstre"}: ${fmt(value)}.`,
      };
    }
    default: {
      const t = randInt(rng, 1, 19); // tenths
      const n = randInt(rng, 2, 9);
      const value = (t * n) / 10;
      return {
        prompt: `Hva er ${fmt(t / 10)} · ${n}?`,
        answer: fmt(value),
        numeric: { value, allowDecimal: true },
        distractors: numDistractors(value, [(t * n) / 100, t * n, (t * n + n) / 10, (t * n - 1) / 10], { integer: false }),
        statement: (s) => `${fmt(t / 10)} · ${n} = ${s}`,
        explanation: `Regn ${t} · ${n} = ${t * n} og sett komma én plass inn, fordi ${fmt(t / 10)} har én desimal: ${fmt(value)}.`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Brøk
// ---------------------------------------------------------------------------
const frac = (a: number, b: number) => `${a}/${b}`;
const sameValue = (a: number, b: number, c: number, d: number) => a * d === b * c;

export function brok(level: number, rng: Rng): Core {
  switch (level) {
    case 1: {
      const n = pick(rng, [2, 3, 4, 5, 10]);
      const k = randInt(rng, 1, 10);
      const total = n * k;
      return {
        prompt: `Hva er ${frac(1, n)} av ${total}?`,
        answer: fmt(k),
        numeric: { value: k },
        distractors: numDistractors(k, [total - k, k * 2, total / 2, k + 1]),
        statement: (s) => `${frac(1, n)} av ${total} er ${s}`,
        explanation: `${frac(1, n)} av ${total} betyr ${total} delt i ${n} like deler: ${total} : ${n} = ${k}.`,
      };
    }
    case 2: {
      const n = randInt(rng, 3, 10);
      const m = randInt(rng, 2, n - 1);
      const k = randInt(rng, 2, 10);
      const total = n * k;
      const ans = m * k;
      return {
        prompt: `Hva er ${frac(m, n)} av ${total}?`,
        answer: fmt(ans),
        numeric: { value: ans },
        distractors: numDistractors(ans, [k, total - ans, ans + k, ans - k]),
        statement: (s) => `${frac(m, n)} av ${total} er ${s}`,
        explanation: `Først ${frac(1, n)} av ${total}: ${total} : ${n} = ${k}. Så ${m} slike deler: ${m} · ${k} = ${ans}.`,
      };
    }
    case 3: {
      const b = randInt(rng, 2, 6);
      const a = randInt(rng, 1, b - 1);
      const f = randInt(rng, 2, 5);
      const ans = a * f;
      return {
        prompt: `Hvilket tall mangler? ${frac(a, b)} = ?/${b * f}`,
        answer: fmt(ans),
        numeric: { value: ans },
        distractors: numDistractors(ans, [a + f, a + (b * f - b), b * f - a, ans + 1]),
        statement: (s) => `${frac(a, b)} = ${s}/${b * f}`,
        explanation: `Nevneren er ganget med ${f} (${b} · ${f} = ${b * f}). Da må telleren også ganges med ${f}: ${a} · ${f} = ${ans}.`,
      };
    }
    case 4: {
      // Largest of four fractions with different values.
      const chosen: [number, number][] = [];
      let guard = 0;
      while (chosen.length < 4 && guard++ < 500) {
        const d = randInt(rng, 2, 12);
        const nu = randInt(rng, 1, d - 1);
        if (chosen.some(([x, y]) => sameValue(x, y, nu, d))) continue;
        chosen.push([nu, d]);
      }
      chosen.sort((p, q) => q[0] * p[1] - p[0] * q[1]); // descending by value
      const [best, ...others] = chosen;
      return {
        prompt: "Hvilken brøk er størst?",
        answer: frac(...best),
        distractors: others.map(([x, y]) => frac(x, y)),
        formats: ["choice"],
        explanation: `${frac(...best)} ≈ ${fmt(best[0] / best[1], 2)} er størst. Tips: Gjør om til desimaltall, eller finn felles nevner.`,
      };
    }
    default: {
      const n = randInt(rng, 5, 12);
      const add = chance(rng, 0.6);
      let a: number;
      let b: number;
      if (add) {
        a = randInt(rng, 1, n - 2);
        b = randInt(rng, 1, n - 1 - a);
      } else {
        a = randInt(rng, 2, n - 1);
        b = randInt(rng, 1, a - 1);
      }
      const top = add ? a + b : a - b;
      const op = add ? "+" : "−";
      const wrong: [number, number][] = [
        [top, add ? 2 * n : 0],
        [top + 1, n],
        [Math.max(1, top - 1), n],
        [add ? a * b : a + b, n],
        [top, n + 1],
      ];
      const distractors = wrong
        .filter(([x, y]) => y > 0 && x > 0 && !sameValue(x, y, top, n))
        .map(([x, y]) => frac(x, y));
      const g = gcd(top, n);
      return {
        prompt: `Hva er ${frac(a, n)} ${op} ${frac(b, n)}?`,
        answer: frac(top, n),
        distractors,
        formats: ["choice", "truefalse"],
        statement: (s) => `${frac(a, n)} ${op} ${frac(b, n)} = ${s}`,
        explanation: `Når nevnerne er like, ${add ? "legger vi sammen" : "trekker vi fra"} bare tellerne: ${a} ${op} ${b} = ${top}. Nevneren blir ${n}.${g > 1 ? ` (${frac(top, n)} kan forkortes til ${frac(top / g, n / g)}.)` : ""}`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Omkrets og areal
// ---------------------------------------------------------------------------
const cm = (n: number) => `${fmt(n)}${NBSP}cm`;

/** Rectangle figure with the longer side horizontal-ish: `a` along the bottom, `b` up the left side. */
function rectFigure(a: number, b: number, opts: Omit<Extract<Figure, { type: "rect" }>, "type" | "w" | "h"> = {}): Figure {
  return { type: "rect", w: a, h: b, ...opts };
}

export function omkretsAreal(level: number, rng: Rng): Core {
  const askArea = chance(rng, 0.5);
  if (level <= 3) {
    let a: number;
    let b: number;
    if (level === 1) { a = randInt(rng, 2, 10); b = a; }
    else if (level === 2) { a = randInt(rng, 3, 10); b = randInt(rng, 2, a - 1); }
    else { a = randInt(rng, 6, 20); b = randInt(rng, 3, 15); if (a === b) a++; }
    const square = a === b;
    const shape = square
      ? `Et kvadrat har sider på ${a}${NBSP}cm.`
      : `Et rektangel er ${a}${NBSP}cm langt og ${b}${NBSP}cm bredt.`;
    const figure = square
      ? rectFigure(a, a, { labels: { bottom: cm(a) }, equalSides: true, shade: askArea })
      : rectFigure(a, b, { labels: { bottom: cm(a), left: cm(b) }, shade: askArea });
    const area = a * b;
    const perimeter = 2 * (a + b);
    if (askArea) {
      return {
        prompt: `${shape} Hva er arealet?`,
        answer: fmt(area),
        numeric: { value: area, unit: "cm²" },
        distractors: numDistractors(area, [perimeter, a + b, area + a, area - b]),
        explanation: `Areal = lengde · bredde = ${a} · ${b} = ${area}${NBSP}cm².`,
        figure,
      };
    }
    return {
      prompt: `${shape} Hva er omkretsen?`,
      answer: fmt(perimeter),
      numeric: { value: perimeter, unit: "cm" },
      distractors: numDistractors(perimeter, [area, a + b, 2 * a + b, perimeter + 2]),
      explanation: `Omkrets er summen av alle sidene: ${a} + ${b} + ${a} + ${b} = ${perimeter}${NBSP}cm.`,
      figure,
    };
  }
  if (level === 4) {
    const a = randInt(rng, 3, 12);
    let b = randInt(rng, 2, 11);
    if (b >= a) b++; // never equal sides – that would be a square, not a rectangle
    if (askArea) {
      const area = a * b;
      return {
        prompt: `Et rektangel har areal ${area}${NBSP}cm². Den ene siden er ${a}${NBSP}cm. Hvor lang er den andre siden?`,
        answer: fmt(b),
        numeric: { value: b, unit: "cm" },
        distractors: numDistractors(b, [area - a, area / 2, b + 1, a]),
        explanation: `Areal = lengde · bredde, så bredden = ${area} : ${a} = ${b}${NBSP}cm.`,
        figure: rectFigure(a, b, { labels: { bottom: cm(a), left: "?" }, center: `A = ${area}${NBSP}cm²`, shade: true }),
      };
    }
    const perimeter = 2 * (a + b);
    return {
      prompt: `Et rektangel har omkrets ${perimeter}${NBSP}cm. Den ene siden er ${a}${NBSP}cm. Hvor lang er den andre siden?`,
      answer: fmt(b),
      numeric: { value: b, unit: "cm" },
      distractors: numDistractors(b, [perimeter - a, perimeter / 2, perimeter - 2 * a, perimeter / 4]),
      explanation: `Halve omkretsen er ${perimeter / 2}${NBSP}cm (én lengde + én bredde). ${perimeter / 2} − ${a} = ${b}${NBSP}cm.`,
      figure: rectFigure(a, b, { labels: { bottom: cm(a), left: "?" }, center: `O = ${perimeter}${NBSP}cm` }),
    };
  }
  // Level 5: square from perimeter, or rectangle with decimal side lengths in metres.
  if (chance(rng, 0.5)) {
    const s = randInt(rng, 2, 15);
    const perimeter = 4 * s;
    return {
      prompt: `Et kvadrat har omkrets ${perimeter}${NBSP}cm. Hva er arealet?`,
      answer: fmt(s * s),
      numeric: { value: s * s, unit: "cm²" },
      distractors: numDistractors(s * s, [perimeter, (perimeter / 2) ** 2, s * 2, perimeter * s]),
      explanation: `Hver side er ${perimeter} : 4 = ${s}${NBSP}cm. Areal = ${s} · ${s} = ${s * s}${NBSP}cm².`,
      figure: rectFigure(s, s, { center: `O = ${perimeter}${NBSP}cm`, equalSides: true, shade: true }),
    };
  }
  let a10 = randInt(rng, 11, 49); // decimetres → e.g. 2,5 m
  const b = randInt(rng, 2, 8);
  if (a10 === b * 10) a10 += 5; // avoid a square room
  const area = (a10 * b) / 10;
  return {
    prompt: `Et rom er ${fmt(a10 / 10)}${NBSP}m langt og ${b}${NBSP}m bredt. Hva er arealet?`,
    answer: fmt(area),
    numeric: { value: area, unit: "m²", allowDecimal: true },
    distractors: numDistractors(area, [2 * (a10 / 10 + b), a10 * b, area + b, (a10 * b) / 100], { integer: false }),
    explanation: `Areal = ${fmt(a10 / 10)} · ${b} = ${fmt(area)}${NBSP}m².`,
    figure: rectFigure(a10 / 10, b, { labels: { bottom: `${fmt(a10 / 10)}${NBSP}m`, left: `${b}${NBSP}m` }, shade: true }),
  };
}
