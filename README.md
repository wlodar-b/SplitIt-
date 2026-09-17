# SplitIt! 🧾✨

**SplitIt!** to aplikacja mobilna (iOS, budowana w Expo/React Native), która rozwiązuje odwieczny problem wspólnych kolacji ze znajomymi: *"kto ile powinien zapłacić?"*.

Zamysł: po wspólnym wyjściu robisz zdjęcie paragonu, aplikacja rozpoznaje pozycje, a Ty w kilka dotknięć przypisujesz, kto co zamawiał. Na dole ekranu na żywo widzisz, ile wychodzi na każdą osobę.

> **Stan projektu:** aktywny prototyp/MVP. Pełny flow (zdjęcie → weryfikacja pozycji → osoby → podział → podsumowanie) jest zbudowany i działa w Expo Go. **Sam silnik OCR wymaga development builda** — szczegóły niżej w [Skanowanie paragonu i OCR](#-skanowanie-paragonu-i-ocr).

### Flow aplikacji

```
/ (start)  →  /scan          →  /verify           →  /people         →  /split           →  /summary
              zdjęcie + OCR     poprawa pozycji      kto przy stole     przypisywanie       kto ile płaci
                                                                                            → historia
```

Każdy krok da się pominąć lub wejść w niego bezpośrednio: z ekranu startowego można wpisać paragon ręcznie albo wczytać przykładowy, a rachunek w toku zawsze czeka na ekranie startowym w karcie „Rachunek w toku”.

---

## 📱 Co już działa

- **Ekran startowy** — skan paragonu, wpisanie ręczne, przykładowy paragon, wznowienie rachunku w toku i wejście w historię.
- **Zdjęcie paragonu** — aparat lub galeria (`expo-image-picker`), z podglądem; działa w Expo Go.
- **Weryfikacja paragonu** — pełna ręczna edycja pozycji (nazwa, cena), dodawanie i usuwanie, nazwa lokalu, live suma.
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

- **OCR nie działa w Expo Go** — flow i parser są gotowe, ale samo rozpoznawanie tekstu wymaga development builda (patrz niżej).
- Brak napiwku/serwisu doliczanego do rachunku.
- Brak ekranu "kto komu winien" (jest już gotowy **algorytm** rozliczeń w `utils/settlement.ts`, ale nie jest jeszcze podłączony do żadnego ekranu).
- Brak integracji z płatnościami (BLIK/przelew).
- Tylko iOS/Expo Go — brak natywnego builda (EAS), testów automatycznych i publikacji w App Store.

---

## 📷 Skanowanie paragonu i OCR

Rozpoznawanie działa obecnie przez **Gemini 3.6 Flash** (`utils/geminiReceipt.ts`) — model multimodalny, który dostaje zdjęcie i sam zwraca gotowy JSON z nazwą lokalu i pozycjami (nazwa + cena). To zwykłe zapytanie `fetch` do REST API, więc **działa w Expo Go bez żadnego dev builda**.

### Jak skonfigurować klucz API

1. Wejdź na [Google AI Studio](https://aistudio.google.com/apikey), zaloguj się kontem Google i kliknij **Create API key** (za darmo, bez karty płatniczej).
2. W katalogu `splitit/` skopiuj `.env.example` do `.env` (albo po prostu edytuj istniejący `.env`).
3. Wklej klucz:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=twoj_klucz_tutaj
   ```
4. Zrestartuj Metro z czyszczeniem cache — zmienne env są wbudowywane w bundle na starcie:
   ```bash
   npx expo start -c
   ```

Prefiks `EXPO_PUBLIC_` jest wymagany — tylko takie zmienne Expo wbudowuje do JS-a. `.env` jest w `.gitignore`, więc klucz nigdy nie trafi do repo.

> ⚠️ **Ograniczenie prototypu:** klucz API ląduje w bundle'u aplikacji, czyli teoretycznie da się go wyciągnąć z zainstalowanej apki. Do własnego użytku i testów ze znajomymi to nieistotne — przed publicznym wydaniem trzeba by przenieść wywołanie Gemini za cienki backend-proxy, żeby klucz nigdy nie trafiał na telefon.
>
> **Darmowy limit:** Google Cloud Vision (alternatywa) daje 1000 skanów/mies. za darmo na stałe; Gemini w AI Studio ma własny darmowy tier w podobnych okolicach — do dzielenia rachunków ze znajomymi realnie nie zapłacisz nic.

### Fallback: on-device OCR (development build)

Warstwa `utils/ocr.ts` obsługuje też on-device OCR (Google ML Kit / Apple Vision) jako alternatywę bez wysyłania zdjęcia do chmury — ale to moduł natywny, więc wymaga *development builda* (nie działa w Expo Go) i płatnego konta Apple Developer (99 USD/rok) do instalacji na fizycznym iPhonie:

```bash
npx expo install expo-mlkit-ocr expo-build-properties expo-dev-client
eas build --profile development --platform ios
```

Ekran skanowania (`app/scan.tsx`) sam wybiera silnik: **Gemini, jeśli klucz jest ustawiony → on-device, jeśli dostępny → w innym wypadku ręczna edycja.** Zmiana silnika nie wymaga modyfikacji żadnego ekranu.

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
│   ├── index.tsx               # Ekran startowy — skan / ręcznie / demo / historia
│   ├── scan.tsx                # Zdjęcie paragonu + OCR (lub info o braku OCR)
│   ├── verify.tsx              # Weryfikacja i edycja rozpoznanych pozycji
│   ├── people.tsx              # "Kto przy stole?" — osoby dzielące rachunek
│   ├── split.tsx               # Wirtualny paragon — przypisywanie osób do pozycji
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
│   ├── ocr.ts                  # Warstwa OCR — wykrywa i wywołuje silnik natywny
│   ├── receiptParser.ts        # Tekst z OCR → pozycje paragonu (heurystyki PL)
│   ├── split.ts                # Sprawiedliwy podział kwot co do grosza
│   ├── shareMessage.ts         # Budowanie tekstu podsumowania do udostępnienia
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

### Faza 1 — Dopracowanie MVP
- [x] Ręczna edycja paragonu — dodawanie/usuwanie/edycja pozycji (nazwa, cena) bez potrzeby OCR.
- [x] Poprawne zaokrąglanie groszy przy nierównym podziale (np. `38,00 zł / 3`).
- [ ] Napiwek / serwis — rozdzielany proporcjonalnie do tego, ile kto zjadł.

### Faza 2 — Finalne rozliczenie ("magic moment")
- [x] Udostępnianie podsumowania — natywny Share Sheet do wysłania na czat grupowy.
- [ ] Ekran "Kto komu winien" — UI na bazie już gotowego algorytmu w `utils/settlement.ts` (minimalna liczba transferów między osobami, nie każdy-z-każdym).
- [ ] Deep link do BLIK-a / przelewu z gotową kwotą.

### Faza 3 — Skanowanie paragonu
- [x] Zdjęcie paragonu (aparat/galeria) + ekran weryfikacji rozpoznanych pozycji.
- [x] Wymienialna warstwa OCR + parser paragonu (heurystyki dla polskich paragonów).
- [ ] Development build z `expo-mlkit-ocr` — realne rozpoznawanie tekstu on-device.
- [ ] Dostrajanie parsera na prawdziwych zdjęciach paragonów (ilości, wagi, rabaty).

### Faza 4 — Polish i produkcja
- [ ] Zapisani "znajomi" / szybkie presety grup (częściowo już mamy — osoby persystują między paragonami).
- [ ] Testy jednostkowe logiki store i algorytmu rozliczeń (Jest).
- [ ] Prawdziwy build (EAS Build) + TestFlight — wyjście z Expo Go.
- [ ] Ikona aplikacji, splash screen, ewentualnie tryb light mode.
- [ ] Dostępność (VoiceOver, Dynamic Type).

---

## 🎨 Filozofia designu

Ciemny, "fintech premium" motyw inspirowany Apple Pay / Revolut: dużo przestrzeni, gradienty, blur, haptic feedback przy interakcjach i płynne mikro-animacje (Reanimated) — appka ma być przyjemna w dotyku, a nie tylko funkcjonalna. Wszystkie kolory, odstępy i typografia są scentralizowane w `constants/theme.ts`.
