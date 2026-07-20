// Builds the RAG context for the (future) AI chat: serializes ALL trip data
// into a system prompt. Activation: set ENABLE_AI_CHAT=true — /api/chat then
// calls Claude with this prompt + conversation history. No client changes needed.
const queries = require('../db/queries');

function formatBooking(b) {
  const fields = (b.fields || []).map((f) => `  - ${f.label}: ${f.value}`).join('\n');
  return `• [${b.type}] ${b.title} (סטטוס: ${b.status}${b.source ? `, מקור: ${b.source}` : ''})\n${fields}${b.notes ? `\n  הערות: ${b.notes}` : ''}`;
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

  return `אתה עוזר AI לטיול קבוצתי בתאילנד ("${settings.trip_title || 'תכנון טיול לתאילנד'}").
ענה בעברית, בקצרה ובאדיבות, אך ורק על סמך נתוני הטיול שלהלן. אם המידע לא מופיע בנתונים — אמור שאין לך את המידע והפנה למארגן הטיול.
לשאלות על הזמנות קיימות אפשר להפנות למרכז למטייל: וואטסאפ 972552750399 או טלפון *8880.

# נתוני הטיול

${section('טיסות', byType('flight'), formatBooking)}

${section('מלונות', byType('hotel'), formatBooking)}

${section('אטרקציות ופעילויות', byType('activity'), formatBooking)}

${section('העברות', byType('transfer'), formatBooking)}

${section('הזמנות נוספות', byType('other'), formatBooking)}

${section("צ'קליסט הכנות", checklist, (c) => `• [${c.done ? 'בוצע' : 'טרם'}] ${c.label}${c.sub ? ` — ${c.sub}` : ''}`)}

${section('משתתפים', participants, (p) => `• ${p.name}`)}

${section('הוצאות', expenses, (e) => `• ${e.description}: ${e.amount} ${e.currency} (שילם: ${e.paid_by}, תאריך: ${e.date})`)}`;
}

module.exports = { buildTripContext };
