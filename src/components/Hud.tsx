import { useStatus } from "../hooks";
import { useStore } from "../store";
import { Pet } from "./Pet";

/** Top bar: pet + daily goal ring, streak and coins. Tapping the pet opens the pet page. */
export function Hud({ onOpenPet }: { onOpenPet?: () => void }) {
  const coins = useStore((s) => s.coins);
  const profile = useStore((s) => s.profile);
  const equipped = useStore((s) => s.equipped);
  const { log, dailyGoal, goalProgress, streak, mood, pet } = useStatus();
  if (!profile) return null;

  const r = 25;
  const circumference = 2 * Math.PI * r;
  return (
    <header className="hud">
      <button className="hud-pet-btn" onClick={onOpenPet} aria-label={`Gå til ${profile.petName}`}>
        <div className="hud-goal" title="Dagens mål">
          <svg viewBox="0 0 60 60" className="ring">
            <circle cx="30" cy="30" r={r} className="ring-bg" />
            <circle
              cx="30"
              cy="30"
              r={r}
              className={`ring-fg ${log.goalReached ? "done" : ""}`}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - goalProgress)}
            />
          </svg>
          <Pet
            stage={pet.stage.key}
            mood={mood}
            color={profile.petColor}
            equipped={equipped}
            hatchProgress={pet.progress}
            size={40}
            className="hud-pet"
          />
        </div>
        <div className="hud-text">
          <strong>{profile.petName}</strong>
          <span>
            {log.goalReached ? "Dagens mål nådd! 🎉" : `${Math.min(log.cards, dailyGoal)} / ${dailyGoal} i dag`}
          </span>
        </div>
      </button>
      <div className={`chip ${streak.todayDone ? "chip-hot" : ""}`} title="Dager på rad">
        🔥 {streak.streak}
      </div>
      <div className="chip" title="Mynter">
        🪙 {coins}
      </div>
    </header>
  );
}

