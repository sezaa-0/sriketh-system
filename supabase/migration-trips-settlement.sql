-- Trip advance settlement tracking (inward / buying loads)
alter table trips add column if not exists actual_weight numeric;
alter table trips add column if not exists buying_price_per_kg numeric;
alter table trips add column if not exists advance_paid numeric not null default 0;
alter table trips add column if not exists supplier_name text not null default '';
alter table trips add column if not exists settlement_status text not null default 'completed';

alter table trips drop constraint if exists trips_settlement_status_check;
alter table trips
  add constraint trips_settlement_status_check
  check (settlement_status in ('pending_receivable', 'pending_payable', 'completed'));

-- Backfill weight/rate from legacy columns where unset
update trips
set
  actual_weight = coalesce(actual_weight, total_kg),
  buying_price_per_kg = coalesce(buying_price_per_kg, price_per_kg)
where actual_weight is null or buying_price_per_kg is null;

create index if not exists trips_settlement_status_idx on trips (settlement_status);
create index if not exists trips_inward_settlement_idx on trips (trip_type, settlement_status);
