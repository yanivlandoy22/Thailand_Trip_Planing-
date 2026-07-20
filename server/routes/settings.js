const express = require('express');
const queries = require('../db/queries');
const { requireOrganizer } = require('../middleware/auth');

const router = express.Router();

// Never expose the organizer password to travelers (or anyone) via the API.
function publicSettings(settings) {
  const { organizer_password, ...rest } = settings;
  return rest;
}

router.get('/', async (req, res, next) => {
  try {
    res.json(publicSettings(await queries.getSettings()));
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings  {key: value, ...} — organizer only
router.put('/', requireOrganizer, async (req, res, next) => {
  try {
    const body = req.body || {};
    const allowed = [
      'trip_title',
      'hero_subtitle',
      'organizer_password',
      'rate_THB_ILS',
      'rate_USD_ILS',
      'rate_EUR_ILS',
    ];
    const entries = Object.entries(body).filter(([key]) => allowed.includes(key));
    if (!entries.length) return res.status(400).json({ error: 'אין הגדרות לעדכון' });
    for (const [key, value] of entries) {
      if (key.startsWith('rate_') && (!Number.isFinite(Number(value)) || Number(value) <= 0)) {
        return res.status(400).json({ error: 'שער המרה חייב להיות מספר חיובי' });
      }
      if (key === 'organizer_password' && String(value).length < 4) {
        return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 4 תווים' });
      }
    }
    for (const [key, value] of entries) {
      await queries.setSetting(key, value);
    }
    res.json(publicSettings(await queries.getSettings()));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.publicSettings = publicSettings;
