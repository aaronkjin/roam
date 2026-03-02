# Roam

Travel planning web app for Gen Z. Pixel-art retro-game aesthetic. Helps users during the ideation/brainstorming phase of travel with three core flows: Inspo Board, AI Itinerary Generation, and Editable Itinerary. Supports multi-user collaboration with role-based access control.

## Tech Stack

| Layer         | Tool                                      | Version                     |
| ------------- | ----------------------------------------- | --------------------------- |
| Framework     | Next.js (App Router)                      | 16.1.6                      |
| Language      | TypeScript                                | 5.x                         |
| Styling       | Tailwind CSS                              | v4                          |
| UI Primitives | shadcn/ui (Radix-based, `new-york` style) | latest                      |
| Auth          | Clerk                                     | `@clerk/nextjs` + `@clerk/themes` |
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
│   ├── middleware.ts               # Clerk auth middleware (protects (app) routes, allows /shared/*, /sign-*)
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, ClerkProvider, TooltipProvider)
│   │   ├── page.tsx               # Redirects to /dashboard
│   │   ├── globals.css            # Tailwind v4 + pixel-art overrides for shadcn + Clerk overrides
│   │   ├── not-found.tsx          # 404 page
│   │   ├── sign-in/[[...sign-in]]/page.tsx  # Clerk sign-in page with pixel-art branding
│   │   ├── sign-up/[[...sign-up]]/page.tsx  # Clerk sign-up page with pixel-art branding
│   │   ├── (app)/                 # App route group (AppShell + TripsProvider, auth required)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx # Shows "Your Adventures", "Shared with Me", "Past Trips"
│   │   │   └── trip/[tripId]/
│   │   │       ├── layout.tsx     # TripNav (4-tab navigation)
│   │   │       ├── page.tsx       # Redirects to /inspo
│   │   │       ├── inspo/         # Inspo Board
│   │   │       ├── generate/      # AI Generation
│   │   │       ├── itinerary/     # Editable Itinerary
│   │   │       └── review/        # Trip Review + Ratings
│   │   ├── shared/[token]/page.tsx  # Public shared itinerary view (no auth required)
│   │   └── api/
│   │       ├── trips/             # CRUD for trips + share token
│   │       │   └── [tripId]/
│   │       │       ├── share/     # Share token generation (owner only)
│   │       │       └── collaborators/  # Collaborator management
│   │       │           ├── route.ts          # GET (list) + POST (invite)
│   │       │           ├── accept/route.ts   # POST (accept invite)
│   │       │           └── [userId]/route.ts # PATCH (role) + DELETE (remove)
│   │       ├── inspo/             # CRUD + reorder + URL parse
│   │       ├── generate/          # GPT-4 streaming SSE endpoint
│   │       ├── itinerary/         # CRUD for days + blocks + reorder + media
│   │       ├── shared/[token]/    # Public share data endpoint (no auth)
│   │       ├── geocode/           # Mapbox geocoding (public)
│   │       ├── image-proxy/       # Image proxy for CORS (public)
│   │       └── setup/             # DB setup helper
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (auto-generated, restyled via globals.css)
│   │   ├── pixel/                 # PixelWindow, PixelProgress, PixelSpinner, SmiskiBuilder
│   │   ├── layout/                # AppShell, Header (UserButton), Sidebar (My Trips/Shared), TripNav
│   │   ├── dashboard/             # TripList, TripCard (role badges), CreateTripModal, EditTripModal
│   │   ├── inspo/                 # InspoBoard, InspoCard (canEdit), InspoAddModal, InspoFilters, InspoPreview
│   │   ├── generate/              # GeneratePanel (canEdit), ModeToggle, InspoSummary, GenerateLoading, GeneratePreview
│   │   └── itinerary/             # ItineraryEditor, DaySection (canEdit), BlockEditor (canEdit), BlockToolbar, ItineraryReadOnly, ShareMenu (invite+public link), InviteDialog, TripReviewPage
│   ├── context/
│   │   └── TripsContext.tsx        # Global trips state: ownTrips, sharedTrips, acceptInvite()
│   ├── hooks/                     # useTrips, useInspoItems, useItinerary, useGenerate, useUrlPreview, useCollaborators
│   ├── lib/
│   │   ├── auth.ts                # requireAuth(), requireTripAccess(), ensureUserSynced(), resolveTripId()
│   │   ├── supabase/client.ts     # Browser Supabase client
│   │   ├── supabase/server.ts     # Server Supabase client (uses cookies)
│   │   ├── openai.ts              # OpenAI client instance
│   │   ├── prompts.ts             # System prompt + strict/creative prompt builders
│   │   ├── url-parser.ts          # OG scraper with TikTok/YouTube special handling
│   │   └── utils.ts               # cn() class merge utility
│   └── types/                     # database.ts, inspo.ts, trip.ts (TripWithRole), itinerary.ts, collaborator.ts
├── supabase/migrations/           # 5 SQL migrations (001-004 original, 007 multi-user)
├── PLAN.md                        # Original technical implementation plan
├── components.json                # shadcn/ui config
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

