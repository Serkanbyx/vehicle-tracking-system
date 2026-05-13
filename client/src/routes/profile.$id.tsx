import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$id")({
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profil — {id}</h1>
    </div>
  );
}
