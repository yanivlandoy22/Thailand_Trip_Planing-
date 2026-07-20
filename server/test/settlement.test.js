const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { pathToFileURL } = require('url');

const settlementUrl = pathToFileURL(
  path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'settlement.js')
).href;

const RATES = { THB: 0.11, USD: 3.65, EUR: 3.95 };

test('totalsPerCurrency sums per currency', async () => {
  const { totalsPerCurrency } = await import(settlementUrl);
  const totals = totalsPerCurrency([
    { amount: 100, currency: 'THB' },
    { amount: 250, currency: 'THB' },
    { amount: 40, currency: 'USD' },
  ]);
  assert.deepStrictEqual(totals, { THB: 350, USD: 40 });
});

test('computeBalances splits equally and converts to ILS', async () => {
  const { computeBalances } = await import(settlementUrl);
  // Dana paid 300 ILS for Dana+Yossi+Noa → each share 100.
  const balances = computeBalances(
    [{ amount: 300, currency: 'ILS', paid_by: 'דנה', participants: ['דנה', 'יוסי', 'נועה'] }],
    RATES,
    ['דנה', 'יוסי', 'נועה']
  );
  assert.strictEqual(balances['דנה'], 200);
  assert.strictEqual(balances['יוסי'], -100);
  assert.strictEqual(balances['נועה'], -100);
});

test('computeBalances converts THB via rate', async () => {
  const { computeBalances } = await import(settlementUrl);
  // 1000 THB = 110 ILS, split between two → payer nets +55.
  const balances = computeBalances(
    [{ amount: 1000, currency: 'THB', paid_by: 'א', participants: ['א', 'ב'] }],
    RATES,
    ['א', 'ב']
  );
  assert.strictEqual(balances['א'], 55);
  assert.strictEqual(balances['ב'], -55);
});

test('computeSettlement produces minimal greedy transfers that zero out', async () => {
  const { computeBalances, computeSettlement } = await import(settlementUrl);
  const expenses = [
    { amount: 300, currency: 'ILS', paid_by: 'דנה', participants: ['דנה', 'יוסי', 'נועה'] },
    { amount: 90, currency: 'ILS', paid_by: 'יוסי', participants: ['דנה', 'יוסי', 'נועה'] },
  ];
  const balances = computeBalances(expenses, RATES, ['דנה', 'יוסי', 'נועה']);
  // דנה: +300-100-30=+170, יוסי: +90-100-30=-40, נועה: -130
  const transfers = computeSettlement(balances);
  assert.strictEqual(transfers.length, 2);
  const paid = {};
  for (const t of transfers) {
    assert.ok(t.amount > 0);
    paid[t.from] = (paid[t.from] || 0) - t.amount;
    paid[t.to] = (paid[t.to] || 0) + t.amount;
  }
  // Net flow (received - paid) must equal each person's balance:
  // creditors receive exactly what they're owed, debtors pay their debt.
  for (const [name, balance] of Object.entries(balances)) {
    assert.ok(Math.abs((paid[name] || 0) - balance) < 0.02, `${name} not settled`);
  }
});

test('computeSettlement returns empty when balanced', async () => {
  const { computeSettlement } = await import(settlementUrl);
  assert.deepStrictEqual(computeSettlement({ a: 0, b: 0 }), []);
});
