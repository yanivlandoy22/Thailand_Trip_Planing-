import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, EmptyState, StatusBadge, FieldList, PageTitle } from '../components/Shared';
import { sortByDate, findField, nightsBetween } from '../utils/bookingDates';

function DateBlock({ label, value, color }) {
  return (
    <div className={`flex-1 rounded-app p-3 text-center ${color}`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="font-bold text-sm mt-0.5">{value || '—'}</div>
    </div>
  );
}

function HotelCard({ booking }) {
  const checkIn = findField(booking, "צ'ק-אין", 'צק-אין', 'כניסה');
  const checkOut = findField(booking, "צ'ק-אאוט", 'צק-אאוט', 'עזיבה');
  const nights = nightsBetween(booking);
  const shownLabels = [checkIn?.label, checkOut?.label];
  const rest = (booking.fields || []).filter((f) => !shownLabels.includes(f.label));

  return (
    <article className="card p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">🏨 {booking.title}</h3>
          {booking.source && <div className="text-xs text-slate-500 mt-0.5">{booking.source}</div>}
        </div>
        <StatusBadge status={booking.status} />
      </header>

      <div className="flex items-center gap-2">
        <DateBlock label="צ'ק-אין" value={checkIn?.value} color="bg-sky-50 text-sky-800" />
        <div className="shrink-0 text-center px-1">
          <div className="text-xl font-extrabold text-ocean">{nights ?? '·'}</div>
          <div className="text-[10px] text-slate-500 font-medium">{nights ? 'לילות' : ''}</div>
        </div>
        <DateBlock label="צ'ק-אאוט" value={checkOut?.value} color="bg-emerald-50 text-emerald-800" />
      </div>

      <FieldList fields={rest} />
      {booking.notes && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-app p-3">
          📝 {booking.notes}
        </p>
      )}
    </article>
  );
}

export default function Hotels() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const hotels = sortByDate(bookings.filter((b) => b.type === 'hotel'));

  return (
    <div>
      <PageTitle emoji="🏨" title="המלונות שלנו" sub="ממוינים לפי תאריך צ'ק-אין" />
      {hotels.length === 0 ? (
        <EmptyState emoji="🏨" title="עדיין אין מלונות" sub="המארגן יוסיף את ההזמנות באזור המארגן" />
      ) : (
        <div className="space-y-4">
          {hotels.map((h) => (
            <HotelCard key={h.id} booking={h} />
          ))}
        </div>
      )}
    </div>
  );
}