7 tables + 1 logging table, all in Supabase PostgreSQL:

- **trips** — id (UUID), user_id (TEXT, nullable, Clerk ID), title, destination, description, cover_image_url, dates, status (`planning|generated|finalized|archived|completed`), share_token, overall_rating, review_note
- **inspo_items** — id, trip_id (FK), type (`link|image|video|article|note`), url, title, description, image_url, site_name, favicon_url, user_note, tags[], position_index
- **itinerary_days** — id, trip_id (FK), day_number (unique per trip), date, title, summary
- **itinerary_blocks** — id, day_id (FK), type (`activity|transport|accommodation|food|note|heading`), title, description, times, duration, location (lat/lng), cost, url, image_url, position_index, ai_generated, source_inspo_id, rating, review_note
- **users** — id (TEXT PK, Clerk user ID), email (UNIQUE), display_name, avatar_url, created_at, updated_at (trigger-based)
- **trip_collaborators** — id (UUID), trip_id (FK→trips, CASCADE), user_id (TEXT FK→users, CASCADE), role (`editor|viewer`), invited_by (FK→users), invited_email, accepted_at, created_at. UNIQUE(trip_id, user_id)
- **pending_invites** — id (UUID), trip_id (FK→trips, CASCADE), email, role (`editor|viewer`), invited_by (FK→users), created_at. UNIQUE(trip_id, email)
- **generation_logs** — id, trip_id (FK), mode, prompt_snapshot, inspo_snapshot (JSONB), raw_response

Migrations are in `supabase/migrations/` (001–004 original schema, 007 multi-user).

## Authentication & Access Control

### Clerk Auth
- **Provider**: Clerk (`@clerk/nextjs`) wraps the entire app via `<ClerkProvider>` in root layout
- **Theme**: `neobrutalism` base theme with pixel-art overrides (border-radius: 0, Roam color palette)
- **Sign-in/Sign-up**: Catch-all routes at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`
- **Env vars required**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Middleware (`src/middleware.ts`)
- Uses `clerkMiddleware` + `createRouteMatcher`
- **Public routes** (no auth): `/sign-in(.*)`, `/sign-up(.*)`, `/shared/(.*)`, `/api/shared/(.*)`, `/api/inspo/parse`, `/api/image-proxy`, `/api/geocode`, `/api/setup`
- **Protected routes** (redirect to `/sign-in`): Everything else

### Auth Helpers (`src/lib/auth.ts`)
- **`requireAuth()`** — Returns `{ userId }` from Clerk session, or `null` if unauthenticated
- **`ensureUserSynced(userId)`** — Upserts Clerk user data to local `users` table, claims orphaned trips (`user_id IS NULL`), resolves pending invites matching user's email into `trip_collaborators`
- **`requireTripAccess(userId, tripId, minimumRole)`** — Checks ownership (`trips.user_id`) then collaborator table. Returns `{ role }` or `null`. Role hierarchy: `viewer < editor < owner`
- **`resolveTripId(entityType, entityId)`** — Resolves child entities (`inspo`, `day`, `block`, `media`) back to their `trip_id` for access checks

### Access Control Pattern
All data access goes through API routes (no direct browser-to-Supabase). Every protected API route follows this pattern:
```ts
const authResult = await requireAuth();
if (!authResult) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const { userId } = authResult;

