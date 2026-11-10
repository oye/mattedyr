import { useEffect, useState } from "react";
import { addDays, MOOD_TEXT, PET_STAGES, parseDayKey } from "../engine/rewards";
import { useStatus } from "../hooks";
import { ITEMS } from "../shop";
import { play } from "../sfx";
import { useStore } from "../store";
import { Pet } from "./Pet";

const WEEKDAYS = ["sø", "ma", "ti", "on", "to", "fr", "lø"];

export function PetView() {
  const profile = useStore((s) => s.profile)!;
  const xp = useStore((s) => s.xp);
  const coins = useStore((s) => s.coins);
  const owned = useStore((s) => s.owned);
  const equipped = useStore((s) => s.equipped);
  const days = useStore((s) => s.days);
  const buy = useStore((s) => s.buy);
  const equip = useStore((s) => s.equip);
  const seeShop = useStore((s) => s.seeShop);
  const sound = useStore((s) => s.sound);
  const { today, mood, pet, streak } = useStatus();
  const [hearts, setHearts] = useState<number[]>([]);
  const [bounce, setBounce] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (pet.stage.key !== "egg") seeShop();
  }, [coins, pet.stage.key, seeShop]);

  const pat = () => {
    play("tap", sound);
    setBounce((b) => b + 1); // remounts the pet so the animation restarts on every tap
    setBouncing(true);
    window.setTimeout(() => setBouncing(false), 600);
    const id = Date.now();
    setHearts((h) => [...h.slice(-5), id]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
  };

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className="page">
      <section className="pet-home">
        <div className="pet-stagewrap">
          <Pet
            key={bounce}
            stage={pet.stage.key}
            mood={mood}
            color={profile.petColor}
            equipped={equipped}
            hatchProgress={pet.progress}
            size={230}
            className={bouncing ? "bounce" : "idle"}
            onClick={pat}
          />
          {hearts.map((id, i) => (
            <span key={id} className="heart" style={{ left: `${40 + ((i * 13) % 25)}%` }}>
              💜
            </span>
          ))}
        </div>
        <h1>{profile.petName}</h1>
        <p className="mood">
          {pet.stage.key === "egg" ? "Egget venter på å klekkes. Svar på oppgaver for å varme det! 🥚" : `${profile.petName} ${MOOD_TEXT[mood]}`}
        </p>
        <div className="stage-bar">
          <div className="stage-labels">
            <span>{pet.stage.name}</span>
            <span>{pet.next ? `${xp} / ${pet.next.minXp} XP → ${pet.next.name}` : `${xp} XP · fullt utvokst! 🌟`}</span>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${pet.progress * 100}%` }} />
          </div>
          <div className="stage-dots">
            {PET_STAGES.map((s, i) => (
              <span key={s.key} className={i <= pet.index ? "on" : ""} title={s.name} />
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>
          🔥 {streak.streak} {streak.streak === 1 ? "dag" : "dager"} på rad
        </h3>
        <div className="week">
          {week.map((d) => {
            const log = days[d];
            const state = log?.goalReached ? "goal" : streak.frozen.includes(d) ? "frozen" : log?.cards ? "some" : "";
            return (
              <div key={d} className={`day ${state} ${d === today ? "today" : ""}`}>
                <span className="day-mark">{state === "goal" ? "✓" : state === "frozen" ? "❄️" : state === "some" ? "·" : ""}</span>
                <span className="day-name">{WEEKDAYS[parseDayKey(d).getDay()]}</span>
              </div>
            );
          })}
        </div>
        <p className="small">
          Nå dagens mål hver dag for å bygge rekka. Glemmer du en dag, brukes en fridag ❄️ automatisk, så rekka ikke
          ryker. Du har to fridager hver uke.
        </p>
      </section>

      <section className="panel">
        <h3>
          Butikken <span className="chip">🪙 {coins}</span>
        </h3>
        {pet.stage.key === "egg" && <p className="small">Klekk egget først, så kan du kle på dyret ditt!</p>}
        <div className="shop">
          {ITEMS.map((item) => {
            const has = owned.includes(item.key);
            const worn = equipped[item.slot] === item.key;
            return (
              <div key={item.key} className={`shop-item ${worn ? "worn" : ""}`}>
                <Pet
                  stage={pet.stage.key === "egg" ? "baby" : pet.stage.key}
                  mood="fornoyd"
                  color={profile.petColor}
                  equipped={{ [item.slot]: item.key }}
                  size={64}
                />
                <span className="shop-name">{item.name}</span>
                {has ? (
                  <button className="btn btn-small" onClick={() => equip(item.key)}>
                    {worn ? "Ta av" : "Ta på"}
                  </button>
                ) : (
                  <button
                    className="btn btn-small btn-primary"
                    disabled={coins < item.price}
                    onClick={() => buy(item.key) && play("levelup", sound)}
                  >
                    🪙 {item.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

