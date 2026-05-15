import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getAlertStats } from "@/api/alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export function TopViolators() {
  const { data } = useQuery({
    queryKey: ["alerts", "stats"],
    queryFn: getAlertStats,
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Uyarı Özeti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="py-4 text-center text-sm text-gray-400">Yükleniyor…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Toplam Uyarı</span>
              <span className="font-semibold">{data.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Onaylanmamış</span>
              <span className="font-semibold text-danger">{data.unacknowledged}</span>
            </div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Türe Göre
              </p>
              {Object.entries(data.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-600 dark:text-gray-300">
                    {type.replace("_", " ")}
                  </span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
