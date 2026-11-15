-- Shirt season, stored as 26/27. Blank when the item has no year.
alter table products add column if not exists season text not null default '';
