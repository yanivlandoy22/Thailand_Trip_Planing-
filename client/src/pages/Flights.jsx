import { useTripStore } from '../store/tripStore';
import { ErrorState, EmptyState, PageTitle } from '../components/Shared';
import Skeleton from '../components/Skeleton';
import { FlightCard } from '../components/BookingCards';
import { sortBookings, nextUpcoming } from '../utils/bookingDates';

export default function Flights() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  if (loading && !loaded) return <Skeleton variant="cards" />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const flights = sortBookings(bookings.filter((b) => b.type === 'flight'));
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
