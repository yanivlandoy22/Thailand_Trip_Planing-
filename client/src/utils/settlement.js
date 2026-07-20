// Expense-splitting math. Pure ESM module — used by the Expenses page and
// unit-tested from the server test suite.

export const CURRENCIES = ['THB', 'ILS', 'USD', 'EUR'];

// rates: {THB: ilsPerThb, USD: ilsPerUsd, EUR: ilsPerEur}
export function toILS(amount, currency, rates) {
  if (currency === 'ILS') return amount;
  const rate = Number(rates[currency]);
  return amount * (Number.isFinite(rate) && rate > 0 ? rate : 0);
}

// Totals per currency: {THB: 1200, ILS: 350, ...} (only currencies present)
export function totalsPerCurrency(expenses) {
  const totals = {};
  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    totals[e.currency] = (totals[e.currency] || 0) + amount;
  }
  return totals;
}

// Net balance per person in ILS. Positive = the group owes them money.
// Each expense is split equally between its participants; if an expense has
// no participants listed, it is split between everyone who appears anywhere.
export function computeBalances(expenses, rates, allParticipants = []) {
  const balances = {};
  const ensure = (name) => {
    if (name && !(name in balances)) balances[name] = 0;
  };
  allParticipants.forEach(ensure);

  for (const e of expenses) {
    const amountILS = toILS(Number(e.amount) || 0, e.currency, rates);
    const sharers =
      Array.isArray(e.participants) && e.participants.length
        ? e.participants
        : allParticipants;
    if (!sharers.length) continue;
    ensure(e.paid_by);
    balances[e.paid_by] += amountILS;
    const share = amountILS / sharers.length;
    for (const name of sharers) {
      ensure(name);
      balances[name] -= share;
    }
  }

  // Round to agorot to avoid floating point noise
  for (const name of Object.keys(balances)) {
    balances[name] = Math.round(balances[name] * 100) / 100;
  }
  return balances;
}

// Greedy settlement minimizing the number of transfers:
// repeatedly match the largest debtor with the largest creditor.
// Returns [{from, to, amount}] with amounts in ILS.
export function computeSettlement(balances) {
  const creditors = [];
  const debtors = [];
  for (const [name, balance] of Object.entries(balances)) {
    if (balance > 0.005) creditors.push({ name, amount: balance });
    else if (balance < -0.005) debtors.push({ name, amount: -balance });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);
    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(amount * 100) / 100,
    });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount <= 0.005) ci += 1;
    if (debtor.amount <= 0.005) di += 1;
  }
  return transfers;
}
