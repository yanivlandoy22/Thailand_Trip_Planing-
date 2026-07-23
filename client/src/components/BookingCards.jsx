import { StatusBadge, FieldList } from './Shared';
import TicketStrip from './TicketStrip';
import { findField, nightsBetween } from '../utils/bookingDates';

// ---------- Flight ----------

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

export function FlightCard({ booking, highlight, compactHeader = false }) {
  const { outbound, inbound, general } = splitLegs(booking.fields);
  return (
    <article className={`card p-5 space-y-4 ${highlight ? 'ring-2 ring-ocean' : ''}`}>
      {!compactHeader && (
        <header className="flex items-start justify-between gap-3">
          <div>
            {highlight && <div className="text-xs font-bold text-ocean mb-1">⭐ הטיסה הקרובה</div>}
            <h3 className="text-lg font-bold">✈️ {booking.title}</h3>
            {booking.source && <div className="text-xs text-slate-500 mt-0.5">{booking.source}</div>}
          </div>
          <StatusBadge status={booking.status} />
        </header>
      )}

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
      <TicketStrip booking={booking} />
    </article>
  );
}

// ---------- Hotel ----------

function DateBlock({ label, value, color }) {
  return (
    <div className={`flex-1 rounded-app p-3 text-center ${color}`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="font-bold text-sm mt-0.5">{value || '—'}</div>
    </div>
  );
}

export function HotelCard({ booking, compactHeader = false }) {
  const checkIn = findField(booking, "צ'ק-אין", 'צק-אין', 'כניסה');
  const checkOut = findField(booking, "צ'ק-אאוט", 'צק-אאוט', 'עזיבה');
  const nights = nightsBetween(booking);
  const shownLabels = [checkIn?.label, checkOut?.label];
  const rest = (booking.fields || []).filter((f) => !shownLabels.includes(f.label));

  return (
    <article className="card p-5 space-y-4">
      {!compactHeader && (
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">🏨 {booking.title}</h3>
            {booking.source && <div className="text-xs text-slate-500 mt-0.5">{booking.source}</div>}
          </div>
          <StatusBadge status={booking.status} />
        </header>
      )}

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
      <TicketStrip booking={booking} />
    </article>
  );
}

// ---------- Activity / Transfer / other ----------

export function GenericCard({ booking, number, compactHeader = false }) {
  const emoji = { activity: '🎡', transfer: '🚐', flight: '✈️', hotel: '🏨' }[booking.type] || '📄';
  return (
    <article className="card p-4 space-y-3">
      {!compactHeader && (
        <header className="flex items-start justify-between gap-2">
          <h3 className="font-bold flex items-center gap-2">
            {number != null && (
              <span className="w-6 h-6 shrink-0 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center">
                {number}
              </span>
            )}
            <span>
              {emoji} {booking.title}
            </span>
          </h3>
          <StatusBadge status={booking.status} />
        </header>
      )}
      <FieldList
        fields={(booking.fields || []).filter((f) => !f.label.includes('קואורדינטות'))}
        className="!grid-cols-1"
      />
      {booking.notes && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-app p-2">📝 {booking.notes}</p>
      )}
      <TicketStrip booking={booking} />
    </article>
  );
}

export function bookingCardFor(booking, props = {}) {
  if (booking.type === 'flight') return <FlightCard booking={booking} {...props} />;
  if (booking.type === 'hotel') return <HotelCard booking={booking} {...props} />;
  return <GenericCard booking={booking} {...props} />;
}
