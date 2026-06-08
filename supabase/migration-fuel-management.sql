-- Fuel Management: credit purchases, installments, and station tracking

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_no text not null default '',
  fuel_station text not null default '',
  total_amount numeric(14, 2) not null default 0,
  is_credit boolean not null default false,
  status text not null default 'Paid'
    check (status in ('Paid', 'Pending', 'Partially Paid')),
  remaining_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fuel_payments (
  id uuid primary key default gen_random_uuid(),
  fuel_log_id uuid not null references public.fuel_logs(id) on delete cascade,
  payment_date date not null default current_date,
  amount_paid numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists fuel_logs_created_at_idx
  on public.fuel_logs (created_at desc);

create index if not exists fuel_logs_status_idx
  on public.fuel_logs (status);

create index if not exists fuel_payments_fuel_log_id_idx
  on public.fuel_payments (fuel_log_id);

alter table public.fuel_logs enable row level security;
alter table public.fuel_payments enable row level security;

drop policy if exists "fuel_logs_anon_all" on public.fuel_logs;
create policy "fuel_logs_anon_all" on public.fuel_logs
  for all using (true) with check (true);

drop policy if exists "fuel_payments_anon_all" on public.fuel_payments;
create policy "fuel_payments_anon_all" on public.fuel_payments
  for all using (true) with check (true);
