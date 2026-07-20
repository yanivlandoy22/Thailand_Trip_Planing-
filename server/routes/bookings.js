const express = require('express');
const queries = require('../db/queries');
const { requireOrganizer } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await queries.listBookings());
  } catch (err) {
    next(err);
  }
});

router.post('/', requireOrganizer, async (req, res, next) => {
  try {
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'להזמנה חייבת להיות כותרת' });
    res.status(201).json(await queries.createBooking(req.body));
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
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
