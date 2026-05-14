import { useQuery } from "@tanstack/react-query";
import { getDailySummary } from "@/api/trips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui";

interface DailySummaryChartProps {
  vehicleId?: string;
  from: string;
  to: string;
}

export function DailySummaryChart({
  vehicleId,
  from,
  to,
}: DailySummaryChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-summary", vehicleId, from, to],
    queryFn: () => getDailySummary({ vehicleId, from, to }),
    enabled: !!from && !!to,
  });

  if (!from || !to) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-400">
          Grafik görmek için tarih aralığı seçin.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Günlük Özet</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Günlük Özet</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-gray-400">
          Bu tarih aralığında veri bulunamadı.
        </CardContent>
      </Card>
    );
  }

  const maxDistance = Math.max(...data.map((d) => d.totalDistanceKm), 1);
  const chartH = 180;
  const barGap = 2;
  const barWidth = Math.max(
    Math.min(Math.floor((600 - data.length * barGap) / data.length), 40),
    6,
  );
  const chartW = data.length * (barWidth + barGap) + 40;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Günlük Özet ({data.length} gün)
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${chartH + 30}`}
          className="w-full"
          style={{ minWidth: `${Math.min(chartW, 400)}px`, maxHeight: "260px" }}
        >
          {data.map((day, i) => {
            const barH = Math.max(
              (day.totalDistanceKm / maxDistance) * chartH,
              2,
            );
            const x = 36 + i * (barWidth + barGap);
            const y = chartH - barH;
            const hasViolations = day.totalViolations > 0;

            return (
              <g key={day.date}>
                <title>
                  {day.date}
                  {"\n"}Mesafe: {day.totalDistanceKm.toFixed(1)} km
                  {"\n"}Seferler: {day.totalTrips}
                  {"\n"}İhlaller: {day.totalViolations}
                </title>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={2}
                  fill={hasViolations ? "#ef4444" : "#3b82f6"}
                  opacity={0.85}
                />
                {i % Math.max(Math.floor(data.length / 8), 1) === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={chartH + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {day.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}

          <line
            x1={34}
            y1={0}
            x2={34}
            y2={chartH}
            stroke="currentColor"
            strokeOpacity={0.15}
          />
          <line
            x1={34}
            y1={chartH}
            x2={chartW}
            y2={chartH}
            stroke="currentColor"
            strokeOpacity={0.15}
          />

          <text
            x={30}
            y={8}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
            opacity={0.5}
          >
            {maxDistance.toFixed(0)}
          </text>
          <text
            x={30}
            y={chartH}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
            opacity={0.5}
          >
            0
          </text>
          <text
            x={2}
            y={chartH / 2}
            textAnchor="middle"
            fontSize={7}
            fill="currentColor"
            opacity={0.4}
            transform={`rotate(-90, 6, ${chartH / 2})`}
          >
            km
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
