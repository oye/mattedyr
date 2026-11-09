import { useStatus } from "../hooks";
import { useStore } from "../store";
import { Pet } from "./Pet";

export interface CelebrationData {
  kind: "stage" | "goal";
  title: string;
  text: string;
}

const CONFETTI_COLORS = ["#ffd93b", "#ff7eb6", "#4cc38a", "#4aa8ff", "#ff9f43", "#8b6cff"];

export function Celebration({ data, onClose }: { data: CelebrationData; onClose: () => void }) {
  const profile = useStore((s) => s.profile);
  const equipped = useStore((s) => s.equipped);
  const { pet } = useStatus();
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 9) * 0.12}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="modal celebrate" onClick={(e) => e.stopPropagation()}>
        {profile && (
          <Pet stage={pet.stage.key} mood="glad" color={profile.petColor} equipped={equipped} size={150} className="bounce" />
        )}
        <h2>{data.title}</h2>
        <p>{data.text}</p>
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Hurra!
        </button>
      </div>
    </div>
  );
}

