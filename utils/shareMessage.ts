import type { Person, ReceiptItem } from '../types';
import { formatPLN } from './currency';
import { splitAmountFair } from './split';

/**
 * Buduje czytelny tekst podsumowania rachunku do udostępnienia
 * (WhatsApp, Messenger, SMS, Notes…).
 */
export function buildShareMessage(params: {
  placeName: string;
  date: string;
  items: ReceiptItem[];
  people: Person[];
}): string {
  const { placeName, date, items, people } = params;

  const lines: string[] = [];
  lines.push(`SplitIt! — ${placeName}`);
  lines.push(date);
  lines.push('');

  const totals: Record<string, number> = {};
  people.forEach((p) => (totals[p.id] = 0));

  let receiptTotal = 0;
  const unassigned: ReceiptItem[] = [];

  items.forEach((item) => {
    receiptTotal += item.price;
    const ids = item.assignedPersonIds;
    if (ids.length === 0) {
      unassigned.push(item);
      return;
    }
    const shares = splitAmountFair(item.price, ids);
    ids.forEach((id) => {
      totals[id] = (totals[id] ?? 0) + (shares[id] ?? 0);
    });
  });

  lines.push(`Suma rachunku: ${formatPLN(receiptTotal)}`);
  lines.push('');

  people.forEach((person) => {
    const total = totals[person.id] ?? 0;
    lines.push(`${person.name}: ${formatPLN(total)}`);

    items.forEach((item) => {
      if (!item.assignedPersonIds.includes(person.id)) return;
      const shares = splitAmountFair(item.price, item.assignedPersonIds);
      const share = shares[person.id] ?? 0;
      const splitHint =
        item.assignedPersonIds.length > 1 ? ` (÷${item.assignedPersonIds.length})` : '';
      lines.push(`  • ${item.name}${splitHint} — ${formatPLN(share)}`);
    });

    lines.push('');
  });

  if (unassigned.length > 0) {
    lines.push('Bez przypisania:');
    unassigned.forEach((item) => {
      lines.push(`  • ${item.name} — ${formatPLN(item.price)}`);
    });
    lines.push('');
  }

  lines.push('— wygenerowano w SplitIt!');
  return lines.join('\n');
}
