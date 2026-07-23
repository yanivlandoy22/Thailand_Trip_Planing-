// Data access layer. Uses Supabase (service role) when configured; otherwise
// falls back to the in-memory store so local dev works before keys are pasted.
const { supabase } = require('./supabase');
const { store, newId } = require('./memoryStore');

function fail(error) {
  const err = new Error(error.message || 'שגיאת מסד נתונים');
  err.status = 500;
  throw err;
}

// ---------- bookings ----------

async function listBookings() {
  if (!supabase) return [...store.bookings];
  const { data, error } = await supabase.from('bookings').select('*').order('created_at');
  if (error) fail(error);
  return data;
}

async function createBooking(booking) {
  const row = {
    type: booking.type || 'other',
    source: booking.source || null,
    title: booking.title,
    status: booking.status || 'unknown',
    fields: booking.fields || [],
    notes: booking.notes || null,
    ticket_path: null,
  };
  if (!supabase) {
    const created = { id: newId(), created_at: new Date().toISOString(), ...row };
    store.bookings.push(created);
    return created;
  }
  const { data, error } = await supabase.from('bookings').insert(row).select().single();
  if (error) fail(error);
  return data;
}

async function updateBooking(id, patch) {
  const allowed = {};
  for (const key of ['type', 'source', 'title', 'status', 'fields', 'notes', 'ticket_path']) {
    if (patch[key] !== undefined) allowed[key] = patch[key];
  }
  if (!supabase) {
    const row = store.bookings.find((b) => b.id === id);
    if (!row) return null;
    Object.assign(row, allowed);
    return row;
  }
  const { data, error } = await supabase.from('bookings').update(allowed).eq('id', id).select().maybeSingle();
  if (error) fail(error);
  return data;
}

async function deleteBooking(id) {
  if (!supabase) {
    const i = store.bookings.findIndex((b) => b.id === id);
    if (i === -1) return false;
    store.bookings.splice(i, 1);
    return true;
  }
  const { error, count } = await supabase.from('bookings').delete({ count: 'exact' }).eq('id', id);
  if (error) fail(error);
  return count > 0;
}

// ---------- checklist ----------

async function listChecklist() {
  if (!supabase) return [...store.checklist];
  const { data, error } = await supabase.from('checklist').select('*').order('created_at');
  if (error) fail(error);
  return data;
}

async function createChecklistItem({ label, sub }) {
  if (!supabase) {
    const created = { id: newId(), label, sub: sub || null, done: false, created_at: new Date().toISOString() };
    store.checklist.push(created);
    return created;
  }
  const { data, error } = await supabase
    .from('checklist')
    .insert({ label, sub: sub || null })
    .select()
    .single();
  if (error) fail(error);
  return data;
}

async function updateChecklistItem(id, patch) {
  const allowed = {};
  for (const key of ['label', 'sub', 'done']) {
    if (patch[key] !== undefined) allowed[key] = patch[key];
  }
  if (!supabase) {
    const row = store.checklist.find((c) => c.id === id);
    if (!row) return null;
    Object.assign(row, allowed);
    return row;
  }
  const { data, error } = await supabase.from('checklist').update(allowed).eq('id', id).select().maybeSingle();
  if (error) fail(error);
  return data;
}

async function deleteChecklistItem(id) {
  if (!supabase) {
    const i = store.checklist.findIndex((c) => c.id === id);
    if (i === -1) return false;
    store.checklist.splice(i, 1);
    return true;
  }
  const { error, count } = await supabase.from('checklist').delete({ count: 'exact' }).eq('id', id);
  if (error) fail(error);
  return count > 0;
}

// ---------- participants ----------

async function listParticipants() {
  if (!supabase) return [...store.participants];
  const { data, error } = await supabase.from('participants').select('*').order('created_at');
  if (error) fail(error);
  return data;
}

async function createParticipant({ name }) {
  if (!supabase) {
    const created = { id: newId(), name, created_at: new Date().toISOString() };
    store.participants.push(created);
    return created;
  }
  const { data, error } = await supabase.from('participants').insert({ name }).select().single();
  if (error) fail(error);
  return data;
}

async function deleteParticipant(id) {
  if (!supabase) {
    const i = store.participants.findIndex((p) => p.id === id);
    if (i === -1) return false;
    store.participants.splice(i, 1);
    return true;
  }
  const { error, count } = await supabase.from('participants').delete({ count: 'exact' }).eq('id', id);
  if (error) fail(error);
  return count > 0;
}

// ---------- expenses ----------

async function listExpenses() {
  if (!supabase) return [...store.expenses];
  const { data, error } = await supabase.from('expenses').select('*').order('date');
  if (error) fail(error);
  return data;
}

async function createExpense(expense) {
  const row = {
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency || 'THB',
    paid_by: expense.paid_by,
    participants: expense.participants || [],
    date: expense.date || new Date().toISOString().slice(0, 10),
  };
  if (!supabase) {
    const created = { id: newId(), created_at: new Date().toISOString(), ...row };
    store.expenses.push(created);
    return created;
  }
  const { data, error } = await supabase.from('expenses').insert(row).select().single();
  if (error) fail(error);
  return data;
}

async function updateExpense(id, patch) {
  const allowed = {};
  for (const key of ['description', 'amount', 'currency', 'paid_by', 'participants', 'date']) {
    if (patch[key] !== undefined) allowed[key] = patch[key];
  }
  if (!supabase) {
    const row = store.expenses.find((e) => e.id === id);
    if (!row) return null;
    Object.assign(row, allowed);
    return row;
  }
  const { data, error } = await supabase.from('expenses').update(allowed).eq('id', id).select().maybeSingle();
  if (error) fail(error);
  return data;
}

async function deleteExpense(id) {
  if (!supabase) {
    const i = store.expenses.findIndex((e) => e.id === id);
    if (i === -1) return false;
    store.expenses.splice(i, 1);
    return true;
  }
  const { error, count } = await supabase.from('expenses').delete({ count: 'exact' }).eq('id', id);
  if (error) fail(error);
  return count > 0;
}

// ---------- settings ----------

async function getSettings() {
  if (!supabase) return { ...store.settings };
  const { data, error } = await supabase.from('settings').select('*');
  if (error) fail(error);
  const settings = {};
  for (const row of data) settings[row.key] = row.value;
  return settings;
}

async function setSetting(key, value) {
  if (!supabase) {
    store.settings[key] = String(value);
    return;
  }
  const { error } = await supabase.from('settings').upsert({ key, value: String(value) });
  if (error) fail(error);
}

module.exports = {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  listChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  listParticipants,
  createParticipant,
  deleteParticipant,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSettings,
  setSetting,
};
