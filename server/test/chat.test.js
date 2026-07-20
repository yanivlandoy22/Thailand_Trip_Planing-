const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const app = require('../index');
const { setClientForTesting } = require('../services/anthropic');

function post(server, path, body) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { host: '127.0.0.1', port, path, method: 'POST', headers: { 'content-type': 'application/json' } },
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

test('POST /api/chat returns coming_soon while ENABLE_AI_CHAT is off', async () => {
  delete process.env.ENABLE_AI_CHAT;
  const server = app.listen(0);
  try {
    const res = await post(server, '/api/chat', { messages: [{ role: 'user', content: 'שלום' }] });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'coming_soon' });
  } finally {
    server.close();
  }
});

test('POST /api/chat calls Claude with trip context when flag is on', async () => {
  process.env.ENABLE_AI_CHAT = 'true';
  const capture = {};
  setClientForTesting({
    messages: {
      create: async (params) => {
        capture.params = params;
        return { content: [{ type: 'text', text: 'הטיסה שלכם ב-15/8' }] };
      },
    },
  });
  const server = app.listen(0);
  try {
    const res = await post(server, '/api/chat', { messages: [{ role: 'user', content: 'מתי הטיסה?' }] });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.reply, 'הטיסה שלכם ב-15/8');
    // system prompt is the serialized trip context
    assert.match(capture.params.system, /נתוני הטיול/);
    assert.match(capture.params.system, /צ'קליסט/);
  } finally {
    delete process.env.ENABLE_AI_CHAT;
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
