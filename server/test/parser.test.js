const test = require('node:test');
const assert = require('node:assert');

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const { setClientForTesting } = require('../services/anthropic');
const { parseBookingText, parseBookingPdfVision, extractJson, normalize } = require('../services/parser');

const FLIGHT_JSON = {
  type: 'flight',
  source: 'El Al',
  title: 'טיסה לבנגקוק',
  status: 'confirmed',
  fields: [
    { label: 'מספר טיסה', value: 'LY081' },
    { label: 'נוסעים ומושבים', value: 'Yaniv Landau — 23A, Dana Landau — 23B' },
  ],
  notes: null,
};

function mockClient(responseText, capture) {
  return {
    messages: {
      create: async (params) => {
        if (capture) capture.params = params;
        return { content: [{ type: 'text', text: responseText }] };
      },
    },
  };
}

test('parseBookingText returns normalized booking from Claude JSON', async () => {
  const capture = {};
  setClientForTesting(mockClient(JSON.stringify(FLIGHT_JSON), capture));
  const result = await parseBookingText('אישור טיסה...');
  assert.strictEqual(result.type, 'flight');
  assert.strictEqual(result.title, 'טיסה לבנגקוק');
  assert.strictEqual(result.fields.length, 2);
  // passenger names + seats must survive parsing
  assert.match(result.fields[1].value, /23A/);
  // system prompt must forbid PII and require passengers+seats
  assert.match(capture.params.system, /מספרי דרכון/);
  assert.match(capture.params.system, /שמות נוסעים ומספרי מושבים/);
});

test('parseBookingText tolerates markdown fences around JSON', async () => {
  setClientForTesting(mockClient('```json\n' + JSON.stringify(FLIGHT_JSON) + '\n```'));
  const result = await parseBookingText('אישור טיסה...');
  assert.strictEqual(result.type, 'flight');
});

test('parseBookingPdfVision sends the PDF as a base64 document block', async () => {
  const capture = {};
  setClientForTesting(mockClient(JSON.stringify(FLIGHT_JSON), capture));
  const buffer = Buffer.from('%PDF-1.4 fake');
  await parseBookingPdfVision(buffer);
  const content = capture.params.messages[0].content;
  const doc = content.find((c) => c.type === 'document');
  assert.ok(doc, 'document block missing');
  assert.strictEqual(doc.source.type, 'base64');
  assert.strictEqual(doc.source.media_type, 'application/pdf');
  assert.strictEqual(doc.source.data, buffer.toString('base64'));
});

test('extractJson throws Hebrew 422 on garbage', () => {
  assert.throws(() => extractJson('not json at all'), (err) => {
    assert.strictEqual(err.status, 422);
    assert.match(err.message, /לא הצלחנו לנתח/);
    return true;
  });
});

test('normalize coerces bad type/status and drops malformed fields', () => {
  const result = normalize({
    type: 'spaceship',
    status: 'maybe',
    fields: [{ label: 'תקין', value: 'כן' }, { label: null, value: 'בלי תווית' }, 'junk'],
  });
  assert.strictEqual(result.type, 'other');
  assert.strictEqual(result.status, 'unknown');
  assert.strictEqual(result.fields.length, 1);
  assert.strictEqual(result.title, 'הזמנה ללא כותרת');
});
