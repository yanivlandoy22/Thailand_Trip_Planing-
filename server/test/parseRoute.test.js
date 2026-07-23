const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const app = require('../index');
const { setClientForTesting } = require('../services/anthropic');
const { signOrganizerToken } = require('../middleware/auth');

// Build a real single-page PDF with pdfkit. With `text` -> real text layer
// (extractable by pdf-parse); without -> graphics only, no text layer, which
// mimics a scanned/image PDF and must trigger the Claude vision fallback.
function makePdf(text) {
  const PDFDocument = require('pdfkit');
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'LETTER' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    if (text) {
      doc.fontSize(12).text(text, 72, 72);
    } else {
      doc.rect(72, 72, 200, 120).fill('#cccccc');
    }
    doc.end();
  });
}

const PARSED = {
  type: 'hotel',
  source: 'Agoda',
  title: 'מלון בבנגקוק',
  status: 'confirmed',
  fields: [{ label: 'עיר', value: 'בנגקוק' }],
  notes: null,
};

function uploadPdf(server, buffer, token) {
  const { port } = server.address();
  const boundary = '----testboundary42';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="booking.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, buffer, tail]);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/parse/pdf',
        method: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': body.length,
          authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') }));
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

test('text-layer PDF goes through pdf-parse -> text prompt (no document block)', async () => {
  const capture = {};
  setClientForTesting({
    messages: {
      create: async (params) => {
        capture.params = params;
        return { content: [{ type: 'text', text: JSON.stringify(PARSED) }] };
      },
    },
  });
  // > MIN_TEXT_LENGTH chars of extractable text
  const longText =
    'Booking confirmation Agoda hotel Bangkok Riva Surya check-in 11 Aug 2026 ' +
    'check-out 14 Aug 2026 room Deluxe guests 2 price 9600 THB confirmation AGD-88213377';
  const server = app.listen(0);
  try {
    const res = await uploadPdf(server, await makePdf(longText), signOrganizerToken());
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    assert.strictEqual(res.body.type, 'hotel');
    const content = capture.params.messages[0].content;
    assert.strictEqual(typeof content, 'string', 'expected plain text prompt');
    assert.match(content, /AGD-88213377/);
  } finally {
    server.close();
  }
});

test('image-only PDF (no text layer) falls back to Claude vision document block', async () => {
  const capture = {};
  setClientForTesting({
    messages: {
      create: async (params) => {
        capture.params = params;
        return { content: [{ type: 'text', text: JSON.stringify(PARSED) }] };
      },
    },
  });
  const pdf = await makePdf(null);
  const server = app.listen(0);
  try {
    const res = await uploadPdf(server, pdf, signOrganizerToken());
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    const content = capture.params.messages[0].content;
    assert.ok(Array.isArray(content), 'expected content blocks');
    const doc = content.find((b) => b.type === 'document');
    assert.ok(doc, 'document block missing — vision fallback not used');
    assert.strictEqual(doc.source.media_type, 'application/pdf');
    assert.strictEqual(doc.source.data, pdf.toString('base64'));
  } finally {
    server.close();
  }
});

test('parse-PDF result carries pending_ticket_id; saving the booking auto-attaches the file', async () => {
  setClientForTesting({
    messages: {
      create: async () => ({ content: [{ type: 'text', text: JSON.stringify(PARSED) }] }),
    },
  });
  const pdf = await makePdf(null);
  const server = app.listen(0);
  try {
    const parsed = await uploadPdf(server, pdf, signOrganizerToken());
    assert.strictEqual(parsed.status, 200);
    assert.ok(parsed.body.pending_ticket_id, 'pending_ticket_id missing from parse result');

    // Save the parsed booking with the pending id -> ticket attached, single upload
    const { port } = server.address();
    const saved = await new Promise((resolve, reject) => {
      const data = JSON.stringify({ ...parsed.body, type: 'flight' });
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: '/api/bookings',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${signOrganizerToken()}`,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') }));
        }
      );
      req.on('error', reject);
      req.end(data);
    });
    assert.strictEqual(saved.status, 201, JSON.stringify(saved.body));
    assert.strictEqual(saved.body.ticket_path, `${saved.body.id}.pdf`);
    assert.strictEqual(saved.body.ticket_error, undefined);
  } finally {
    server.close();
  }
});

test('parse endpoints are organizer-only', async () => {
  const server = app.listen(0);
  try {
    const res = await uploadPdf(server, await makePdf('x'), 'not-a-token');
    assert.strictEqual(res.status, 401);
  } finally {
    server.close();
  }
});
