// Ticket PDF storage. Supabase Storage (private `tickets` bucket) when
// configured; in-memory buffers otherwise (local dev before keys are pasted).
// Travelers only ever get short-lived signed URLs generated here.
const crypto = require('crypto');
const { supabase } = require('../db/supabase');
const { store } = require('../db/memoryStore');

const BUCKET = 'tickets';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

if (!store.tickets) store.tickets = new Map(); // bookingId -> Buffer

function objectPath(bookingId) {
  return `${bookingId}.pdf`;
}

function storageError(error) {
  const err = new Error('שמירת הכרטיס נכשלה — נסו שוב');
  err.status = 500;
  err.cause = error;
  return err;
}

async function putTicket(bookingId, buffer) {
  if (!supabase) {
    store.tickets.set(bookingId, buffer);
    return objectPath(bookingId);
  }
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath(bookingId), buffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw storageError(error);
  return objectPath(bookingId);
}

async function removeTicket(bookingId) {
  if (!supabase) {
    store.tickets.delete(bookingId);
    return;
  }
  // Ignore not-found: removing an already-missing file is fine.
  await supabase.storage.from(BUCKET).remove([objectPath(bookingId)]);
}

// downloadName (optional) sets Content-Disposition on the signed URL so the
// browser saves with a Hebrew filename — a client-side `download` attribute
// is ignored for cross-origin URLs, so this is the only reliable mechanism.
async function getSignedUrl(bookingId, { downloadName } = {}) {
  if (!supabase) {
    if (!store.tickets.has(bookingId)) return null;
    const suffix = downloadName ? `?download=${encodeURIComponent(downloadName)}` : '';
    return `/api/bookings/${bookingId}/ticket-file${suffix}`;
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      objectPath(bookingId),
      SIGNED_URL_TTL_SECONDS,
      downloadName ? { download: downloadName } : undefined
    );
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Memory-fallback direct file access (used only when Supabase is absent).
function getMemoryTicket(bookingId) {
  return store.tickets.get(bookingId) || null;
}

// ---- Pending uploads: parse-PDF flow stores the file once, the booking ----
// ---- created from the parse result claims it via pending_ticket_id.    ----

const PENDING_TTL_MS = 30 * 60 * 1000;
const pending = new Map(); // pendingId -> {buffer, expires}

function stashPending(buffer) {
  const id = crypto.randomUUID();
  pending.set(id, { buffer, expires: Date.now() + PENDING_TTL_MS });
  return id;
}

function takePending(pendingId) {
  // Opportunistic TTL sweep — the map only ever holds a handful of entries.
  for (const [key, value] of pending) {
    if (value.expires < Date.now()) pending.delete(key);
  }
  const entry = pending.get(pendingId);
  if (!entry) return null;
  pending.delete(pendingId);
  return entry.buffer;
}

module.exports = { putTicket, removeTicket, getSignedUrl, getMemoryTicket, stashPending, takePending };
