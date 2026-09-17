import { personColorPalette } from '../constants/theme';
import type { Person, Receipt } from '../types';

/**
 * Zmyślony paragon testowy — na tym etapie pomijamy OCR/skanowanie.
 * W przyszłości ten obiekt będzie budowany na podstawie zdjęcia paragonu.
 */
export const mockReceipt: Receipt = {
  placeName: 'Trattoria Bella Vita',
  date: '17 września 2026',
  // Ceny celowo z groszami / niepodzielne przez 3, żeby od razu testować
  // sprawiedliwe zaokrąglanie (np. 38,00 / 3 = 12,67 + 12,67 + 12,66).
  items: [
    { id: 'item-1', name: 'Pizza Margherita', price: 32.5, quantity: 1, assignedPersonIds: [] },
    { id: 'item-2', name: 'Pizza Diavola', price: 38.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-3', name: 'Spaghetti Carbonara', price: 29.9, quantity: 1, assignedPersonIds: [] },
    { id: 'item-4', name: 'Lasagne', price: 33.5, quantity: 1, assignedPersonIds: [] },
    { id: 'item-5', name: 'Tiramisu', price: 17.99, quantity: 1, assignedPersonIds: [] },
    { id: 'item-6', name: 'Wino domowe (karafka)', price: 45.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-7', name: 'Coca-Cola 0.5l', price: 7.5, quantity: 1, assignedPersonIds: [] },
    { id: 'item-8', name: 'Woda gazowana', price: 5.99, quantity: 1, assignedPersonIds: [] },
  ],
};

export const mockPeople: Person[] = [
  { id: 'person-1', name: 'Ja', color: personColorPalette[0] },
  { id: 'person-2', name: 'Ania', color: personColorPalette[1] },
  { id: 'person-3', name: 'Tomek', color: personColorPalette[2] },
];
