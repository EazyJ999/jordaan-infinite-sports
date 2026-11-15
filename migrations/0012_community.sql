create table if not exists customers (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null default '',
  phone text not null default ''
);

create table if not exists score_entries (
  id text primary key,
  created_at timestamptz not null default now(),
  round_id text not null,
  customer_id text not null,
  name text not null,
  contact text not null,
  shirt text not null,
  picks jsonb not null
);

create unique index if not exists score_entries_round_customer
  on score_entries (round_id, customer_id);
