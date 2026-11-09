/** Tiny sound effects made with Web Audio – no audio files needed. */
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function ensure(): boolean {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export type Sfx = "correct" | "wrong" | "goal" | "levelup" | "tap";

export function play(sfx: Sfx, enabled: boolean) {
  if (sfx === "correct") navigator.vibrate?.(20);
  if (sfx === "wrong") navigator.vibrate?.([30, 40, 30]);
  if (!enabled || !ensure()) return;
  switch (sfx) {
    case "correct":
      tone(660, 0, 0.12, "triangle");
      tone(990, 0.08, 0.18, "triangle");
      break;
    case "wrong":
      tone(220, 0, 0.18, "sine", 0.1);
      tone(196, 0.12, 0.22, "sine", 0.1);
      break;
    case "goal":
    case "levelup":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "triangle"));
      break;
    case "tap":
      tone(880, 0, 0.05, "square", 0.04);
      break;
  }
}

