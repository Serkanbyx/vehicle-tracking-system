import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("no-anim")
  );
}

export function useSmoothPosition(
  target: [number, number],
  durationMs = 1500,
): [number, number] {
  const [pos, setPos] = useState(target);
  const startRef = useRef<{
    from: [number, number];
    to: [number, number];
    t0: number;
  } | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPos(target);
      return;
    }

    startRef.current = { from: pos, to: target, t0: performance.now() };
    let raf = 0;

    const step = (t: number) => {
      const s = startRef.current!;
      const p = Math.min((t - s.t0) / durationMs, 1);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      setPos([
        s.from[0] + (s.to[0] - s.from[0]) * eased,
        s.from[1] + (s.to[1] - s.from[1]) * eased,
      ]);

      if (p < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target[0], target[1]]);

  return pos;
}
