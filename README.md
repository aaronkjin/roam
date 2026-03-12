# Roam

Make your inspos into a trip

![Demo](docs/demo.gif)

Click [here](https://tryroam.xyz)

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

## Flow

auth → dashboard → create trip → add inspo → generate itinerary → edit & share
