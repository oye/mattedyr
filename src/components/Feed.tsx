/** The main swipe feed: one card at a time, swipe up for the next. */
import { useCallback, useEffect, useRef, useState } from "react";
import { checkAnswer } from "../engine/build";
import type { CardPick } from "../engine/feed";
import { SKILLS_BY_KEY } from "../engine/skills";
import type { Grade, InfoCard, Question } from "../engine/types";
import { useStatus } from "../hooks";
import { play } from "../sfx";
import { useStore, type AnswerResult } from "../store";
import { Celebration, type CelebrationData } from "./Celebration";
import { FigureView } from "./FigureView";
import { Hud } from "./Hud";
import { ChoiceInput, NumericInput, TrueFalseInput } from "./inputs";
import { useDrag } from "./useDrag";

interface Result {
  input: string;
  correct: boolean;
  reward: AnswerResult;
}

const PRAISE = ["Riktig!", "Supert!", "Helt rett!", "Bra jobba!", "Strålende!", "Knallbra!"];
const ENCOURAGE = ["Nesten!", "Godt forsøk!", "Ikke helt …", "Nå lærer du!"];
const pickText = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/**
 * An unanswered question is kept here while the feed is not shown (e.g. when visiting the pet
 * page), so switching tabs neither loses nor skips it.
 */
let parked: { pick: CardPick; grade: Grade } | null = null;

export function Feed({ onOpenPet }: { onOpenPet?: () => void }) {
  const draw = useStore((s) => s.draw);
  const answer = useStore((s) => s.answer);
  const seeInfo = useStore((s) => s.seeInfo);
  const sound = useStore((s) => s.sound);
  const petName = useStore((s) => s.profile?.petName ?? "Dyret");
  const grade = useStore((s) => s.profile?.grade ?? 5);
  const { dailyGoal } = useStatus();

  const [pick, setPick] = useState<CardPick>(() => {
    const saved = parked?.grade === grade ? parked.pick : null;
    parked = null;
    return saved ?? draw();
  });
  const [result, setResult] = useState<Result | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [combo, setCombo] = useState(0);
  const [celebrations, setCelebrations] = useState<CelebrationData[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const shownAt = useRef(Date.now());

  const card = pick.card;
  const done = card.kind === "info" || result !== null;

  // Park the current question when the feed is unmounted before it has been answered.
  const unanswered = useRef<CardPick | null>(null);
  unanswered.current = card.kind === "question" && !result ? pick : null;
  useEffect(() => {
    parked = null; // also undoes React StrictMode's simulated unmount in development
    return () => {
      if (unanswered.current) parked = { pick: unanswered.current, grade };
    };
  }, [grade]);

  useEffect(() => {
    shownAt.current = Date.now();
    if (card.kind === "info") seeInfo(card);
  }, [card, seeInfo]);

  const next = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      setResult(null);
      setPick(draw());
      setLeaving(false);
    }, 220);
  }, [draw, leaving]);

  const submit = useCallback(
    (input: string) => {
      if (card.kind !== "question" || result) return;
      const correct = checkAnswer(card, input);
      const reward = answer(card, correct, Date.now() - shownAt.current);
      setResult({ input, correct, reward });
      setCombo((c) => (correct ? c + 1 : 0));
      setFeedbackText(correct ? pickText(PRAISE) : pickText(ENCOURAGE));
      play(correct ? "correct" : "wrong", sound);

      const extra: CelebrationData[] = [];
      if (reward.newStage) {
        extra.push(
          reward.newStage === "Baby"
            ? { kind: "stage", title: "Egget klekket! 🐣", text: `Hils på ${petName}! Fortsett å regne, så vokser den.` }
            : { kind: "stage", title: `${petName} har vokst! 🎉`, text: `Nå er ${petName} ${reward.newStage.toLowerCase()}.` },
        );
      }
      if (reward.goalReached) {
        extra.push({
          kind: "goal",
          title: "Dagens mål er nådd! 🏆",
          text: `Du har gjort ${dailyGoal} oppgaver i dag. ${petName} er mett og glad – og du fikk 10 bonusmynter!`,
        });
      }
      if (extra.length) {
        window.setTimeout(() => {
          play("goal", sound);
          setCelebrations((c) => [...c, ...extra]);
        }, 700);
      }
    },
    [answer, card, dailyGoal, petName, result, sound],
  );

  // Swipe up (or press Enter / Space / ↑) for the next card once this one is done.
  const { offset, dragging, handlers } = useDrag({ axis: "y", enabled: done && !leaving, only: -1, onSwipe: next });
  useEffect(() => {
    if (!done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        next();
      }
    };
    // Delay so the Enter that submitted the answer does not also skip the feedback.
    const t = window.setTimeout(() => window.addEventListener("keydown", onKey), 250);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [done, next]);

  return (
    <div className="feed">
      <Hud onOpenPet={onOpenPet} />
      <div className="feed-stage">
        <div
          key={card.id}
          className={`card ${leaving ? "card-leave" : "card-enter"} ${dragging ? "dragging" : ""} ${
            card.kind === "question" && card.boss ? "card-boss" : ""
          } ${result ? (result.correct ? "card-correct" : "card-wrong") : ""}`}
          style={{ transform: offset ? `translateY(${Math.min(0, offset)}px)` : undefined }}
          {...handlers}
        >
          {card.kind === "info" ? (
            <InfoContent card={card} />
          ) : (
            <QuestionContent q={card} mode={pick.mode} result={result} onSubmit={submit} />
          )}

          {result && card.kind === "question" && (
            <div className={`feedback ${result.correct ? "ok" : "miss"}`}>
              <div className="feedback-head">
                <strong>{feedbackText}</strong>
                {result.correct ? (
                  <span className="reward">
                    +{result.reward.xp} XP{result.reward.coins > 0 && <> · +{result.reward.coins} 🪙</>}
                  </span>
                ) : (
                  <span className="reward">Svar: {card.correctText}</span>
                )}
              </div>
              {result.correct && combo >= 3 && <div className="combo">🔥 {combo} riktige på rad!</div>}
              {!result.correct && <p className="explanation">{card.explanation}</p>}
            </div>
          )}

          {done && (
            <button className="next-btn" onClick={next}>
              <span className="next-arrow">↑</span> Sveip opp for neste
            </button>
          )}
        </div>
      </div>
      {celebrations.length > 0 && (
        <Celebration data={celebrations[0]} onClose={() => setCelebrations((c) => c.slice(1))} />
      )}
    </div>
  );
}

