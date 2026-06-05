-- Spare parts inventory & stock consumption logs
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists inventory_item_name_unique_idx
  on inventory (lower(trim(item_name)));

create index if not exists inventory_quantity_idx on inventory (quantity);
create index if not exists inventory_updated_at_idx on inventory (updated_at desc);

create table if not exists stock_logs (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete restrict,
  quantity_issued integer not null check (quantity_issued > 0),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists stock_logs_inventory_idx on stock_logs (inventory_id);
create index if not exists stock_logs_vehicle_idx on stock_logs (vehicle_id);
create index if not exists stock_logs_issued_at_idx on stock_logs (issued_at desc);

alter table inventory enable row level security;
alter table stock_logs enable row level security;

drop policy if exists "inventory_anon_all" on inventory;
create policy "inventory_anon_all" on inventory for all using (true) with check (true);

drop policy if exists "stock_logs_anon_all" on stock_logs;
create policy "stock_logs_anon_all" on stock_logs for all using (true) with check (true);
