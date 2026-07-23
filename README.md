# 🌴 תאילנד Trip Planner

אפליקציית מידע לטיול קבוצתי בתאילנד — עברית, RTL, מובייל-first.
המטיילים רואים את הטיסות, המלונות והאטרקציות **שכבר הוזמנו**, ומשתמשים בכלים קבוצתיים (חלוקת הוצאות, צ'קליסט, טיפים). המארגן מזין את הנתונים דרך ניתוח AI של אישורי הזמנה (PDF או טקסט).

> זה **לא** אתר הזמנות — אין קישורים ל-Skyscanner/Booking/Agoda. ההזמנות כבר בוצעו; האתר מציג אותן.

## סטאק

- **Client:** React 18 + Vite + Tailwind (RTL) + React Router + Zustand + Leaflet
- **Server:** Node + Express, פרוקסי ל-Anthropic API (ניתוח הזמנות), JWT למארגן
- **DB:** Supabase (Postgres) — פרויקט ייעודי `thailand-trip` (ref: `chcmshsbhgxvmmpzsjau`), RLS פעיל ללא מדיניות ציבורית; גישה רק דרך השרת עם ה-service role key

## הרצה מקומית

```bash
npm install          # מתקין גם client וגם server
cp .env.example .env # ומלאו את המפתחות (ראו למטה)
npm run dev          # client על :5173, server על :3001
```

- `npm run build` — בניית ה-client
- `npm start` — שרת פרודקשן (מגיש API + client בנוי על :3001)
- `npm test` — טסטים של השרת (פרסר, חישוב התחשבנות, דגל הצ'אט)

**בלי מפתחות?** השרת עולה גם בלי Supabase — עם מאגר זמני בזיכרון (הנתונים לא נשמרים). מושלם להתרשמות ראשונה; לפרודקשן חובה למלא את המפתחות.

## משתני סביבה (.env)

| משתנה | מה זה | מאיפה |
|---|---|---|
| `ANTHROPIC_API_KEY` | ניתוח הזמנות עם Claude | https://console.anthropic.com/settings/keys |
| `SUPABASE_URL` | כבר מולא: `https://chcmshsbhgxvmmpzsjau.supabase.co` | — |
| `SUPABASE_SERVICE_ROLE_KEY` | מפתח סודי לשרת בלבד | Supabase Dashboard → Project Settings → API Keys → `service_role` |
| `ORGANIZER_PASSWORD` | סיסמת אזור המארגן (ברירת מחדל `admin2026`) | בחרו בעצמכם |
| `JWT_SECRET` | חתימת טוקן המארגן | מחרוזת אקראית ארוכה |
| `ENABLE_AI_CHAT` | צ'אט ה-AI פעיל כברירת מחדל; `false` מציג "בקרוב" | — |
| `ANTHROPIC_MODEL` | אופציונלי. ברירת מחדל `claude-sonnet-5` | שנו רק אם Anthropic ימליצו על מודל חדש בעתיד |

## מסד הנתונים

הסכימה כבר הוחלה על פרויקט ה-Supabase (טבלאות: bookings, checklist, participants, expenses, settings + נתוני seed). אם תרצו להקים פרויקט מחדש — הריצו את `supabase/migration.sql` ב-SQL Editor.

## דיפלוי

### אפשרות א' (מומלץ): הכל ב-Render — שירות אחד

1. דחפו את הריפו ל-GitHub
2. ב-[Render](https://render.com): **New → Blueprint** ובחרו את הריפו — הקובץ `render.yaml` כבר מגדיר הכל
3. מלאו את משתני הסביבה המסומנים `sync: false` (מפתח Anthropic, מפתח service role, סיסמת מארגן)
4. זהו — Render בונה את ה-client ומגיש אותו מאותו שרת (אין בעיות CORS)

### אפשרות ב': client ב-Netlify/Vercel + server ב-Render

1. **Server ב-Render:** New → Web Service, root הריפו, Build: `npm install && npm run build`, Start: `npm start`, + משתני הסביבה
2. **Client ב-Netlify/Vercel:** base directory `client`, build `npm run build`, publish `client/dist`
3. ב-client הגדירו משתנה סביבה `VITE_API_URL=https://<your-render-app>.onrender.com/api`

## צ'אט ה-AI 🤖 — פעיל!

הצ'אט חי כברירת מחדל: עונה בעברית מתוך נתוני הטיול, כולל המסלול יום-אחר-יום ("מה יש לנו מחר?").
הגנות: מגבלת 15 הודעות לדקה למשתמש, והיסטוריה של עד 20 הודעות. לכיבוי זמני: `ENABLE_AI_CHAT=false`.

## המסלול 🗓️

דף הבית הוא ציר זמן כרונולוגי של כל הטיול — מקובץ לפי ימים, מלונות מופיעים גם בצ'ק-אין וגם בצ'ק-אאוט, ופריט "הבא בתור" מודגש במהלך הטיול. התאריכים המובנים (start_at/end_at) מחולצים אוטומטית בניתוח; להזמנות ותיקות לחצו "🪄 נסה לזהות תאריכים" באזור המארגן.

## אזור המארגן

- כניסה: `/organizer` עם הסיסמה (ברירת מחדל `admin2026` — החליפו!)
- **העלאת PDF:** עובד גם עם PDF טקסטואלי (חילוץ עם pdf-parse) וגם עם PDF סרוק/מצולם (נשלח ל-Claude כתמונה)
- **הדבקת טקסט:** הדביקו אימייל אישור → JSON מובנה
- לפני שמירה מוצגת תצוגה מקדימה עם עריכה מלאה
- הפרסר כולל שמות נוסעים ומושבים, ולעולם לא כולל אימיילים/טלפונים/דרכונים/פרטי תשלום

## כרטיסי טיסה מקוריים 🎫

- כשהמארגן מעלה PDF לניתוח, הקובץ המקורי מצורף אוטומטית להזמנה שנשמרת (העלאה אחת בלבד)
- אפשר גם לצרף/להחליף/להסיר כרטיס ידנית מרשימת ההזמנות באזור המארגן (PDF עד 10MB)
- מטיילים רואים בכרטיסי הטיסות פס "כרטיס טיסה מקורי" עם צפייה בטאב חדש או הורדה לנייד
- האחסון ב-bucket פרטי ב-Supabase Storage; הגישה דרך קישורים חתומים לשעה בלבד שנוצרים בשרת — הקבצים לעולם לא חשופים ישירות
