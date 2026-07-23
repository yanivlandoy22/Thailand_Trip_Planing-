-- Structured datetimes for the chronological itinerary.
-- Convention: values hold the LOCAL WALL TIME of the event stored as-if-UTC
-- (parser emits ISO without offset); clients render the UTC fields verbatim
-- so times never shift with the viewer's timezone.

alter table bookings add column if not exists start_at timestamptz;
alter table bookings add column if not exists end_at timestamptz;
