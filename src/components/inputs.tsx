/** Answer inputs for the three question formats. */
import { useEffect, useState } from "react";
import { MINUS } from "../engine/format";
import type { ChoiceQuestion, NumericQuestion, TrueFalseQuestion } from "../engine/types";
import { useDrag } from "./useDrag";

interface InputProps<Q> {
  q: Q;
  /** The submitted answer, once answered. */
  submitted: string | null;
  onSubmit: (input: string) => void;
}

// ---------------------------------------------------------------------------
// Number pad
// ---------------------------------------------------------------------------
export function NumericInput({ q, submitted, onSubmit }: InputProps<NumericQuestion>) {
  const [text, setText] = useState("");
  const locked = submitted !== null;
  const value = locked ? submitted : text;

  const press = (key: string) => {
    if (locked) return;
    setText((t) => {
      if (key === "⌫") return t.slice(0, -1);
      if (key === MINUS) return t.startsWith(MINUS) ? t.slice(1) : MINUS + t;
      if (key === ",") return t.includes(",") ? t : (t === "" || t === MINUS ? t + "0" : t) + ",";
      const digits = t.replace(/\D/g, "");
      if (digits.length >= 9) return t;
      if (t === "0") return key;
      if (t === MINUS + "0") return MINUS + key;
      return t + key;
    });
  };
  const canSubmit = !locked && /\d/.test(text);
  const submit = () => canSubmit && onSubmit(text);

  // Physical keyboard support (desktop / tablets with keyboard).
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
      else if ((e.key === "," || e.key === ".") && q.allowDecimal) press(",");
      else if (e.key === "-" && q.allowNegative) press(MINUS);
      else if (e.key === "Enter") submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="numpad">
      <div className={`numpad-display ${value ? "" : "empty"}`}>
        <span className="numpad-value">{value || "?"}</span>
        {q.unit && <span className="numpad-unit">{q.unit}</span>}
        {!locked && (
          <button className="numpad-back" onClick={() => press("⌫")} aria-label="Slett" disabled={!text}>
            ⌫
          </button>
        )}
      </div>
      {!locked && (
        <>
          <div className="numpad-grid">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button key={k} className="key" onClick={() => press(k)}>
                {k}
              </button>
            ))}
            {q.allowNegative ? (
              <button className="key key-alt" onClick={() => press(MINUS)} aria-label="Minus">
                {MINUS}
              </button>
            ) : (
              <span />
            )}
            <button className="key" onClick={() => press("0")}>
              0
            </button>
            {q.allowDecimal ? (
              <button className="key key-alt" onClick={() => press(",")} aria-label="Komma">
                ,
              </button>
            ) : (
              <span />
            )}
          </div>
          <button className="btn btn-primary btn-block" disabled={!canSubmit} onClick={submit}>
            Sjekk svar
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multiple choice
// ---------------------------------------------------------------------------
export function ChoiceInput({ q, submitted, onSubmit }: InputProps<ChoiceQuestion>) {
  const locked = submitted !== null;
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < q.choices.length) onSubmit(q.choices[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, q, onSubmit]);

  return (
    <div className="choices">
      {q.choices.map((c) => {
        let state = "";
        if (locked) {
          if (c === q.answer) state = "correct";
          else if (c === submitted) state = "wrong";
          else state = "dim";
        }
        return (
          <button key={c} className={`choice ${state}`} disabled={locked} onClick={() => onSubmit(c)}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// True / false: swipe right for "stemmer", left for "stemmer ikke".
// ---------------------------------------------------------------------------
export function TrueFalseInput({ q, submitted, onSubmit }: InputProps<TrueFalseQuestion>) {
  const locked = submitted !== null;
  const { offset, dragging, handlers } = useDrag({
    axis: "x",
    enabled: !locked,
    onSwipe: (dir) => onSubmit(String(dir === 1)),
  });

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onSubmit("true");
      else if (e.key === "ArrowLeft") onSubmit("false");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, onSubmit]);

  const lean = Math.max(-1, Math.min(1, offset / 120));
  const chosen = submitted === null ? null : submitted === "true";
  const correctChoice = locked && chosen === q.answer;

  return (
    <div className="tf">
      <div
        className={`tf-card ${dragging ? "dragging" : ""} ${locked ? (correctChoice ? "correct" : "wrong") : ""}`}
        style={{ transform: `translateX(${offset}px) rotate(${lean * 10}deg)` }}
        {...handlers}
      >
        <span className="tf-stamp tf-yes" style={{ opacity: Math.max(0, lean) }}>Stemmer ✓</span>
        <span className="tf-stamp tf-no" style={{ opacity: Math.max(0, -lean) }}>Stemmer ikke ✗</span>
        <div className="tf-statement">{q.statement}</div>
        {locked && <div className="tf-truth">{q.answer ? "Dette stemmer ✓" : "Dette stemmer ikke ✗"}</div>}
      </div>
      {!locked && <p className="hint">Sveip ← eller →</p>}
      <div className="tf-buttons">
        <button
          className={`btn tf-btn tf-btn-no ${chosen === false ? "chosen" : ""}`}
          disabled={locked}
          onClick={() => onSubmit("false")}
        >
          ✗ Stemmer ikke
        </button>
        <button
          className={`btn tf-btn tf-btn-yes ${chosen === true ? "chosen" : ""}`}
          disabled={locked}
          onClick={() => onSubmit("true")}
        >
          ✓ Stemmer
        </button>
      </div>
    </div>
  );
}

