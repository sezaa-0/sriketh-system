-- Fleet / vehicle maintenance tracker
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  province_code text not null default '',
  series_code text not null default '',
  sequence_number text not null default '',
  vehicle_type text not null default 'lorry'
    check (vehicle_type in ('lorry', 'jeep', 'car')),
  license_expire_date date,
  insurance_expire_date date,
  service_due_date date,
  service_due_km numeric not null default 0,
  current_km numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_plate_idx on vehicles(province_code, series_code, sequence_number);
create index if not exists vehicles_license_expire_idx on vehicles(license_expire_date);
create index if not exists vehicles_insurance_expire_idx on vehicles(insurance_expire_date);
create index if not exists vehicles_service_due_idx on vehicles(service_due_date);
create index if not exists vehicles_created_at_idx on vehicles(created_at desc);

alter table vehicles enable row level security;

drop policy if exists "vehicles_anon_all" on vehicles;
create policy "vehicles_anon_all" on vehicles for all using (true) with check (true);
