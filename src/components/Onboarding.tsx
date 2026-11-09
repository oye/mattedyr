import { useState } from "react";
import { GRADES, schoolStage } from "../engine/skills";
import type { Grade } from "../engine/types";
import { useStore, type PetColor } from "../store";
import { Pet, PET_COLOR_HEX, PET_COLORS } from "./Pet";

const NAME_IDEAS = ["Pixel", "Tallulf", "Brøkus", "Nulli", "Pi", "Sifra", "Kubbe", "Plussi"];

export function Onboarding() {
  const setup = useStore((s) => s.setup);
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [color, setColor] = useState<PetColor>("lilla");
  const [name, setName] = useState(() => NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)]);

  return (
    <div className="onboarding">
      {step === 0 && (
        <div className="onb-step">
          <Pet stage="baby" mood="glad" color="lilla" size={180} className="idle" />
          <h1>Mattedyr</h1>
          <p>Sveip deg gjennom matteoppgaver, tjen XP og se kjæledyret ditt vokse fra egg til ferdig utvokst!</p>
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>
            Kom i gang
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="onb-step">
          <h2>Hvilket trinn går du på?</h2>
          {(["Mellomtrinnet", "Ungdomsskolen"] as const).map((stage) => (
            <div key={stage} className="grade-group">
              <span className="grade-group-label">
                {stage === "Mellomtrinnet" ? "🎒" : "🎓"} {stage}
              </span>
              <div className="grade-picks">
                {GRADES.filter((g) => schoolStage(g) === stage).map((g) => (
                  <button key={g} className={`grade-pick ${grade === g ? "on" : ""}`} onClick={() => setGrade(g)}>
                    <strong>{g}.</strong>
                    <span>trinn</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-block" disabled={!grade} onClick={() => setStep(2)}>
            Videre
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="onb-step">
          <h2>Velg ditt egg</h2>
          <Pet stage="egg" mood="sulten" color={color} size={170} className="idle" />
          <div className="colors">
            {PET_COLORS.map((c) => (
              <button
                key={c}
                className={`color ${color === c ? "on" : ""}`}
                style={{ background: PET_COLOR_HEX[c] }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
          <label className="field">
            Hva skal dyret hete?
            <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
          </label>
          <button
            className="btn btn-primary btn-block"
            disabled={!name.trim()}
            onClick={() => setup({ grade: grade!, petColor: color, petName: name.trim() })}
          >
            Start! 🥚
          </button>
        </div>
      )}

      <div className="onb-dots">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i === step ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

