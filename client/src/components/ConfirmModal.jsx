import { useUiStore } from '../store/uiStore';

// Custom confirm dialog — window.confirm is forbidden in this app.
export default function ConfirmModal() {
  const confirmState = useUiStore((s) => s.confirmState);
  const resolveConfirm = useUiStore((s) => s.resolveConfirm);
  if (!confirmState) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={() => resolveConfirm(false)} />
      <div className="relative card p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-2">{confirmState.title}</h3>
        <p className="text-sm text-slate-600 mb-5">{confirmState.message}</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={() => resolveConfirm(false)}>
            ביטול
          </button>
          <button
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-app px-4 py-2 transition-colors"
            onClick={() => resolveConfirm(true)}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
