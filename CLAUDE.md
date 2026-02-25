# Roam

Travel planning web app for Gen Z. Pixel-art retro-game aesthetic. Helps users during the ideation/brainstorming phase of travel with three core flows: Inspo Board, AI Itinerary Generation, and Editable Itinerary.

## Tech Stack

| Layer         | Tool                                      | Version                     |
| ------------- | ----------------------------------------- | --------------------------- |
| Framework     | Next.js (App Router)                      | 16.1.6                      |
| Language      | TypeScript                                | 5.x                         |
| Styling       | Tailwind CSS                              | v4                          |
| UI Primitives | shadcn/ui (Radix-based, `new-york` style) | latest                      |
| AI            | OpenAI GPT-4                              | via `openai` 6.x            |
| Backend/DB    | Supabase (PostgreSQL)                     | `@supabase/supabase-js` 2.x |
| Drag-and-Drop | `@dnd-kit/core` + `@dnd-kit/sortable`     | 6.x / 10.x                  |
| URL Parsing   | `open-graph-scraper`                      | 6.x                         |
| Image Export  | `html-to-image`                           | 1.x                         |
| Icons         | `lucide-react`                            | latest                      |
| Deployment    | Vercel                                    | —                           |

## Project Structure

```
roam/
├── docs/                          # Research docs (market research, needfinding, screener, study plan)
├── inspo/                         # Moodboard, styletile reference images
├── public/                        # Static assets, favicon
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, TooltipProvider)
│   │   ├── page.tsx               # Redirects to /dashboard
│   │   ├── globals.css            # Tailwind v4 + pixel-art overrides for shadcn
│   │   ├── not-found.tsx          # 404 page
│   │   ├── (app)/                 # App route group (AppShell + TripsProvider)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── trip/[tripId]/
│   │   │       ├── layout.tsx     # TripNav (4-tab navigation)
│   │   │       ├── page.tsx       # Redirects to /inspo
│   │   │       ├── inspo/         # Inspo Board
│   │   │       ├── generate/      # AI Generation
│   │   │       ├── itinerary/     # Editable Itinerary
│   │   │       └── review/        # Trip Review + Ratings
│   │   ├── shared/[token]/page.tsx  # Public shared itinerary view
│   │   └── api/
│   │       ├── trips/             # CRUD for trips + share token
│   │       ├── inspo/             # CRUD + reorder + URL parse
│   │       ├── generate/          # GPT-4 streaming SSE endpoint
│   │       ├── itinerary/         # CRUD for days + blocks + reorder
│   │       ├── shared/[token]/    # Public share data endpoint
│   │       └── setup/             # DB setup helper
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (auto-generated, restyled via globals.css)
│   │   ├── pixel/                 # PixelWindow, PixelProgress, PixelSpinner, SmiskiBuilder
│   │   ├── layout/                # AppShell, Header, Sidebar, TripNav
│   │   ├── dashboard/             # TripList, TripCard, CreateTripModal, EditTripModal
│   │   ├── inspo/                 # InspoBoard, InspoCard, InspoAddModal, InspoDropZone, InspoFilters, InspoPreview
│   │   ├── generate/              # GeneratePanel, ModeToggle, InspoSummary, GenerateLoading, GeneratePreview
│   │   └── itinerary/             # ItineraryEditor, DaySection, BlockEditor, BlockToolbar, ItineraryReadOnly, ShareMenu, TripReviewPage
│   ├── context/
│   │   └── TripsContext.tsx        # Global trips state provider
│   ├── hooks/                     # useTrips, useInspoItems, useItinerary, useGenerate, useUrlPreview
│   ├── lib/
│   │   ├── supabase/client.ts     # Browser Supabase client
│   │   ├── supabase/server.ts     # Server Supabase client (uses cookies)
│   │   ├── openai.ts              # OpenAI client instance
│   │   ├── prompts.ts             # System prompt + strict/creative prompt builders
│   │   ├── url-parser.ts          # OG scraper with TikTok/YouTube special handling
│   │   └── utils.ts               # cn() class merge utility
│   └── types/                     # database.ts, inspo.ts, trip.ts, itinerary.ts
├── supabase/migrations/           # 4 SQL migrations (schema, itinerary, share_token, reviews)
├── PLAN.md                        # Original technical implementation plan
├── components.json                # shadcn/ui config
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

4 tables + 1 logging table, all in Supabase PostgreSQL:

- **trips** — id, user_id (nullable, no auth for MVP), title, destination, description, cover_image_url, dates, status (`planning|generated|finalized|archived|completed`), share_token, overall_rating, review_note
- **inspo_items** — id, trip_id (FK), type (`link|image|video|article|note`), url, title, description, image_url, site_name, favicon_url, user_note, tags[], position_index
- **itinerary_days** — id, trip_id (FK), day_number (unique per trip), date, title, summary
- **itinerary_blocks** — id, day_id (FK), type (`activity|transport|accommodation|food|note|heading`), title, description, times, duration, location (lat/lng), cost, url, image_url, position_index, ai_generated, source_inspo_id, rating, review_note
- **generation_logs** — id, trip_id (FK), mode, prompt_snapshot, inspo_snapshot (JSONB), raw_response

Migrations are in `supabase/migrations/` (001–004).

## Design System

### Colors

| Token | Hex       | Usage                                   |
| ----- | --------- | --------------------------------------- |
| mist  | `#A8D8EA` | Backgrounds, light accents, selection   |
| grass | `#C5D86D` | Success, creative mode, nature accents  |
| jam   | `#F4845F` | Primary CTA, alerts, strict mode        |
| milk  | `#F7F7F7` | Page/card backgrounds                   |
| moss  | `#6B8F71` | Secondary buttons, tags                 |
| night | `#3D5A80` | Primary text, headers, borders, shadows |
| rock  | `#8D8D8D` | Muted text, disabled states             |
| sky   | `#98C1D9` | Hover states, links, secondary bg       |

