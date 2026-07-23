export function Spinner({ label = 'טוען...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
      <div className="w-9 h-9 border-4 border-ocean/30 border-t-ocean rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ emoji = '🌴', title, sub }) {
  return (
    <div className="card p-10 text-center text-slate-500">
      <div className="text-4xl mb-3">{emoji}</div>
      <div className="font-semibold text-slate-700">{title}</div>
      {sub && <div className="text-sm mt-1">{sub}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-4xl mb-3">😕</div>
      <div className="font-semibold text-slate-700 mb-1">משהו השתבש</div>
      <div className="text-sm text-slate-500 mb-4">{message}</div>
      {onRetry && (
        <button className="btn-primary" onClick={onRetry}>
          נסו שוב
        </button>
      )}
    </div>
  );
}

const STATUS = {
  confirmed: { text: 'מאושר', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { text: 'ממתין', cls: 'bg-amber-100 text-amber-700' },
  unknown: { text: 'לא ידוע', cls: 'bg-slate-100 text-slate-600' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.unknown;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.text}</span>
  );
}

// Key/value grid for booking fields
export function FieldList({ fields, className = '' }) {
  if (!fields?.length) return null;
  return (
    <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm ${className}`}>
      {fields.map((f, i) => (
        <div key={i} className="flex gap-2">
          <dt className="font-semibold text-slate-500 shrink-0">{f.label}:</dt>
          <dd className="text-slate-800 break-words min-w-0">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PageTitle({ emoji, title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h2>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
