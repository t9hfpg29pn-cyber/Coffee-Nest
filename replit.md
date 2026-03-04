# Kaffee Journal

A mobile app for rating and tracking coffee varieties from different roasteries.

## Architecture

- **Frontend**: Expo Router (React Native) with file-based routing
- **Backend**: Express.js server on port 5000
- **Storage**: AsyncStorage for local data persistence
- **Navigation**: Stack navigation (no tabs — hierarchical flow)

## Features

- Roastery management (add, view, delete)
- Coffee management per roastery (add, view, delete)
- Per-coffee ratings: Hase Rating & Dodo Rating (0-10 scale)
- Grind level scale (1-5: fein – grob)
- Aroma scale (1-5: kräftig – fruchtig)
- Aroma description and general notes fields
- Price per kg in €
- Full edit capability on all fields

## Screens

- `app/index.tsx` — Röstereien overview
- `app/roastery/[id].tsx` — Coffees for a specific roastery
- `app/coffee/[id].tsx` — Coffee detail/edit screen

## Data Layer

- `lib/storage.ts` — AsyncStorage utilities for Roastery and Coffee CRUD operations

## Color Palette

Warm espresso-inspired: deep brown, caramel gold, cream white

## Workflows

- **Start Backend**: `npm run server:dev` — Express on port 5000
- **Start Frontend**: `npm run expo:dev` — Metro on port 8081
