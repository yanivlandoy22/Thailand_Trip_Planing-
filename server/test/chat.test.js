const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const app = require('../index');
const { setClientForTesting } = require('../services/anthropic');
const { signOrganizerToken } = require('../middleware/auth');

function post(server, path, body, { token, headers = {} } = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') }));
      }
    );
    req.on('error', reject);
    req.end(data);
  });
}

test('chat is LIVE by default: replies via Claude with itinerary in context', async () => {
  delete process.env.ENABLE_AI_CHAT;
  // Seed a dated booking so the day-by-day itinerary is answerable
  const server = app.listen(0);
  try {
    await post(server, '/api/bookings', {
      type: 'activity',
      title: 'שייט לאיי פי פי',
      start_at: '2026-08-12T08:00:00',
      fields: [],
    }, { token: signOrganizerToken() });

    const capture = {};
    setClientForTesting({
      messages: {
        create: async (params) => {
          capture.params = params;
          return { content: [{ type: 'text', text: 'מחר בשעה 08:00 שייט לאיי פי פי 🚤' }] };
        },
      },
    });

    const res = await post(server, '/api/chat', {
      messages: [{ role: 'user', content: 'מה יש לנו מחר?' }],
    }, { headers: { 'x-forwarded-for': '10.0.0.1' } });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.match(res.body.reply, /שייט/);
    assert.strictEqual(capture.params.max_tokens, 700);
    // context contains the chronological itinerary with the seeded entry
    assert.match(capture.params.system, /המסלול יום-אחר-יום/);
    assert.match(capture.params.system, /08:00 — 🎡 פעילות: שייט לאיי פי פי/);
    assert.match(capture.params.system, /אל תמציא/);
  } finally {
    server.close();
  }
});

test('ENABLE_AI_CHAT=false shows the placeholder', async () => {
  process.env.ENABLE_AI_CHAT = 'false';
  const server = app.listen(0);
  try {
    const res = await post(server, '/api/chat', {
      messages: [{ role: 'user', content: 'שלום' }],
    }, { headers: { 'x-forwarded-for': '10.0.0.2' } });
    assert.deepStrictEqual(res.body, { status: 'coming_soon' });
  } finally {
    delete process.env.ENABLE_AI_CHAT;
    server.close();
  }
});

test('Anthropic failure returns Hebrew 502', async () => {
  setClientForTesting({
    messages: {
      create: async () => {
        const err = new Error('overloaded');
        err.status = 529;
        throw err;
      },
    },
  });
  const server = app.listen(0);
  try {
    const res = await post(server, '/api/chat', {
      messages: [{ role: 'user', content: 'שלום' }],
    }, { headers: { 'x-forwarded-for': '10.0.0.3' } });
    assert.strictEqual(res.status, 502);
    assert.match(res.body.error, /העוזר לא זמין כרגע/);
  } finally {
    server.close();
  }
});

test('rate limiter returns Hebrew 429 on the 16th request in a minute', async () => {
  setClientForTesting({
    messages: { create: async () => ({ content: [{ type: 'text', text: 'ok' }] }) },
  });
  const server = app.listen(0);
  try {
    const headers = { 'x-forwarded-for': '10.9.9.9' };
    let last;
    for (let i = 0; i < 16; i++) {
      last = await post(server, '/api/chat', {
        messages: [{ role: 'user', content: 'שלום' }],
      }, { headers });
    }
    assert.strictEqual(last.status, 429);
    assert.match(last.body.error, /יותר מדי הודעות/);
  } finally {
    server.close();
  }
});

test('organizer-only endpoints reject without token', async () => {
  const server = app.listen(0);
  try {
    const res = await post(server, '/api/bookings', { title: 'ניסיון' });
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error);
  } finally {
    server.close();
  }
});
