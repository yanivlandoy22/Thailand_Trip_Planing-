const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { pathToFileURL } = require('url');

const url = pathToFileURL(path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'retry.js')).href;
const noSleep = () => Promise.resolve();

test('withRetry retries RetryableError then succeeds', async () => {
  const { withRetry, RetryableError } = await import(url);
  let calls = 0;
  const result = await withRetry(async () => {
    if (++calls < 3) throw new RetryableError('asleep');
    return 'ok';
  }, { delays: [1, 1, 1], sleep: noSleep });
  assert.strictEqual(result, 'ok');
  assert.strictEqual(calls, 3);
});

test('withRetry gives up after delays exhausted and never retries other errors or empty delays', async () => {
  const { withRetry, RetryableError } = await import(url);
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw new RetryableError('x'); }, { delays: [1, 1], sleep: noSleep }));
  assert.strictEqual(calls, 3);
  calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw new Error('400'); }, { delays: [1, 1], sleep: noSleep }));
  assert.strictEqual(calls, 1);
  calls = 0; // mutations: delays [] => single attempt
  await assert.rejects(withRetry(async () => { calls++; throw new RetryableError('x'); }, { delays: [], sleep: noSleep }));
  assert.strictEqual(calls, 1);
});

test('resolveApiBase / isRetryableStatus', async () => {
  const { resolveApiBase, isRetryableStatus } = await import(url);
  assert.strictEqual(resolveApiBase(undefined), '/api');
  assert.strictEqual(resolveApiBase('https://x.onrender.com/'), 'https://x.onrender.com/api');
  assert.strictEqual(resolveApiBase('https://x.onrender.com/api'), 'https://x.onrender.com/api');
  assert.ok(isRetryableStatus(503) && !isRetryableStatus(404));
});
