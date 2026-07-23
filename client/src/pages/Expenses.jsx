import { useMemo, useState } from 'react';
import { useTripStore } from '../store/tripStore';
import { useUiStore } from '../store/uiStore';
import { api } from '../api/client';
import { Spinner, ErrorState, PageTitle } from '../components/Shared';
import {
  CURRENCIES,
  totalsPerCurrency,
  computeBalances,
  computeSettlement,
  toILS,
} from '../utils/settlement';

const SYMBOLS = { THB: '฿', ILS: '₪', USD: '$', EUR: '€' };

const emptyForm = () => ({
  description: '',
  amount: '',
  currency: 'THB',
  paid_by: '',
  participants: [],
  date: new Date().toISOString().slice(0, 10),
});

export default function Expenses() {
  const { expenses, participants, settings, setExpenses, setParticipants, loading, loaded, error, reload } =
    useTripStore();
  const toast = useUiStore((s) => s.toast);
  const confirm = useUiStore((s) => s.confirm);

  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const rates = useMemo(
    () => ({
      THB: Number(settings.rate_THB_ILS) || 0.11,
      USD: Number(settings.rate_USD_ILS) || 3.65,
      EUR: Number(settings.rate_EUR_ILS) || 3.95,
    }),
    [settings]
  );

  const names = participants.map((p) => p.name);
  const totals = totalsPerCurrency(expenses);
  const balances = computeBalances(expenses, rates, names);
  const settlement = computeSettlement(balances);
  const totalILS = expenses.reduce((sum, e) => sum + toILS(Number(e.amount) || 0, e.currency, rates), 0);

  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleParticipant = (name) =>
    setForm((f) => ({
      ...f,
      participants: f.participants.includes(name)
        ? f.participants.filter((n) => n !== name)
        : [...f.participants, name],
    }));

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await api.addParticipant(newName.trim());
      setParticipants([...participants, created]);
      setNewName('');
      toast('המשתתף נוסף 👋');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const removeParticipant = async (p) => {
    const ok = await confirm('הסרת משתתף', `להסיר את ${p.name} מהקבוצה?`);
    if (!ok) return;
    try {
      await api.deleteParticipant(p.id);
      setParticipants(participants.filter((x) => x.id !== p.id));
      toast('המשתתף הוסר');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      currency: expense.currency,
      paid_by: expense.paid_by,
      participants: expense.participants || [],
      date: expense.date,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.description.trim()) return toast('יש להזין תיאור', 'error');
    if (!Number(form.amount) || Number(form.amount) <= 0) return toast('יש להזין סכום חיובי', 'error');
    if (!form.paid_by) return toast('יש לבחור מי שילם', 'error');
    setBusy(true);
    const payload = { ...form, description: form.description.trim(), amount: Number(form.amount) };
    try {
      if (editingId) {
        const updated = await api.updateExpense(editingId, payload);
        setExpenses(expenses.map((x) => (x.id === editingId ? updated : x)));
        toast('ההוצאה עודכנה ✏️');
      } else {
        const created = await api.addExpense(payload);
        setExpenses([...expenses, created]);
        toast('ההוצאה נשמרה 💾');
      }
      setForm(emptyForm());
      setEditingId(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (expense) => {
    const ok = await confirm('מחיקת הוצאה', `למחוק את "${expense.description}"?`);
    if (!ok) return;
    try {
      await api.deleteExpense(expense.id);
      setExpenses(expenses.filter((x) => x.id !== expense.id));
      if (editingId === expense.id) {
        setEditingId(null);
        setForm(emptyForm());
      }
      toast('ההוצאה נמחקה');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <PageTitle emoji="💰" title="הוצאות" sub="חלוקת הוצאות הקבוצה וחישוב התחשבנות" />

      {/* participants */}
      <div className="card p-4 mb-4">
        <div className="font-bold text-sm mb-2">משתתפים</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {names.length === 0 && (
            <span className="text-sm text-slate-500">הוסיפו את שמות המטיילים כדי להתחיל</span>
          )}
          {participants.map((p) => (
            <span
              key={p.id}
              className="bg-sky-50 text-sky-800 text-sm font-medium pl-1.5 pr-3 py-1 rounded-full flex items-center gap-1.5"
            >
              {p.name}
              <button
                onClick={() => removeParticipant(p)}
                className="text-sky-400 hover:text-rose-600 leading-none"
                aria-label={`הסרת ${p.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={addParticipant} className="flex gap-2">
          <input
            className="input max-w-xs"
            placeholder="שם משתתף..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={!newName.trim()}>
            הוספה
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* expense list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-4 overflow-x-auto">
            <div className="font-bold mb-3">רשימת הוצאות</div>
            {expenses.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">
                עדיין אין הוצאות — הוסיפו את הראשונה בטופס 👈
              </div>
            ) : (
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-right text-slate-500 border-b border-slate-100">
                    <th className="py-2 font-semibold">תאריך</th>
                    <th className="py-2 font-semibold">תיאור</th>
                    <th className="py-2 font-semibold">משלם</th>
                    <th className="py-2 font-semibold">סכום</th>
                    <th className="py-2 font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 whitespace-nowrap text-slate-500">
                        {new Date(e.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-medium">{e.description}</td>
                      <td className="py-2.5">{e.paid_by}</td>
                      <td className="py-2.5 whitespace-nowrap font-semibold">
                        {SYMBOLS[e.currency]}
                        {Number(e.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <button onClick={() => startEdit(e)} className="ml-2 hover:scale-110 transition-transform" aria-label="עריכה">
                          ✏️
                        </button>
                        <button onClick={() => remove(e)} className="hover:scale-110 transition-transform" aria-label="מחיקה">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* summary */}
          <div className="card p-4">
            <div className="font-bold mb-3">סיכום</div>
            {expenses.length === 0 ? (
              <div className="text-sm text-slate-500">אין נתונים עדיין</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(totals).map(([currency, total]) => (
                    <div key={currency} className="bg-slate-50 rounded-app px-3 py-2 text-center">
                      <div className="font-extrabold text-ocean">
                        {SYMBOLS[currency]}
                        {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[11px] text-slate-500">{currency}</div>
                    </div>
                  ))}
                  <div className="bg-ocean/10 rounded-app px-3 py-2 text-center">
                    <div className="font-extrabold text-ocean-dark">
                      ₪{totalILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[11px] text-slate-500">סה"כ בשקלים</div>
                  </div>
                </div>

                <div className="font-bold text-sm mb-2">התחשבנות 🤝</div>
                {settlement.length === 0 ? (
                  <div className="text-sm text-emerald-600 font-medium">הכל מאוזן — אין העברות נדרשות ✨</div>
                ) : (
                  <ul className="space-y-1.5">
                    {settlement.map((t, i) => (
                      <li key={i} className="text-sm bg-amber-50 border border-amber-100 rounded-app px-3 py-2">
                        <span className="font-bold">{t.from}</span> צריך לשלם ל
                        <span className="font-bold">{t.to}</span> —{' '}
                        <span className="font-extrabold text-amber-700">
                          ₪{t.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* add/edit form */}
        <form onSubmit={submit} className="lg:col-span-2 card p-4 h-fit space-y-3">
          <div className="font-bold">{editingId ? 'עריכת הוצאה' : 'הוסף הוצאה'}</div>
          <div>
            <label className="label">תיאור</label>
            <input
              className="input"
              placeholder="למשל: ארוחת ערב בשוק לילה"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">סכום</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setField('amount', e.target.value)}
              />
            </div>
            <div>
              <label className="label">מטבע</label>
              <select className="input" value={form.currency} onChange={(e) => setField('currency', e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} {SYMBOLS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">משלם</label>
            <select className="input" value={form.paid_by} onChange={(e) => setField('paid_by', e.target.value)}>
              <option value="">בחרו משתתף...</option>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">מי השתתף? (ברירת מחדל: כולם)</label>
            <div className="flex flex-wrap gap-1.5">
              {names.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => toggleParticipant(n)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    form.participants.includes(n)
                      ? 'bg-ocean text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">תאריך</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-success flex-1" disabled={busy}>
              {editingId ? 'עדכון הוצאה' : 'שמור הוצאה'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                }}
              >
                ביטול
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
