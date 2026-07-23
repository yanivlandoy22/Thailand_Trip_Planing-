const { getClient, MODEL } = require('./anthropic');

const SYSTEM_PROMPT = `אתה מנתח אישורי הזמנות (טיסות, מלונות, אטרקציות, העברות) עבור אפליקציית מידע לטיול קבוצתי בתאילנד.
המשתמש ידביק טקסט של אימייל אישור או יעלה PDF, ואתה מחלץ ממנו JSON מובנה.

חוקים מחייבים:
1. פלט JSON בלבד — אובייקט אחד, ללא טקסט נוסף, ללא markdown, ללא \`\`\`.
2. מבנה הפלט המדויק:
{"type":"flight|hotel|activity|transfer|other","source":"שם הספק/האתר","title":"כותרת קצרה בעברית","status":"confirmed|pending|unknown","start_at":"ISO 8601 או null","end_at":"ISO 8601 או null","fields":[{"label":"תווית בעברית","value":"ערך"}],"notes":"הערות חשובות או null"}
2ב. start_at ו-end_at — תאריכי התחלה וסיום מובנים למיון כרונולוגי:
   - פורמט ISO 8601 בשעה מקומית וללא אזור זמן (למשל "2026-08-10T21:30:00"). אם ידוע רק תאריך בלי שעה — "2026-08-10T00:00:00". אם לא ניתן לקבוע — null.
   - flight: start_at = המראת ההלוך, end_at = נחיתת החזור (או נחיתת ההלוך אם אין חזור).
   - hotel: start_at = צ'ק-אין, end_at = צ'ק-אאוט.
   - activity: start_at = מועד הפעילות, end_at = סיום אם ידוע.
   - transfer: start_at = שעת האיסוף.
3. כל התוויות (label) והכותרת (title) בעברית. ערכים (value) יכולים להישאר בשפת המקור (שמות, קודי טיסה, שמות מלונות).
4. חובה לכלול שמות נוסעים ומספרי מושבים אם קיימים (נחוצים בעלייה למטוס).
5. אסור בהחלט לכלול: כתובות אימייל, מספרי טלפון, מספרי דרכון, פרטי תשלום/כרטיס אשראי.

שדות לחילוץ לפי סוג:
- flight: מספר טיסה, חברת תעופה, מסלול (מוצא→יעד), תאריך ושעת המראה, תאריך ושעת נחיתה, משך, אסמכתא (PNR), מחלקה, כבודה, ארוחה, נוסעים ומושבים. אם יש הלוך ושוב — הפרד שדות עם קידומת "הלוך:" ו"חזור:".
- hotel: שם המלון, עיר, תאריך צ'ק-אין, תאריך צ'ק-אאוט, מספר לילות, סוג חדר, מספר אורחים, מחיר, מספר אישור, מדיניות ביטול.
- activity: שם הפעילות, תאריך, שעה, מיקום, מספר משתתפים, מה כלול, אסמכתא. אם המיקום מזוהה — הוסף שדה {"label":"קואורדינטות","value":"lat,lng"}.
- transfer: נקודת איסוף, יעד, תאריך, שעה, סוג רכב, אסמכתא.

אם המסמך אינו אישור הזמנה — החזר {"type":"other","source":null,"title":"מסמך לא מזוהה","status":"unknown","fields":[],"notes":"לא זוהה אישור הזמנה במסמך"}.`;

function extractJson(text) {
  // The model is instructed to return bare JSON, but be tolerant of fences.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw badParse();
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw badParse();
  }
}

function badParse() {
  const err = new Error('לא הצלחנו לנתח את המסמך — נסו שוב או הזינו את הפרטים ידנית');
  err.status = 422;
  return err;
}

// Accept ISO-8601-looking datetimes only; anything unparseable becomes null.
function normalizeDatetime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(value.endsWith('Z') ? value : `${value.replace(/([+-]\d{2}:?\d{2})$/, '')}Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Store wall time as-if-UTC: strip any offset, keep the literal components.
  return value.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
}

function normalize(parsed) {
  const types = ['flight', 'hotel', 'activity', 'transfer', 'other'];
  const statuses = ['confirmed', 'pending', 'unknown'];
  return {
    start_at: normalizeDatetime(parsed.start_at),
    end_at: normalizeDatetime(parsed.end_at),
    type: types.includes(parsed.type) ? parsed.type : 'other',
    source: parsed.source || null,
    title: parsed.title || 'הזמנה ללא כותרת',
    status: statuses.includes(parsed.status) ? parsed.status : 'unknown',
    fields: Array.isArray(parsed.fields)
      ? parsed.fields
          .filter((f) => f && f.label && f.value !== undefined && f.value !== null)
          .map((f) => ({ label: String(f.label), value: String(f.value) }))
      : [],
    notes: parsed.notes || null,
  };
}

async function parseBookingText(text) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `נתח את אישור ההזמנה הבא:\n\n${text}` }],
  });
  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw badParse();
  return normalize(extractJson(block.text));
}

// For scanned/image PDFs with no text layer: send the PDF itself as a
// base64 document block — Claude reads it visually.
async function parseBookingPdfVision(pdfBuffer) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBuffer.toString('base64'),
            },
          },
          { type: 'text', text: 'נתח את אישור ההזמנה שבמסמך המצורף.' },
        ],
      },
    ],
  });
  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw badParse();
  return normalize(extractJson(block.text));
}

// Backfill helper: extract only start_at/end_at from an existing booking's
// display fields (for data created before the structured-datetime columns).
async function extractBookingDates(booking) {
  const fieldsText = (booking.fields || []).map((f) => `${f.label}: ${f.value}`).join('\n');
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 256,
    system:
      'חלץ תאריכי התחלה וסיום מנתוני הזמנה. השב אך ורק ב-JSON: {"start_at":"ISO 8601 בשעה מקומית ללא אזור זמן או null","end_at":"כנ\'\'ל או null"}. ' +
      'flight: התחלה=המראת הלוך, סיום=נחיתת חזור. hotel: צ\'ק-אין/צ\'ק-אאוט. תאריך בלי שעה → T00:00:00. אין מידע → null.',
    messages: [
      { role: 'user', content: `סוג: ${booking.type}\nכותרת: ${booking.title}\n${fieldsText}` },
    ],
  });
  const block = response.content.find((b) => b.type === 'text');
  if (!block) return { start_at: null, end_at: null };
  const parsed = extractJson(block.text);
  return { start_at: normalizeDatetime(parsed.start_at), end_at: normalizeDatetime(parsed.end_at) };
}

module.exports = {
  parseBookingText,
  parseBookingPdfVision,
  extractBookingDates,
  extractJson,
  normalize,
  SYSTEM_PROMPT,
};
