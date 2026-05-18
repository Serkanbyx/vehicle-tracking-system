import { createFileRoute } from "@tanstack/react-router";
import { requireManagerOrAdmin } from "@/components/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export const Route = createFileRoute("/vehicles/new")({
  beforeLoad: requireManagerOrAdmin,
  component: NewVehiclePage,
});

function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm />
        </CardContent>
      </Card>
    </div>
  );
}
