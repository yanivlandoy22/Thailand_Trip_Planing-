// In-memory fallback store, used only when Supabase credentials are missing
// (e.g. first local run before pasting keys). Mirrors the Supabase schema and
// seed data so the app is fully usable, but nothing persists across restarts.
const crypto = require('crypto');

const store = {
  bookings: [],
  checklist: [
    seedItem('ביטוח נסיעות', 'לוודא כיסוי לכל משתתפי הטיול'),
    seedItem('דרכון בתוקף', 'לפחות 6 חודשים מיום הכניסה לתאילנד'),
    seedItem('המרת מזומן', 'דולרים/באטים — מומלץ SuperRich בבנגקוק'),
    seedItem('הורדת אפליקציית Grab', 'מוניות ומשלוחים בתאילנד'),
    seedItem("צ'ק-אין אונליין", '24 שעות לפני הטיסה'),
    seedItem('אריזה', 'בגדים קלים, קרם הגנה, מטען נייד, מתאם חשמל'),
  ],
  participants: [],
  expenses: [],
  settings: {
    trip_title: 'תכנון טיול לתאילנד',
    hero_subtitle: 'כל המידע על הטיול שלנו במקום אחד',
    rate_THB_ILS: '0.11',
    rate_USD_ILS: '3.65',
    rate_EUR_ILS: '3.95',
  },
};

function seedItem(label, sub) {
  return { id: crypto.randomUUID(), label, sub, done: false, created_at: new Date().toISOString() };
}

function newId() {
  return crypto.randomUUID();
}

module.exports = { store, newId };
