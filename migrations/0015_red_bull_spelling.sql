update products
set
  name = replace(regexp_replace(name, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g'), 'JAcket', 'jacket'),
  team = regexp_replace(team, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g'),
  blurb = regexp_replace(blurb, '[Rr][Ee][Dd][Bb]ull', 'Red Bull', 'g')
where name ~* 'redbull' or name like '%JAcket%' or team ~* 'redbull' or blurb ~* 'redbull';
