import { Download } from "lucide-react";
import { useState } from "react";
import { exportRoute } from "@/api/vehicles";
import { Button } from "@/components/ui";

interface ExportButtonsProps {
  vehicleId: string;
  from: string;
  to: string;
}

export function ExportButtons({ vehicleId, from, to }: ExportButtonsProps) {
  const [loading, setLoading] = useState<"csv" | "geojson" | null>(null);

  const handleExport = async (format: "csv" | "geojson") => {
    setLoading(format);
    try {
      const blob = await exportRoute(vehicleId, { from, to, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `route-${vehicleId.slice(0, 8)}.${format === "geojson" ? "geojson" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => void handleExport("csv")}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {loading === "csv" ? "…" : "CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => void handleExport("geojson")}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {loading === "geojson" ? "…" : "GeoJSON"}
      </Button>
    </div>
  );
}
