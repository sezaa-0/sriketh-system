-- Buying & Selling Stock v3: separate buying_weight and selling_weight
-- Run after migration-buying-selling-stock-v2.sql

alter table public.buying_selling_stock
  add column if not exists buying_weight numeric(14, 2) default 0,
  add column if not exists selling_weight numeric(14, 2) default 0;

update public.buying_selling_stock
set
  buying_weight = case
    when coalesce(buying_weight, 0) = 0 then coalesce(nullif(total_kg, 0), buying_weight_kg, 0)
    else buying_weight
  end,
  selling_weight = case
    when coalesce(selling_weight, 0) = 0 then coalesce(nullif(total_kg, 0), buying_weight_kg, 0)
    else selling_weight
  end;