### Fonts

- **Press Start 2P** (`--font-pixel`) — h1, h2, h3
- **Silkscreen** (`--font-silk`) — h4-h6, buttons, badges, labels
- **Roboto Mono** (`--font-body`) — Body text, inputs
- **Space Mono** (`--font-body-alt`) — Alternate body

### Pixel Style Rules

- `border-radius: 0` on everything (enforced globally via `!important`)
- `border: 3px solid night` on interactive components
- `box-shadow: 4px 4px 0px night` (pixel drop shadow)
- Hover: `translate(2px, 2px)` + reduced shadow (press effect)
- Active: `translate(4px, 4px)` + no shadow
- `image-rendering: pixelated` on decorative art
- No gradients

### shadcn Overrides

All shadcn components are restyled in `globals.css` using `[data-slot="..."]` selectors — not by editing the component files in `src/components/ui/`. This is the correct approach for Tailwind v4 + shadcn.

Installed shadcn components: button, card, dialog, input, textarea, toggle, badge, dropdown-menu, tooltip, sheet, tabs, skeleton, separator, star-rating.

## Key Architecture Patterns

### State Management

- **TripsContext** — Global trips list, wraps entire `(app)` layout
- **Custom hooks** — `useInspoItems(tripId)`, `useItinerary(tripId)`, `useGenerate({ tripId })`, `useUrlPreview(url)` manage local state per page
- **Optimistic updates** — UI updates immediately, reverts on API error
- **Debounced saves** — Itinerary block edits debounce 500ms before persisting

### Data Flow (Core User Journey)

1. Dashboard → Create Trip → redirects to Inspo Board
2. Inspo Board → Add URLs/notes/images → collect inspiration
3. Generate tab → Select inspo items, choose strict/creative mode → GPT-4 streams itinerary
4. Preview → Accept → saves to DB, redirects to Itinerary Editor
5. Itinerary Editor → Inline edit blocks, drag-and-drop reorder, share
6. Review tab → Rate trip + individual blocks, mark as completed

### AI Generation

