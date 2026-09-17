import type { DraftItem } from '../store/useReceiptStore';

/**
 * Zamienia surowy tekst z OCR na listę pozycji { nazwa, cena }.
 *
 * Silnik OCR (ML Kit / Apple Vision) zwraca "goły" tekst linia po linii — to tutaj
 * dzieje się cała robota rozumienia paragonu. Parser jest celowo niezależny od
 * silnika OCR, dzięki czemu można go testować i podmieniać OCR bez zmian tutaj.
 */

/** Linie, które na pewno nie są pozycją do rozliczenia. */
const NOISE_PATTERNS = [
  /\bsuma\b/i,
  /\brazem\b/i,
  /\bdo\s*zap[łl]aty\b/i,
  /\bptu\b/i,
  /\bvat\b/i,
  /\bnip\b/i,
  /\bparagon\b/i,
  /\bfiskalny\b/i,
  /\bniefiskalny\b/i,
  /\breszta\b/i,
  /\bgot[óo]wka\b/i,
  /\bkarta\b/i,
  /\bp[łl]atno[śs][ćc]\b/i,
  /\bsprzeda[żz]\b/i,
  /\brabat\b/i,
  /\bopust\b/i,
  /\bkasa\b/i,
  /\bkasjer\b/i,
  /\bnr\s*wydr/i,
  /\bdata\b/i,
  /\bgodz/i,
  /\bul\.\s/i,
  /\btel\.?\s/i,
  /\bwww\./i,
  /\bdzi[ęe]kujemy\b/i,
  /\bzapraszamy\b/i,
  /^\s*[-=*_.]+\s*$/,
];

/** Wyciąga wszystkie kwoty z linii (12,50 / 12.50 / 1 234,00). */
const PRICE_REGEX = /(\d{1,4}(?:[ \u00A0]?\d{3})*[.,]\d{2})(?!\d)/g;

/** Fragment "2 x 7,50" / "2x7.50" / "2 szt. x 7,50" — usuwamy go z nazwy. */
const QUANTITY_REGEX = /\d+(?:[.,]\d+)?\s*(?:szt\.?)?\s*[xX×]\s*\d{1,4}[.,]\d{2}/g;

function toNumber(raw: string): number {
  return Number(raw.replace(/[ \u00A0]/g, '').replace(',', '.'));
}

function isNoise(line: string): boolean {
  return NOISE_PATTERNS.some((pattern) => pattern.test(line));
}

function cleanName(line: string): string {
  return line
    .replace(QUANTITY_REGEX, ' ')
    .replace(PRICE_REGEX, ' ')
    // końcowe litery stawki VAT (A, B, C, D) oraz śmieci interpunkcyjne
    .replace(/\s+[A-Da-d]\s*$/, ' ')
    .replace(/[|*_=]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s.,:;-]+|[\s.,:;-]+$/g, '')
    .trim();
}

export function parseReceiptText(rawText: string): DraftItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: DraftItem[] = [];

  for (const line of lines) {
    if (isNoise(line)) continue;

    const prices = line.match(PRICE_REGEX);
    if (!prices || prices.length === 0) continue;

    // Cena pozycji to zwykle OSTATNIA kwota w linii (po "2 x 7,50" stoi "15,00").
    const price = toNumber(prices[prices.length - 1]);
    if (!Number.isFinite(price) || price <= 0 || price > 10000) continue;

    const name = cleanName(line);
    // Odrzucamy linie bez sensownej nazwy (same cyfry, kody, pojedyncze znaki).
    if (name.length < 2) continue;
    if (!/[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]{2,}/.test(name)) continue;

    items.push({ name, price });
  }

  return items;
}

/** Próbuje zgadnąć nazwę lokalu — zwykle jest w pierwszych liniach paragonu. */
export function guessPlaceName(rawText: string): string {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 5)) {
    if (isNoise(line)) continue;
    if (PRICE_REGEX.test(line)) continue;
    if (line.length < 3) continue;
    if (!/[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]{3,}/.test(line)) continue;
    return line.slice(0, 40);
  }

  return '';
}
