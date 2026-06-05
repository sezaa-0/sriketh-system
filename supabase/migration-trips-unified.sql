-- Migrate from loads-based schema to unified trips table
-- Review before running on production data

-- Option A: fresh start (dev)
-- drop table if exists trips cascade;
-- drop table if exists loads cascade;
-- then run schema.sql

-- Option B: extend existing trips if it had load_id only
-- alter table trips drop constraint if exists trips_load_id_fkey;
-- alter table trips drop column if exists load_id;

alter table trips drop constraint if exists trips_trip_type_check;
alter table trips drop constraint if exists trips_item_type_check;

-- Add missing columns if upgrading old trips table
alter table trips add column if not exists trip_reference text unique;
alter table trips add column if not exists paddy_type text;
alter table trips add column if not exists warehouse_name text default '';
alter table trips add column if not exists buyer_name text;
alter table trips add column if not exists helper_names text default '';
alter table trips add column if not exists total_kg numeric default 0;
alter table trips add column if not exists price_per_kg numeric default 0;

-- Map legacy columns if they exist
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='trips' and column_name='item_type') then
    update trips set paddy_type = item_type where paddy_type is null;
  end if;
end $$;

update trips set trip_type = 'බඩු ගේන්න' where trip_type in ('Inward', 'inward');
update trips set trip_type = 'බඩු බාන්න' where trip_type in ('Outward', 'outward');

alter table trips
  add constraint trips_trip_type_check
  check (trip_type in ('බඩු ගේන්න', 'බඩු බාන්න'));

alter table trips
  add constraint trips_paddy_type_check
  check (paddy_type in ('වී', 'බඩඉරිඟු'));
