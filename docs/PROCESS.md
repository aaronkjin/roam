# Process

## Design Architecture

| Layer         | Tool                    | Purpose                                                     |
| ------------- | ----------------------- | ----------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) | Server/client rendering, API routes, file-based routing     |
| Language      | TypeScript              | Type safety across the full stack                           |
| Styling       | Tailwind CSS v4         | Utility-first CSS with `@theme inline` tokens               |
| UI Primitives | shadcn/ui (Radix)       | Accessible components, restyled via `[data-slot]` selectors |
| Auth          | Clerk                   | Sign-in/sign-up, session management, user data sync         |
| AI            | OpenAI GPT-4            | Streaming itinerary generation (strict/creative modes)      |
| Database      | Supabase (PostgreSQL)   | 7 tables, server-side client, no RLS (app-level auth)       |
| Drag-and-Drop | @dnd-kit                | Sortable blocks in itinerary editor                         |
| Maps          | Mapbox GL JS            | Interactive trip map with route visualization               |
| Image Search  | Pexels API              | Cover photos and block thumbnails                           |
| Deployment    | Vercel                  | Serverless, edge-optimized hosting                          |

## Week-by-Week Building Process

### Week 1 (Feb 9): MVP Foundation

Built the entire app scaffold in a single intensive session:

- **Project scaffolding**: Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase
- **Pixel-art design system**: Custom color tokens (mist, grass, jam, milk, moss, night, rock, sky), Press Start 2P / Silkscreen / Roboto Mono font stack, zero border-radius everywhere, pixel drop shadows with hover press effects
- **Layout & navigation**: AppShell with sidebar, Header, TripNav (4-tab navigation)
- **Inspo Board**: Full CRUD, drag-and-drop reordering, URL paste with Open Graph metadata scraping (TikTok, YouTube, Instagram special handling)
- **AI Generation**: OpenAI GPT-4 integration with SSE streaming, strict mode (exact inspo locations) and creative mode (inspo as vibes), structured JSON output
- **Itinerary Editor**: Day/block data model, inline editing, drag-and-drop reorder, block types (activity, food, transport, accommodation, note, heading)
- **Dashboard**: Trip grid, create/edit modals, status badges
- **Database**: Supabase SQL migrations (001-002), trips, inspo_items, itinerary_days, itinerary_blocks, generation_logs tables

### Week 2 (Feb 10): Polish & QoL

- **Edit/patch trip functionality**: EditTripModal with full field editing
- **Inspo preview overhaul**: Editable dialog with video embed support (YouTube, TikTok, Instagram, Vimeo)
- **Image proxy**: Server-side CORS proxy for external images
- Various UX improvements across the app

### Week 3 (Feb 17-25): Design Overhaul + Sharing

- **Angela's design changes**: Updated photos, refined color usage, SmiskiBuilder sprite animation for loading states
- **Shareable itineraries**: Share token generation, public view at `/shared/[token]`
- **Trip review & completion**: Star ratings (overall + per-block), review notes, trip status progression (planning -> generated -> finalized -> completed)
- **ShareMenu component**: Copy as text, download as PNG via html-to-image
- **ItineraryReadOnly**: Dedicated read-only component for shared/public views

### Week 4 (Mar 2): Multi-User Collaboration

The biggest architectural addition — transforming Roam from single-user to collaborative:

- **Clerk Auth integration**: `@clerk/nextjs` with neobrutalism theme, pixel-art CSS overrides, catch-all sign-in/sign-up routes
- **Database expansion**: `users` table (Clerk data cache), `trip_collaborators` (role-based), `pending_invites` (for non-existing users), migration 007
- **Auth middleware**: `src/middleware.ts` with Clerk, public route whitelist for `/shared/*`, `/api/shared/*`, sign-in/up
- **Auth helpers**: `requireAuth()`, `requireTripAccess(userId, tripId, minimumRole)`, `ensureUserSynced()` (upserts Clerk data, claims orphaned trips, resolves pending invites), `resolveTripId()` (chains child entities to parent trip)
- **RBAC across 20+ API routes**: Owner/editor/viewer role hierarchy, consistent access patterns
- **Collaborator management**: Invite by email, accept/decline, change role, remove. API endpoints + InviteDialog UI
- **TripsContext split**: `ownTrips` / `sharedTrips` / `pendingSharedTrips` with `TripWithRole` type
- **Permission-aware rendering**: `canEdit` prop flowing through itinerary, inspo, and generate components

