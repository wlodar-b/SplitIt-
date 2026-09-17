import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { personColorPalette } from '../constants/theme';
import { mockPeople, mockReceipt } from '../data/mockReceipt';
import type { ArchivedReceipt, Person, ReceiptItem } from '../types';

/** Zwraca świeży, "czysty" komplet pozycji na nowy paragon (bez przypisań). */
function freshReceiptItems(): ReceiptItem[] {
  return mockReceipt.items.map((item) => ({ ...item, assignedPersonIds: [] }));
}

function formatTodayPL(): string {
  return new Date().toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type ReceiptStore = {
  placeName: string;
  date: string;
  items: ReceiptItem[];
  people: Person[];
  history: ArchivedReceipt[];
  /** Czy stan został już wczytany z dysku (AsyncStorage). Zapobiega "mrugnięciu" domyślnymi danymi. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // -- akcje --
  /** Zaznacza/odznacza osobę na danej pozycji paragonu (multi-select). */
  togglePersonOnItem: (itemId: string, personId: string) => void;
  /** Dodaje nową osobę z automatycznie wybranym, nieużywanym kolorem. */
  addPerson: (name: string) => void;
  /** Usuwa osobę i czyści jej przypisania ze wszystkich pozycji. */
  removePerson: (personId: string) => void;
  /** Zapisuje bieżący paragon (ze snapshotem osób i sumą) do historii, po czym zaczyna nowy. */
  archiveCurrentReceipt: () => void;
  /** Zaczyna nowy paragon bez zapisywania bieżącego do historii. */
  startNewReceipt: () => void;
  /** Usuwa zarchiwizowany paragon z historii. */
  deleteHistoryReceipt: (id: string) => void;
};

export const useReceiptStore = create<ReceiptStore>()(
  persist(
    (set, get) => ({
      placeName: mockReceipt.placeName,
      date: mockReceipt.date,
      items: mockReceipt.items,
      people: mockPeople,
      history: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      togglePersonOnItem: (itemId, personId) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;

            const isAssigned = item.assignedPersonIds.includes(personId);
            const assignedPersonIds = isAssigned
              ? item.assignedPersonIds.filter((id) => id !== personId)
              : [...item.assignedPersonIds, personId];

            return { ...item, assignedPersonIds };
          }),
        })),

      addPerson: (name) =>
        set((state) => {
          const usedColors = new Set(state.people.map((p) => p.color));
          const nextColor =
            personColorPalette.find((c) => !usedColors.has(c)) ??
            personColorPalette[state.people.length % personColorPalette.length];

          const newPerson: Person = {
            id: `person-${Date.now()}`,
            name: name.trim(),
            color: nextColor,
          };

          return { people: [...state.people, newPerson] };
        }),

      removePerson: (personId) =>
        set((state) => ({
          people: state.people.filter((p) => p.id !== personId),
          items: state.items.map((item) => ({
            ...item,
            assignedPersonIds: item.assignedPersonIds.filter((id) => id !== personId),
          })),
        })),

      archiveCurrentReceipt: () => {
        const { placeName, date, items, people } = get();
        const total = items.reduce((sum, item) => sum + item.price, 0);

        const archived: ArchivedReceipt = {
          id: `receipt-${Date.now()}`,
          placeName,
          date,
          savedAt: new Date().toISOString(),
          items,
          peopleSnapshot: people,
          total,
        };

        set((state) => ({
          history: [archived, ...state.history],
          items: freshReceiptItems(),
          date: formatTodayPL(),
        }));
      },

      startNewReceipt: () =>
        set({
          items: freshReceiptItems(),
          date: formatTodayPL(),
        }),

      deleteHistoryReceipt: (id) =>
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'splitit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persystujemy tylko dane — akcje (funkcje) i tak nie da się zserializować.
      partialize: (state) => ({
        placeName: state.placeName,
        date: state.date,
        items: state.items,
        people: state.people,
        history: state.history,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
