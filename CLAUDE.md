# CLAUDE.md

Guidelines for Claude Code when working in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check + build
npm run typecheck  # TypeScript check only
npm run lint       # ESLint
```

## Architecture

- **UI**: Preact with functional components and hooks
- **Styling**: Tailwind CSS v4 — use utility classes, no custom CSS unless necessary
- **State**: Local component state + custom hooks (`useGame`, `useAuth`)
- **Storage**: Always use the `storage` export from `src/lib/storageContext.ts` — never access `localStorage` directly in components or hooks

## Key Constraints

- **iPad-first**: Touch targets must be at least 44×44px; use `dvh` not `vh`; respect `safe-area-inset-*`
- **No Firebase yet**: Firebase is installed but not active. Do not wire up auth or Firestore until explicitly asked
- **Storage adapter pattern**: All data access goes through `StorageAdapter` — this makes the Firebase migration seamless
- **Peek = retry**: Any card peek must move the card to the retry pile — this is a core game rule

## File Conventions

- Pages live in `src/pages/`
- Reusable components live in `src/components/`
- Custom hooks live in `src/hooks/`
- Shared types in `src/lib/storage.ts`
- Shared constants in `src/lib/constants.ts`
