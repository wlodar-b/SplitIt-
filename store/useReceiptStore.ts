import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { personColorPalette } from '../constants/theme';
import { mockPeople, mockReceipt } from '../data/mockReceipt';
import type { ArchivedReceipt, Person, ReceiptItem } from '../types';

function formatTodayPL(): string {
  return new Date().toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

let itemCounter = 0;
function nextItemId(): string {
  itemCounter += 1;
  return `item-${Date.now()}-${itemCounter}`;
}

export type DraftItem = { name: string; price: number };

type ReceiptStore = {
  placeName: string;
  date: string;
  items: ReceiptItem[];
  people: Person[];
  history: ArchivedReceipt[];
  /** Ostatnie zdjęcie paragonu (URI lokalne) — pokazywane na ekranie weryfikacji. */
  lastPhotoUri: string | null;
  /** Czy stan został już wczytany z dysku (AsyncStorage). Zapobiega "mrugnięciu" domyślnymi danymi. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // -- paragon --
  /** Zaczyna zupełnie nowy, pusty rachunek (czyści pozycje i przypisania). */
  startNewReceipt: () => void;
  /** Wczytuje przykładowy paragon (tryb demo, dopóki nie mamy OCR). */
  loadDemoReceipt: () => void;
  /** Podmienia pozycje paragonu — np. wynikiem OCR albo ręcznym wpisaniem. */
  setItemsFromDraft: (drafts: DraftItem[]) => void;
  addItem: (name: string, price: number) => void;
  updateItem: (itemId: string, patch: Partial<Pick<ReceiptItem, 'name' | 'price'>>) => void;
  removeItem: (itemId: string) => void;
  setPlaceName: (name: string) => void;
  setLastPhotoUri: (uri: string | null) => void;

  // -- osoby --
  togglePersonOnItem: (itemId: string, personId: string) => void;
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;

  // -- historia --
  /** Zapisuje bieżący paragon (ze snapshotem osób i sumą) do historii, po czym czyści bieżący. */
  archiveCurrentReceipt: () => void;
  deleteHistoryReceipt: (id: string) => void;
};

export const useReceiptStore = create<ReceiptStore>()(
  persist(
    (set, get) => ({
      placeName: '',
      date: formatTodayPL(),
      items: [],
      people: [],
      history: [],
      lastPhotoUri: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      startNewReceipt: () =>
        set({
          placeName: '',
          date: formatTodayPL(),
          items: [],
          lastPhotoUri: null,
        }),

      loadDemoReceipt: () =>
        set({
          placeName: mockReceipt.placeName,
          date: formatTodayPL(),
          items: mockReceipt.items.map((item) => ({
            ...item,
            id: nextItemId(),
            assignedPersonIds: [],
          })),
          lastPhotoUri: null,
          // w demo dorzucamy przykładowe osoby tylko wtedy, gdy użytkownik nie ma żadnych
          people: get().people.length > 0 ? get().people : mockPeople,
        }),

      setItemsFromDraft: (drafts) =>
        set({
          items: drafts.map((draft) => ({
            id: nextItemId(),
            name: draft.name,
            price: draft.price,
            quantity: 1,
            assignedPersonIds: [],
          })),
        }),

      addItem: (name, price) =>
        set((state) => ({
          items: [
            ...state.items,
            { id: nextItemId(), name, price, quantity: 1, assignedPersonIds: [] },
          ],
        })),

      updateItem: (itemId, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item
          ),
        })),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),

      setPlaceName: (name) => set({ placeName: name }),

      setLastPhotoUri: (uri) => set({ lastPhotoUri: uri }),

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
          placeName: placeName || 'Rachunek',
          date,
          savedAt: new Date().toISOString(),
          items,
          peopleSnapshot: people,
          total,
        };

        set((state) => ({
          history: [archived, ...state.history],
          placeName: '',
          items: [],
          lastPhotoUri: null,
          date: formatTodayPL(),
        }));
      },

      deleteHistoryReceipt: (id) =>
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'splitit-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 trzymał w bieżącym paragonie dane z mocka. Po przejściu na flow ze
      // skanowaniem zaczynamy od pustego rachunku, ale osoby i historię zachowujemy.
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<ReceiptStore>;
        if (version < 2) {
          return {
            ...state,
            placeName: '',
            items: [],
            lastPhotoUri: null,
            date: formatTodayPL(),
          };
        }
        return state;
      },
      // Persystujemy tylko dane — akcji (funkcji) i tak nie da się zserializować.
      partialize: (state) => ({
        placeName: state.placeName,
        date: state.date,
        items: state.items,
        people: state.people,
        history: state.history,
        lastPhotoUri: state.lastPhotoUri,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
