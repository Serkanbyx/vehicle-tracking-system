import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSmoothPosition } from "@/hooks/use-smooth-position";

let rafCallbacks: Array<(time: number) => void> = [];
let originalRaf: typeof requestAnimationFrame;
let originalCaf: typeof cancelAnimationFrame;
let perfNowSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  rafCallbacks = [];
  originalRaf = globalThis.requestAnimationFrame;
  originalCaf = globalThis.cancelAnimationFrame;

  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    rafCallbacks.push(cb as (time: number) => void);
    return rafCallbacks.length;
  }) as any;
  globalThis.cancelAnimationFrame = vi.fn();

  perfNowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCaf;
  perfNowSpy.mockRestore();
});

function flushRaf(time: number) {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) {
    act(() => cb(time));
  }
}

describe("useSmoothPosition", () => {
  it("should return the initial target on first render", () => {
    const { result } = renderHook(() =>
      useSmoothPosition([29.0, 41.0], 1000),
    );

    expect(result.current[0]).toBe(29.0);
    expect(result.current[1]).toBe(41.0);
  });

  it("should interpolate between two points", () => {
    const { result, rerender } = renderHook(
      ({ target, duration }: { target: [number, number]; duration: number }) =>
        useSmoothPosition(target, duration),
      { initialProps: { target: [0, 0] as [number, number], duration: 1000 } },
    );

    rerender({ target: [10, 20], duration: 1000 });

    (performance.now as ReturnType<typeof vi.fn>).mockReturnValue(500);
    flushRaf(500);

    const [lng, lat] = result.current;
    expect(lng).toBeGreaterThan(0);
    expect(lng).toBeLessThan(10);
    expect(lat).toBeGreaterThan(0);
    expect(lat).toBeLessThan(20);
  });

  it("should reach the target when animation completes", () => {
    const { result, rerender } = renderHook(
      ({ target, duration }: { target: [number, number]; duration: number }) =>
        useSmoothPosition(target, duration),
      { initialProps: { target: [0, 0] as [number, number], duration: 1000 } },
    );

    rerender({ target: [10, 20], duration: 1000 });

    (performance.now as ReturnType<typeof vi.fn>).mockReturnValue(1000);
    flushRaf(1000);

    const [lng, lat] = result.current;
    expect(lng).toBeCloseTo(10, 1);
    expect(lat).toBeCloseTo(20, 1);
  });

  it("should skip animation when prefers-reduced-motion is set", () => {
    document.body.classList.add("no-anim");

    const { result, rerender } = renderHook(
      ({ target }: { target: [number, number] }) =>
        useSmoothPosition(target, 1000),
      { initialProps: { target: [0, 0] as [number, number] } },
    );

    rerender({ target: [50, 50] });

    expect(result.current[0]).toBe(50);
    expect(result.current[1]).toBe(50);

    document.body.classList.remove("no-anim");
  });
});
