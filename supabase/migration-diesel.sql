-- Private diesel bulk tank & consumption tracker
create table if not exists diesel_stock (
  id int primary key default 1 check (id = 1),
  total_liters numeric not null default 0 check (total_liters >= 0),
  avg_cost_per_liter numeric not null default 0 check (avg_cost_per_liter >= 0),
  updated_at timestamptz not null default now()
);

insert into diesel_stock (id, total_liters, avg_cost_per_liter)
values (1, 0, 0)
on conflict (id) do nothing;

create table if not exists diesel_purchases (
  id uuid primary key default gen_random_uuid(),
  liters_added numeric not null check (liters_added > 0),
  cost_per_liter numeric not null check (cost_per_liter >= 0),
  total_cost numeric not null default 0 check (total_cost >= 0),
  purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists diesel_purchases_purchased_at_idx on diesel_purchases (purchased_at desc);
create index if not exists diesel_purchases_created_at_idx on diesel_purchases (created_at desc);

create table if not exists diesel_usage (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete restrict,
  liters_issued numeric not null check (liters_issued > 0),
  cost_per_liter_at_issue numeric not null default 0,
  total_diesel_cost numeric not null default 0,
  trip_type text not null check (trip_type in ('load', 'hire')),
  trip_table text not null check (trip_table in ('trips', 'loads', 'lorry_hires')),
  trip_target_id uuid not null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists diesel_usage_issued_at_idx on diesel_usage (issued_at desc);
create index if not exists diesel_usage_vehicle_idx on diesel_usage (vehicle_id);
create index if not exists diesel_usage_trip_idx on diesel_usage (trip_table, trip_target_id);

alter table diesel_stock enable row level security;
alter table diesel_purchases enable row level security;
alter table diesel_usage enable row level security;

drop policy if exists "diesel_stock_anon_all" on diesel_stock;
create policy "diesel_stock_anon_all" on diesel_stock for all using (true) with check (true);

drop policy if exists "diesel_purchases_anon_all" on diesel_purchases;
create policy "diesel_purchases_anon_all" on diesel_purchases for all using (true) with check (true);

drop policy if exists "diesel_usage_anon_all" on diesel_usage;
create policy "diesel_usage_anon_all" on diesel_usage for all using (true) with check (true);
