# Mattekort

A math flashcard game for children, primarily designed for iPad. Players practice multiplication tables 1–10 using a card flip mechanic — correct answers go to the "clear" pile, wrong answers or peeks go to the "retry" pile. Progress is saved per user.

## Tech Stack

- **Vite** – build tool
- **Preact** – UI framework
- **TypeScript** – type safety
- **Tailwind CSS** – styling with safe-area and dvh support for iPad/Safari
- **Firebase Auth + Firestore** – installed and configured, not yet active
- **Vite PWA plugin** – offline support and "add to home screen"
- **@use-gesture/react** – card flip and touch interactions

## Getting Started

```bash
npm install
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

## Project Structure

```
src/
  components/       UI components (Card, NumPad, PileBar, etc.)
  pages/            Login, Home, Game, Complete
  hooks/            useGame, useAuth
  lib/
    firebase.ts     Firebase init (inactive)
    storage.ts      Interface/types
    storage.local.ts  localStorage adapter
    storageContext.ts Active adapter export
    constants.ts    Shared constants
  app.tsx
  main.tsx
  index.css
```

## Architecture

Game logic is built against a storage abstraction layer (`StorageAdapter`). Currently using `localStorage` — switching to Firebase later requires only swapping the adapter in `storageContext.ts`, with zero changes to game code.

### Auth

Username + 4-digit PIN. When Firebase Auth is wired up, credentials are stored as `username@mattekort.fake`.

### Card Flip

Physical 3D flip animation via `@use-gesture/react`. Peeking at the answer automatically moves the card to the retry pile.
