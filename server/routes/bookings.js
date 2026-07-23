const express = require('express');
const multer = require('multer');
const queries = require('../db/queries');
const { requireOrganizer } = require('../middleware/auth');
const ticketStore = require('../services/ticketStore');
const { supabase } = require('../db/supabase');

const router = express.Router();

const MAX_TICKET_BYTES = 10 * 1024 * 1024;
const ticketUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TICKET_BYTES },
});

// Multer throws LIMIT_FILE_SIZE outside our handlers — translate to Hebrew.
function ticketUploadMiddleware(req, res, next) {
  ticketUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'הקובץ גדול מדי — עד 10MB' });
      }
      return next(err);
    }
    next();
  });
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await queries.listBookings());
  } catch (err) {
    next(err);
  }
});

router.post('/', requireOrganizer, async (req, res, next) => {
  try {
    const { title, pending_ticket_id } = req.body || {};
    if (!title) return res.status(400).json({ error: 'להזמנה חייבת להיות כותרת' });
    let booking = await queries.createBooking(req.body);

    // Parse-PDF flow: the file uploaded for parsing becomes the ticket —
    // single upload, two purposes. An attach failure must not lose the booking.
    if (pending_ticket_id) {
      const buffer = ticketStore.takePending(pending_ticket_id);
      if (buffer) {
        try {
          const path = await ticketStore.putTicket(booking.id, buffer);
          booking = (await queries.updateBooking(booking.id, { ticket_path: path })) || booking;
        } catch (err) {
          console.error('ticket auto-attach failed:', err);
          booking.ticket_error = 'ההזמנה נשמרה אך צירוף הכרטיס נכשל — צרפו אותו שוב מרשימת ההזמנות';
        }
      }
    }
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireOrganizer, async (req, res, next) => {
  try {
    const updated = await queries.updateBooking(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireOrganizer, async (req, res, next) => {
  try {
    const ok = await queries.deleteBooking(req.params.id);
    if (!ok) return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    await ticketStore.removeTicket(req.params.id).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// One-time backfill: run bookings missing start_at through Claude to extract
// structured datetimes (for data created before the itinerary change).
router.post('/backfill-dates', requireOrganizer, async (req, res, next) => {
  try {
    const { extractBookingDates } = require('../services/parser');
    const bookings = await queries.listBookings();
    const missing = bookings.filter((b) => !b.start_at);
    let updated = 0;
    let failed = 0;
    for (const booking of missing) {
      try {
        const { start_at, end_at } = await extractBookingDates(booking);
        if (start_at) {
          await queries.updateBooking(booking.id, { start_at, end_at });
          updated += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
    res.json({ updated, failed, skipped: bookings.length - missing.length });
  } catch (err) {
    next(err);
  }
});

// ---- Ticket PDF (original booking confirmation) ----

// Attach or replace (organizer). Overwrites {id}.pdf in the private bucket.
router.post('/:id/ticket', requireOrganizer, ticketUploadMiddleware, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'יש לצרף קובץ PDF' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'ניתן לצרף קבצי PDF בלבד' });
    }
    const bookings = await queries.listBookings();
    if (!bookings.some((b) => b.id === req.params.id)) {
      return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    }
    const path = await ticketStore.putTicket(req.params.id, req.file.buffer);
    const updated = await queries.updateBooking(req.params.id, { ticket_path: path });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Remove ticket (organizer)
router.delete('/:id/ticket', requireOrganizer, async (req, res, next) => {
  try {
    const updated = await queries.updateBooking(req.params.id, { ticket_path: null });
    if (!updated) return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    await ticketStore.removeTicket(req.params.id).catch(() => {});
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Fresh short-lived signed URL (public — travelers). Never cached client-side;
// each click requests a new one, so expiry can't bite mid-session.
router.get('/:id/ticket-url', async (req, res, next) => {
  try {
    const bookings = await queries.listBookings();
    const booking = bookings.find((b) => b.id === req.params.id);
    if (!booking || !booking.ticket_path) {
      return res.status(404).json({ error: 'אין כרטיס מצורף להזמנה זו' });
    }
    const downloadName =
      req.query.download !== undefined
        ? `כרטיס-טיסה-${String(booking.title || '').replace(/[\\/:*?"<>|]/g, ' ').trim() || 'הזמנה'}.pdf`
        : undefined;
    const url = await ticketStore.getSignedUrl(booking.id, { downloadName });
    if (!url) return res.status(404).json({ error: 'אין כרטיס מצורף להזמנה זו' });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// Direct file streaming — memory-fallback mode only (no Supabase configured).
// With Supabase, travelers get signed Storage URLs and this route 404s.
router.get('/:id/ticket-file', async (req, res, next) => {
  try {
    if (supabase) return res.status(404).json({ error: 'אין כרטיס מצורף להזמנה זו' });
    const buffer = ticketStore.getMemoryTicket(req.params.id);
    if (!buffer) return res.status(404).json({ error: 'אין כרטיס מצורף להזמנה זו' });
    res.setHeader('Content-Type', 'application/pdf');
    if (req.query.download) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(String(req.query.download))}`
      );
    }
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
