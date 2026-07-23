// Builds the system prompt for the AI chat: all trip data serialized, with a
// chronological day-by-day itinerary — "מה יש לנו מחר?" is the #1 question.
const queries = require('../db/queries');

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function formatBooking(b) {
  const fields = (b.fields || []).map((f) => `  - ${f.label}: ${f.value}`).join('\n');
  return `• [${b.type}] ${b.title} (סטטוס: ${b.status}${b.source ? `, מקור: ${b.source}` : ''})\n${fields}${b.notes ? `\n  הערות: ${b.notes}` : ''}`;
}

// start_at/end_at hold local wall time stored as-if-UTC — read UTC fields only.
function wall(iso) {
  return iso ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`) : null;
}

function fmtTime(d) {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function fmtDate(d) {
  return `יום ${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

const ENTRY_LABEL = {
  flight: '✈️ טיסה',
  hotel: '🏨 מלון',
  activity: '🎡 פעילות',
  transfer: '🚐 העברה',
  other: '📄',
};

// Day-grouped itinerary text. Hotels contribute both a check-in entry (start_at)
// and a check-out entry (end_at).
function buildItineraryText(bookings) {
  const entries = [];
  for (const b of bookings) {
    const start = wall(b.start_at);
    if (!start) continue;
    if (b.type === 'hotel') {
      entries.push({ at: start, text: `🏨 צ'ק-אין: ${b.title}` });
      const end = wall(b.end_at);
      if (end) entries.push({ at: end, text: `🏨 צ'ק-אאוט: ${b.title}` });
    } else {
      entries.push({ at: start, text: `${ENTRY_LABEL[b.type] || '📄'}: ${b.title}` });
    }
  }
  entries.sort((a, b) => a.at - b.at);
  if (!entries.length) return 'אין עדיין פריטים עם תאריך במסלול';

  const lines = [];
  let currentDay = '';
  let dayIndex = 0;
  for (const entry of entries) {
    const dayKey = entry.at.toISOString().slice(0, 10);
    if (dayKey !== currentDay) {
      currentDay = dayKey;
      dayIndex += 1;
      lines.push(`\n### יום ${dayIndex} — ${fmtDate(entry.at)}`);
    }
    lines.push(`${fmtTime(entry.at)} — ${entry.text}`);
  }
  const undated = bookings.filter((b) => !b.start_at);
  if (undated.length) {
    lines.push('\n### ללא תאריך מוגדר');
    for (const b of undated) lines.push(`• ${ENTRY_LABEL[b.type] || '📄'}: ${b.title}`);
  }
  return lines.join('\n');
}

async function buildTripContext() {
  const [bookings, checklist, participants, expenses, settings] = await Promise.all([
    queries.listBookings(),
    queries.listChecklist(),
    queries.listParticipants(),
    queries.listExpenses(),
    queries.getSettings(),
  ]);

  const byType = (type) => bookings.filter((b) => b.type === type);
  const section = (title, items, fmt) =>
    `## ${title}\n${items.length ? items.map(fmt).join('\n') : 'אין נתונים'}`;

  const now = new Date();
  const todayLine = `היום: יום ${DAY_NAMES[now.getUTCDay()]}, ${now.toISOString().slice(0, 10)} (UTC)`;

  return `אתה עוזר AI חם ותמציתי לטיול קבוצתי בתאילנד ("${settings.trip_title || 'תכנון טיול לתאילנד'}").
${todayLine}

כללים מחייבים:
1. ענה תמיד בעברית, בחום ובקיצור.
2. על שאלות שקשורות לטיול עצמו (טיסות, מלונות, פעילויות, זמנים, מושבים, אסמכתאות) — ענה אך ורק מנתוני הטיול שלמטה. לעולם אל תמציא הזמנות, שעות, מושבים או מספרי אישור.
3. אם מידע על הטיול חסר בנתונים — אמור זאת במפורש והצע לפנות למארגן הטיול.
4. שאלות כלליות על תאילנד (אוכל, תרבות, מקומות) — ענה מהידע הכללי שלך.
5. לשאלות תפעוליות על הזמנות קיימות אפשר להפנות למרכז למטייל: וואטסאפ 972552750399 או טלפון *8880.
6. שעות במסלול הן בשעון המקומי של המקום (ישראל/תאילנד בהתאם).

# המסלול יום-אחר-יום
${buildItineraryText(bookings)}

# נתוני הטיול המלאים

${section('טיסות', byType('flight'), formatBooking)}

${section('מלונות', byType('hotel'), formatBooking)}

${section('אטרקציות ופעילויות', byType('activity'), formatBooking)}

${section('העברות', byType('transfer'), formatBooking)}

${section('הזמנות נוספות', byType('other'), formatBooking)}

${section("צ'קליסט הכנות", checklist, (c) => `• [${c.done ? 'בוצע' : 'טרם'}] ${c.label}${c.sub ? ` — ${c.sub}` : ''}`)}

${section('משתתפים', participants, (p) => `• ${p.name}`)}

${section('הוצאות', expenses, (e) => `• ${e.description}: ${e.amount} ${e.currency} (שילם: ${e.paid_by}, תאריך: ${e.date})`)}`;
}

module.exports = { buildTripContext, buildItineraryText };
