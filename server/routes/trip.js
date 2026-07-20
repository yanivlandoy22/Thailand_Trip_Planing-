const express = require('express');
const queries = require('../db/queries');
const { publicSettings } = require('./settings');

const router = express.Router();

// GET /api/trip — everything a traveler needs, in one request
router.get('/', async (req, res, next) => {
  try {
    const [bookings, checklist, participants, expenses, settings] = await Promise.all([
      queries.listBookings(),
      queries.listChecklist(),
      queries.listParticipants(),
      queries.listExpenses(),
      queries.getSettings(),
    ]);
    res.json({ bookings, checklist, participants, expenses, settings: publicSettings(settings) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
