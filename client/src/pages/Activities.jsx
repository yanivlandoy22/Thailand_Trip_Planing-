import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, EmptyState, StatusBadge, FieldList, PageTitle } from '../components/Shared';
import { sortByDate, findField } from '../utils/bookingDates';

function coordsOf(booking) {
  const f = findField(booking, 'קואורדינטות');
  if (!f) return null;
  const m = String(f.value).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function numberedIcon(n) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#0284c7;color:#fff;font-weight:700;font-family:Heebo,sans-serif;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"><span style="transform:rotate(45deg)">${n}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function BookingCard({ booking, number }) {
  const emoji = booking.type === 'transfer' ? '🚐' : '🎡';
  return (
    <article className="card p-4 space-y-3">
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
      <FieldList
        fields={(booking.fields || []).filter((f) => !f.label.includes('קואורדינטות'))}
        className="!grid-cols-1"
      />
      {booking.notes && <p className="text-xs text-amber-800 bg-amber-50 rounded-app p-2">📝 {booking.notes}</p>}
    </article>
  );
}

const FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'activity', label: 'אטרקציות' },
  { key: 'transfer', label: 'העברות' },
];

const THAILAND_CENTER = [13.75, 100.5];

export default function Activities() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const items = useMemo(() => {
    const relevant = bookings.filter((b) => b.type === 'activity' || b.type === 'transfer');
    return sortByDate(relevant).filter((b) => {
      if (filter !== 'all' && b.type !== filter) return false;
      if (!query.trim()) return true;
      const q = query.trim();
      return (
        b.title.includes(q) ||
        (b.fields || []).some((f) => f.value.includes(q) || f.label.includes(q))
      );
    });
  }, [bookings, query, filter]);

  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  // Numbered pins: only located activities get a number (shared list<->map)
  const located = [];
  const numbered = new Map();
  for (const b of items) {
    if (b.type !== 'activity') continue;
    const coords = coordsOf(b);
    if (coords) {
      located.push({ booking: b, coords });
      numbered.set(b.id, located.length);
    }
  }

  return (
    <div>
      <PageTitle emoji="🌴" title="אטרקציות והעברות" sub="הפעילויות וההסעות שהוזמנו לטיול" />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="input sm:max-w-xs"
          placeholder="חיפוש..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-ocean text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pl-1">
          {items.length === 0 ? (
            <EmptyState emoji="🌴" title="לא נמצאו פעילויות" sub="נסו חיפוש אחר או פנו למארגן" />
          ) : (
            items.map((b) => <BookingCard key={b.id} booking={b} number={numbered.get(b.id)} />)
          )}
        </div>

        <div className="lg:col-span-3 card overflow-hidden h-72 lg:h-[70vh]">
          <MapContainer
            center={located[0]?.coords || THAILAND_CENTER}
            zoom={located.length ? 9 : 6}
            className="w-full h-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {located.map(({ booking, coords }, i) => (
              <Marker key={booking.id} position={coords} icon={numberedIcon(i + 1)}>
                <Popup>
                  <div style={{ direction: 'rtl', fontFamily: 'Heebo, sans-serif' }}>
                    <strong>{booking.title}</strong>
                    <br />
                    {findField(booking, 'מיקום')?.value || ''}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Operator contact for existing bookings */}
      <div className="card mt-5 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="text-sm">
          <span className="font-bold">שאלות על הזמנות קיימות?</span>{' '}
          <span className="text-slate-500">המרכז למטייל בתאילנד זמין עבורכם</span>
        </div>
        <div className="flex gap-2">
          <a
            href="https://api.whatsapp.com/send/?phone=972552750399"
            target="_blank"
            rel="noreferrer"
            className="btn-success !py-1.5 text-sm"
          >
            💬 וואטסאפ
          </a>
          <a href="tel:*8880" className="btn-ghost !py-1.5 text-sm">
            📞 *8880
          </a>
        </div>
      </div>
    </div>
  );
}
