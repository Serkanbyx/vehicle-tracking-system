import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Location } from "@/api/types";
import { Button, Select, Slider } from "@/components/ui";

interface HistoryPlayerProps {
  points: Location[];
  onTick: (point: Location) => void;
}

const SPEED_OPTIONS = [
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 5, label: "5×" },
  { value: 10, label: "10×" },
] as const;

export function HistoryPlayer({ points, onTick }: HistoryPlayerProps) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const tick = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setT((prev) => {
        const next = prev + speed * delta * 0.05;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    },
    [speed],
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  useEffect(() => {
    if (points.length === 0) return;
    const idx = Math.min(Math.floor(t * (points.length - 1)), points.length - 1);
    const point = points[idx];
    if (point) onTick(point);
  }, [t, points, onTick]);

  const handleSliderChange = (value: number[]) => {
    const v = value[0];
    if (v !== undefined) {
      setT(v / 100);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Duraklat" : "Oynat"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Select
          value={String(speed)}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-20"
        >
          {SPEED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <span className="ml-auto text-xs text-gray-400">{Math.round(t * 100)}%</span>
      </div>

      <Slider value={[t * 100]} onValueChange={handleSliderChange} max={100} step={0.5} />
    </div>
  );
}
