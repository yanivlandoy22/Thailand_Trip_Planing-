import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { PageTitle } from '../components/Shared';

// AI chat shell — fully wired to POST /api/chat. While the server flag
// ENABLE_AI_CHAT is off the endpoint returns {status:"coming_soon"} and the
// UI shows the "בקרוב" state. Flipping the flag activates real answers with
// no client changes.
export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, comingSoon]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);
    try {
      const res = await api.chat(nextMessages);
      if (res.status === 'coming_soon') {
        setComingSoon(true);
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: res.reply }]);
      }
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-160px)]">
      <PageTitle emoji="🤖" title="צ'אט AI" sub="עוזר חכם שמכיר את כל פרטי הטיול שלכם" />

      <div className="card flex-1 overflow-y-auto p-4 space-y-3 mb-3">
        {messages.length === 0 && !comingSoon && (
          <div className="text-center text-slate-500 py-10">
            <div className="text-4xl mb-3">🤖</div>
            <div className="font-semibold text-slate-700">שאלו אותי כל דבר על הטיול</div>
            <div className="text-sm mt-1">"מתי הטיסה חזרה?", "באיזה מלון אנחנו בפוקט?"...</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-ocean text-white rounded-tr-md'
                  : 'bg-slate-100 text-slate-800 rounded-tl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {comingSoon && (
          <div className="text-center py-8">
            <div className="inline-block bg-gradient-to-l from-sky-50 to-cyan-50 border border-sky-200 rounded-2xl px-6 py-5">
              <div className="text-3xl mb-2">🚀</div>
              <div className="font-bold text-ocean-dark text-lg">בקרוב!</div>
              <p className="text-sm text-slate-600 mt-1 max-w-xs">
                העוזר החכם בהכנות אחרונות — ממש בקרוב תוכלו לשאול אותו הכל על הטיסות, המלונות והאטרקציות שלכם.
              </p>
            </div>
          </div>
        )}
        {busy && (
          <div className="flex justify-end">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 text-slate-400 text-sm">מקליד...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="input"
          placeholder="כתבו הודעה..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy || !input.trim()}>
          שליחה
        </button>
      </form>
    </div>
  );
}
