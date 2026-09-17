export type Person = {
  id: string;
  name: string;
  color: string; // hex
};

export type ReceiptItem = {
  id: string;
  name: string;
  price: number; // cena całej pozycji, w PLN
  quantity: number; // na przyszłość (np. "2x Cola")
  assignedPersonIds: string[]; // kto płaci za tę pozycję
};

export type Receipt = {
  placeName: string;
  date: string; // czytelna data, np. "12 września 2025"
  items: ReceiptItem[];
};

/**
 * Zarchiwizowany, zakończony paragon — trafia do historii po naciśnięciu
 * "Zakończ i zapisz" na ekranie podsumowania. Trzymamy snapshot osób z tamtego
 * momentu, żeby historia nie "psuła się", jeśli ktoś później usunie/zmieni osobę.
 */
export type ArchivedReceipt = {
  id: string;
  placeName: string;
  date: string;
  savedAt: string; // ISO timestamp zapisu do historii
  items: ReceiptItem[];
  peopleSnapshot: Person[];
  total: number;
};
