# SplitIt! 🧾✨

**SplitIt!** is a mobile app (iOS, built with Expo/React Native) that solves the classic problem of splitting restaurant bills with friends: *“who owes how much?”*

The idea: after a meal together, you take a photo of the receipt, the app reads the line items, and you assign who ordered what in a few taps. A sticky footer shows each person’s running total in real time.

> **Project status:** active prototype/MVP. The full flow (photo → verify items → people → split → summary) is implemented and runs in Expo Go. **Cloud OCR uses Gemini** (see [Receipt scanning & OCR](#-receipt-scanning--ocr)); optional on-device OCR needs a development build.

### App flow

```
/ (home)  →  /scan          →  /verify           →  /people         →  /split           →  /summary
            photo + OCR        edit line items      who's at the table  assign items        who pays what
                                                                                              → history
```

Every step can be skipped or entered directly: from the home screen you can enter a receipt manually or load a sample receipt, and an in-progress bill always appears on home in the **Receipt in progress** card.

---

## 📱 What's working

- **Home screen** — scan receipt, manual entry, sample receipt, resume in-progress bill, history.
- **Receipt photo** — camera or gallery (`expo-image-picker`) with preview; works in Expo Go.
- **Receipt verification** — full manual editing (name, price), add/remove items, venue name, live total.
- **Virtual receipt** — line items (name + price) in a clean, receipt-like list.
- **Assign people to items** — tap a line to open a bottom sheet with person chips; multi-select splits the price evenly.
- **Mini avatars under each item** — see who shares each cost (stacked colored circles).
- **Sticky footer with live totals** — per-person sums plus warnings for unassigned items.
- **Summary screen** (`/summary`, bottom sheet modal) — full breakdown of who pays for what, with split hints (e.g. `÷2`).
- **People management** — add people (auto-assigned colors) and remove them (clears assignments).
- **Receipt history** — finishing a bill archives it (people snapshot + totals); list and detail screens.
- **Persistence** — state (people, current receipt, history) is stored locally (`AsyncStorage`).
- **Fintech-style UI** — dark mode, gradients, blur (`expo-blur`), haptics, Reanimated animations — inspired by Apple Pay / Revolut.

## 🚧 Not yet (known MVP limits)

- **On-device OCR does not run in Expo Go** — cloud OCR via Gemini works with an API key; ML Kit / Vision needs a dev build (see below).
- No tip / service charge split.
- No “who owes whom” screen yet (settlement **algorithm** exists in `utils/settlement.ts` but is not wired to UI).
- No payment integration (BLIK / bank transfer).
- iOS / Expo Go only — no EAS production build, automated tests, or App Store release yet.

---

## 📷 Receipt scanning & OCR

Scanning uses **Gemini 3.6 Flash** (`utils/geminiReceipt.ts`) — a multimodal model that takes the photo and returns structured JSON (venue name + line items with prices). It’s a plain `fetch` to the REST API, so **it works in Expo Go without a dev build**.

### How to configure the API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey), sign in with Google, and click **Create API key** (free tier; no credit card required for basic use).
2. In the `splitit/` folder, copy `.env.example` to `.env` (or edit the existing `.env`).
3. Paste your key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
4. Restart Metro with a clean cache — env vars are baked into the bundle at startup:
   ```bash
   npx expo start -c
   ```

The `EXPO_PUBLIC_` prefix is required — only those variables are inlined into the JS bundle. `.env` is in `.gitignore`, so the key should not be committed.

> ⚠️ **Prototype limitation:** the API key ends up in the app bundle, so it could be extracted from a distributed build. Fine for personal use and demos — for a public release, move Gemini calls behind a small backend proxy so the key never ships on the device.
>
> **Free tier:** Gemini in AI Studio has a generous free quota for hobby use; splitting bills with friends should cost nothing in practice.

### Fallback: on-device OCR (development build)

`utils/ocr.ts` also supports on-device OCR (Google ML Kit / Apple Vision) so photos never leave the device — but that’s a native module, so it requires a **development build** (not Expo Go) and a paid Apple Developer account ($99/year) to install on a physical iPhone:

```bash
npx expo install expo-mlkit-ocr expo-build-properties expo-dev-client
eas build --profile development --platform ios
```

The scan screen (`app/scan.tsx`) picks the engine automatically: **Gemini if the key is set → on-device if available → otherwise manual entry.** Switching engines does not require changing other screens.

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57 (managed workflow) + TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) + `persist` middleware |
| Persistence | `@react-native-async-storage/async-storage` |
| Bottom sheets | [`@gorhom/bottom-sheet`](https://gorhom.github.io/react-native-bottom-sheet/) |
| Animation / gestures | `react-native-reanimated` v4 (+ `react-native-worklets`), `react-native-gesture-handler` |
| Visual effects | `expo-blur`, `expo-linear-gradient`, `expo-haptics` |
| Device testing | **Expo Go** (no Mac required — develop on Windows) |

---

## 📂 Project structure

```
splitit/
├── app/                        # Screens (Expo Router)
│   ├── _layout.tsx             # Root layout: GestureHandlerRootView, Stack, dark theme
│   ├── index.tsx               # Home — scan / manual / demo / history
│   ├── scan.tsx                # Receipt photo + OCR
│   ├── verify.tsx              # Verify and edit recognized items
│   ├── people.tsx              # Who's at the table?
│   ├── split.tsx               # Virtual receipt — assign people to items
│   ├── summary.tsx             # Summary modal
│   └── history/
│       ├── index.tsx           # Archived receipts list
│       └── [id].tsx            # Single archived receipt detail
│
├── components/
│   ├── ReceiptHeader.tsx       # Receipt header (name, date, total)
│   ├── ReceiptItemRow.tsx      # Line item + mini avatars
│   ├── PersonAvatar.tsx        # Person avatar (initials on gradient)
│   ├── AssignPeopleSheet.tsx   # Bottom sheet: assign people to item
│   ├── ManagePeopleSheet.tsx   # Bottom sheet: add/remove people
│   └── SummaryFooter.tsx       # Sticky footer + "Summary" button
│
├── store/
│   └── useReceiptStore.ts      # Zustand store — state and persistence
│
├── data/
│   └── mockReceipt.ts          # Sample receipt (8 items) + sample people
│
├── types/
│   └── index.ts                # Person, ReceiptItem, Receipt, ArchivedReceipt
│
├── utils/
│   ├── currency.ts             # PLN formatting, initials
│   ├── ocr.ts                  # OCR layer — native engine detection
│   ├── receiptParser.ts        # OCR text → line items (PL receipt heuristics)
│   ├── split.ts                # Fair split to the penny
│   ├── shareMessage.ts         # Share text for summary
│   └── settlement.ts           # Minimize transfers (not wired to UI yet)
│
└── constants/
    └── theme.ts                # Colors, spacing, typography, person palette
```

### Data model (`types/index.ts`)

```ts
type Person = { id: string; name: string; color: string };

type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedPersonIds: string[]; // who pays for this item (even split among them)
};

type ArchivedReceipt = {
  id: string;
  placeName: string;
  date: string;
  savedAt: string;
  items: ReceiptItem[];
  peopleSnapshot: Person[]; // people at archive time
  total: number;
};
```

**Core calculation** (in `useReceiptStore` and on `split` / `summary`): for each item, `price` is split evenly across `assignedPersonIds`. Items with an empty `assignedPersonIds` are **unassigned** and highlighted so the bill isn’t marked complete by mistake.

---

## ▶️ How to run (Windows + Expo Go, no Mac)

### Requirements

- [Node.js](https://nodejs.org/) (tested on v24; v18+ should work)
- iPhone with **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)** from the App Store
- Phone and computer on the **same Wi‑Fi network**

### Install and start

```powershell
cd splitit
npm install
npx expo start
```

Scan the **QR code** in the terminal:
- from **Expo Go** (“Scan QR code”), or
- with the iPhone Camera app (opens in Expo Go).

The app loads on your phone; code changes hot-reload.

### Useful commands

| Command | Purpose |
|---|---|
| `npx expo start` | Dev server + QR code |
| `npx expo start --tunnel` | Tunnel mode when LAN QR doesn’t work (slower, more reliable) |
| `npx tsc --noEmit` | TypeScript check without building |
| `npx expo-doctor` | Expo project diagnostics |

### Troubleshooting

- **Port in use** — `npx expo start --port 8082` (or any free port).
- **QR won’t connect** — try `--tunnel` or check firewall / local network.
- **Weird state after changes** — shake the phone in Expo Go → **Reload**, or press `r` in the Expo terminal.

---

## 🗺️ Roadmap

### Phase 1 — MVP polish
- [x] Manual receipt editing — add/remove/edit items without OCR.
- [x] Fair rounding for uneven splits (e.g. 38.00 PLN ÷ 3).
- [ ] Tip / service charge — split proportionally by consumption.

### Phase 2 — Final settlement (“magic moment”)
- [x] Share summary — native Share Sheet for group chats.
- [ ] “Who owes whom” UI using `utils/settlement.ts` (minimal transfers).
- [ ] Deep link to BLIK / transfer with prefilled amount.

### Phase 3 — Receipt scanning
- [x] Receipt photo (camera/gallery) + verification screen.
- [x] Pluggable OCR layer + receipt parser (Polish receipt heuristics).
- [ ] Dev build with `expo-mlkit-ocr` — on-device text recognition.
- [ ] Tune parser on real receipts (quantities, weights, discounts).

### Phase 4 — Polish & production
- [ ] Saved friends / group presets (people already persist across receipts).
- [ ] Unit tests for store logic and settlement (Jest).
- [ ] EAS Build + TestFlight — beyond Expo Go.
- [ ] App icon, splash, optional light mode.
- [ ] Accessibility (VoiceOver, Dynamic Type).

---

## 🎨 Design philosophy

Dark “fintech premium” look inspired by Apple Pay / Revolut: generous spacing, gradients, blur, haptics, and smooth micro-animations (Reanimated). Colors, spacing, and typography live in `constants/theme.ts`.
