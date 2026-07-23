const express = require('express');
const { buildTripContext } = require('../services/tripContext');
const { getClient, MODEL } = require('../services/anthropic');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'יותר מדי הודעות בדקה האחרונה — חכו רגע ונסו שוב 🙏',
});

// POST /api/chat  {messages:[{role:'user'|'assistant', content}]}
// LIVE by default: calls Claude with the full trip context (day-by-day
// itinerary included) + conversation history. Set ENABLE_AI_CHAT=false to
// fall back to the {status:"coming_soon"} placeholder.
router.post('/', chatLimiter, async (req, res, next) => {
  try {
    if (process.env.ENABLE_AI_CHAT === 'false') {
      return res.json({ status: 'coming_soon' });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'יש לשלוח הודעה' });
    }
    const history = messages
      .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .slice(-20);
    if (!history.length || history[history.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'ההודעה האחרונה חייבת להיות של המשתמש' });
    }

    const system = await buildTripContext();

    let response;
    try {
      response = await getClient().messages.create({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: history,
      });
    } catch (err) {
      if (err.status === 503) throw err; // missing API key — keep its message
      console.error('chat: Anthropic call failed:', err.message || err);
      return res.status(502).json({ error: 'העוזר לא זמין כרגע, נסו שוב בעוד רגע' });
    }

    const block = response.content.find((b) => b.type === 'text');
    res.json({ status: 'ok', reply: block ? block.text : '' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