const access = await requireTripAccess(userId, tripId, "editor"); // or "viewer" or "owner"
if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

### Role-Based Access
| Role | Can View | Can Edit | Can Invite | Can Share Link | Can Delete Trip |
|------|----------|----------|------------|----------------|-----------------|
| Owner | Yes | Yes | Yes | Yes | Yes |
| Editor | Yes | Yes | No | No | No |
| Viewer | Yes | No | No | No | No |

- **Owner** is implicit via `trips.user_id` (not stored in `trip_collaborators`)
- **Collaborators** are stored in `trip_collaborators` with `accepted_at` tracking
- **Pending invites** for non-existing users go to `pending_invites`, resolved on signup

### Orphaned Trip Claiming
Pre-auth trips (`user_id IS NULL`) are automatically claimed by the first user who signs in, via `ensureUserSynced()`. This is a one-time migration path for MVP data.

## Collaboration Model

### Invite Flow
1. Owner enters email + role (editor/viewer) in InviteDialog
2. If email matches existing `users` row → insert into `trip_collaborators` (accepted_at = NULL)
3. If no matching user → insert into `pending_invites`
4. When invited user signs up, `ensureUserSynced()` resolves pending invites into `trip_collaborators`
5. Collaborator sees trip in "Shared with Me" section and can accept

### API Endpoints
- `GET /api/trips/[tripId]/collaborators` — List collaborators + pending invites (viewer+)
- `POST /api/trips/[tripId]/collaborators` — Invite by email (owner only)
- `PATCH /api/trips/[tripId]/collaborators/[userId]` — Change role (owner only)
- `DELETE /api/trips/[tripId]/collaborators/[userId]` — Remove collaborator (owner, or self-remove)
- `POST /api/trips/[tripId]/collaborators/accept` — Accept pending invite (authenticated user)

### Frontend State
- **TripsContext** provides `ownTrips`, `sharedTrips`, `trips` (combined), `acceptInvite(tripId)`
- `GET /api/trips` returns `{ ownTrips: TripWithRole[], sharedTrips: TripWithRole[] }`
- Each trip carries `userRole: "owner" | "editor" | "viewer"`
- **`useCollaborators(tripId)`** hook manages collaborator CRUD

### Permission-Aware Rendering
Components derive `canEdit` from the trip's `userRole` in TripsContext:
- `canEdit = userRole === "owner" || userRole === "editor"`
- **ItineraryEditor/DaySection/BlockEditor**: `canEdit` prop hides drag handles, delete buttons, makes fields read-only
- **InspoBoard/InspoCard**: Hides add/edit/delete/drag for viewers
- **GeneratePanel**: Shows "view only" message for viewers
- **ShareMenu**: "Invite Collaborator" and "Copy Public Link" shown only for owners
- **TripCard**: Role badges (editor/viewer) on shared trips, hidden edit button for viewers

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

### Clerk Component Overrides

Clerk components are styled in `globals.css` using `[class^="cl-"]` and `.cl-*` selectors to enforce pixel-art aesthetics (border-radius: 0, pixel borders/shadows). The `<ClerkProvider>` appearance config in `layout.tsx` sets the `neobrutalism` base theme with Roam color tokens.

## Key Architecture Patterns

### State Management

- **TripsContext** — Global trips list (split into `ownTrips`/`sharedTrips`), wraps entire `(app)` layout
- **Custom hooks** — `useInspoItems(tripId)`, `useItinerary(tripId)`, `useGenerate({ tripId })`, `useUrlPreview(url)`, `useCollaborators(tripId)` manage local state per page
- **Optimistic updates** — UI updates immediately, reverts on API error
- **Debounced saves** — Itinerary block edits debounce 500ms before persisting

### Data Flow (Core User Journey)

1. Sign up/Sign in via Clerk → redirects to Dashboard
2. Dashboard → Create Trip → redirects to Inspo Board
3. Inspo Board → Add URLs/notes/images → collect inspiration
4. Generate tab → Select inspo items, choose strict/creative mode → GPT-4 streams itinerary
5. Preview → Accept → saves to DB, redirects to Itinerary Editor
6. Itinerary Editor → Inline edit blocks, drag-and-drop reorder, share/invite collaborators
7. Review tab → Rate trip + individual blocks, mark as completed

