import {
  Outlet,
  createRootRouteWithContext,
  Link,
} from "@tanstack/react-router";
import { Compass, RefreshCw, AlertTriangle } from "lucide-react";
import type { RouterContext } from "@/router";
import { Button } from "@/components/ui";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorBoundaryPage,
});

function RootComponent() {
  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Compass className="h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
      <p className="max-w-md text-gray-500">
        Aradığınız sayfa taşınmış veya silinmiş olabilir.
      </p>
      <Link to="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  );
}

function ErrorBoundaryPage({ error }: { error: Error }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-16 w-16 text-danger" />
      <h1 className="text-2xl font-semibold">Bir hata oluştu</h1>
      <p className="max-w-md text-gray-500">{error.message}</p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Sayfayı Yenile
      </Button>
    </div>
  );
}
