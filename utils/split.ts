/**
 * Sprawiedliwe dzielenie kwoty między N osób z dokładnością do 1 grosza.
 *
 * Problem: 38,00 zł / 3 = 12,666... zł — po prostym `toFixed(2)` suma może
 * nie zgadzać się z oryginałem (np. 12,67 × 3 = 38,01).
 *
 * Rozwiązanie: pracujemy w groszach (integer), dajemy każdemu `floor(total/n)`,
 * a pozostałe 0..(n-1) groszy rozdzielamy po jednym pierwszym osobom z listy.
 * Dzięki temu suma udziałów ZAWSZE równa się oryginalnej kwocie.
 */

export function splitAmountFair(amount: number, personIds: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  if (personIds.length === 0) return result;

  const totalCents = Math.round(amount * 100);
  const n = personIds.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents % n;

  personIds.forEach((id, index) => {
    const cents = base + (index < remainder ? 1 : 0);
    result[id] = cents / 100;
  });

  return result;
}

/** Udział "bazowy" (floor) — do podglądu w UI, gdy nie potrzebujemy mapy per-osoba. */
export function baseSharePerPerson(amount: number, personCount: number): number {
  if (personCount <= 0) return amount;
  const totalCents = Math.round(amount * 100);
  return Math.floor(totalCents / personCount) / 100;
}

/**
 * Zakres udziałów po sprawiedliwym podziale.
 * Gdy reszta groszy > 0, niektórzy płacą o 1 gr więcej — wtedy min !== max.
 */
export function shareRange(
  amount: number,
  personCount: number
): { min: number; max: number; uneven: boolean } {
  if (personCount <= 0) return { min: amount, max: amount, uneven: false };
  const totalCents = Math.round(amount * 100);
  const base = Math.floor(totalCents / personCount) / 100;
  const remainder = totalCents % personCount;
  if (remainder === 0) return { min: base, max: base, uneven: false };
  return { min: base, max: base + 0.01, uneven: true };
}
