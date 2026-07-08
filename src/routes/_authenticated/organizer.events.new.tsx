import { createFileRoute, useRouter } from "@tanstack/react-router";
import { EventForm } from "@/components/event-form";

export const Route = createFileRoute("/_authenticated/organizer/events/new")({
  component: NewEvent,
});

function NewEvent() {
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold mb-6">Novo evento</h2>
      <EventForm onSaved={(id) => router.navigate({ to: "/organizer/events/$id", params: { id } })} />
    </div>
  );
}