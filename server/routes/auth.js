const express = require('express');
const { signOrganizerToken } = require('../middleware/auth');
const queries = require('../db/queries');

const router = express.Router();

// POST /api/auth/organizer  {password} -> {token}
router.post('/organizer', async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'יש להזין סיסמה' });
    const settings = await queries.getSettings();
    const expected = settings.organizer_password || process.env.ORGANIZER_PASSWORD || 'admin2026';
    if (password !== expected) {
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }
    res.json({ token: signOrganizerToken() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
