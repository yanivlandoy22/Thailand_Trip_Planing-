import { useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTripStore } from '../store/tripStore';
import { useUiStore } from '../store/uiStore';
import { PageTitle, StatusBadge } from '../components/Shared';

const TYPES = [
  { value: 'flight', label: '✈️ טיסה' },
  { value: 'hotel', label: '🏨 מלון' },
  { value: 'activity', label: '🎡 אטרקציה' },
  { value: 'transfer', label: '🚐 העברה' },
  { value: 'other', label: '📄 אחר' },
];

const STATUSES = [
  { value: 'confirmed', label: 'מאושר' },
  { value: 'pending', label: 'ממתין' },
  { value: 'unknown', label: 'לא ידוע' },
];

// Editable booking preview — used both for parse results and editing existing bookings.
function BookingEditor({ draft, setDraft, onSave, onCancel, busy, saveLabel }) {
  const setField = (i, key, value) =>
    setDraft({
      ...draft,
      fields: draft.fields.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)),
    });

  return (
    <div className="card p-4 space-y-3 border-2 border-ocean/40">
      <div className="font-bold text-ocean-dark">תצוגה מקדימה — בדקו וערכו לפני שמירה</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">סוג</label>
          <select className="input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">סטטוס</label>
          <select
            className="input"
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">כותרת</label>
        <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </div>
      <div>
        <label className="label">מקור</label>
        <input
          className="input"
          value={draft.source || ''}
          onChange={(e) => setDraft({ ...draft, source: e.target.value })}
          placeholder="שם הספק / אתר ההזמנה"
        />
      </div>
      <div>
        <label className="label">שדות</label>
        <div className="space-y-1.5">
          {draft.fields.map((f, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                className="input !w-2/5"
                value={f.label}
                onChange={(e) => setField(i, 'label', e.target.value)}
                placeholder="תווית"
              />
              <input
                className="input"
                value={f.value}
                onChange={(e) => setField(i, 'value', e.target.value)}
                placeholder="ערך"
              />
              <button
                type="button"
                className="text-slate-400 hover:text-rose-600 px-1"
                onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, idx) => idx !== i) })}
                aria-label="מחיקת שדה"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-sm text-ocean font-semibold mt-2"
          onClick={() => setDraft({ ...draft, fields: [...draft.fields, { label: '', value: '' }] })}
        >
          + הוספת שדה
        </button>
      </div>
      <div>
        <label className="label">הערות</label>
        <textarea
          className="input"
          rows={2}
          value={draft.notes || ''}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <button className="btn-success flex-1" onClick={onSave} disabled={busy || !draft.title.trim()}>
          {saveLabel}
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function Login() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const toast = useUiStore((s) => s.toast);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { token } = await api.loginOrganizer(password);
      setToken(token);
      toast('התחברתם כמארגן 🔓');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6 max-w-sm mx-auto mt-8 space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-2">🔐</div>
        <h2 className="text-xl font-bold">אזור המארגן</h2>
        <p className="text-sm text-slate-500 mt-1">הזינו את סיסמת המארגן כדי לנהל את הטיול</p>
      </div>
      <input
        className="input"
        type="password"
        placeholder="סיסמה"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <button type="submit" className="btn-primary w-full" disabled={busy || !password}>
        {busy ? 'מתחבר...' : 'כניסה'}
      </button>
    </form>
  );
}

