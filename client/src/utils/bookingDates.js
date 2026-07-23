// Tolerant date extraction from parsed booking fields ([{label, value}]).
// Values come from AI parsing of real confirmations, so formats vary.

const DATE_PATTERNS = [
  // 2026-08-15 or 2026/08/15
  { re: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, order: ['y', 'm', 'd'] },
  // 15/08/2026, 15.8.26
  { re: /(\d{1,2})[./](\d{1,2})[./](\d{2,4})/, order: ['d', 'm', 'y'] },
];

const TIME_RE = /(\d{1,2}):(\d{2})/;

export function extractDate(text) {
  if (!text) return null;
  const s = String(text);
  for (const { re, order } of DATE_PATTERNS) {
    const m = s.match(re);
    if (!m) continue;
    const parts = {};
    order.forEach((key, i) => (parts[key] = Number(m[i + 1])));
    if (parts.y < 100) parts.y += 2000;
    if (parts.m < 1 || parts.m > 12 || parts.d < 1 || parts.d > 31) continue;
    const t = s.match(TIME_RE);
    const date = new Date(parts.y, parts.m - 1, parts.d, t ? Number(t[1]) : 0, t ? Number(t[2]) : 0);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

const START_LABELS = ['המראה', 'יציאה', "צ'ק-אין", 'צק-אין', 'תאריך'];

// Primary date of a booking: first date found in a field whose label suggests
// a start (departure / check-in / generic date), else any dated field.
export function bookingDate(booking) {
  const fields = booking.fields || [];
  for (const keyword of START_LABELS) {
    for (const f of fields) {
      if (f.label && f.label.includes(keyword)) {
        const d = extractDate(f.value);
        if (d) return d;
      }
    }
  }
  for (const f of fields) {
    const d = extractDate(f.value);
    if (d) return d;
  }
  return null;
}

// Preferred sort: structured start_at first, heuristic field-date fallback.
export function sortBookings(bookings) {
  const key = (b) => {
    if (b.start_at) {
      const d = new Date(String(b.start_at).replace(/(Z|[+-]\d{2}:?\d{2})$/, '') + 'Z');
      if (!Number.isNaN(d.getTime())) return d;
    }
    return bookingDate(b);
  };
  return [...bookings].sort((a, b) => {
    const da = key(a);
    const db = key(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
}

export function sortByDate(bookings) {
  return [...bookings].sort((a, b) => {
    const da = bookingDate(a);
    const db = bookingDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
}

// Next booking whose date is today-or-later
export function nextUpcoming(bookings) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = sortByDate(bookings).filter((b) => {
    const d = bookingDate(b);
    return d && d >= today;
  });
  return sorted[0] || null;
}

export function findField(booking, ...keywords) {
  return (booking.fields || []).find((f) => keywords.some((k) => f.label && f.label.includes(k)));
}

// Nights between check-in and check-out field dates
export function nightsBetween(booking) {
  const checkIn = findField(booking, "צ'ק-אין", 'צק-אין', 'כניסה');
  const checkOut = findField(booking, "צ'ק-אאוט", 'צק-אאוט', 'יציאה', 'עזיבה');
  const dIn = checkIn && extractDate(checkIn.value);
  const dOut = checkOut && extractDate(checkOut.value);
  if (!dIn || !dOut) {
    const explicit = findField(booking, 'לילות');
    if (explicit) {
      const n = parseInt(explicit.value, 10);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
  const nights = Math.round((dOut - dIn) / (24 * 60 * 60 * 1000));
  return nights > 0 ? nights : null;
}

export function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}
