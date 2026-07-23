import { useUiStore } from '../store/uiStore';

const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  info: 'bg-ocean',
};

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type] || STYLES.info} text-white text-sm font-medium px-4 py-2.5 rounded-app shadow-lg max-w-sm text-center`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
