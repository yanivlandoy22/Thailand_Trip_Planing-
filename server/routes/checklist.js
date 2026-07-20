const express = require('express');
const queries = require('../db/queries');

const router = express.Router();

// Group tool — public read/write for travelers
router.get('/', async (req, res, next) => {
  try {
    res.json(await queries.listChecklist());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { label, sub } = req.body || {};
    if (!label || !label.trim()) return res.status(400).json({ error: 'יש להזין טקסט למשימה' });
    res.status(201).json(await queries.createChecklistItem({ label: label.trim(), sub }));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await queries.updateChecklistItem(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'המשימה לא נמצאה' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await queries.deleteChecklistItem(req.params.id);
    if (!ok) return res.status(404).json({ error: 'המשימה לא נמצאה' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
