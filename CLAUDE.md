# Thailand Trip Planner — CLAUDE.md

## Overview
Full-stack Hebrew RTL trip-information app for a group Thailand trip.
Travelers view their booked flights/hotels/activities and use group tools.
React+Vite+Tailwind client, Express server, Supabase (Postgres) database, Anthropic API for booking parsing + live AI chat.
NOT a booking site — bookings already exist; this displays them.

## Commands
- `npm run dev` — run client+server concurrently
- `npm run build` — build client
- `npm start` — production server (serves API + built client)
- `npm test` — server unit tests (parser, settlement math, itinerary grouping, chat, tickets)

## Architecture
- client/ — React SPA, Zustand state, React Router
- server/ — Express API, Supabase (Postgres) via @supabase/supabase-js, Anthropic proxy
- Deploy: API (+ optional built client) on Render free tier; client ALSO deployable as static site on Vercel (Root Directory `client`, `client/vercel.json` SPA rewrite) with `VITE_API_URL=https://<render-host>`. Vercel = Preview deployments only unless told otherwise
- CORS (`server/middleware/corsPolicy.js`): same-origin, localhost, `thailandtripplanner*.vercel.app` (also hyphenated variants), plus optional `CORS_ORIGINS` env (comma list). Everything else gets no CORS headers
- Cold start: Render free sleeps. Client warm-up ping on load (`GET /api/health`), GET requests auto-retry on network error/502/503/504 (never mutations/uploads), "השרת מתעורר" banner after 3s, skeleton loaders instead of spinners
- Supabase project: `thailand-trip` (dedicated, ref `chcmshsbhgxvmmpzsjau`); service role key server-side only
- Anthropic model: claude-sonnet-5 (overridable via ANTHROPIC_MODEL env var); key in ANTHROPIC_API_KEY env var only

## Pages / navigation
- 🗓️ המסלול (Itinerary) — the HOME page (`/`): all bookings merged chronologically, sticky day headers with day counter, hotels appear twice (check-in at start_at + check-out at end_at, generated at render time), inline expansion to full cards, "הבא בתור" highlight + auto-scroll during the trip, "ללא תאריך" section at the bottom
- ✈️ טיסות, 🏨 מלונות — type pages, sorted by start_at (heuristic field-date fallback)
- 🌴 אטרקציות (`/activities`) and 🚐 העברות (`/transfers`) are SEPARATE pages; both show the operator contact strip
- טיפים + אזור מארגן live in the "עוד" menu (mobile tab bar + desktop navbar); itinerary/flights/hotels/activities/transfers stay top-level

## Non-negotiable product rules
- NO external booking-link hub pages (no Skyscanner/Booking/Agoda collections)
- Operator contact for existing bookings: lametayel-thailand WhatsApp 972552750399, phone *8880
- Parser: include passenger names+seats; never include emails/phones/passports/payment info
- All UI text Hebrew, dir=rtl; fonts Heebo + Noto Serif Display
- No window.confirm/prompt — custom modals only
- 7 tips only, no "local culture" tip

## AI Chat — LIVE
- Enabled by default; set ENABLE_AI_CHAT=false to fall back to the "בקרוב" placeholder
- /api/chat: system prompt from services/tripContext.js (all trip data + day-by-day itinerary), history capped at last 20 messages, max_tokens 700
- Prompt rules: Hebrew, warm+concise, trip answers strictly from data, general Thailand from model knowledge, say when data is missing → refer to organizer, NEVER invent bookings/times/refs
- In-memory rate limit 15 req/min/IP → Hebrew 429; Anthropic failure → Hebrew 502
- Client: suggested-question chips, typing indicator, "נקה שיחה", history in memory only

## Design tokens
ocean #0284c7 / #0369a1, teal #0d9488, amber #d97706, emerald #059669,
purple #7c3aed, rose #e11d48, gray-800 #1e293b, radius 14px,
bg #f0f4f8, cards white rounded-2xl shadow

## DB schema (Supabase / Postgres)
bookings(id uuid pk default gen_random_uuid(), type text, source text, title text, status text, fields jsonb, notes text, start_at timestamptz, end_at timestamptz, ticket_path text, created_at timestamptz default now())
checklist(id uuid pk default gen_random_uuid(), label text, sub text, done boolean default false, created_at timestamptz default now())
participants(id uuid pk default gen_random_uuid(), name text, created_at timestamptz default now())
expenses(id uuid pk default gen_random_uuid(), description text, amount numeric, currency text, paid_by text, participants jsonb, date date, created_at timestamptz default now())
settings(key text pk, value text)
RLS: enabled on all tables with no public policies — access is exclusively through the backend using the service role key
Storage: private bucket `tickets` (10MB, application/pdf only), object path {booking_id}.pdf; traveler access via server-generated 60-min signed URLs only — never expose the bucket publicly. Parse-PDF flow auto-attaches the uploaded file as the booking's ticket via pending_ticket_id (single upload).

## Datetime convention (start_at / end_at)
Values hold the event's LOCAL WALL TIME stored as-if-UTC (parser emits ISO without offset, e.g. "2026-08-10T21:30:00"). Always read/render the UTC fields (getUTCHours etc. — see client/src/utils/wallTime.js) so times never shift with the viewer's timezone. Flight: start=outbound departure, end=return arrival. Hotel: check-in/check-out. Parser extracts them; organizer can edit via datetime inputs; "נסה לזהות תאריכים" backfills old bookings via Claude (POST /api/bookings/backfill-dates).

## Data contract — booking fields
{type: flight|hotel|activity|transfer|other, source, title(he), status: confirmed|pending|unknown,
 start_at: ISO|null, end_at: ISO|null, fields: [{label(he), value}], notes}
