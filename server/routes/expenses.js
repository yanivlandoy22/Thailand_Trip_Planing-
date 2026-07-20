const express = require('express');
const queries = require('../db/queries');

const router = express.Router();

const CURRENCIES = ['THB', 'ILS', 'USD', 'EUR'];

function validate(body) {
  if (!body.description || !body.description.trim()) return 'יש להזין תיאור להוצאה';
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'יש להזין סכום חיובי';
  if (body.currency && !CURRENCIES.includes(body.currency)) return 'מטבע לא נתמך';
  if (!body.paid_by) return 'יש לבחור מי שילם';
  return null;
}

// Group tool — public read/write for travelers
router.get('/', async (req, res, next) => {
  try {
    res.json(await queries.listExpenses());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const problem = validate(req.body || {});
    if (problem) return res.status(400).json({ error: problem });
    res.status(201).json(
      await queries.createExpense({ ...req.body, amount: Number(req.body.amount) })
    );
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (body.amount !== undefined && (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0)) {
      return res.status(400).json({ error: 'יש להזין סכום חיובי' });
    }
    if (body.currency && !CURRENCIES.includes(body.currency)) {
      return res.status(400).json({ error: 'מטבע לא נתמך' });
    }
    const patch = body.amount !== undefined ? { ...body, amount: Number(body.amount) } : body;
    const updated = await queries.updateExpense(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'ההוצאה לא נמצאה' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await queries.deleteExpense(req.params.id);
    if (!ok) return res.status(404).json({ error: 'ההוצאה לא נמצאה' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
