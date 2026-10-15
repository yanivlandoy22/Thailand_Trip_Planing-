// Loading placeholders (additive; the existing Spinner is untouched).
function Bar({ className = '' }) {
  return <div className={`bg-slate-200 rounded-md ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Bar className="h-5 w-2/5" />
      <Bar className="h-3 w-1/4" />
      <Bar className="h-16 w-full" />
      <Bar className="h-3 w-3/5" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3">
      <div className="w-14 shrink-0 flex flex-col items-center gap-2">
        <Bar className="h-3 w-9" />
        <div className="w-9 h-9 rounded-full bg-slate-200" />
      </div>
      <div className="flex-1 card p-3.5 space-y-2 mb-3">
        <Bar className="h-4 w-1/2" />
        <Bar className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// variant: 'cards' (flights/hotels/activities/transfers) | 'timeline' (itinerary) | 'list' (checklist/expenses)
export default function Skeleton({ variant = 'cards', count = 3 }) {
  const Item = variant === 'timeline' ? SkeletonRow : variant === 'list' ? SkeletonRow : SkeletonCard;
  return (
    <div className="animate-pulse space-y-4 max-w-3xl mx-auto" aria-busy="true" aria-label="טוען...">
      {Array.from({ length: count }, (_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}
