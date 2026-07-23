import { useState } from 'react';
import { api } from '../api/client';
import { useUiStore } from '../store/uiStore';

function MiniSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin align-middle" />
  );
}

// Original ticket PDF strip on flight cards. Rendered only when a ticket
// exists; every click fetches a fresh signed URL (they expire after an hour).
export default function TicketStrip({ booking }) {
  const toast = useUiStore((s) => s.toast);
  const [busy, setBusy] = useState(null); // 'view' | 'download' | null

  if (!booking.ticket_path) return null;

  const open = async (mode) => {
    if (busy) return;
    setBusy(mode);
    try {
      const { url } = await api.getTicketUrl(booking.id, { download: mode === 'download' });
      if (mode === 'view') {
        window.open(url, '_blank', 'noopener');
      } else {
        // Filename comes from the signed URL's Content-Disposition header —
        // a cross-origin `download` attribute would be ignored by the browser.
        const a = document.createElement('a');
        a.href = url;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      toast('לא ניתן לטעון את הכרטיס כרגע, נסו שוב', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-app bg-sky-50 border border-sky-100 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl">🎫</span>
        <span className="font-semibold text-sky-900 text-sm">כרטיס טיסה מקורי</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => open('view')}
          disabled={busy !== null}
          className="btn-primary min-h-[44px] flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm"
        >
          {busy === 'view' ? <MiniSpinner /> : '👁️'} הצג כרטיס
        </button>
        <button
          onClick={() => open('download')}
          disabled={busy !== null}
          className="btn-ghost min-h-[44px] flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm"
        >
          {busy === 'download' ? <MiniSpinner /> : '⬇️'} הורדה
        </button>
      </div>
    </div>
  );
}
