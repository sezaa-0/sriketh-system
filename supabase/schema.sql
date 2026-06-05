-- Sri Keth ERP — Unified Trips (ගමන් වාර) system

-- Drop legacy loads architecture if migrating
-- drop table if exists trips cascade;
-- drop table if exists loads cascade;

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  trip_reference text unique,
  trip_type text not null check (trip_type in ('බඩු ගේන්න', 'බඩු බාන්න')),
  paddy_type text not null check (paddy_type in ('වී', 'බඩඉරිඟු')),
  warehouse_name text not null default '',
  buyer_name text,
  lorry_number text not null default '',
  driver_name text not null default '',
  helper_names text not null default '',
  total_kg numeric not null default 0,
  price_per_kg numeric not null default 0,
  start_km numeric not null default 0,
  end_km numeric not null default 0,
  diesel_liters numeric not null default 0,
  diesel_cost numeric not null default 0,
  driver_wage numeric not null default 0,
  helper_wage numeric not null default 0,
  road_expenses numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trips_created_at_idx on trips(created_at desc);
create index if not exists trips_trip_type_idx on trips(trip_type);

alter table trips enable row level security;

drop policy if exists "trips_anon_all" on trips;
create policy "trips_anon_all" on trips for all using (true) with check (true);
