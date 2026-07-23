const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const app = require('../index');
const { signOrganizerToken } = require('../middleware/auth');

const PDF_BYTES = Buffer.from('%PDF-1.4 ticket-bytes-for-test');

function jsonRequest(server, method, path, { body, token } = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {};
    if (data) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;
    const req = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let parsed;
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.end(data);
  });
}

function uploadTicket(server, bookingId, buffer, { token, mime = 'application/pdf' } = {}) {
  const { port } = server.address();
  const boundary = '----ticketboundary7';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="t.pdf"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, buffer, tail]);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: `/api/bookings/${bookingId}/ticket`,
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

test('ticket lifecycle: attach -> signed url -> stream -> remove -> booking delete cleans up', async () => {
  const token = signOrganizerToken();
  const server = app.listen(0);
  try {
    const created = await jsonRequest(server, 'POST', '/api/bookings', {
      token,
      body: { title: 'טיסת בדיקה', type: 'flight' },
    });
    assert.strictEqual(created.status, 201);
    const id = created.body.id;
    assert.strictEqual(created.body.ticket_path, null);

    // no ticket yet -> Hebrew 404
    const missing = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-url`);
    assert.strictEqual(missing.status, 404);
    assert.match(missing.body.error, /אין כרטיס/);

    // attach
    const attached = await uploadTicket(server, id, PDF_BYTES, { token });
    assert.strictEqual(attached.status, 200, JSON.stringify(attached.body));
    assert.strictEqual(attached.body.ticket_path, `${id}.pdf`);

    // signed url (memory mode -> local route) and stream the actual bytes
    const urlRes = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-url?download=1`);
    assert.strictEqual(urlRes.status, 200);
    assert.match(urlRes.body.url, new RegExp(`/api/bookings/${id}/ticket-file`));

    const file = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-file?download=x.pdf`);
    assert.strictEqual(file.status, 200);
    assert.strictEqual(file.headers['content-type'], 'application/pdf');
    assert.match(file.headers['content-disposition'], /attachment/);
    assert.ok(Buffer.isBuffer(file.body) && file.body.equals(PDF_BYTES), 'streamed bytes differ');

    // remove ticket -> path nulled, file gone
    const removed = await jsonRequest(server, 'DELETE', `/api/bookings/${id}/ticket`, { token });
    assert.strictEqual(removed.status, 200);
    assert.strictEqual(removed.body.ticket_path, null);
    const gone = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-file`);
    assert.strictEqual(gone.status, 404);

    // re-attach then delete the booking -> file cleaned up too
    await uploadTicket(server, id, PDF_BYTES, { token });
    await jsonRequest(server, 'DELETE', `/api/bookings/${id}`, { token });
    const afterDelete = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-file`);
    assert.strictEqual(afterDelete.status, 404);
  } finally {
    server.close();
  }
});

test('ticket upload rejects non-PDF and oversize files with Hebrew errors', async () => {
  const token = signOrganizerToken();
  const server = app.listen(0);
  try {
    const created = await jsonRequest(server, 'POST', '/api/bookings', {
      token,
      body: { title: 'הזמנה', type: 'flight' },
    });
    const id = created.body.id;

    const badType = await uploadTicket(server, id, Buffer.from('hello'), { token, mime: 'text/plain' });
    assert.strictEqual(badType.status, 400);
    assert.match(badType.body.error, /PDF בלבד/);

    const oversize = await uploadTicket(server, id, Buffer.alloc(10 * 1024 * 1024 + 1), { token });
    assert.strictEqual(oversize.status, 400);
    assert.match(oversize.body.error, /גדול מדי/);
  } finally {
    server.close();
  }
});

test('ticket mutations are organizer-only; ticket-url is public', async () => {
  const token = signOrganizerToken();
  const server = app.listen(0);
  try {
    const created = await jsonRequest(server, 'POST', '/api/bookings', {
      token,
      body: { title: 'הזמנה', type: 'flight' },
    });
    const id = created.body.id;

    const noAuth = await uploadTicket(server, id, PDF_BYTES, { token: 'bad' });
    assert.strictEqual(noAuth.status, 401);
    const noAuthDelete = await jsonRequest(server, 'DELETE', `/api/bookings/${id}/ticket`);
    assert.strictEqual(noAuthDelete.status, 401);

    await uploadTicket(server, id, PDF_BYTES, { token });
    const publicUrl = await jsonRequest(server, 'GET', `/api/bookings/${id}/ticket-url`);
    assert.strictEqual(publicUrl.status, 200);
  } finally {
    server.close();
  }
});
