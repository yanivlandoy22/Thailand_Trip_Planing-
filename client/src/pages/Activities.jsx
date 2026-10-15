import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTripStore } from '../store/tripStore';
import { ErrorState, EmptyState, PageTitle } from '../components/Shared';
import Skeleton from '../components/Skeleton';
import { GenericCard } from '../components/BookingCards';
import OperatorContact from '../components/OperatorContact';
import { sortBookings, findField } from '../utils/bookingDates';

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

const THAILAND_CENTER = [13.75, 100.5];

export default function Activities() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const activities = bookings.filter((b) => b.type === 'activity');
    return sortBookings(activities).filter((b) => {
      if (!query.trim()) return true;
      const q = query.trim();
      return (
        b.title.includes(q) ||
        (b.fields || []).some((f) => f.value.includes(q) || f.label.includes(q))
      );
    });
  }, [bookings, query]);

  if (loading && !loaded) return <Skeleton variant="cards" />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  // Numbered pins: only located activities get a number (shared list<->map)
  const located = [];
  const numbered = new Map();
  for (const b of items) {
    const coords = coordsOf(b);
    if (coords) {
      located.push({ booking: b, coords });
      numbered.set(b.id, located.length);
    }
  }

  return (
    <div>
      <PageTitle emoji="🌴" title="האטרקציות שלנו" sub="הפעילויות שהוזמנו לטיול, עם מפה" />

      <div className="mb-4">
        <input
          className="input sm:max-w-xs"
          placeholder="חיפוש..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pl-1">
          {items.length === 0 ? (
            <EmptyState emoji="🌴" title="לא נמצאו אטרקציות" sub="נסו חיפוש אחר או פנו למארגן" />
          ) : (
            items.map((b) => <GenericCard key={b.id} booking={b} number={numbered.get(b.id)} />)
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

      <OperatorContact />
    </div>
  );
}
