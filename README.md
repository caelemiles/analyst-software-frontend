# ⚽ Pro Analyst — Football Scouting Dashboard

A professional football analyst dashboard for EFL League Two, built with React, TypeScript, and Tailwind CSS. Designed to look and feel like club-level scouting software.

## Features

- **Player Dashboard** — Browse 48+ players with pagination, search by name, and filter by team, position, age, goals, and xG
- **Player Profiles** — Detailed 8-tab view with stats, radar charts, performance trends, heatmaps, video highlights, and AI insights
- **Team Pages** — Full squad lists, team stats, and league position for all 24 League Two clubs
- **League Table** — Complete standings with form, goals scored/conceded, and promotion/relegation zones
- **Scouting Portfolio** — Select players, compare stats side-by-side, and export reports as CSV or PDF
- **Stats Table** — Sortable, searchable table of all player statistics
- **Dark Theme UI** — Professional scouting aesthetic with glassmorphism cards, gradients, and clean spacing
- **API Caching** — 5-minute in-memory cache to avoid redundant API calls
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Framework:** React 19 + TypeScript 5.9
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **PDF Export:** jsPDF + jspdf-autotable
- **Testing:** Vitest + React Testing Library
- **Routing:** React Router v7

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the project root (optional):

```env
# API base URL — defaults to http://localhost:8000 if not set
VITE_API_BASE_URL=http://localhost:8000
```

If no API is available, the app automatically falls back to built-in mock data for all features.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── api/
│   ├── client.ts          # API client with caching
│   └── mockData.ts        # Mock data (48 players, 24 teams)
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── PlayerCard.tsx      # Player card component
│   ├── FilterBar.tsx       # Search & filter controls
│   ├── PlayerSearch.tsx    # Autocomplete player search
│   ├── StatsTable.tsx      # Match-by-match stats table
│   ├── Per90MetricsTable.tsx
│   ├── OffensiveRadar.tsx  # Attacking metrics radar
│   ├── DefensiveRadar.tsx  # Defensive metrics radar
│   ├── PerformanceTrends.tsx
│   ├── ShotHeatmap.tsx     # Position activity heatmap
│   ├── HighlightsSection.tsx
│   ├── AIInsightsCard.tsx
│   └── ...
├── pages/
│   ├── Dashboard.tsx       # Main player listing with pagination
│   ├── PlayerProfile.tsx   # Player detail view (8 tabs)
│   ├── PlayerStatsTable.tsx
│   ├── Teams.tsx           # Team listings & squads
│   ├── Leagues.tsx         # League standings
│   └── Portfolio.tsx       # Scouting portfolio & export
├── types/
│   └── index.ts            # TypeScript interfaces
├── utils/
│   └── per90.ts            # Per-90 calculation utilities
└── App.tsx                 # Root routing
```

## Customization

### Styling

The app uses a dark theme by default. Theme utilities are defined in `src/index.css`:

- `.glass` — Glassmorphism card effect
- `.glass-light` — Lighter glass variant
- `.gradient-accent` — Indigo-to-purple gradient
- `.card-hover` — Hover lift animation

### API

Set `VITE_API_BASE_URL` to connect to a live backend. The API client expects these endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/players` | GET | List all players |
| `/api/players?league=...&page=...&limit=...` | GET | Paginated players |
| `/player/:id` | GET | Single player |
| `/api/teams` | GET | All teams |
| `/api/league-table` | GET | League standings |
| `/api/season` | GET | Current season info |
| `/api/players/:id/highlights` | GET | Player match highlights |
| `/player/:id/update-notes` | POST | Update player notes |
| `/portfolio/export` | POST | Export portfolio PDF |

### Backend Data Formats

The frontend expects JSON responses in the following formats. All endpoints should return `Content-Type: application/json`.

**`GET /api/season`** — Current Season Info

```json
{
  "currentSeason": "2025/26",
  "league": "EFL League Two"
}
```

**`GET /api/players?league=EFL-League-Two&page=1&limit=20`** — Paginated Players

```json
{
  "players": [
    {
      "id": 1,
      "name": "James Collins",
      "team": "Crawley Town",
      "position": "Forward",
      "age": 24,
      "nationality": "England",
      "image_url": "https://...",
      "stats": {
        "appearances": 32, "goals": 14, "assists": 6,
        "xG": 12.3, "xA": 5.1,
        "passes_completed": 420, "pass_accuracy": 78.5,
        "tackles": 18, "interceptions": 12, "clearances": 8,
        "minutes_played": 2680, "rating": 7.3, "npxG": 10.5,
        "dribbles": 38, "key_passes": 32, "aerial_duels_won": 42,
        "yellow_cards": 4, "red_cards": 0,
        "fouls_drawn": 35, "fouls_committed": 22
      },
      "highlights": [
        { "id": "h1", "title": "Goal vs Swindon", "url": "https://...", "date": "2025-11-15", "event_type": "goal", "minute": 23 }
      ],
      "ai_summary": "Clinical finisher...",
      "match_logs": [
        { "match_date": "2025-09-14", "opponent": "Swindon Town", "goals": 2, "assists": 0, "xG": 1.1, "xA": 0.2, "minutes": 90, "rating": 8.2, "dribbles": 2, "key_passes": 1, "tackles": 1, "interceptions": 0 }
      ]
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 20,
  "totalPages": 10
}
```

**`GET /api/players/:id/highlights`** — Player Highlights

```json
{
  "highlights": [
    { "id": "h1", "title": "Goal vs Swindon", "url": "https://youtube.com/embed/...", "date": "2025-11-15", "event_type": "goal", "minute": 23 }
  ]
}
```

`event_type` can be: `"goal"`, `"assist"`, `"save"`, `"tackle"`, or `"other"`.

**`GET /api/teams`** — All Teams

Each team object should include `id`, `name`, `logo` (optional URL), `league`, `position`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `goalDifference`, `points`, `avgXG` (optional), `avgPossession` (optional), and `squad` (array of `{ id, name, position, age, nationality, appearances, goals, assists }`).

**`GET /api/league-table`** — League Standings

Each entry: `{ position, team, played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points, form }` where `form` is an array of `"W"`, `"D"`, or `"L"` strings (last 5 results).

### Authentication

No authentication tokens are currently required. If the backend requires auth in the future, add the token via the `VITE_API_TOKEN` environment variable and include it as a `Bearer` token in `src/api/client.ts`.

### Deployment

The build output is in `dist/`. Deploy to any static hosting:

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, GitHub Pages, or any static host
```

