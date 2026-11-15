-- Extra angles of the same kit. The card still uses image.
alter table products add column if not exists gallery text not null default '[]';
