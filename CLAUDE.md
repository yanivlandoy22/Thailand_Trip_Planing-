# Thailand Trip Planner — CLAUDE.md

## Overview
Full-stack Hebrew RTL trip-information app for a group Thailand trip.
Travelers view their booked flights/hotels/activities and use group tools.
React+Vite+Tailwind client, Express server, Supabase (Postgres) database, Anthropic API for booking parsing.
NOT a booking site — bookings already exist; this displays them.

## Commands
- `npm run dev` — run client+server concurrently
- `npm run build` — build client
- `npm start` — production server (serves API + built client)
- `npm test` — server unit tests (parser, settlement math, chat flag)

## Architecture
- client/ — React SPA, Zustand state, React Router
- server/ — Express API, Supabase (Postgres) via @supabase/supabase-js, Anthropic proxy
- Supabase project: `thailand-trip` (dedicated, ref `chcmshsbhgxvmmpzsjau`); service role key server-side only
- Anthropic model: claude-sonnet-4-20250514; key in ANTHROPIC_API_KEY env var only

## Non-negotiable product rules
- NO external booking-link hub pages (no Skyscanner/Booking/Agoda collections)
- Operator contact for existing bookings: lametayel-thailand WhatsApp 972552750399, phone *8880
- Parser: include passenger names+seats; never include emails/phones/passports/payment info
- All UI text Hebrew, dir=rtl; fonts Heebo + Noto Serif Display
- No window.confirm/prompt — custom modals only
- 7 tips only, no "local culture" tip
- AI chat ships as prepared placeholder; activation via ENABLE_AI_CHAT=true

## AI Chat activation (future)
1. Set ENABLE_AI_CHAT=true in .env
2. /api/chat then calls Claude with system prompt from services/tripContext.js (all trip data) + conversation history
3. Client chat shell already wired to the endpoint — no client changes needed

## Design tokens
ocean #0284c7 / #0369a1, teal #0d9488, amber #d97706, emerald #059669,
purple #7c3aed, rose #e11d48, gray-800 #1e293b, radius 14px,
bg #f0f4f8, cards white rounded-2xl shadow

## DB schema (Supabase / Postgres)
bookings(id uuid pk default gen_random_uuid(), type text, source text, title text, status text, fields jsonb, notes text, created_at timestamptz default now())
checklist(id uuid pk default gen_random_uuid(), label text, sub text, done boolean default false, created_at timestamptz default now())
participants(id uuid pk default gen_random_uuid(), name text, created_at timestamptz default now())
expenses(id uuid pk default gen_random_uuid(), description text, amount numeric, currency text, paid_by text, participants jsonb, date date, created_at timestamptz default now())
settings(key text pk, value text)
RLS: enabled on all tables with no public policies — access is exclusively through the backend using the service role key

## Data contract — booking fields
{type: flight|hotel|activity|transfer|other, source, title(he), status: confirmed|pending|unknown,
 fields: [{label(he), value}], notes}
