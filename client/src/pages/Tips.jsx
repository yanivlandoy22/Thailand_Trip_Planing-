import { PageTitle } from '../components/Shared';

// Exactly 7 tips per product spec — no "local culture" tip.
const TIPS = [
  {
    emoji: '💱',
    color: 'border-amber-200 bg-amber-50',
    title: 'המרת כסף',
    body: 'את ההמרה הכי משתלמת תמצאו בסניפי SuperRich (הירוק והכתום) בבנגקוק. הביאו דולרים או יורו במזומן — שטרות חדשים של 100$ מקבלים שער טוב יותר. הימנעו מהמרה בשדה התעופה מעבר לסכום קטן לתחילת הדרך.',
  },
  {
    emoji: '📱',
    color: 'border-sky-200 bg-sky-50',
    title: 'סים מקומי',
    body: 'סים תיירים של True Move (או AIS) זמין בדוכנים בשדה התעופה — חבילות של 8-15 ימים עם גלישה בלתי מוגבלת במחיר נוח. אפשר גם eSIM מראש מהבית. חשוב שיהיה אינטרנט זמין ל-Grab ולניווט.',
  },
  {
    emoji: '🚕',
    color: 'border-emerald-200 bg-emerald-50',
    title: 'אפליקציית Grab',
    body: 'ה"אובר של תאילנד" — מוניות, אופנועים ומשלוחי אוכל במחיר סגור מראש, בלי להתמקח. הורידו והגדירו את האפליקציה עוד בבית. ברוב המקומות זו הדרך הזולה והבטוחה ביותר להתנייד.',
  },
  {
    emoji: '🛫',
    color: 'border-purple-200 bg-purple-50',
    title: 'שדות תעופה',
    body: 'לטיסות פנים הגיעו שעה וחצי לפני ההמראה, לטיסות בינלאומיות — שעתיים. עשו צ׳ק-אין אונליין 24 שעות מראש. שימו לב מאיזה שדה יוצאת הטיסה בבנגקוק: סוברנבומי (BKK) או דון מיואנג (DMK) — הם רחוקים זה מזה!',
  },
  {
    emoji: '🌦️',
    color: 'border-cyan-200 bg-cyan-50',
    title: 'מזג אוויר',
    body: 'חם ולח כל השנה — שתו הרבה מים ומרחו קרם הגנה. בעונת הגשמים (מאי-אוקטובר) הממטרים בדרך כלל קצרים ועזים ואז מתבהר. מטריה קטנה או פונצ׳ו זולים בכל 7-Eleven.',
  },
  {
    emoji: '🏥',
    color: 'border-rose-200 bg-rose-50',
    title: 'בריאות',
    body: 'שתו רק מים מבוקבקים. ביטוח נסיעות חובה — כולל כיסוי לאופנוע אם מתכננים לרכוב. בתי המרקחת (Boots, Watsons) מצוידים היטב. בתי החולים הפרטיים בערים הגדולות ברמה גבוהה מאוד.',
  },
  {
    emoji: '🎟️',
    color: 'border-indigo-200 bg-indigo-50',
    title: 'הזמנה מראש',
    body: 'אטרקציות פופולריות, טיולי איים והעברות בין ערים כדאי להזמין יום-יומיים מראש, במיוחד בעונת השיא (נובמבר-פברואר). את הכרטיסים והאישורים תמצאו כאן באפליקציה — שמרו צילום מסך גם לאופליין.',
  },
];

export default function Tips() {
  return (
    <div>
      <PageTitle emoji="💡" title="טיפים לתאילנד" sub="מה שחשוב לדעת לפני ובמהלך הטיול" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TIPS.map((tip) => (
          <article key={tip.title} className={`card border p-5 ${tip.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{tip.emoji}</span>
              <h3 className="font-bold">{tip.title}</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{tip.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
