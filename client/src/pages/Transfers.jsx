import { useTripStore } from '../store/tripStore';
import { Spinner, ErrorState, EmptyState, PageTitle } from '../components/Shared';
import { GenericCard } from '../components/BookingCards';
import OperatorContact from '../components/OperatorContact';
import { sortBookings } from '../utils/bookingDates';

export default function Transfers() {
  const { bookings, loading, loaded, error, reload } = useTripStore();
  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const transfers = sortBookings(bookings.filter((b) => b.type === 'transfer'));

  return (
    <div>
      <PageTitle emoji="🚐" title="ההעברות שלנו" sub="הסעות והעברות בסדר כרונולוגי" />
      {transfers.length === 0 ? (
        <EmptyState
          emoji="🚐"
          title="עדיין אין העברות"
          sub="המארגן יוסיף את ההזמנות באזור המארגן"
        />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {transfers.map((t) => (
            <GenericCard key={t.id} booking={t} />
          ))}
        </div>
      )}
      <OperatorContact />
    </div>
  );
}
