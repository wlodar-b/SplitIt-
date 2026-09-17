import type { DraftItem } from '../store/useReceiptStore';

/**
 * OCR paragonu przez Gemini 3.6 Flash (Google AI Studio) — działa w Expo Go,
 * bo to zwykłe wywołanie `fetch` do REST API, bez żadnego modułu natywnego.
 *
 * Model dostaje zdjęcie + instrukcję i sam zwraca gotowy, ustrukturyzowany JSON
 * (nazwa lokalu + pozycje z cenami), więc dodatkowy parser regexowy
 * (`receiptParser.ts`) nie jest tu potrzebny — Gemini "rozumie" paragon sam.
 *
 * Klucz API czytamy z `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (plik `.env`
 * w katalogu `splitit/`). Prefiks `EXPO_PUBLIC_` sprawia, że Expo wbudowuje
 * wartość w bundle JS na etapie builda — działa identycznie w Expo Go i w
 * dev buildzie, bez żadnej dodatkowej konfiguracji.
 *
 * ⚠️ Klucz trafia do bundla aplikacji, czyli teoretycznie da się go wyciągnąć
 * z zainstalowanej apki. Do prototypu na własnym telefonie to nie problem —
 * przed publicznym wydaniem trzeba by przenieść to wywołanie za backend-proxy.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// gemini-2.5-flash zostało wycofane dla nowych kluczy (błąd 404) — następca
// wskazany wprost przez Google w komunikacie błędu.
const MODEL = 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiReceiptResult = {
  placeName: string;
  items: DraftItem[];
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    placeName: { type: 'STRING', description: 'Nazwa restauracji/sklepu, jeśli widoczna.' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          price: { type: 'NUMBER' },
        },
        required: ['name', 'price'],
      },
    },
  },
  required: ['items'],
} as const;

const PROMPT = `Jesteś asystentem odczytującym paragony z restauracji lub sklepu.
Na podstawie zdjęcia zwróć nazwę lokalu (jeśli widoczna) oraz listę pozycji zakupowych.
Zasady:
- Cena pozycji to jej cena KOŃCOWA w PLN (po uwzględnieniu ilości i rabatów), jako liczba z kropką dziesiętną, np. 15.00.
- Pomiń linie z sumą, VAT, NIP-em, formą płatności, resztą i danymi lokalu innymi niż nazwa.
- Jeśli ta sama pozycja występuje kilka razy, zwróć ją jako osobne wpisy zgodnie z paragonem.
- Jeśli zdjęcie nie jest paragonem albo jest nieczytelne, zwróć pustą listę items.`;

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/** Rozpoznaje pozycje paragonu ze zdjęcia zakodowanego w base64. */
export async function recognizeReceiptWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiReceiptResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64Image } }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`GEMINI_HTTP_${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('GEMINI_EMPTY_RESPONSE');
  }

  let parsed: { placeName?: string; items?: Array<{ name?: string; price?: number }> };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('GEMINI_INVALID_JSON');
  }

  const items: DraftItem[] = (parsed.items ?? [])
    .filter(
      (it): it is { name: string; price: number } =>
        !!it && typeof it.name === 'string' && typeof it.price === 'number' && it.price > 0
    )
    .map((it) => ({ name: it.name.trim(), price: Math.round(it.price * 100) / 100 }));

  return {
    placeName: (parsed.placeName ?? '').trim(),
    items,
  };
}
