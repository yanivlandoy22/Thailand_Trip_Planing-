import { useEffect, useMemo, useRef, useState } from 'react';
import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, EmptyState, PageTitle, StatusBadge } from '../components/Shared';
import { bookingCardFor } from '../components/BookingCards';
import { buildItinerary, findNextEntryId, nowAsWall, isDuringTrip } from '../utils/itinerary';
import { formatTime, formatDayHeader } from '../utils/wallTime';
import { findField } from '../utils/bookingDates';

const TYPE_ICON = { flight: '✈️', hotel: '🏨', activity: '🎡', transfer: '🚐', other: '📄' };

// 1-2 key details per compact row
function entrySummary(entry) {
  const b = entry.booking;
  if (entry.hotelEvent === 'checkin') return "צ'ק-אין";
  if (entry.hotelEvent === 'checkout') return "צ'ק-אאוט";
  if (b.type === 'flight') {
    const route = findField(b, 'מסלול');
    const seats = findField(b, 'נוסעים ומושבים', 'מושבים');
    return [route?.value, seats && 'כולל מושבים'].filter(Boolean).join(' · ');
  }
  if (b.type === 'transfer') {
    const from = findField(b, 'איסוף');
    const to = findField(b, 'יעד');
    if (from && to) return `${from.value} ← ${to.value}`;
    return from?.value || to?.value || '';
  }
  const location = findField(b, 'מיקום');
  return location?.value || '';
}

function TimelineRow({ entry, isNext, expanded, onToggle }) {
  const b = entry.booking;
  return (
    <div className="flex gap-3" id={`entry-${entry.id}`}>
      {/* time + icon + connecting line */}
      <div className="flex flex-col items-center w-14 shrink-0">
        <div className="text-xs font-bold text-slate-500 tabular-nums">{formatTime(entry.at)}</div>
        <div
          className={`mt-1 w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm ${
            isNext ? 'bg-ocean text-white ring-4 ring-ocean/20' : 'bg-white'
          }`}
        >
          {TYPE_ICON[b.type] || '📄'}
        </div>
        <div className="flex-1 w-0.5 bg-slate-200 mt-1 min-h-3" />
      </div>

      {/* card */}
      <div className="flex-1 min-w-0 pb-3">
        {isNext && (
          <span className="inline-block text-[11px] font-bold bg-ocean text-white rounded-full px-2.5 py-0.5 mb-1">
            הבא בתור ⏭️
          </span>
        )}
        <button
          onClick={onToggle}
          className={`w-full text-right card p-3.5 hover:shadow-md transition-shadow ${
            isNext ? 'ring-2 ring-ocean' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">
                {entry.hotelEvent ? `${b.title}` : b.title}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">{entrySummary(entry)}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={b.status} />
              <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </div>
        </button>
        {expanded && <div className="mt-2">{bookingCardFor(b, { compactHeader: false })}</div>}
      </div>
    </div>
  );
}

export default function Itinerary() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  const [expandedId, setExpandedId] = useState(null);
  const scrolledRef = useRef(false);

  const { groups, undated } = useMemo(() => buildItinerary(bookings), [bookings]);
  const now = nowAsWall();
  const nextId = useMemo(() => findNextEntryId(groups, now), [groups]); // eslint-disable-line react-hooks/exhaustive-deps

  // During the trip: auto-scroll once to the current/next item
  useEffect(() => {
    if (scrolledRef.current || !nextId || !isDuringTrip(groups, now)) return;
    scrolledRef.current = true;
    setTimeout(() => {
      document.getElementById(`entry-${nextId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [nextId, groups]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const toggle = (id) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle emoji="🗓️" title="המסלול שלנו" sub="כל הטיול, יום אחרי יום, לפי השעה" />

      {groups.length === 0 && undated.length === 0 && (
        <EmptyState
          emoji="🗓️"
          title="המסלול עדיין ריק"
          sub="ברגע שהמארגן יוסיף הזמנות עם תאריכים — הן יופיעו כאן על ציר הזמן"
        />
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-0 md:top-14 z-30 -mx-4 px-4 py-2 bg-bgapp/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="bg-ocean text-white text-xs font-bold rounded-full px-2.5 py-1">
                יום {group.dayIndex}
              </span>
              <h2 className="font-bold">{formatDayHeader(group.date)}</h2>
            </div>
          </div>
          <div className="pt-2">
            {group.entries.map((entry) => (
              <TimelineRow
                key={entry.id}
                entry={entry}
                isNext={entry.id === nextId}
                expanded={expandedId === entry.id}
                onToggle={() => toggle(entry.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {undated.length > 0 && (
        <section className="mt-6">
          <h2 className="font-bold text-slate-500 mb-3">📌 ללא תאריך</h2>
          <div className="space-y-2">
            {undated.map((b) => (
              <div key={b.id}>
                <button
                  onClick={() => toggle(b.id)}
                  className="w-full text-right card p-3.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm truncate">
                      {TYPE_ICON[b.type] || '📄'} {b.title}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={b.status} />
                      <span className={`text-slate-400 transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </div>
                </button>
                {expandedId === b.id && <div className="mt-2">{bookingCardFor(b)}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
