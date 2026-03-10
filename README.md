# Mattekort / Räkneresan

A math flashcard game for children (**Räkneresan** — "The Math Journey"), primarily designed for iPad. Players practice multiplication tables and arithmetic using a card flip mechanic — correct answers go to the "clear" pile, wrong answers or peeks go to the "retry" pile. Progress is saved per user via Firebase.

## Categories

23 categories across three operations:

- **Multiply** — Tables 1–10, each with a unique color and emoji
- **Add** — Tiokompisar (Ten Friends), Dubbelkompisar (Double Friends), Plus till 20, Lätt hundra
- **Subtract** — Minuskompisar till 10, Minus inom 20, Lätt hundra minus

## Tech Stack

- **Vite** – build tool
- **Preact** – UI framework
- **TypeScript** – type safety
- **Tailwind CSS v4** – utility-class styling with safe-area and `dvh` support for iPad/Safari
- **Firebase Auth + Firestore** – authentication and cloud persistence with offline support
- **Vite PWA plugin** – installable as a home screen app
- **@use-gesture/react** – 3D card flip and touch interactions

## Getting Started

```bash
npm install
```

Create a `.env.local` with your Firebase project config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Then start the dev server:

```bash
npm run dev
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  components/       NumericKeypad, HintModal, HistoryModal, Modal, ThemeToggle
  pages/            LoginPage, HomePage, GamePage, CompletePage, StatsPage
  hooks/            useGame, useAuth, useTheme
  lib/
    firebase.ts         Firebase init
    storage.ts          StorageAdapter interface + shared types
    storage.firebase.ts Firebase Firestore adapter (active)
    storageContext.ts   Active adapter export (swap here to change backend)
    game-logic.ts       buildDeck, isCorrectAnswer, computeEndRound
    constants.ts        Shared constants, fakeEmail(), table definitions
    preferences.ts      Keypad hand preference (persisted)
  app.tsx
  main.tsx
  index.css
```

## Architecture

Game logic is built against a `StorageAdapter` abstraction. The active implementation uses Firebase Firestore — swapping backends only requires changing the export in `storageContext.ts`.

### Auth

Username + 4-digit PIN. Credentials are stored in Firebase Auth as `username@matte.kort`. PINs are doubled internally (`pinToPassword`) to meet Firebase's 6-character minimum.

### Screen Flow

Login → Home → Game → Complete → (back to Home or replay)
Home also provides access to Stats.

### Card Flip

Physical 3D flip animation via `@use-gesture/react`. Peeking at the answer immediately moves the card to the retry pile (core game rule).

### Auto-Flip

After 2 wrong answers on the same card, the card flips automatically and shows the answer for 12 seconds, then moves on.

### Theming

Supports light and dark modes with a toggle. System preference is detected on first load and stored in `localStorage`.
