insert into products (
  slug, name, team, sport, category, availability, region, kind,
  price, fan_price, image, blurb, stock, sizes, size_chart, printable, hidden, sort_order
)
select
  'pre-game-set',
  'Pre-game training set',
  'Vest and shorts',
  'football',
  'training',
  'to_order',
  'international',
  'jersey',
  799,
  799,
  '/catalog/training-set.jpg',
  'A vest and a pair of shorts, worn before the match. One size covers the set.',
  0,
  'S,M,L,XL,XXL',
  'training',
  false,
  false,
  (select coalesce(max(sort_order), 0) + 1 from products)
where not exists (select 1 from products where slug = 'pre-game-set');
