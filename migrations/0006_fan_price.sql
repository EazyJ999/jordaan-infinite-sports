alter table products add column if not exists fan_price integer;

update products
set price = 699,
    fan_price = 599
where fan_price is null
   or price <> 699
   or fan_price <> 599;

alter table products alter column fan_price set default 599;
alter table products alter column fan_price set not null;
