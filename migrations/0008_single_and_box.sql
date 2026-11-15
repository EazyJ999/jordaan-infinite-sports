alter table products add column if not exists box_price integer;
alter table products add column if not exists box_fan_price integer;

update products
set box_price = 699,
    box_fan_price = 599
where availability = 'on_hand'
  and category <> 'training'
  and box_price is null;

update products
set price = 1349,
    fan_price = 1299
where category <> 'training';

update products
set price = 1449,
    fan_price = 1449,
    box_price = null,
    box_fan_price = null
where category = 'training';
