import { useRef, useState, type PointerEvent } from "react";

interface DragOptions {
  axis: "x" | "y";
  enabled: boolean;
  /** Distance in px needed to count as a swipe. */
  threshold?: number;
  /** Called with −1 (left/up) or 1 (right/down) when the drag passes the threshold. */
  onSwipe: (dir: -1 | 1) => void;
  /** Only report swipes in this direction (others snap back). */
  only?: -1 | 1;
}

/**
 * Minimal pointer-based drag/swipe hook. Pointer capture is only taken once the
 * finger has actually moved, so taps on buttons inside the dragged element still work.
 */
export function useDrag({ axis, enabled, threshold = 90, onSwipe, only }: DragOptions) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; captured: boolean } | null>(null);

  const reset = () => {
    start.current = null;
    setDragging(false);
    setOffset(0);
  };

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
      start.current = { x: e.clientX, y: e.clientY, captured: false };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const main = axis === "x" ? dx : dy;
      const cross = axis === "x" ? dy : dx;
      if (!s.captured) {
        if (Math.abs(main) < 10) return;
        if (Math.abs(cross) > Math.abs(main)) {
          start.current = null; // moving along the other axis – not our gesture
          return;
        }
        s.captured = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      // Resist dragging in the disallowed direction.
      setOffset(only && Math.sign(main) !== only ? main * 0.2 : main);
    },
    onPointerUp: () => {
      const s = start.current;
      if (s?.captured && Math.abs(offset) >= threshold) {
        const dir = (offset > 0 ? 1 : -1) as -1 | 1;
        if (!only || dir === only) onSwipe(dir);
      }
      reset();
    },
    onPointerCancel: reset,
  };

  return { offset, dragging, handlers };
}

