# Roam - Technical Implementation Plan

## Context

Roam is a travel planning web app targeting Gen Z users. It helps during the ideation/brainstorming phase of travel planning with 3 core tasks:

1. Inspo Board - Collect travel inspiration (TikTok, IG Reels, pictures, articles, links) in a Pinterest-like board
2. AI Itinerary Generation - Use OpenAI GPT-4 to generate trip plans from inspo (strict vs creative mode)
3. Editable Trip Itinerary - Notion-like block editor for the generated plan

The aesthetic is pixel-art, retro-game, cozy/whimsical ("inspiring, adventurous, playful"). This is a greenfield project - the repo currently only has `docs/` and `inspo/` folders.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| UI Primitives | shadcn/ui (Radix-based) restyled with pixel-art theme |
| AI | OpenAI GPT-4 API |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Deployment | Vercel |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| URL parsing | `open-graph-scraper` |
| Utilities | `clsx`, `tailwind-merge` (bundled with shadcn) |

---

## Design System

### Colors (from styletile)

| Token | Hex | Usage |
|---|---|---|
| mist | `#A8D8EA` | Backgrounds, light accents |
| grass | `#C5D86D` | Success, "creative" mode, nature accents |
| jam | `#F4845F` | Primary CTA, alerts, "strict" mode |
| milk | `#F7F7F7` | Page/card backgrounds |
| moss | `#6B8F71` | Secondary buttons, tags |
| night | `#3D5A80` | Primary text, headers, borders |
| rock | `#8D8D8D` | Muted text, disabled states |
| sky | `#98C1D9` | Hover states, links, secondary bg |

Fonts: Press Start 2P (pixel headers), Silkscreen (subheaders/buttons), Roboto Mono (body), Space Mono (body alt)

### Pixel Style Rules

- `border-radius: 0` on all components (sharp pixel corners)
- `box-shadow: 4px 4px 0px` in night color (pixel drop shadow)
- Hover: `translate(2px, 2px)` + reduced shadow (press effect)
- `image-rendering: pixelated` on decorative art
- 4px borders, no gradients

### shadcn/ui Customization

Install shadcn components (`Button`, `Card`, `Dialog`, `Input`, `Textarea`, `Toggle`, `Badge`, `DropdownMenu`, `Tooltip`, `Sheet`, `Tabs`, `Skeleton`) and override their default styles in `globals.css` and `tailwind.config.ts` to match the pixel-art theme.

The shadcn components give us accessibility (keyboard nav, screen readers, focus management) while we restyle the visuals.

---

## Project Structure

```text
roam/
├── docs/                          # (existing) Research documents
├── inspo/                         # (existing) Moodboard, styletile
├── public/
│   └── images/pixel-sprites/      # Pixel art assets
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── page.tsx               # Redirects to /dashboard
│   │   ├── globals.css            # Tailwind + pixel overrides for shadcn
│   │   ├── (app)/                 # Authenticated app routes
│   │   │   ├── layout.tsx         # AppShell (sidebar + header)
│   │   │   ├── dashboard/page.tsx
│   │   │   └── trip/[tripId]/
│   │   │       ├── layout.tsx     # TripNav tabs
│   │   │       ├── page.tsx       # Smart redirect
│   │   │       ├── inspo/page.tsx
│   │   │       ├── generate/page.tsx
│   │   │       └── itinerary/page.tsx
│   │   └── api/
│   │       ├── trips/route.ts
│   │       ├── inspo/route.ts
│   │       ├── inspo/[id]/route.ts
│   │       ├── inspo/parse/route.ts
│   │       ├── generate/route.ts
│   │       ├── itinerary/route.ts
│   │       ├── itinerary/days/[dayId]/route.ts
│   │       ├── itinerary/blocks/route.ts
│   │       ├── itinerary/blocks/[blockId]/route.ts
│   │       └── itinerary/blocks/reorder/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (auto-generated + restyled)
│   │   ├── pixel/                 # Custom pixel-art wrapper components
│   │   │   ├── PixelWindow.tsx    # Retro game window frame
│   │   │   ├── PixelProgress.tsx  # Segmented retro loading bar
│   │   │   └── PixelSpinner.tsx   # Animated pixel spinner
│   │   ├── layout/                # AppShell, Header, Sidebar, TripNav
│   │   ├── inspo/                 # InspoBoard, InspoCard, InspoDropZone, etc.
│   │   ├── generate/              # GeneratePanel, ModeToggle, Loading, Preview
│   │   ├── itinerary/             # ItineraryEditor, DaySection, Block types
│   │   └── dashboard/             # TripList, TripCard, CreateTripModal
│   ├── hooks/                     # useInspoItems, useTrips, useItinerary, useGenerate, useUrlPreview
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── openai.ts
│   │   ├── prompts.ts
│   │   ├── url-parser.ts
│   │   └── utils.ts               # cn() from shadcn
│   └── types/                     # database.ts, inspo.ts, trip.ts, itinerary.ts
├── supabase/migrations/
├── .env.example
├── tailwind.config.ts
├── components.json                # shadcn/ui config
└── package.json
```

