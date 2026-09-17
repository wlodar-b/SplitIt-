/**
 * Warstwa abstrakcji nad OCR.
 *
 * Silnik on-device (Google ML Kit / Apple Vision) to natywny moduł — NIE działa
 * w Expo Go, wymaga development builda. Dlatego ładujemy go dynamicznie:
 *  - jest dostępny (dev build)  → prawdziwe rozpoznawanie tekstu,
 *  - brak modułu (Expo Go)      → `available: false`, a UI proponuje ręczne wpisanie.
 *
 * Dzięki temu cały flow aplikacji (zdjęcie → weryfikacja → osoby → podział)
 * działa już dziś, a włączenie OCR to kwestia zbudowania dev clienta.
 */

export type OcrAvailability =
  | { available: true; engine: string }
  | { available: false; reason: string };

type MlkitModule = {
  recognize?: (uri: string) => Promise<{ text?: string }>;
  recognizeAsync?: (uri: string) => Promise<{ text?: string }>;
};

function loadMlkit(): MlkitModule | null {
  try {
    // Wymagane dynamicznie — w Expo Go moduł nie istnieje i to jest OK.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-mlkit-ocr');
    return (mod?.default ?? mod) as MlkitModule;
  } catch {
    return null;
  }
}

export function getOcrAvailability(): OcrAvailability {
  const mlkit = loadMlkit();
  if (mlkit && (mlkit.recognize || mlkit.recognizeAsync)) {
    return { available: true, engine: 'ML Kit (on-device)' };
  }
  return {
    available: false,
    reason:
      'Rozpoznawanie tekstu wymaga development builda — w Expo Go moduł natywny jest niedostępny.',
  };
}

/** Zwraca surowy tekst odczytany ze zdjęcia. Rzuca, jeśli OCR nie jest dostępny. */
export async function recognizeTextFromImage(imageUri: string): Promise<string> {
  const mlkit = loadMlkit();
  const recognize = mlkit?.recognize ?? mlkit?.recognizeAsync;

  if (!recognize) {
    throw new Error('OCR_UNAVAILABLE');
  }

  const result = await recognize(imageUri);
  return result?.text ?? '';
}
