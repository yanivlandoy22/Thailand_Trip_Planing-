import { useState } from 'react';
import { useTripStore } from '../store/tripStore';
import { useUiStore } from '../store/uiStore';
import { api } from '../api/client';
import { Spinner, ErrorState, PageTitle, EmptyState } from '../components/Shared';

export default function Checklist() {
  const { checklist, setChecklist, loading, loaded, error, reload } = useTripStore();
  const toast = useUiStore((s) => s.toast);
  const confirm = useUiStore((s) => s.confirm);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !loaded) return <Spinner />;
  if (error && !loaded) return <ErrorState message={error} onRetry={reload} />;

  const toggle = async (item) => {
    const optimistic = checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c));
    setChecklist(optimistic);
    try {
      await api.updateChecklistItem(item.id, { done: !item.done });
    } catch (err) {
      setChecklist(checklist);
      toast(err.message, 'error');
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!label.trim() || busy) return;
    setBusy(true);
    try {
      const created = await api.addChecklistItem(label.trim());
      setChecklist([...checklist, created]);
      setLabel('');
      toast('המשימה נוספה ✅');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    const ok = await confirm('מחיקת משימה', `למחוק את "${item.label}"?`);
    if (!ok) return;
    try {
      await api.deleteChecklistItem(item.id);
      setChecklist(checklist.filter((c) => c.id !== item.id));
      toast('המשימה נמחקה');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const done = checklist.filter((c) => c.done).length;

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle
        emoji="✅"
        title="צ'קליסט לפני הטיול"
        sub={checklist.length ? `הושלמו ${done} מתוך ${checklist.length}` : undefined}
      />

      {checklist.length > 0 && (
        <div className="h-2 bg-slate-200 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${checklist.length ? (done / checklist.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-2 mb-5">
        {checklist.length === 0 && (
          <EmptyState emoji="📝" title="הרשימה ריקה" sub="הוסיפו משימות הכנה לטיול" />
        )}
        {checklist.map((item) => (
          <div key={item.id} className="card p-3.5 flex items-center gap-3">
            <button
              onClick={() => toggle(item)}
              aria-label={item.done ? 'סמן כלא בוצע' : 'סמן כבוצע'}
              className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${
                item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'
              }`}
            >
              {item.done && '✓'}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold ${item.done ? 'line-through text-slate-400' : ''}`}>
                {item.label}
              </div>
              {item.sub && (
                <div className={`text-xs ${item.done ? 'line-through text-slate-300' : 'text-slate-500'}`}>
                  {item.sub}
                </div>
              )}
            </div>
            <button
              onClick={() => remove(item)}
              className="text-slate-400 hover:text-rose-600 transition-colors text-lg"
              aria-label="מחיקה"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="card p-4 flex gap-2">
        <input
          className="input"
          placeholder="משימה חדשה..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy || !label.trim()}>
          הוספה
        </button>
      </form>
    </div>
  );
}
