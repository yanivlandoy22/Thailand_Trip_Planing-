-- Thailand Trip Planner — full schema
-- Run once in the `thailand-trip` Supabase project (SQL editor) if not applied via MCP.

create extension if not exists pgcrypto;

-- ===== Tables =====

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'other',            -- flight | hotel | activity | transfer | other
  source text,
  title text not null,
  status text not null default 'unknown',        -- confirmed | pending | unknown
  fields jsonb not null default '[]'::jsonb,     -- [{label, value}]
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists checklist (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sub text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  currency text not null default 'THB',          -- THB | ILS | USD | EUR
  paid_by text not null,
  participants jsonb not null default '[]'::jsonb, -- names of participants sharing the expense
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

-- ===== RLS: enabled with NO public policies =====
-- All access goes through the backend with the service role key (bypasses RLS).

alter table bookings enable row level security;
alter table checklist enable row level security;
alter table participants enable row level security;
alter table expenses enable row level security;
alter table settings enable row level security;

-- ===== Seed data =====

insert into settings (key, value) values
  ('trip_title', 'תכנון טיול לתאילנד'),
  ('hero_subtitle', 'כל המידע על הטיול שלנו במקום אחד'),
  ('rate_THB_ILS', '0.11'),
  ('rate_USD_ILS', '3.65'),
  ('rate_EUR_ILS', '3.95')
on conflict (key) do nothing;

insert into checklist (label, sub) values
  ('ביטוח נסיעות', 'לוודא כיסוי לכל משתתפי הטיול'),
  ('דרכון בתוקף', 'לפחות 6 חודשים מיום הכניסה לתאילנד'),
  ('המרת מזומן', 'דולרים/באטים — מומלץ SuperRich בבנגקוק'),
  ('הורדת אפליקציית Grab', 'מוניות ומשלוחים בתאילנד'),
  ('צ''ק-אין אונליין', '24 שעות לפני הטיסה'),
  ('אריזה', 'בגדים קלים, קרם הגנה, מטען נייד, מתאם חשמל');
