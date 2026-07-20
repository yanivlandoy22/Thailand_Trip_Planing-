const express = require('express');
const queries = require('../db/queries');

const router = express.Router();

// Group tool — public read/write for travelers
router.get('/', async (req, res, next) => {
  try {
    res.json(await queries.listParticipants());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'יש להזין שם משתתף' });
    const existing = await queries.listParticipants();
    if (existing.some((p) => p.name === name.trim())) {
      return res.status(409).json({ error: 'משתתף בשם הזה כבר קיים' });
    }
    res.status(201).json(await queries.createParticipant({ name: name.trim() }));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await queries.deleteParticipant(req.params.id);
    if (!ok) return res.status(404).json({ error: 'המשתתף לא נמצא' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
