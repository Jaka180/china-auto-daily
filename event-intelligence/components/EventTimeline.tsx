import { EventCard } from "./EventCard";
import type { StoredEvent } from "@/lib/events/types";

export function EventTimeline({ events, empty = "No events yet." }: { events: StoredEvent[]; empty?: string }) {
  if (!events.length) {
    return <p className="py-10 text-sm text-muted">{empty}</p>;
  }

  return (
    <div>
      {events.map((event) => (
        <EventCard event={event} key={event.id} />
      ))}
    </div>
  );
}
