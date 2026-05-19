# Coffee Nest

An offline-first PWA for rating and tracking coffee varieties from different roasteries. Built with Expo Router (React Native Web). No backend.

## Architecture

- **Frontend only**: Expo Router (React Native Web) — file-based routing
- **Storage**: AsyncStorage. On web this is backed by `localStorage`; on native by the platform store. All app data lives on-device.
- **Networking**: None. The app makes no HTTP calls. Backup and restore work via a local JSON file the user picks/downloads.
- **Navigation**: Stack navigation (no tabs — hierarchical flow)

## Features

- Roastery management (add, view, delete)
- Coffee management per roastery (add, view, delete)
- Per-coffee ratings: Hase Rating & Dodo Rating (0-10 scale)
- Grind level scale (1-5: fein – grob), per-grinder settings
- Aroma scale (1-5: kräftig – fruchtig)
- Aroma description and general notes fields
- Price per kg in €
- Full edit capability on all fields
- JSON import/export backup in Settings
- Installable PWA, works offline after first visit

## Screens

- `app/index.tsx` — Röstereien overview
- `app/roastery/[id].tsx` — Coffees for a specific roastery
- `app/coffee/[id].tsx` — Coffee detail/edit screen
- `app/settings.tsx` — User names, grinders, design mode, backup/restore

## Data Layer

- `lib/storage.ts` — AsyncStorage utilities for Roastery, Coffee, Grinder CRUD operations.

## Theme System

Two selectable designs (stored in AsyncStorage via `context/ThemeContext.tsx`):
- **Klassisch**: Warm espresso-inspired — deep brown, caramel gold, cream white (light/dark follows system)
- **Low-Poly**: Modern dark — near-black (#0D0D0D), electric gold (#FFB300), always dark

Use `useThemeColors()` from `@/context/ThemeContext` in all screens.

## Workflows

- **Start Frontend**: `npm run expo:dev` — Metro on port 8081 (dev only).

There is no backend workflow.

## Web / PWA Build

```
npm run build:web        # produces web-dist/
```

See `WEB_DEPLOY.md` for Cloudflare Pages / Netlify deployment details.
