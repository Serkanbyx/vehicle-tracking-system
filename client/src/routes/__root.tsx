import { Outlet, createRootRouteWithContext, Link } from "@tanstack/react-router";
import type { RouterContext } from "@/router";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-lg text-gray-500">Sayfa bulunamadı</p>
      <Link to="/" className="text-brand-600 hover:underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}

function ErrorBoundaryPage({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-danger">Bir hata oluştu</h1>
      <p className="max-w-md text-center text-gray-500">{error.message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
      >
        Sayfayı yenile
      </button>
    </div>
  );
}
