import type { Grade } from "./types";

export interface Fact {
  emoji: string;
  title: string;
  body: string;
  /** Which grades the fact suits. */
  grades: Grade[];
}

const MIDDLE: Grade[] = [5, 6, 7];
const LOWER_SECONDARY: Grade[] = [8, 9, 10];
const ALL: Grade[] = [...MIDDLE, ...LOWER_SECONDARY];

export const FACTS: Fact[] = [
  { emoji: "🔟", title: "Visste du at …", body: "… en googol er 1 med 100 nuller etter? Navnet ble funnet på av en ni år gammel gutt for rundt hundre år siden.", grades: ALL },
  { emoji: "🐝", title: "Bienes matte", body: "Bier bygger sekskantede celler. Sekskanter dekker en flate uten hull og bruker minst mulig voks.", grades: ALL },
  { emoji: "🖐️", title: "9-gangen på fingrene", body: "Hold opp alle ti fingrene. Skal du regne 9 · 4, bøyer du finger nummer 4. Til venstre står 3 fingre (tiere), til høyre 6 (enere): 36!", grades: MIDDLE },
  { emoji: "🧒", title: "Lille Gauss", body: "Matematikeren Gauss skal ha lagt sammen alle tallene fra 1 til 100 på et blunk som barn: 50 par som hver blir 101. Svaret er 5050.", grades: ALL },
  { emoji: "🏛️", title: "Romertall", body: "Romerne hadde ikke noe tegn for null. MMXXVI betyr 2026.", grades: ALL },
  { emoji: "🎂", title: "Bursdagsparadokset", body: "Er det 23 personer i et rom, er det over 50 % sjanse for at to av dem har bursdag samme dag!", grades: LOWER_SECONDARY },
  { emoji: "⭕", title: "Pi", body: "Del omkretsen av en sirkel på diameteren, og du får alltid ca. 3,14. Det tallet kalles π (pi), og desimalene slutter aldri.", grades: ALL },
  { emoji: "🧮", title: "Algoritme", body: "Ordet «algoritme» kommer fra navnet til den persiske matematikeren al-Khwarizmi, som levde for over 1100 år siden.", grades: ALL },
  { emoji: "🥶", title: "Negative tall", body: "Europeiske matematikere kalte lenge negative tall «absurde». Men en vinterdag på −10 °C viser at de er ganske ekte!", grades: LOWER_SECONDARY },
  { emoji: "🔁", title: "Tverrsum-triks", body: "Gang et tall med 9, og legg sammen sifrene i svaret. Fortsett til du har ett siffer igjen – da får du alltid 9! Prøv: 9 · 47 = 423 → 4 + 2 + 3 = 9. Eller 9 · 99 = 891 → 8 + 9 + 1 = 18 → 1 + 8 = 9.", grades: ALL },
  { emoji: "📅", title: "Skuddår", body: "Et skuddår har 366 dager. Neste skuddår er 2028.", grades: MIDDLE },
  { emoji: "√", title: "Kvadratroten av 2", body: "√2 ≈ 1,414 … kan ikke skrives som en brøk. Det ble bevist i antikkens Hellas for over 2000 år siden.", grades: LOWER_SECONDARY },
  { emoji: "🍕", title: "Brøk i hverdagen", body: "Deler du en pizza i 8 biter og spiser 2, har du spist 2/8 = 1/4 av pizzaen.", grades: MIDDLE },
  { emoji: "💸", title: "Prosent betyr «per hundre»", body: "Ordet kommer fra latin «per centum». 25 % betyr 25 av 100.", grades: LOWER_SECONDARY },
  { emoji: "♾️", title: "Uendelig", body: "Det finnes ikke noe største tall. Uansett hvor stort tall du tenker på, kan du alltid legge til 1.", grades: ALL },
];

export function factsForGrade(grade: Grade): Fact[] {
  return FACTS.filter((f) => f.grades.includes(grade));
}
