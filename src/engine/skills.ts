import { brok, desimaltall, divisjon, gangetabell, omkretsAreal, plassverdi } from "./generators/grade5";
import { ligninger, negativeTall, potenser, proporsjonalitet, prosent, uttrykk } from "./generators/grade8";
import { funksjoner, pytagoras, sannsynlighet, standardform } from "./generators/grade9";
import { MIN_LEVEL } from "./mastery";
import type { Grade, Skill } from "./types";

export const GRADES: Grade[] = [5, 6, 7, 8, 9, 10];

/**
 * All skills in the app. `curriculum` refers to LK20, Læreplan i matematikk 1.–10. trinn (MAT01-05).
 * The exact competence aims can be looked up (and later linked) via Udir's Grep API.
 *
 * `grades` maps each grade the skill is practised in to the starting level (1–5) for a new
 * learner in that grade. Higher grades start further up and repeat earlier topics at a harder level;
 * the adaptive mastery takes over after the first answers. The mapping is a rough progression
 * based on LK20 and can be tuned freely.
 */
export const SKILLS: Skill[] = [
  { key: "gangetabell", title: "Gangetabellen", emoji: "✖️", grades: { 5: 1, 6: 3, 7: 4 }, curriculum: "Tall og regning – multiplikasjon", generate: gangetabell },
  { key: "divisjon", title: "Divisjon", emoji: "➗", grades: { 5: 1, 6: 2, 7: 3 }, curriculum: "Tall og regning – divisjon", generate: divisjon },
  { key: "plassverdi", title: "Plassverdi og avrunding", emoji: "🔢", grades: { 5: 1, 6: 2, 7: 3 }, curriculum: "Tall og regning – titallssystemet", generate: plassverdi },
  { key: "desimaltall", title: "Desimaltall", emoji: "🔸", grades: { 5: 1, 6: 2, 7: 3, 8: 4 }, curriculum: "Tall og regning – desimaltall", generate: desimaltall },
  { key: "brok", title: "Brøk", emoji: "🍕", grades: { 5: 1, 6: 2, 7: 3, 8: 4, 9: 5 }, curriculum: "Tall og regning – brøk", generate: brok },
  { key: "omkrets_areal", title: "Omkrets og areal", emoji: "📐", grades: { 5: 1, 6: 2, 7: 3, 8: 4 }, curriculum: "Geometri og måling – omkrets og areal", generate: omkretsAreal },

  { key: "negative_tall", title: "Negative tall", emoji: "🌡️", grades: { 7: 1, 8: 2, 9: 3, 10: 4 }, curriculum: "Tall og regning – negative tall", generate: negativeTall },
  { key: "prosent", title: "Prosent", emoji: "💯", grades: { 6: 1, 7: 2, 8: 3, 9: 4, 10: 5 }, curriculum: "Tall og regning – prosent", generate: prosent },
  { key: "potenser", title: "Potenser og kvadratrøtter", emoji: "🚀", grades: { 8: 1, 9: 2, 10: 3 }, curriculum: "Tall og regning – potenser og kvadratrøtter", generate: potenser },
  { key: "uttrykk", title: "Algebraiske uttrykk", emoji: "🔤", grades: { 6: 1, 7: 1, 8: 2, 9: 3, 10: 4 }, curriculum: "Algebra – uttrykk med variabler", generate: uttrykk },
  { key: "ligninger", title: "Ligninger", emoji: "⚖️", grades: { 7: 1, 8: 2, 9: 3, 10: 4 }, curriculum: "Algebra – ligninger", generate: ligninger },
  { key: "proporsjonalitet", title: "Proporsjonalitet", emoji: "📈", grades: { 8: 1, 9: 2, 10: 3 }, curriculum: "Funksjoner – proporsjonalitet", generate: proporsjonalitet },
  { key: "sannsynlighet", title: "Sannsynlighet", emoji: "🎲", grades: { 8: 1, 9: 2, 10: 3 }, curriculum: "Statistikk og sannsynlighet – sannsynlighet", generate: sannsynlighet },

  { key: "pytagoras", title: "Pytagoras", emoji: "🔺", grades: { 9: 1, 10: 2 }, curriculum: "Geometri og måling – Pytagoras’ setning", generate: pytagoras },
  { key: "funksjoner", title: "Lineære funksjoner", emoji: "📉", grades: { 9: 1, 10: 2 }, curriculum: "Funksjoner – lineære funksjoner og grafer", generate: funksjoner },
  { key: "standardform", title: "Standardform", emoji: "🔭", grades: { 9: 1, 10: 2 }, curriculum: "Tall og regning – standardform", generate: standardform },
];

export const SKILLS_BY_KEY: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.key, s]));

export function skillsForGrade(grade: Grade): Skill[] {
  return SKILLS.filter((s) => s.grades[grade] !== undefined);
}

/** Starting level for a skill in the given grade (MIN_LEVEL if the skill is not part of that grade). */
export function startLevel(skill: Skill | undefined, grade: Grade): number {
  return skill?.grades[grade] ?? MIN_LEVEL;
}

export const GRADE_LABELS: Record<Grade, string> = {
  5: "5. trinn",
  6: "6. trinn",
  7: "7. trinn",
  8: "8. trinn",
  9: "9. trinn",
  10: "10. trinn",
};

export function schoolStage(grade: Grade): string {
  return grade <= 7 ? "Mellomtrinnet" : "Ungdomsskolen";
}
