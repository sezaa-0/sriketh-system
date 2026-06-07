-- Buying & Selling Stock + custom paddy varieties

create table if not exists custom_paddy_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

alter table custom_paddy_types enable row level security;

drop policy if exists "custom_paddy_types_anon_all" on custom_paddy_types;
create policy "custom_paddy_types_anon_all" on custom_paddy_types
  for all using (true) with check (true);

create table if not exists buying_selling_stock (
  id uuid primary key default gen_random_uuid(),
  vehicle_no text not null default '',
  lorry_number text not null default '',
  driver_name text not null default '',
  commodity_type text not null check (commodity_type in ('Paddy', 'Maize', 'Rice', 'Black Seed')),
  variety text,
  paddy_variety text,
  buyer_name text not null default '',
  total_kg numeric not null default 0,
  buying_weight_kg numeric not null default 0,
  buying_price_per_kg numeric not null default 0,
  buying_rate_per_kg numeric not null default 0,
  total_buying_amount numeric not null default 0,
  supplier_name text not null default '',
  amount_paid_to_supplier numeric not null default 0,
  advance_cash_paid numeric not null default 0,
  supplier_balance numeric not null default 0,
  selling_price_per_kg numeric not null default 0,
  selling_rate_per_kg numeric not null default 0,
  total_selling_amount numeric not null default 0,
  additional_expenses numeric not null default 0,
  extra_expenses numeric not null default 0,
  total_cost numeric not null default 0,
  total_revenue numeric not null default 0,
  gross_profit numeric not null default 0,
  net_profit numeric not null default 0,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Settled')),
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'Cheque', 'Credit')),
  advance_settlement_status text not null default 'settled',
  advance_difference numeric not null default 0,
  is_active boolean not null default true,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists buying_selling_stock_created_at_idx
  on buying_selling_stock (created_at desc);

alter table buying_selling_stock enable row level security;

drop policy if exists "buying_selling_stock_anon_all" on buying_selling_stock;
create policy "buying_selling_stock_anon_all" on buying_selling_stock
  for all using (true) with check (true);