---

## Database Schema

```sql
-- TRIPS
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- nullable for MVP (no auth)
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning','generated','finalized','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSPO ITEMS
CREATE TABLE public.inspo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link','image','video','article','note')),
  url TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT,
  user_note TEXT,
  tags TEXT[],
  position_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITINERARY DAYS
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- ITINERARY BLOCKS
CREATE TABLE public.itinerary_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('activity','transport','accommodation','food','note','heading')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  location TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  cost_estimate DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  url TEXT,
  image_url TEXT,
  position_index INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT FALSE,
  source_inspo_id UUID REFERENCES public.inspo_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GENERATION LOGS
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('strict','creative')),
  prompt_snapshot TEXT,
  inspo_snapshot JSONB,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Task Breakdown (for coding sub-agents)

### Task 0: Project Scaffolding

- Create: Next.js 14+ app with TypeScript, Tailwind CSS, shadcn/ui init, Supabase clients, env template, full folder structure
- Install: `@supabase/supabase-js`, `@supabase/ssr`, `openai`
- shadcn init: Run `npx shadcn@latest init` and install: `button`, `card`, `dialog`, `input`, `textarea`, `toggle`, `badge`, `dropdown-menu`, `tooltip`, `sheet`, `tabs`, `skeleton`, `separator`
- Files: `package.json`, `tailwind.config.ts`, `components.json`, `.env.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/utils.ts`, `src/types/*.ts`
- Acceptance: `npm run dev` runs, shadcn components render, Supabase client initializes
- Deps: None

### Task 1: Design System - Pixel Art Theme

- Override shadcn defaults with pixel-art styling in `tailwind.config.ts` and `globals.css`
- Create: `src/components/pixel/PixelWindow.tsx` (retro game window frame), `PixelProgress.tsx`, `PixelSpinner.tsx`
- Modify: `globals.css` - pixel borders, box-shadows, scrollbar, selection color, font variables; `tailwind.config.ts` - color tokens, font families, custom shadows
- Modify: `src/app/layout.tsx` - load Press Start 2P, Silkscreen, Roboto Mono, Space Mono via `next/font/google`
- Acceptance: All shadcn components render with pixel-art styling (no border-radius, pixel shadows, correct fonts)
- Deps: Task 0

### Task 2: Layout and Navigation

- Create: `src/components/layout/AppShell.tsx`, `Header.tsx`, `Sidebar.tsx`, `TripNav.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx` (placeholder), `src/app/(app)/trip/[tripId]/layout.tsx`
- Uses: shadcn `Sheet` (mobile sidebar), `Tabs` (TripNav), `Button`, `Separator`
- Acceptance: `/dashboard` shows sidebar+header, `/trip/[id]/inspo` shows TripNav with active tab, responsive sidebar
- Deps: Task 0, Task 1

### Task 3: Inspo Board - Data & CRUD

- Create: `supabase/migrations/001_initial_schema.sql` (trips + inspo_items tables)
- Create: `src/types/trip.ts`, `src/types/inspo.ts`
- Create: `src/app/api/trips/route.ts`, `src/app/api/inspo/route.ts`, `src/app/api/inspo/[id]/route.ts`
- Create: `src/hooks/useTrips.ts`, `src/hooks/useInspoItems.ts`
- Acceptance: Full CRUD for trips and inspo items via API routes, hooks handle loading/error
- Deps: Task 0

### Task 4: Inspo Board - UI

- Create: `src/components/inspo/InspoBoard.tsx` (masonry grid), `InspoCard.tsx` (PixelWindow frame), `InspoDropZone.tsx`, `InspoAddModal.tsx`, `InspoFilters.tsx`, `InspoPreview.tsx`
- Create: `src/app/(app)/trip/[tripId]/inspo/page.tsx`
- Uses: shadcn `Card`, `Dialog`, `Badge`, `DropdownMenu`, `Input`, `Textarea`, `Button`, `Skeleton`
- Acceptance: Masonry grid, paste URL to add, filter/sort, pixel-art card frames, empty state
- Deps: Task 1, 2, 3

### Task 5: Inspo Board - Link Parsing

- Install: `open-graph-scraper`
- Create: `src/app/api/inspo/parse/route.ts`, `src/lib/url-parser.ts`, `src/hooks/useUrlPreview.ts`
- Modify: `InspoAddModal.tsx` and `InspoDropZone.tsx` to auto-parse URLs
- Acceptance: Pasting a URL auto-fetches OG metadata, populates title/desc/image, handles errors
- Deps: Task 3, Task 4

### Task 6: AI Generation - OpenAI Integration

- Create: `src/lib/openai.ts`, `src/lib/prompts.ts` (strict + creative prompt templates)
- Create: `src/app/api/generate/route.ts` (streaming SSE endpoint)
- Create: `src/hooks/useGenerate.ts` (streaming client hook)
- Create: `src/types/itinerary.ts`
- Acceptance: Streaming response from GPT-4, strict mode uses exact inspo places, creative mode riffs on themes, output parses into `ItineraryDay[]`/`ItineraryBlock[]`
- Deps: Task 0, Task 3

### Task 7: AI Generation - UI

- Create: `src/components/generate/GeneratePanel.tsx`, `ModeToggle.tsx`, `InspoSummary.tsx`, `GenerateLoading.tsx`, `GeneratePreview.tsx`
- Create: `src/app/(app)/trip/[tripId]/generate/page.tsx`
- Uses: shadcn `Toggle`, `Button`, `Card`, `Skeleton`, `Badge`
- Acceptance: Inspo summary with deselect, strict/creative toggle, pixel loading animation, streamed preview, "Accept and Edit" navigates to itinerary
- Deps: Task 1, Task 4, Task 6

### Task 8: Itinerary Editor - Data Model

- Create: `supabase/migrations/002_itinerary_schema.sql` (days, blocks, generation_logs)
- Create: `src/app/api/itinerary/route.ts`, `days/[dayId]/route.ts`, `blocks/route.ts`, `blocks/[blockId]/route.ts`, `blocks/reorder/route.ts`
- Create: `src/hooks/useItinerary.ts` (with optimistic updates)
- Acceptance: Full CRUD for days+blocks, reorder endpoint, optimistic UI updates
- Deps: Task 0, Task 3

### Task 9: Itinerary Editor - UI

- Install: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Create: `src/components/itinerary/ItineraryEditor.tsx`, `DaySection.tsx`, `BlockEditor.tsx`, `ActivityBlock.tsx`, `NoteBlock.tsx`, `TransportBlock.tsx`, `AccommodationBlock.tsx`, `BlockToolbar.tsx`
- Create: `src/app/(app)/trip/[tripId]/itinerary/page.tsx`
- Uses: shadcn `Card`, `Button`, `DropdownMenu`, `Input`, `Separator`, `Skeleton`
- Acceptance: Inline-editable blocks, drag-and-drop reorder, add/delete blocks, auto-save on debounce, all block types render
- Deps: Task 1, 2, 8

### Task 10: Dashboard

- Create: `src/components/dashboard/TripList.tsx`, `TripCard.tsx`, `CreateTripModal.tsx`
- Update: `src/app/(app)/dashboard/page.tsx`, `src/app/page.tsx` (redirect)
- Uses: shadcn `Card`, `Dialog`, `Input`, `Button`, `Skeleton`, `Badge`
- Acceptance: Trip grid, create trip modal, empty state, click navigates to trip inspo board
- Deps: Task 1, 2, 3

### Task 11: End-to-End Flow Polish

- Modify: `TripNav` (step indicators), `InspoBoard` (generate CTA), `trip/[tripId]/page.tsx` (smart redirect), loading/error states across all pages
- Acceptance: Seamless flow from create trip -> inspo -> generate -> edit, all loading/error states handled
- Deps: Tasks 4, 7, 9, 10

Beyond MVP: B1 (Auth), B2 (Sharing), B3 (Group Collab), B4 (Media Upload), B5 (Maps), B6 (Export), B7 (Booking Integrations)

---

## Task Dependency Graph

```text
Task 0 (Scaffolding)
├── Task 1 (Design System) ──┐
│   ├── Task 2 (Layout) ─────┤
│   │   ├── Task 4 (Inspo UI)┤
│   │   ├── Task 7 (Gen UI) ─┤
│   │   ├── Task 9 (Edit UI) ┤
│   │   └── Task 10 (Dash) ──┤
│   └─────────────────────────┤
├── Task 3 (Inspo Data) ─────┤
│   ├── Task 5 (URL Parse) ──┤
│   └── Task 6 (AI Backend) ─┤
├── Task 8 (Itin Data) ──────┤
└─────────────────────────────┘
              ↓
       Task 11 (Polish)
```

Parallel lanes: Data (`0->3->5->6->8`) and UI (`0->1->2->4->7->9->10`) can proceed in parallel, merging at page-level components.

---

## Verification

1. `npm run dev` starts without errors
2. Navigate `/dashboard` -> create trip -> lands on inspo board
3. Paste a URL -> OG metadata extracted -> inspo card appears with pixel frame
4. Add 3+ inspo items -> navigate to Generate tab
5. Toggle strict/creative -> click Generate -> see streaming itinerary
6. Click "Accept and Edit" -> itinerary editor loads with generated blocks
7. Inline-edit a block title -> auto-saves
8. Drag a block to reorder -> position updates
9. All pages use pixel-art styling (no rounded corners, pixel shadows, correct fonts)
10. `npm run build` succeeds with no TypeScript errors
