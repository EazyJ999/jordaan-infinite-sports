-- Which fit chart a kit uses, and whether name/number printing applies.

alter table products add column if not exists size_chart text;
alter table products add column if not exists printable boolean;

update products set size_chart = 'nba' where category = 'nba' and (size_chart is null or size_chart = '');
update products set size_chart = 'retro' where category = 'retro' and (size_chart is null or size_chart = '');
update products set size_chart = 'player' where size_chart is null or size_chart = '';

update products set sizes = 'S,M,L,XL,XXL' where size_chart = 'nba';
update products set sizes = 'S,M,L,XL,XXL,XXXL,XXXXL' where size_chart in ('player', 'retro');
update products set sizes = '16,18,20,22,24,26,28' where size_chart = 'kids';
update products set sizes = 'S,M,L,XL,XXL' where size_chart in ('training', 'jacket');
update products set sizes = '155-170,165-175,170-185,180-195,185-200' where size_chart = 'windbreaker';

update products set printable = true where printable is null and size_chart in ('player', 'retro', 'nba', 'kids', 'training');
update products set printable = false where printable is null;

alter table products alter column size_chart set default 'player';
alter table products alter column printable set default true;
alter table products alter column size_chart set not null;
alter table products alter column printable set not null;
