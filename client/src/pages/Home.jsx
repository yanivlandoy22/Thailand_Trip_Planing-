import { Link } from 'react-router-dom';
import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, StatusBadge } from '../components/Shared';
import { nextUpcoming, bookingDate, formatDate, findField } from '../utils/bookingDates';

const SECTIONS = [
  { to: '/flights', emoji: '✈️', title: 'הטיסות שלנו', sub: 'פרטי כל הטיסות, מושבים וכבודה' },
  { to: '/hotels', emoji: '🏨', title: 'המלונות שלנו', sub: "צ'ק-אין, לילות ופרטי הזמנה" },
  { to: '/activities', emoji: '🌴', title: 'אטרקציות והעברות', sub: 'פעילויות מוזמנות ומפה' },
  { to: '/checklist', emoji: '✅', title: "צ'קליסט", sub: 'הכנות לפני הטיסה' },
  { to: '/expenses', emoji: '💰', title: 'הוצאות', sub: 'חלוקת הוצאות בין המשתתפים' },
  { to: '/tips', emoji: '💡', title: 'טיפים', sub: 'מידע שימושי לתאילנד' },
  { to: '/chat', emoji: '🤖', title: "צ'אט AI", sub: 'שאלו כל שאלה על הטיול — בקרוב' },
  { to: '/organizer', emoji: '⚙️', title: 'אזור מארגן', sub: 'ניהול הזמנות והגדרות' },
];

function NextCard({ emoji, label, booking }) {
  const date = bookingDate(booking);
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="text-3xl">{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-ocean mb-0.5">{label}</div>
        <div className="font-bold truncate">{booking.title}</div>
        <div className="text-sm text-slate-500">
          {date ? formatDate(date) : findField(booking, 'תאריך')?.value || ''}
        </div>
      </div>
      <StatusBadge status={booking.status} />
    </div>
  );
}

export default function Home() {
  const { bookings, loading, loaded, error, reload } = useTripStore();

  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const flights = bookings.filter((b) => b.type === 'flight');
  const hotels = bookings.filter((b) => b.type === 'hotel');
  const activities = bookings.filter((b) => b.type === 'activity');
  const transfers = bookings.filter((b) => b.type === 'transfer');

  const nextFlight = nextUpcoming(flights);
  const nextHotel = nextUpcoming(hotels);

  const counts = [
    { label: 'טיסות', value: flights.length, to: '/flights' },
    { label: 'מלונות', value: hotels.length, to: '/hotels' },
    { label: 'אטרקציות', value: activities.length, to: '/activities' },
    { label: 'העברות', value: transfers.length, to: '/activities' },
  ];

  return (
    <div className="space-y-6">
      {(nextFlight || nextHotel) && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">הקרוב בתוכנית 🎯</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nextFlight && <NextCard emoji="✈️" label="הטיסה הבאה" booking={nextFlight} />}
            {nextHotel && <NextCard emoji="🏨" label="המלון הבא" booking={nextHotel} />}
          </div>
        </section>
      )}

      <section className="grid grid-cols-4 gap-2">
        {counts.map((c) => (
          <Link key={c.label} to={c.to} className="card p-3 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-extrabold text-ocean">{c.value}</div>
            <div className="text-xs text-slate-500 font-medium">{c.label}</div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-1.5"
          >
            <div className="text-3xl">{s.emoji}</div>
            <div className="font-bold">{s.title}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{s.sub}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