### AI Generation

- Endpoint: `POST /api/generate` returns SSE stream (requires editor+ access)
- Two modes: **strict** (temp 0.3, uses exact inspo locations) and **creative** (temp 0.9, uses inspo as vibes)
- Prompt supports trip context: dates, stay address
- Output: structured JSON parsed into ItineraryDay[]/ItineraryBlock[]
- Max 4000 tokens per generation

### Next.js Specifics

- **App Router** with route groups: `(app)` for authenticated layout
- Route params in Next.js 16 are `Promise<{}>` — must `await` them
- Server components used for shared page; everything else is `"use client"`
- API routes use `NextResponse.json()` and Supabase server client
- Clerk middleware in `src/middleware.ts` protects all non-public routes

## Changelog

### 2026-03-02

- **Multi-user support** with Clerk Auth (migration 007)
- `users` table (Clerk data cache), `trip_collaborators`, `pending_invites` tables
- Auth middleware protecting all `(app)` routes; public routes preserved for `/shared/*`
- Auth helpers in `src/lib/auth.ts`: `requireAuth()`, `requireTripAccess()`, `ensureUserSynced()`, `resolveTripId()`
- All 20+ API routes gated with role-based access control (owner/editor/viewer)
- Collaborator API: invite by email, accept/decline, change role, remove
- TripsContext split into `ownTrips` / `sharedTrips` with `TripWithRole` type
- Header: Clerk `<UserButton>` with pixel styling
- Sidebar: "My Trips" / "Shared" / "Archived" sections
- Dashboard: "Shared with Me" section with role badges
- ShareMenu: "Invite Collaborator" + "Copy Public Link" (owner only)
- InviteDialog: email invite form, collaborator list, role management
- Permission-aware rendering: `canEdit` prop through itinerary, inspo, generate components
- Orphaned trip auto-claiming on first sign-in
- `useCollaborators(tripId)` hook for collaborator CRUD

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
6. **Auth required** — All API routes (except public ones listed in middleware) must call `requireAuth()` and return 401 if null. Routes that access trip data must also call `requireTripAccess()` with the appropriate minimum role.
7. **Optimistic UI** — Update state immediately, revert on error. Follow patterns in existing hooks.
8. **Color tokens** — Use `mist`, `grass`, `jam`, `milk`, `moss`, `night`, `rock`, `sky` via Tailwind classes (e.g., `bg-mist`, `text-night`, `border-jam`).
9. **Component organization** — Group by feature domain (`inspo/`, `generate/`, `itinerary/`, `dashboard/`, `layout/`, `pixel/`). Page files are thin wrappers that delegate to components.
10. **API routes** — Use Supabase server client. Return `NextResponse.json()`. Handle errors with appropriate status codes. Always add auth checks using helpers from `@/lib/auth.ts`.
11. **New migrations** — Add as `supabase/migrations/008_*.sql`, `009_*.sql`, etc. Keep sequential numbering (007 is the latest).
12. **No over-engineering** — Keep solutions simple. Don't add caching or optimization layers unless explicitly requested.
13. **Existing patterns** — Before creating new patterns, check how similar problems are already solved in the codebase. Follow the established conventions.
14. **Permission-aware components** — When adding new UI that modifies trip data, accept a `canEdit` prop and hide/disable edit controls when `false`. Derive `canEdit` from the trip's `userRole` in TripsContext: `canEdit = userRole === "owner" || userRole === "editor"`.
15. **Clerk components** — Use Clerk's built-in components (`<SignIn>`, `<SignUp>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>`) rather than building custom auth UI. Style via ClerkProvider appearance config and CSS overrides in globals.css.
16. **Collaborator access** — Owner is determined by `trips.user_id`. Collaborators are in `trip_collaborators` (must have `accepted_at` set to be active). The `resolveTripId()` helper chains child entities back to their parent trip for access checks.
17. **User data** — The `users` table is a cache of Clerk data, synced via `ensureUserSynced()`. It is NOT a source of truth for auth — Clerk is. The table exists for join queries (collaborator names/avatars) and email-based invite lookups.
