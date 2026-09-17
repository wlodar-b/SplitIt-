# SplitIt! 🧾✨

**SplitIt!** to aplikacja mobilna (iOS, budowana w Expo/React Native), która rozwiązuje odwieczny problem wspólnych kolacji ze znajomymi: *"kto ile powinien zapłacić?"*.

Zamysł: po wspólnym wyjściu robisz zdjęcie paragonu, aplikacja rozpoznaje pozycje (w przyszłości — patrz [Roadmap](#-roadmap--plany-rozwoju)), a Ty w kilka dotknięć przypisujesz, kto co zamawiał. Na dole ekranu na żywo widzisz, ile wychodzi na każdą osobę.

> **Stan projektu:** aktywny prototyp/MVP skupiony na **UI/UX i logice dzielenia rachunku**. Skanowanie paragonu aparatem (OCR) jest na razie pominięte — pracujemy na danych testowych (mock), żeby dopracować idealny flow przypisywania i rozliczania.

---

## 📱 Co już działa

- **Wirtualny paragon** — lista pozycji (nazwa + cena) w estetycznej, minimalistycznej formie.
- **Przypisywanie osób do pozycji** — tap na pozycję otwiera dolny panel (Bottom Sheet) z chipsami osób; można zaznaczyć kilka naraz — cena dzieli się równo między zaznaczonych.
- **Mini-avatary pod pozycją** — od razu widać, kto "bierze" dany koszt (stos kółek w kolorach osób).
- **Sticky footer z live-podsumowaniem** — przyklejony pasek na dole, który na żywo przelicza sumę dla każdej osoby, plus ostrzeżenie o pozycjach jeszcze nie przypisanych.
- **Ekran podsumowania** (`/summary`, modal wysuwany od dołu) — pełne rozpisanie "kto za co płaci", z sumami per osoba i listą pozycji ze wskazaniem podziału (np. `÷2`).
- **Zarządzanie osobami** — dodawanie nowych osób (z automatycznym, ładnym kolorem) i usuwanie ich z pełnym czyszczeniem przypisań.
- **Historia paragonów** — zakończenie rachunku archiwizuje go (ze snapshotem osób i sum) w historii; osobny ekran listy i szczegółów archiwalnego paragonu.
- **Trwałość danych** — cały stan (osoby, bieżący paragon, historia) jest zapisywany lokalnie (`AsyncStorage`), więc zamknięcie aplikacji niczego nie resetuje.
- **UI w stylu fintech** — dark mode, gradienty, blur (`expo-blur`), haptic feedback, płynne animacje (Reanimated) — inspirowane Apple Pay / Revolut.

## 🚧 Czego jeszcze nie ma (świadome ograniczenia MVP)

- Brak aparatu/OCR — pozycje na paragonie są **danymi testowymi** (`data/mockReceipt.ts`), nie realnym skanem.
- Brak ręcznej edycji pozycji paragonu (dodaj/usuń/zmień cenę) — "Nowy paragon" zawsze zaczyna od tego samego mocka.
- Brak napiwku/serwisu i logiki zaokrąglania groszy przy nierównym podziale.
- Brak ekranu "kto komu winien" (jest już gotowy **algorytm** rozliczeń w `utils/settlement.ts`, ale nie jest jeszcze podłączony do żadnego ekranu).
- Brak udostępniania podsumowania (Share Sheet) i integracji z płatnościami (BLIK/przelew).
- Tylko iOS/Expo Go — brak natywnego builda (EAS), testów automatycznych i publikacji w App Store.

---

## 🛠️ Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57 (managed workflow) + TypeScript |
| Nawigacja | [Expo Router](https://docs.expo.dev/router/introduction/) (routing plikowy) |
| State management | [Zustand](https://zustand-demo.pmnd.rs/) + middleware `persist` |
| Trwałość danych | `@react-native-async-storage/async-storage` |
| Dolne panele | [`@gorhom/bottom-sheet`](https://gorhom.github.io/react-native-bottom-sheet/) |
| Animacje / gesty | `react-native-reanimated` v4 (+ `react-native-worklets`), `react-native-gesture-handler` |
| Wizualne efekty | `expo-blur`, `expo-linear-gradient`, `expo-haptics` |
| Testowanie na telefonie | **Expo Go** (bez potrzeby Maca — development na Windowsie) |

---

## 📂 Struktura projektu

```
splitit/
├── app/                        # Ekrany (Expo Router — routing plikowy)
│   ├── _layout.tsx             # Root layout: GestureHandlerRootView, Stack, dark theme
│   ├── index.tsx               # Ekran główny — wirtualny paragon
│   ├── summary.tsx             # Modal podsumowania ("kto za co ile")
│   └── history/
│       ├── index.tsx           # Lista zarchiwizowanych paragonów
│       └── [id].tsx            # Szczegóły jednego zarchiwizowanego paragonu
│
├── components/
│   ├── ReceiptHeader.tsx       # Nagłówek paragonu (nazwa, data, suma)
│   ├── ReceiptItemRow.tsx      # Pojedyncza pozycja na paragonie + mini-avatary
│   ├── PersonAvatar.tsx        # Avatar osoby (inicjały na gradiencie)
│   ├── AssignPeopleSheet.tsx   # Bottom Sheet: przypisywanie osób do pozycji
│   ├── ManagePeopleSheet.tsx   # Bottom Sheet: dodawanie/usuwanie osób
│   └── SummaryFooter.tsx       # Sticky footer z live-sumami + przycisk "Podsumuj"
│
├── store/
│   └── useReceiptStore.ts      # Zustand store — cała logika stanu i persystencji
│
├── data/
│   └── mockReceipt.ts          # Testowy paragon (8 pozycji) + testowe osoby
│
├── types/
│   └── index.ts                # Typy: Person, ReceiptItem, Receipt, ArchivedReceipt
│
├── utils/
│   ├── currency.ts             # Formatowanie kwot ("zł"), inicjały imion
│   └── settlement.ts           # Algorytm minimalizacji transferów (jeszcze nie podłączony do UI)
│
└── constants/
    └── theme.ts                 # Kolory, spacing, typografia, paleta kolorów osób
```

### Model danych (`types/index.ts`)

```ts
type Person = { id: string; name: string; color: string };

type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedPersonIds: string[]; // kto płaci za tę pozycję (podział równy między nich)
};

type ArchivedReceipt = {
  id: string;
  placeName: string;
  date: string;
  savedAt: string;
  items: ReceiptItem[];
  peopleSnapshot: Person[]; // snapshot osób z momentu archiwizacji
  total: number;
};
```

**Kluczowa logika liczenia** (w `useReceiptStore` i na ekranach `index`/`summary`): dla każdej pozycji kwota `price` dzieli się równo przez liczbę osób w `assignedPersonIds`. Pozycje z pustym `assignedPersonIds` są traktowane jako "nieprzypisane" i wizualnie wyróżnione (czerwony akcent), żeby użytkownik wiedział, że rozliczenie nie jest jeszcze kompletne.

---

## ▶️ Jak uruchomić projekt (Windows + Expo Go, bez Maca)

### Wymagania

- [Node.js](https://nodejs.org/) (sprawdzone na v24, powinno działać od v18+)
- Telefon iPhone z zainstalowaną aplikacją **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)** z App Store
- Telefon i komputer **w tej samej sieci Wi-Fi**

### Instalacja i start

```powershell
cd splitit
npm install
npx expo start
```

W terminalu pojawi się **QR kod**. Zeskanuj go:
- z aplikacji **Expo Go** (przycisk "Scan QR code"), albo
- wbudowanym aparatem iPhone'a (poprosi o otwarcie w Expo Go).

Aplikacja się zbuduje i otworzy na telefonie. Każda zmiana kodu = automatyczny hot-reload.

### Przydatne komendy

| Komenda | Co robi |
|---|---|
| `npx expo start` | Start dev servera + QR kod |
| `npx expo start --tunnel` | Jak wyżej, ale przez internet (gdy QR/Wi-Fi nie działa — wolniejsze, ale zawsze się połączy) |
| `npx tsc --noEmit` | Sprawdzenie typów TypeScript bez budowania |
| `npx expo-doctor` | Diagnostyka konfiguracji projektu Expo |

### Rozwiązywanie problemów

- **Port zajęty** — `npx expo start --port 8082` (albo dowolny inny wolny port).
- **QR nie łączy się** — użyj `--tunnel` (patrz wyżej) lub sprawdź, czy firewall nie blokuje sieci lokalnej.
- **Coś się "posypało" po zmianach** — potrząśnij telefonem w Expo Go → **Reload**, albo wpisz `r` w terminalu z działającym `expo start`.

---

## 🗺️ Roadmap / Plany rozwoju

### Faza 1 — Dopracowanie MVP (najbliższe kroki)
- [ ] Ręczna edycja paragonu — dodawanie/usuwanie/edycja pozycji (nazwa, cena) bez potrzeby OCR.
- [ ] Napiwek / serwis — rozdzielany proporcjonalnie do tego, ile kto zjadł.
- [ ] Poprawne zaokrąglanie groszy przy nierównym podziale (np. `38,00 zł / 3`).

### Faza 2 — Finalne rozliczenie ("magic moment")
- [ ] Ekran "Kto komu winien" — UI na bazie już gotowego algorytmu w `utils/settlement.ts` (minimalna liczba transferów między osobami, nie każdy-z-każdym).
- [ ] Udostępnianie podsumowania — natywny Share Sheet (tekst/obrazek) do wysłania na czat grupowy.
- [ ] Deep link do BLIK-a / przelewu z gotową kwotą.

### Faza 3 — Skanowanie paragonu (odłożone na start)
- [ ] Integracja `expo-camera` + OCR (Google Cloud Vision / ML Kit / on-device) do automatycznego rozpoznawania pozycji ze zdjęcia.
- [ ] Ekran weryfikacji/korekty rozpoznanych pozycji przed przejściem do przypisywania.

### Faza 4 — Polish i produkcja
- [ ] Zapisani "znajomi" / szybkie presety grup (częściowo już mamy — osoby persystują między paragonami).
- [ ] Testy jednostkowe logiki store i algorytmu rozliczeń (Jest).
- [ ] Prawdziwy build (EAS Build) + TestFlight — wyjście z Expo Go.
- [ ] Ikona aplikacji, splash screen, ewentualnie tryb light mode.
- [ ] Dostępność (VoiceOver, Dynamic Type).

---

## 🎨 Filozofia designu

Ciemny, "fintech premium" motyw inspirowany Apple Pay / Revolut: dużo przestrzeni, gradienty, blur, haptic feedback przy interakcjach i płynne mikro-animacje (Reanimated) — appka ma być przyjemna w dotyku, a nie tylko funkcjonalna. Wszystkie kolory, odstępy i typografia są scentralizowane w `constants/theme.ts`.