function InfoContent({ card }: { card: InfoCard }) {
  return (
    <div className="info">
      <div className="info-emoji">{card.emoji}</div>
      <h2>{card.title}</h2>
      <p>{card.body}</p>
    </div>
  );
}

function QuestionContent({
  q,
  mode,
  result,
  onSubmit,
}: {
  q: Question;
  mode: CardPick["mode"];
  result: Result | null;
  onSubmit: (input: string) => void;
}) {
  const skill = SKILLS_BY_KEY[q.skill];
  const submitted = result?.input ?? null;
  return (
    <div className={`question format-${q.format} ${q.figure ? "has-figure" : ""}`}>
      <div className="card-tags">
        <span className="tag">
          {skill?.emoji} {skill?.title}
        </span>
        {mode === "boss" && <span className="tag tag-boss">👾 Boss · dobbel belønning</span>}
        {mode === "review" && <span className="tag tag-review">🔁 Repetisjon</span>}
      </div>
      <div className="question-body">
        <h2 className="prompt">{q.prompt}</h2>
        {q.figure && <FigureView figure={q.figure} />}
      </div>
      <div className="answer-area">
        {q.format === "numeric" && <NumericInput q={q} submitted={submitted} onSubmit={onSubmit} />}
        {q.format === "choice" && <ChoiceInput q={q} submitted={submitted} onSubmit={onSubmit} />}
        {q.format === "truefalse" && <TrueFalseInput q={q} submitted={submitted} onSubmit={onSubmit} />}
      </div>
    </div>
  );
}

