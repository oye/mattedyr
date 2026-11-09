import { useState } from "react";
import { GRADE_LABELS, GRADES, schoolStage, skillsForGrade } from "../engine/skills";
import { useStore } from "../store";
import { PET_COLOR_HEX, PET_COLORS } from "./Pet";

const GOALS = [10, 20, 30, 40];

export function SettingsView() {
  const s = useStore();
  const profile = s.profile!;
  const [confirmReset, setConfirmReset] = useState(false);
  const skills = skillsForGrade(profile.grade);
  const allKeys = skills.map((k) => k.key);

  return (
    <div className="page">
      <h1>For voksne</h1>
      <p className="subtle">Innstillinger for foreldre og lærere.</p>

      <section className="panel">
        <h3>Trinn</h3>
        <div className="segmented">
          {GRADES.map((g) => (
            <button key={g} className={profile.grade === g ? "on" : ""} onClick={() => s.setGrade(g)}>
              {g}.
            </button>
          ))}
        </div>
        <p className="small">
          {GRADE_LABELS[profile.grade]} · {schoolStage(profile.grade)}. Trinnet bestemmer hvilke tema som er med og hvor
          vanskelig nye tema starter. Fremgangen du allerede har, beholdes.
        </p>
      </section>

      <section className="panel">
        <h3>Dagens mål</h3>
        <div className="segmented">
          {GOALS.map((g) => (
            <button key={g} className={s.dailyGoal === g ? "on" : ""} onClick={() => s.setDailyGoal(g)}>
              {g}
            </button>
          ))}
        </div>
        <p className="small">Antall oppgaver per dag. 20 oppgaver tar vanligvis 5–10 minutter.</p>
      </section>

      <section className="panel">
        <h3>Tema</h3>
        <p className="small">Velg hvilke tema som skal øves på. Alle er på som standard.</p>
        <ul className="toggles">
          {skills.map((k) => {
            const on = s.enabledSkills.length === 0 || s.enabledSkills.includes(k.key);
            return (
              <li key={k.key}>
                <label>
                  <span>
                    {k.emoji} {k.title}
                    <small>{k.curriculum}</small>
                  </span>
                  <input type="checkbox" checked={on} onChange={() => s.toggleSkill(k.key, allKeys)} />
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h3>Kjæledyret</h3>
        <label className="field">
          Navn
          <input
            value={profile.petName}
            maxLength={16}
            onChange={(e) => s.setPet({ petName: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && s.setPet({ petName: "Pixel" })}
          />
        </label>
        <div className="colors">
          {PET_COLORS.map((c) => (
            <button
              key={c}
              className={`color ${profile.petColor === c ? "on" : ""}`}
              style={{ background: PET_COLOR_HEX[c] }}
              onClick={() => s.setPet({ petColor: c })}
              aria-label={c}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <label className="toggle-row">
          <span>🔊 Lyd</span>
          <input type="checkbox" checked={s.sound} onChange={(e) => s.setSound(e.target.checked)} />
        </label>
      </section>

      <section className="panel">
        <h3>Om Mattedyr</h3>
        <p className="small">
          Oppgavene er laget etter kompetansemålene i læreplanen i matematikk (LK20). Appen lagrer alt lokalt på
          denne enheten – ingen konto, ingen reklame og ingen data sendes noe sted.
        </p>
        {confirmReset ? (
          <div className="row">
            <button className="btn btn-danger" onClick={() => s.reset()}>
              Ja, slett alt
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)}>
              Avbryt
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            Start på nytt …
          </button>
        )}
      </section>
    </div>
  );
}

