-- League categories and whether a kit is on hand or only available to order.

alter table products add column if not exists category text;
alter table products add column if not exists availability text;

update products set category = 'premier-league'
where slug in ('manchester-united', 'liverpool', 'manchester-city', 'arsenal', 'chelsea', 'tottenham');

update products set category = 'laliga'
where slug in ('real-madrid', 'barcelona');

update products set category = 'bundesliga'
where slug in ('bayern', 'dortmund');

update products set category = 'serie-a'
where slug in ('juventus', 'ac-milan', 'inter');

update products set category = 'retro'
where slug in ('france-1998', 'brazil-1998', 'argentina-1986', 'netherlands-1998');

update products set category = 'nba'
where slug in ('lakers', 'celtics', 'bulls', 'warriors', 'heat', 'knicks', 'nuggets', 'mavericks');

update products set category = 'retro' where category is null and sport = 'retro';
update products set category = 'nba' where category is null and sport = 'nba';
update products set category = 'premier-league' where category is null;

update products set availability = 'to_order'
where slug in (
  'bayern', 'dortmund', 'juventus', 'ac-milan', 'inter',
  'france-1998', 'argentina-1986', 'netherlands-1998',
  'knicks', 'nuggets', 'mavericks'
);

update products set availability = 'on_hand' where availability is null or availability = '';

alter table products alter column category set default 'premier-league';
alter table products alter column availability set default 'on_hand';
alter table products alter column category set not null;
alter table products alter column availability set not null;
