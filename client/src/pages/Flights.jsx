import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, EmptyState, StatusBadge, FieldList, PageTitle } from '../components/Shared';
import { sortByDate, nextUpcoming } from '../utils/bookingDates';

// The parser prefixes leg-specific fields with "הלוך:" / "חזור:".
function splitLegs(fields = []) {
  const outbound = [];
  const inbound = [];
  const general = [];
  for (const f of fields) {
    if (f.label.startsWith('הלוך')) {
      outbound.push({ ...f, label: f.label.replace(/^הלוך:?\s*/, '') });
    } else if (f.label.startsWith('חזור')) {
      inbound.push({ ...f, label: f.label.replace(/^חזור:?\s*/, '') });
    } else {
      general.push(f);
    }
  }
  return { outbound, inbound, general };
}

function Leg({ title, fields, color }) {
  if (!fields.length) return null;
  const palette =
    color === 'blue'
      ? 'bg-sky-50 border-sky-200 text-sky-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  return (
    <div className={`rounded-app border p-3 ${palette}`}>
      <div className="font-bold text-sm mb-2">{title}</div>
      <FieldList fields={fields} />
    </div>
  );
}

function FlightCard({ booking, highlight }) {
  const { outbound, inbound, general } = splitLegs(booking.fields);
  return (
    <article
      className={`card p-5 space-y-4 ${highlight ? 'ring-2 ring-ocean' : ''}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          {highlight && (
            <div className="text-xs font-bold text-ocean mb-1">⭐ הטיסה הקרובה</div>
          )}
          <h3 className="text-lg font-bold">✈️ {booking.title}</h3>
          {booking.source && <div className="text-xs text-slate-500 mt-0.5">{booking.source}</div>}
        </div>
        <StatusBadge status={booking.status} />
      </header>

      {(outbound.length || inbound.length) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Leg title="🛫 הלוך" fields={outbound} color="blue" />
          <Leg title="🛬 חזור" fields={inbound} color="green" />
        </div>
      )}

      <FieldList fields={general} />
      {booking.notes && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-app p-3">
          📝 {booking.notes}
        </p>
      )}
    </article>
  );
}

export default function Flights() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const flights = sortByDate(bookings.filter((b) => b.type === 'flight'));
  const next = nextUpcoming(flights);

  return (
    <div>
      <PageTitle emoji="✈️" title="הטיסות שלנו" sub="כל הטיסות בסדר כרונולוגי" />
      {flights.length === 0 ? (
        <EmptyState
          emoji="✈️"
          title="עדיין אין טיסות"
          sub="המארגן יוסיף את פרטי הטיסות באזור המארגן"
        />
      ) : (
        <div className="space-y-4">
          {flights.map((f) => (
            <FlightCard key={f.id} booking={f} highlight={next && f.id === next.id} />
          ))}
        </div>
      )}
    </div>
  );
}
