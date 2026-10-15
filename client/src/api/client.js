// Thin fetch wrapper. In dev, Vite proxies /api to the Express server.
// In production the server serves the client, so /api is same-origin.
// VITE_API_URL overrides for split deployments (Netlify client + Render server).
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { withRetry, RetryableError, isRetryableStatus, resolveApiBase } from '../utils/retry';

const BASE = resolveApiBase(import.meta.env.VITE_API_URL);
const WAKING_AFTER_MS = 3000;

// Fire-and-forget ping on app load so a sleeping Render server starts waking
// before the first real request.
export function warmUpServer() {
  fetch(`${BASE}/health`).catch(() => {});
}

async function attempt(path, { method, body, formData }) {
  const headers = {};
  const token = useAuthStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: formData || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new RetryableError('אין חיבור לשרת — בדקו את החיבור לאינטרנט');
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    if (isRetryableStatus(res.status)) throw new RetryableError('השרת מתעורר — נסו שוב בעוד רגע');
    if (res.status === 401) useAuthStore.getState().handleUnauthorized();
    throw new Error(data.error || 'אירעה שגיאה — נסו שוב');
  }
  return data;
}

async function request(path, { method = 'GET', body, formData } = {}) {
  // Show "server is waking up" if a request is still pending after 3s.
  const { beginSlow, endSlow } = useUiStore.getState();
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    beginSlow();
  }, WAKING_AFTER_MS);

  try {
    // Only idempotent GETs are auto-retried — never mutations or uploads.
    return await withRetry(() => attempt(path, { method, body, formData }), {
      delays: method === 'GET' ? undefined : [],
    });
  } finally {
    clearTimeout(timer);
    if (slow) endSlow();
  }
}

export const api = {
  getTrip: () => request('/trip'),

  createBooking: (booking) => request('/bookings', { method: 'POST', body: booking }),
  updateBooking: (id, patch) => request(`/bookings/${id}`, { method: 'PUT', body: patch }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  parseText: (text) => request('/parse/text', { method: 'POST', body: { text } }),
  backfillDates: () => request('/bookings/backfill-dates', { method: 'POST' }),

  uploadTicket: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/bookings/${id}/ticket`, { method: 'POST', formData });
  },
  deleteTicket: (id) => request(`/bookings/${id}/ticket`, { method: 'DELETE' }),
  // Always fetched fresh per click — signed URLs are short-lived, never cache.
  getTicketUrl: (id, { download } = {}) =>
    request(`/bookings/${id}/ticket-url${download ? '?download=1' : ''}`),
  parsePdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/parse/pdf', { method: 'POST', formData });
  },

  addChecklistItem: (label, sub) => request('/checklist', { method: 'POST', body: { label, sub } }),
  updateChecklistItem: (id, patch) => request(`/checklist/${id}`, { method: 'PUT', body: patch }),
  deleteChecklistItem: (id) => request(`/checklist/${id}`, { method: 'DELETE' }),

  addParticipant: (name) => request('/participants', { method: 'POST', body: { name } }),
  deleteParticipant: (id) => request(`/participants/${id}`, { method: 'DELETE' }),

  addExpense: (expense) => request('/expenses', { method: 'POST', body: expense }),
  updateExpense: (id, patch) => request(`/expenses/${id}`, { method: 'PUT', body: patch }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  updateSettings: (patch) => request('/settings', { method: 'PUT', body: patch }),

  loginOrganizer: (password) => request('/auth/organizer', { method: 'POST', body: { password } }),

  chat: (messages) => request('/chat', { method: 'POST', body: { messages } }),
};
