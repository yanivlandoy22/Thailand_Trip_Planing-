const Anthropic = require('@anthropic-ai/sdk');

// claude-sonnet-4-20250514 (the model originally pinned by spec) was retired
// by Anthropic on 2026-06-15 and now 404s. Default to its recommended
// replacement; override via ANTHROPIC_MODEL if needed.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

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
