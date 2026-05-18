import { Card, CardContent } from "@/components/ui";

interface StatsPanelProps {
  totalPoints: number;
  distanceKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  durationMin: number;
}

export function StatsPanel({
  totalPoints,
  distanceKm,
  avgSpeedKmh,
  maxSpeedKmh,
  durationMin,
}: StatsPanelProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-3 text-sm">
        <div>
          <p className="text-gray-400">Total Points</p>
          <p className="font-semibold">{totalPoints}</p>
        </div>
        <div>
          <p className="text-gray-400">Distance</p>
          <p className="font-semibold">{distanceKm.toFixed(1)} km</p>
        </div>
        <div>
          <p className="text-gray-400">Avg. Speed</p>
          <p className="font-semibold">{avgSpeedKmh.toFixed(0)} km/h</p>
        </div>
        <div>
          <p className="text-gray-400">Max. Speed</p>
          <p className="font-semibold">{maxSpeedKmh.toFixed(0)} km/h</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400">Duration</p>
          <p className="font-semibold">{durationMin.toFixed(0)} min</p>
        </div>
      </CardContent>
    </Card>
  );
}
