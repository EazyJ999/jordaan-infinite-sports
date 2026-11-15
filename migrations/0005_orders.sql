create table if not exists shop_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'received',
  customer_name text not null,
  phone text not null,
  phone_key text not null,
  email text not null default '',
  line1 text not null default '',
  suburb text not null default '',
  city text not null default '',
  province text not null default '',
  postal text not null default '',
  notes text not null default '',
  delivery text not null,
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  lines jsonb not null,
  stock_taken boolean not null default false
);

create table if not exists bulk_enquiries (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null default '',
  organisation text not null default '',
  details text not null,
  status text not null default 'new'
);
