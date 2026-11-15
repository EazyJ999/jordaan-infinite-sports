-- Shop catalogue. Public reads are the storefront. Writes are limited to the
-- single shop owner recorded in shop_owner (set when they claim the desk).

create table if not exists shop_owner (
  id integer primary key,
  user_id text,
  seeded boolean not null default false
);

insert into shop_owner (id, user_id)
values (1, null)
on conflict (id) do nothing;

create table if not exists products (
  slug text primary key,
  name text not null,
  team text not null,
  sport text not null,
  region text not null default 'international',
  kind text not null default 'jersey',
  price integer not null,
  image text not null,
  blurb text not null default '',
  stock integer not null default 0,
  sizes text not null default 'S,M,L,XL,2XL,3XL',
  hidden boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
