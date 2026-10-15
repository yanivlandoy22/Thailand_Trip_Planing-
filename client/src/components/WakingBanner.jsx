import { useUiStore } from '../store/uiStore';

// Shown when the API takes >3s (free-tier server waking from sleep).
export default function WakingBanner() {
  const slow = useUiStore((s) => s.slowRequests > 0);
  if (!slow) return null;
  return (
    <div
      role="status"
      className="fixed top-3 inset-x-3 z-50 mx-auto max-w-md rounded-app bg-amber-50 border border-amber-200 text-amber-900 shadow-lg px-4 py-3 flex items-center gap-3 text-sm"
    >
      <span className="w-5 h-5 shrink-0 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      <span>
        <strong>השרת מתעורר...</strong> זה לוקח עד דקה בפעם הראשונה, תכף הכול נטען.
      </span>
    </div>
  );
}
