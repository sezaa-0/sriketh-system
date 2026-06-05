-- 02 කොටස: ලොරි කුලියට දීම (Lorry Hire)
create table if not exists lorry_hires (
  id uuid primary key default gen_random_uuid(),
  hire_reference text unique,
  lorry_number text not null default '',
  hirer_name text not null default '',
  driver_name text not null default '',
  depart_date date,
  return_date date,
  start_km numeric not null default 0,
  end_km numeric not null default 0,
  hire_rate numeric not null default 0,
  paid_amount numeric not null default 0,
  diesel_cost numeric not null default 0,
  driver_wage numeric not null default 0,
  helper_wage numeric not null default 0,
  other_expenses numeric not null default 0,
  is_settled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lorry_hires_created_at_idx on lorry_hires(created_at desc);

alter table lorry_hires enable row level security;

drop policy if exists "lorry_hires_anon_all" on lorry_hires;
create policy "lorry_hires_anon_all" on lorry_hires for all using (true) with check (true);
