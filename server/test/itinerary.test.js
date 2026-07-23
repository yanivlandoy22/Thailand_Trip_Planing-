const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { pathToFileURL } = require('url');

const itineraryUrl = pathToFileURL(
  path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'itinerary.js')
).href;

const BOOKINGS = [
  { id: 'f1', type: 'flight', title: 'טיסה', start_at: '2026-08-10T21:30:00', end_at: '2026-08-29T06:10:00' },
  { id: 'h1', type: 'hotel', title: 'מלון בנגקוק', start_at: '2026-08-11T15:00:00', end_at: '2026-08-14T12:00:00' },
  { id: 't1', type: 'transfer', title: 'העברה', start_at: '2026-08-11T13:00:00' },
  { id: 'a1', type: 'activity', title: 'שייט', start_at: '2026-08-12T08:00:00' },
  { id: 'x1', type: 'activity', title: 'ללא תאריך', start_at: null },
];

test('buildItinerary sorts, groups by day with day counter, hotel appears twice', async () => {
  const { buildItinerary } = await import(itineraryUrl);
  const { groups, undated } = buildItinerary(BOOKINGS);

  // days: 10.8 (flight), 11.8 (transfer 13:00 then hotel check-in 15:00), 12.8 (activity), 14.8 (check-out)
  assert.deepStrictEqual(groups.map((g) => g.key), ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-14']);
  assert.deepStrictEqual(groups.map((g) => g.dayIndex), [1, 2, 3, 5]);

  const day2 = groups[1].entries;
  assert.deepStrictEqual(day2.map((e) => e.id), ['t1', 'h1-in']);
  assert.strictEqual(day2[1].hotelEvent, 'checkin');

  const day5 = groups[3].entries;
  assert.strictEqual(day5[0].id, 'h1-out');
  assert.strictEqual(day5[0].hotelEvent, 'checkout');

  assert.deepStrictEqual(undated.map((b) => b.id), ['x1']);
});

test('findNextEntryId picks the first entry at or after now', async () => {
  const { buildItinerary, findNextEntryId } = await import(itineraryUrl);
  const { groups } = buildItinerary(BOOKINGS);
  // between the flight and the transfer
  const next = findNextEntryId(groups, new Date('2026-08-11T00:00:00Z'));
  assert.strictEqual(next, 't1');
  // after everything
  assert.strictEqual(findNextEntryId(groups, new Date('2026-09-01T00:00:00Z')), null);
});

test('isDuringTrip detects trip span', async () => {
  const { buildItinerary, isDuringTrip } = await import(itineraryUrl);
  const { groups } = buildItinerary(BOOKINGS);
  assert.strictEqual(isDuringTrip(groups, new Date('2026-08-12T10:00:00Z')), true);
  assert.strictEqual(isDuringTrip(groups, new Date('2026-07-01T10:00:00Z')), false);
});

test('wall-time parsing ignores timezone offsets from Supabase', async () => {
  const { buildItinerary } = await import(itineraryUrl);
  const { groups } = buildItinerary([
    { id: 'z', type: 'activity', title: 'x', start_at: '2026-08-12T08:00:00+00:00' },
  ]);
  assert.strictEqual(groups[0].entries[0].at.getUTCHours(), 8);
});
