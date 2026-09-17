/**
 * Minimalizacja liczby transakcji potrzebnych do rozliczenia grupy.
 *
 * Wejście: "saldo" każdej osoby = (ile skonsumowała) − (ile faktycznie zapłaciła).
 *   - saldo > 0  → osoba jest "na minusie", czyli winna pieniądze do wspólnej puli.
 *   - saldo < 0  → osoba jest "na plusie", czyli jej się zwraca — dopłaciła za innych.
 *
 * Algorytm greedy: w każdym kroku łączymy największego dłużnika z największym
 * wierzycielem, przenosimy między nimi min(dług, wierzytelność) i powtarzamy.
 * To standardowe podejście używane np. w Splitwise — nie jest to jedyne poprawne
 * rozwiązanie, ale w praktyce daje bliską minimalnej liczbę koniecznych przelewów.
 */

export type PersonBalance = {
  personId: string;
  balance: number; // dodatnie = winien, ujemne = należy mu się zwrot
};

export type Settlement = {
  fromId: string; // kto płaci
  toId: string; // kto dostaje
  amount: number;
};

const EPSILON = 0.01; // grosz — poniżej tego uznajemy saldo za wyrównane

export function computeSettlements(balances: PersonBalance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ personId: b.personId, balance: -b.balance }))
    .sort((a, b) => b.balance - a.balance);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > EPSILON) {
      settlements.push({ fromId: debtor.personId, toId: creditor.personId, amount });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance <= EPSILON) i += 1;
    if (creditor.balance <= EPSILON) j += 1;
  }

  return settlements;
}