### Weeks 5-6: Feed, Maps, Advanced AI

- **Community Feed**: Public trip feed with likes, comments, save functionality, slug-based URLs
- **Mapbox integration**: Interactive map alongside itinerary editor, route visualization with transport directions, custom pixel-art markers, distance/time display
- **Trip timing system**: Exact dates and flexible timing, date-locked day count for generation
- **Cmd+K AI editing**: Select blocks -> type natural language instruction -> GPT returns targeted edits with diff preview (accept/reject per block)
- **Transport selector**: Walking/transit/driving options with Mapbox Directions API, duration and cost estimates
- **Budget preferences**: Budget/balanced/luxury mode for generation prompt tuning

## Bug Bashing

### Internal Code Review

Conducted a systematic audit of the codebase covering security, state management, and access control:

**Security findings (6 issues)**:

- SSRF vulnerability in image proxy (blocked private IPs and non-HTTP protocols)
- Missing auth on backfill-coords endpoint (added `requireAuth()`)
- Missing auth on photos API (added `requireAuth()`)
- Missing email validation on invite endpoint (added regex + length limit)
- Missing coordinate range validation on directions API
- Missing geocode query length limit

**State management (5 issues)**:

- Debounce timers not cleaned up on unmount in `useItinerary`
- `updateDay` missing optimistic revert on error
- Missing AbortController for streaming generation fetch (noted, deferred)
- Stale closure in geocoding dependency array (noted, intentional)
- `editComment` missing optimistic revert (noted, low risk)

**Access control (1 systemic issue)**:

- Inconsistent role checks across itinerary API routes — some used "owner" where "editor" was appropriate. Flagged for review.

### Lessons Learned

The bug bashing revealed that security issues tend to accumulate in utility/proxy endpoints that were added quickly for convenience. The most impactful finding was the SSRF vulnerability — a reminder that any endpoint that fetches external URLs server-side needs strict URL validation.

## Usability Testing

### Christina's Session

Christina tested the full flow: account creation -> trip creation -> inspo collection -> AI generation -> itinerary editing -> collaboration. Her session surfaced 19 issues across four categories:

**Visual/Layout (4 issues)**:

- Modals too small and cramped (Bug 9) — fixed with larger max-width
- "Shared with Me" section in wrong position (Bug 15) — moved to bottom
- Trip days input not intuitive (Bug 13) — replaced with +/- stepper
- Not mobile-friendly (Bug 19) — added responsive CSS and layout adjustments

**Functional Gaps (7 issues)**:

- No cover photo on new trips (Bug 5) — auto-fetch from Pexels
- Can't change cover photo (Bug 18) — added photo picker in edit modal
- Thumbnails don't update on title change (Bugs 1, 6) — auto-fetch on blur/accept
- Same photos everywhere (Bug 16) — randomized selection + dedup
- Can't delete pending invites (Bug 8) — new API endpoint + UI
- Accept invite not visible on dashboard (Bug 7) — new "Pending Invites" section
- Can't leave generation page (Bug 11) — background generation context

**AI Quality (3 issues)**:

- Generation fails for 4+ day trips (Bug 3) — increased token limit + JSON repair
- Geographic clustering not strict enough (Bug 20) — strengthened prompt rules
- Hotel stays disappear after generation (Bug 4) — auto-insert accommodation blocks
- No dollar sign display for restaurants (Bug 17) — added $ notation

**Collaboration (2 issues)**:

- Misleading "Not signed up yet" text (Bug 2) — changed to "Invite pending"
- Editors can see generate UI but get 403 (Bug 14) — restricted to owner-only with lock icon

### Key Insight

The most impactful usability finding was Bug 11 (background generation). Users naturally want to continue browsing while AI generates their itinerary, but the original implementation destroyed the SSE stream on navigation. The fix — lifting generation state into a React context — was the largest single change but dramatically improved the user experience.
