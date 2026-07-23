// start_at/end_at hold the event's LOCAL WALL TIME stored as-if-UTC.
// Always read/write the UTC fields so times never shift with the viewer's
// timezone (the trip spans Israel and Thailand).

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Accepts "2026-08-10T21:30:00", "...Z", or "...+00:00" (Supabase) → Date
export function parseWall(iso) {
  if (!iso) return null;
  const cleaned = String(iso).replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
  const date = new Date(`${cleaned}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(date) {
  if (!date) return '';
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatDayHeader(date) {
  return `יום ${DAY_NAMES[date.getUTCDay()]} · ${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()}`;
}

export function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// datetime-local <input> value ("2026-08-10T21:30") <-> stored ISO
export function toInputValue(iso) {
  const date = parseWall(iso);
  if (!date) return '';
  return date.toISOString().slice(0, 16);
}

export function fromInputValue(value) {
  return value ? `${value}:00` : null;
}