function ParseSection({ onParsed }) {
  const [tab, setTab] = useState('pdf');
  const [text, setText] = useState('');
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const toast = useUiStore((s) => s.toast);

  const parsePdf = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      toast('מנתח את הקובץ — זה יכול לקחת כמה שניות ⏳', 'info');
      onParsed(await api.parsePdf(file));
      toast('הניתוח הושלם — בדקו את התצוגה המקדימה');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const parseText = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      toast('מנתח את הטקסט... ⏳', 'info');
      onParsed(await api.parseText(text));
      setText('');
      toast('הניתוח הושלם — בדקו את התצוגה המקדימה');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const loadJson = () => {
    try {
      const parsed = JSON.parse(json);
      onParsed({
        type: parsed.type || 'other',
        source: parsed.source || null,
        title: parsed.title || '',
        status: parsed.status || 'unknown',
        fields: Array.isArray(parsed.fields) ? parsed.fields : [],
        notes: parsed.notes || null,
      });
      setJson('');
    } catch {
      toast('JSON לא תקין — בדקו את המבנה', 'error');
    }
  };

  const tabs = [
    { key: 'pdf', label: '📄 העלאת PDF' },
    { key: 'text', label: '📋 הדבקת טקסט' },
    { key: 'json', label: '🧩 JSON ידני' },
  ];

  return (
    <div className="card p-4">
      <div className="font-bold mb-3">הוספת הזמנה חדשה</div>
      <div className="flex gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-ocean text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pdf' && (
        <div>
          <label
            className={`block border-2 border-dashed border-slate-300 hover:border-ocean rounded-app p-8 text-center cursor-pointer transition-colors ${
              busy ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => parsePdf(e.target.files?.[0])}
            />
            <div className="text-3xl mb-2">📄</div>
            <div className="font-semibold text-slate-700">{busy ? 'מנתח...' : 'לחצו לבחירת קובץ PDF'}</div>
            <div className="text-xs text-slate-500 mt-1">
              עובד גם עם PDF סרוק/מצולם — הניתוח נעשה עם AI
            </div>
          </label>
        </div>
      )}

      {tab === 'text' && (
        <div className="space-y-2">
          <textarea
            className="input"
            rows={7}
            placeholder="הדביקו כאן את תוכן אימייל האישור..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary" onClick={parseText} disabled={busy || !text.trim()}>
            {busy ? 'מנתח...' : 'ניתוח עם AI'}
          </button>
        </div>
      )}

      {tab === 'json' && (
        <div className="space-y-2">
          <textarea
            className="input font-mono text-xs"
            dir="ltr"
            rows={7}
            placeholder='{"type":"flight","title":"...","status":"confirmed","fields":[{"label":"...","value":"..."}]}'
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
          <button className="btn-primary" onClick={loadJson} disabled={!json.trim()}>
            טעינה לתצוגה מקדימה
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsSection() {
  const { settings, setSettings } = useTripStore();
  const toast = useUiStore((s) => s.toast);
  const [form, setForm] = useState({
    trip_title: settings.trip_title || '',
    hero_subtitle: settings.hero_subtitle || '',
    organizer_password: '',
    rate_THB_ILS: settings.rate_THB_ILS || '0.11',
    rate_USD_ILS: settings.rate_USD_ILS || '3.65',
    rate_EUR_ILS: settings.rate_EUR_ILS || '3.95',
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const patch = { ...form };
      if (!patch.organizer_password) delete patch.organizer_password;
      const updated = await api.updateSettings(patch);
      setSettings(updated);
      setForm((f) => ({ ...f, organizer_password: '' }));
      toast('ההגדרות נשמרו ⚙️');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="font-bold">הגדרות הטיול</div>
      <div>
        <label className="label">כותרת הטיול</label>
        <input
          className="input"
          value={form.trip_title}
          onChange={(e) => setForm({ ...form, trip_title: e.target.value })}
        />
      </div>
      <div>
        <label className="label">כותרת משנה</label>
        <input
          className="input"
          value={form.hero_subtitle}
          onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
        />
      </div>
      <div>
        <label className="label">סיסמת מארגן חדשה (השאירו ריק כדי לא לשנות)</label>
        <input
          className="input"
          type="password"
          value={form.organizer_password}
          onChange={(e) => setForm({ ...form, organizer_password: e.target.value })}
        />
      </div>
      <div>
        <label className="label">שערי המרה לשקל</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['rate_THB_ILS', '฿ באט'],
            ['rate_USD_ILS', '$ דולר'],
            ['rate_EUR_ILS', '€ יורו'],
          ].map(([key, label]) => (
            <div key={key}>
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full" onClick={save} disabled={busy}>
        שמירת הגדרות
      </button>
    </div>
  );
}

export default function Organizer() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const { bookings, setBookings, reload } = useTripStore();
  const toast = useUiStore((s) => s.toast);
  const confirm = useUiStore((s) => s.confirm);

  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!token) return <Login />;

  const saveDraft = async () => {
    setBusy(true);
    try {
      if (editingId) {
        const updated = await api.updateBooking(editingId, draft);
        setBookings(bookings.map((b) => (b.id === editingId ? updated : b)));
        toast('ההזמנה עודכנה ✏️');
      } else {
        const created = await api.createBooking(draft);
        setBookings([...bookings, created]);
        toast('ההזמנה נשמרה 🎉');
      }
      setDraft(null);
      setEditingId(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const editBooking = (b) => {
    setEditingId(b.id);
    setDraft({
      type: b.type,
      source: b.source,
      title: b.title,
      status: b.status,
      fields: [...(b.fields || [])],
      notes: b.notes,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBooking = async (b) => {
    const ok = await confirm('מחיקת הזמנה', `למחוק את "${b.title}"? פעולה זו אינה הפיכה.`);
    if (!ok) return;
    try {
      await api.deleteBooking(b.id);
      setBookings(bookings.filter((x) => x.id !== b.id));
      toast('ההזמנה נמחקה');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <PageTitle emoji="⚙️" title="אזור המארגן" />
        <button className="btn-ghost text-sm" onClick={logout}>
          התנתקות
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          {draft ? (
            <BookingEditor
              draft={draft}
              setDraft={setDraft}
              onSave={saveDraft}
              onCancel={() => {
                setDraft(null);
                setEditingId(null);
              }}
              busy={busy}
              saveLabel={editingId ? 'עדכון ההזמנה' : 'שמירת ההזמנה'}
            />
          ) : (
            <ParseSection
              onParsed={(parsed) => {
                setEditingId(null);
                setDraft(parsed);
              }}
            />
          )}
          <SettingsSection />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">הזמנות ({bookings.length})</div>
            <button className="text-sm text-ocean font-semibold" onClick={reload}>
              🔄 רענון
            </button>
          </div>
          {bookings.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">
              עדיין אין הזמנות — העלו PDF או הדביקו טקסט אישור
            </div>
          ) : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.id} className="border border-slate-100 rounded-app p-3 flex items-center gap-3">
                  <span className="text-xl">
                    {{ flight: '✈️', hotel: '🏨', activity: '🎡', transfer: '🚐' }[b.type] || '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{b.title}</div>
                    <div className="text-xs text-slate-500">{b.source}</div>
                  </div>
                  <StatusBadge status={b.status} />
                  <button onClick={() => editBooking(b)} aria-label="עריכה" className="hover:scale-110 transition-transform">
                    ✏️
                  </button>
                  <button onClick={() => deleteBooking(b)} aria-label="מחיקה" className="hover:scale-110 transition-transform">
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
