import { useTripStore } from '../store/tripStore';
import { ErrorState, EmptyState, PageTitle } from '../components/Shared';
import Skeleton from '../components/Skeleton';
import { HotelCard } from '../components/BookingCards';
import { sortBookings } from '../utils/bookingDates';

export default function Hotels() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  if (loading && !loaded) return <Skeleton variant="cards" />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const hotels = sortBookings(bookings.filter((b) => b.type === 'hotel'));

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
