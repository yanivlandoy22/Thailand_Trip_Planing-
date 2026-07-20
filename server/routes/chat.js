const express = require('express');
const { buildTripContext } = require('../services/tripContext');
const { getClient, MODEL } = require('../services/anthropic');

const router = express.Router();

// POST /api/chat  {messages:[{role:'user'|'assistant', content}]}
// Ships as a prepared placeholder: returns {status:"coming_soon"} until
// ENABLE_AI_CHAT=true, at which point it calls Claude with the full trip
// context (services/tripContext.js) + conversation history. The client chat
// shell is already wired to this endpoint — activation needs no client change.
router.post('/', async (req, res, next) => {
  try {
    if (process.env.ENABLE_AI_CHAT !== 'true') {
      return res.json({ status: 'coming_soon' });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'יש לשלוח הודעה' });
    }
    const history = messages
      .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .slice(-30);
    if (!history.length || history[history.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'ההודעה האחרונה חייבת להיות של המשתמש' });
    }

    const system = await buildTripContext();
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: history,
    });
    const block = response.content.find((b) => b.type === 'text');
    res.json({ status: 'ok', reply: block ? block.text : '' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
