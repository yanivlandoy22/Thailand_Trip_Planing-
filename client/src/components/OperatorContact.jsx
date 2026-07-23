// Contact strip for the local operator (המרכז למטייל) — questions about
// existing bookings only. Appears on the activities and transfers pages.
export default function OperatorContact() {
  return (
    <div className="card mt-5 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
      <div className="text-sm">
        <span className="font-bold">שאלות על הזמנות קיימות?</span>{' '}
        <span className="text-slate-500">המרכז למטייל בתאילנד זמין עבורכם</span>
      </div>
      <div className="flex gap-2">
        <a
          href="https://api.whatsapp.com/send/?phone=972552750399"
          target="_blank"
          rel="noreferrer"
          className="btn-success !py-1.5 text-sm"
        >
          💬 וואטסאפ
        </a>
        <a href="tel:*8880" className="btn-ghost !py-1.5 text-sm">
          📞 *8880
        </a>
      </div>
    </div>
  );
}
