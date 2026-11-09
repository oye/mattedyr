import { addDays, parseDayKey } from "../engine/rewards";
import { isDue, recentAccuracy } from "../engine/mastery";
import { GRADE_LABELS, schoolStage, skillsForGrade, startLevel } from "../engine/skills";
import { useStatus } from "../hooks";
import { useStore } from "../store";

const WEEKDAYS = ["sø", "ma", "ti", "on", "to", "fr", "lø"];

export function ProgressView() {
  const profile = useStore((s) => s.profile)!;
  const progress = useStore((s) => s.progress);
  const days = useStore((s) => s.days);
  const xp = useStore((s) => s.xp);
  const enabled = useStore((s) => s.enabledSkills);
  const { today, dailyGoal } = useStatus();

  const all = Object.values(days);
  const cards = all.reduce((s, d) => s + d.cards, 0);
  const correct = all.reduce((s, d) => s + d.correct, 0);
  const goalDays = all.filter((d) => d.goalReached).length;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const maxCards = Math.max(dailyGoal, ...week.map((d) => days[d]?.cards ?? 0));
  const now = Date.now();

  return (
    <div className="page">
      <h1>Fremgang</h1>
      <p className="subtle">
        {GRADE_LABELS[profile.grade]} · {schoolStage(profile.grade)}
      </p>

      <div className="stats">
        <div className="stat">
          <strong>{cards}</strong>
          <span>oppgaver</span>
        </div>
        <div className="stat">
          <strong>{cards ? Math.round((100 * correct) / cards) : 0} %</strong>
          <span>riktige</span>
        </div>
        <div className="stat">
          <strong>{goalDays}</strong>
          <span>mål nådd</span>
        </div>
        <div className="stat">
          <strong>{xp}</strong>
          <span>XP</span>
        </div>
      </div>

      <section className="panel">
        <h3>Siste 7 dager</h3>
        <div className="chart">
          {week.map((d) => {
            const log = days[d];
            return (
              <div key={d} className="chart-col">
                <div className="chart-bar-wrap">
                  <div
                    className={`chart-bar ${log?.goalReached ? "goal" : ""}`}
                    style={{ height: `${((log?.cards ?? 0) / maxCards) * 100}%` }}
                  />
                  <div className="chart-goal" style={{ bottom: `${(dailyGoal / maxCards) * 100}%` }} />
                </div>
                <span className="chart-n">{log?.cards ?? 0}</span>
                <span className="chart-day">{WEEKDAYS[parseDayKey(d).getDay()]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Ferdigheter</h3>
        <ul className="skills">
          {skillsForGrade(profile.grade).map((skill) => {
            const p = progress[skill.key];
            const acc = recentAccuracy(p);
            const off = enabled.length > 0 && !enabled.includes(skill.key);
            const level = p?.level ?? startLevel(skill, profile.grade);
            return (
              <li key={skill.key} className={off ? "off" : ""}>
                <span className="skill-emoji">{skill.emoji}</span>
                <div className="skill-main">
                  <div className="skill-title">
                    {skill.title}
                    {isDue(p, now) && <span className="tag tag-review">🔁 klar for repetisjon</span>}
                    {off && <span className="tag">av</span>}
                  </div>
                  <div className="skill-level" aria-label={`Nivå ${level.toFixed(1)} av 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className="pip">
                        <span style={{ width: `${Math.max(0, Math.min(1, level - n + 1)) * 100}%` }} />
                      </span>
                    ))}
                  </div>
                  <div className="small">
                    {p ? `${p.correct + p.wrong} forsøk${acc !== null ? ` · ${Math.round(acc * 100)} % riktig siste ${p.recent.length}` : ""}` : "Ikke prøvd ennå"}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="small">
          Nivået justeres automatisk slik at oppgavene er passe utfordrende. Ferdigheter du har lært, dukker opp igjen
          etter 1, 2, 4, 7 og 14 dager så du ikke glemmer dem.
        </p>
      </section>
    </div>
  );
}