- Endpoint: `POST /api/generate` returns SSE stream
- Two modes: **strict** (temp 0.3, uses exact inspo locations) and **creative** (temp 0.9, uses inspo as vibes)
- Prompt supports trip context: dates, stay address
- Output: structured JSON parsed into ItineraryDay[]/ItineraryBlock[]
- Max 4000 tokens per generation

### Authentication

- **No auth for MVP** — `user_id` is nullable across all tables
- Share tokens (UUID) enable public read-only itinerary views

### Next.js Specifics

- **App Router** with route groups: `(app)` for authenticated layout
- Route params in Next.js 16 are `Promise<{}>` — must `await` them
- Server components used for shared page; everything else is `"use client"`
- API routes use `NextResponse.json()` and Supabase server client

## Changelog

### 2026-02-25

- Shareable itineraries via share token (migration 003)
- Trip review + completion flow with star ratings (migration 004)
- ShareMenu component (copy as text, download as PNG)
- ItineraryReadOnly component for shared/public views
- TripReviewPage with per-block ratings and notes
- Public shared view at `/shared/[token]`

### 2026-02-17

- Angela's design changes: updated photos, colors, SmiskiBuilder sprite animation

### 2026-02-10

- Inspo preview now an editable dialog with video embed support (YouTube, TikTok, Instagram, Vimeo)
- Edit/patch trip functionality (EditTripModal)
- QoL improvements across the app

### 2026-02-09 (MVP Build)

- Project scaffolding (Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase)
- Pixel-art design system (colors, fonts, shadows, scrollbars, shadcn overrides)
- Layout + navigation (AppShell, Header, Sidebar, TripNav)
- Inspo Board with CRUD, drag-and-drop reordering, URL paste + OG metadata parsing
- OpenAI GPT-4 integration with streaming SSE, strict/creative modes
- AI generation UI with loading animation, streamed preview, accept flow
- Itinerary data model (days + blocks) with full CRUD + reorder API
- Itinerary editor UI with inline editing, drag-and-drop, block types
- Dashboard with trip grid, create/edit modals, status badges
- End-to-end flow polish, loading/error states
- Supabase SQL migrations (001–002)
- Favicon, README, demo assets

## Rules for Agents

1. **Tailwind v4** — Use `@theme inline` blocks in `globals.css` for theme tokens. There is no `tailwind.config.ts` for colors/fonts; it's all CSS-native.
2. **shadcn/ui styling** — Override via `[data-slot="..."]` selectors in `globals.css`. Do not modify files in `src/components/ui/` for styling changes.
3. **Pixel-art consistency** — All new components must use `border-radius: 0`, `border: 3px solid night`, and `pixel-shadow` classes. Use Silkscreen font for buttons/labels, Press Start 2P for headers.
4. **Next.js 16 params** — Route params are `Promise<{}>`. Always `await` params before accessing properties (e.g., `const { tripId } = await params`).
5. **Supabase SSR** — Use `createClient()` from `@/lib/supabase/server` in API routes and server components. Use `@/lib/supabase/client` in browser code.
6. **No auth for MVP** — `user_id` is nullable. Do not add auth gates or middleware.
7. **Optimistic UI** — Update state immediately, revert on error. Follow patterns in existing hooks.
8. **Color tokens** — Use `mist`, `grass`, `jam`, `milk`, `moss`, `night`, `rock`, `sky` via Tailwind classes (e.g., `bg-mist`, `text-night`, `border-jam`).
9. **Component organization** — Group by feature domain (`inspo/`, `generate/`, `itinerary/`, `dashboard/`, `layout/`, `pixel/`). Page files are thin wrappers that delegate to components.
10. **API routes** — Use Supabase server client. Return `NextResponse.json()`. Handle errors with appropriate status codes.
11. **New migrations** — Add as `supabase/migrations/005_*.sql`, `006_*.sql`, etc. Keep sequential numbering.
12. **No over-engineering** — This is an MVP. Keep solutions simple. Don't add auth, caching, or optimization layers unless explicitly requested.
13. **Existing patterns** — Before creating new patterns, check how similar problems are already solved in the codebase. Follow the established conventions.
