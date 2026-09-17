import { personColorPalette } from '../constants/theme';
import type { Person, Receipt } from '../types';

/**
 * Zmyślony paragon testowy — na tym etapie pomijamy OCR/skanowanie.
 * W przyszłości ten obiekt będzie budowany na podstawie zdjęcia paragonu.
 */
export const mockReceipt: Receipt = {
  placeName: 'Trattoria Bella Vita',
  date: '17 września 2026',
  items: [
    { id: 'item-1', name: 'Pizza Margherita', price: 32.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-2', name: 'Pizza Diavola', price: 38.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-3', name: 'Spaghetti Carbonara', price: 29.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-4', name: 'Lasagne', price: 34.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-5', name: 'Tiramisu', price: 18.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-6', name: 'Wino domowe (karafka)', price: 45.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-7', name: 'Coca-Cola 0.5l', price: 8.0, quantity: 1, assignedPersonIds: [] },
    { id: 'item-8', name: 'Woda gazowana', price: 6.0, quantity: 1, assignedPersonIds: [] },
  ],
};

export const mockPeople: Person[] = [
  { id: 'person-1', name: 'Ja', color: personColorPalette[0] },
  { id: 'person-2', name: 'Ania', color: personColorPalette[1] },
  { id: 'person-3', name: 'Tomek', color: personColorPalette[2] },
];
