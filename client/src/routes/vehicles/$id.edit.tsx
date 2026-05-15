import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Vehicle } from "@/api/types";
import { getVehicle, removeVehicle } from "@/api/vehicles";
import { requireManagerOrAdmin } from "@/components/guards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export const Route = createFileRoute("/vehicles/$id/edit")({
  beforeLoad: requireManagerOrAdmin,
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["vehicles", params.id],
      queryFn: () => getVehicle(params.id),
    }),
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const vehicle = Route.useLoaderData() as Vehicle;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeVehicle(vehicle.id);
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      await navigate({ to: "/vehicles" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Araç Düzenle — {vehicle.plate}</CardTitle>
              <p className="mt-1 text-sm text-gray-400">
                Son güncelleme:{" "}
                {format(new Date(vehicle.updatedAt), "dd MMM yyyy HH:mm", {
                  locale: tr,
                })}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{vehicle.plate} aracını sil?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem araçla ilişkili tüm konum verilerini, seferleri ve uyarıları kalıcı
                    olarak silecektir. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDelete()} disabled={deleting}>
                    {deleting ? "Siliniyor…" : "Sil"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <VehicleForm vehicle={vehicle} />
        </CardContent>
      </Card>
    </div>
  );
}
