# Roam

Make your inspos into a trip

![Demo](docs/demo.gif)

## What it does

- Collect travel inspo (links, TikToks, reels, articles, images)
- Generate AI itineraries from inspo (strict or creative mode)
- Edit itineraries in a block-style editor with drag-and-drop
- View activities on an interactive Mapbox map with route distances
- Inline AI editing of itinerary blocks (Cmd+K)
- Multi-user collaboration with role-based access (owner/editor/viewer)
- Share itineraries via public link or invite
- Rate and review completed trips

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL)
- OpenAI GPT-5.2
- Clerk (auth)
- Mapbox GL (maps + directions)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `PEXELS_API_KEY`

## Flow

Dashboard → create trip → add inspo → generate itinerary → edit & share

## Verify

- `npm run dev`
- `npm run build`
