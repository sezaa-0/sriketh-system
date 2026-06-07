-- Buying & Selling Stock v2: separate buying/selling fields + buyer payment tracking
-- Run after migration-buying-selling-stock.sql

alter table public.buying_selling_stock
  add column if not exists vehicle_no text,
  add column if not exists variety text,
  add column if not exists total_kg numeric(14, 2) default 0,
  add column if not exists buying_price_per_kg numeric(14, 2) default 0,
  add column if not exists total_buying_amount numeric(14, 2) default 0,
  add column if not exists supplier_name text default '',
  add column if not exists amount_paid_to_supplier numeric(14, 2) default 0,
  add column if not exists supplier_balance numeric(14, 2) default 0,
  add column if not exists selling_price_per_kg numeric(14, 2) default 0,
  add column if not exists total_selling_amount numeric(14, 2) default 0,
  add column if not exists payment_status text default 'Pending',
  add column if not exists payment_method text default 'Cash';

-- Backfill from legacy columns
update public.buying_selling_stock
set
  vehicle_no = coalesce(nullif(trim(vehicle_no), ''), lorry_number),
  variety = coalesce(nullif(trim(variety), ''), paddy_variety),
  total_kg = case when coalesce(total_kg, 0) = 0 then buying_weight_kg else total_kg end,
  buying_price_per_kg = case when coalesce(buying_price_per_kg, 0) = 0 then buying_rate_per_kg else buying_price_per_kg end,
  total_buying_amount = case when coalesce(total_buying_amount, 0) = 0 then total_cost else total_buying_amount end,
  amount_paid_to_supplier = case when coalesce(amount_paid_to_supplier, 0) = 0 then advance_cash_paid else amount_paid_to_supplier end,
  selling_price_per_kg = case when coalesce(selling_price_per_kg, 0) = 0 then selling_rate_per_kg else selling_price_per_kg end,
  total_selling_amount = case when coalesce(total_selling_amount, 0) = 0 then total_revenue else total_selling_amount end,
  supplier_balance = coalesce(total_buying_amount, total_cost, 0) - coalesce(amount_paid_to_supplier, advance_cash_paid, 0),
  payment_status = case
    when payment_status in ('Pending', 'Settled') then payment_status
    when advance_settlement_status = 'settled' then 'Settled'
    else 'Pending'
  end,
  payment_method = case
    when payment_method in ('Cash', 'Cheque', 'Credit') then payment_method
    else 'Cash'
  end;

-- Payment status constraint
alter table public.buying_selling_stock
  drop constraint if exists buying_selling_stock_payment_status_check;

alter table public.buying_selling_stock
  add constraint buying_selling_stock_payment_status_check
  check (payment_status in ('Pending', 'Settled'));

-- Payment method constraint
alter table public.buying_selling_stock
  drop constraint if exists buying_selling_stock_payment_method_check;

alter table public.buying_selling_stock
  add constraint buying_selling_stock_payment_method_check
  check (payment_method in ('Cash', 'Cheque', 'Credit'));
