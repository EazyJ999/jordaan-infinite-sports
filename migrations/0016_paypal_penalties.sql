create table if not exists shop_settings (
  key text primary key,
  value text not null
);

create table if not exists paypal_pending (
  paypal_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists penalty_entries (
  id text primary key,
  round_id text not null,
  customer_id text not null,
  name text not null,
  contact text not null,
  created_at timestamptz not null default now(),
  unique (round_id, customer_id)
);
