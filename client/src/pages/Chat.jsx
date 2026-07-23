import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { PageTitle } from '../components/Shared';
import { useUiStore } from '../store/uiStore';

const SUGGESTED = ['מה יש לנו מחר?', 'מתי הטיסה הבאה?', "באיזה מלון אנחנו ישנים בצ'אנג מאי?"];

const HISTORY_CAP = 20;

// Live AI chat — the server answers with Claude using the full trip context
// (day-by-day itinerary included). History lives in memory only.
export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const confirm = useUiStore((s) => s.confirm);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;
    const nextMessages = [...messages, { role: 'user', content }].slice(-HISTORY_CAP);
    setMessages(nextMessages);
    setInput('');
    setBusy(true);
    try {
      const res = await api.chat(nextMessages);
      if (res.status === 'coming_soon') {
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: 'העוזר עדיין לא הופעל — פנו למארגן הטיול 🙂' },
        ]);
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: res.reply }].slice(-HISTORY_CAP));
      }
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!messages.length) return;
    const ok = await confirm('ניקוי שיחה', 'למחוק את כל ההודעות בשיחה?');
    if (ok) setMessages([]);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-190px)] md:h-[calc(100vh-160px)]">
      <div className="flex items-start justify-between">
        <PageTitle emoji="🤖" title="צ'אט AI" sub="עוזר חכם שמכיר את כל פרטי הטיול שלכם" />
        {messages.length > 0 && (
          <button onClick={clear} className="btn-ghost text-xs shrink-0">
            🧹 נקה שיחה
          </button>
        )}
      </div>

      <div className="card flex-1 overflow-y-auto p-4 space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <div className="text-4xl mb-3">🤖</div>
            <div className="font-semibold text-slate-700">שאלו אותי כל דבר על הטיול</div>
            <div className="flex flex-col items-center gap-2 mt-4">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="bg-sky-50 hover:bg-sky-100 text-ocean-dark text-sm font-medium rounded-full px-4 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-ocean text-white rounded-tr-md'
                  : 'bg-slate-100 text-slate-800 rounded-tl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-end">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="כתבו הודעה..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn-primary shrink-0 min-h-[44px]" disabled={busy || !input.trim()}>
          שליחה
        </button>
      </form>
    </div>
  );
}
