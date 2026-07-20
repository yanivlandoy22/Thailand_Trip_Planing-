const Anthropic = require('@anthropic-ai/sdk');

// Model pinned by spec; overridable via env because claude-sonnet-4-20250514
// is deprecated — if it gets retired set ANTHROPIC_MODEL=claude-sonnet-5.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY חסר — הוסיפו אותו לקובץ .env כדי להפעיל ניתוח הזמנות');
    err.status = 503;
    throw err;
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// Test seam: lets unit tests inject a mock client without hitting the API.
function setClientForTesting(mock) {
  client = mock;
}

module.exports = { getClient, setClientForTesting, MODEL };
