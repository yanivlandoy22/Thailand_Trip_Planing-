// Builds the chronological day-grouped itinerary from bookings.
// Pure module — unit-tested from the server test suite.
import { parseWall, dayKey } from './wallTime.js';

// Entries: every dated booking once, except hotels which contribute BOTH a
// check-in entry (start_at) and a check-out entry (end_at) — render-time only.
export function buildEntries(bookings) {
  const entries = [];
  for (const booking of bookings) {
    const start = parseWall(booking.start_at);
    if (!start) continue;
    if (booking.type === 'hotel') {
      entries.push({ id: `${booking.id}-in`, booking, at: start, hotelEvent: 'checkin' });
      const end = parseWall(booking.end_at);
      if (end) entries.push({ id: `${booking.id}-out`, booking, at: end, hotelEvent: 'checkout' });
    } else {
      entries.push({ id: booking.id, booking, at: start, hotelEvent: null });
    }
  }
  entries.sort((a, b) => a.at - b.at);
  return entries;
}

// -> {groups: [{key, date, dayIndex, entries[]}], undated: [bookings]}
// dayIndex counts calendar days from the first trip day (day 1).
export function buildItinerary(bookings) {
  const entries = buildEntries(bookings);
  const groups = [];
  let current = null;
  const firstDay = entries.length ? startOfUTCDay(entries[0].at) : null;
  for (const entry of entries) {
    const key = dayKey(entry.at);
    if (!current || current.key !== key) {
      current = {
        key,
        date: entry.at,
        dayIndex: 1 + Math.round((startOfUTCDay(entry.at) - firstDay) / 86400000),
        entries: [],
      };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  const undated = bookings.filter((b) => !parseWall(b.start_at));
  return { groups, undated };
}

function startOfUTCDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// The current/next entry ("הבא בתור"): first entry ending/starting at or after now.
// `now` must be wall time expressed as-if-UTC (see nowAsWall).
export function findNextEntryId(groups, now) {
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.at >= now) return entry.id;
    }
  }
  return null;
}

// Browser "now" converted to the same wall-as-UTC representation.
export function nowAsWall() {
  const now = new Date();
  return new Date(Date.UTC(
    now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes()
  ));
}

// True when today falls within the trip's date span (for auto-scroll).
export function isDuringTrip(groups, now) {
  if (!groups.length) return false;
  const first = groups[0].entries[0]?.at;
  const lastGroup = groups[groups.length - 1];
  const last = lastGroup.entries[lastGroup.entries.length - 1]?.at;
  return first && last && now >= startOfUTCDayDate(first) && now <= endOfUTCDayDate(last);
}

function startOfUTCDayDate(date) {
  return new Date(startOfUTCDay(date));
}

function endOfUTCDayDate(date) {
  return new Date(startOfUTCDay(date) + 86400000 - 1);
}
