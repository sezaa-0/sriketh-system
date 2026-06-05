-- Split vehicle_number into province_code, series_code, sequence_number
alter table vehicles add column if not exists province_code text not null default '';
alter table vehicles add column if not exists series_code text not null default '';
alter table vehicles add column if not exists sequence_number text not null default '';

-- Best-effort parse legacy vehicle_number (WP GA-1234)
update vehicles
set
  province_code = coalesce(
    nullif(upper(substring(vehicle_number from '^([A-Za-z]{1,2})')), ''),
    province_code
  ),
  series_code = coalesce(
    nullif(upper(substring(vehicle_number from '^[A-Za-z]{1,2}\s+([A-Za-z0-9]{1,3})')), ''),
    series_code
  ),
  sequence_number = coalesce(
    nullif(substring(vehicle_number from '(\d{1,4})$'), ''),
    sequence_number
  )
where vehicle_number is not null and vehicle_number <> '';

alter table vehicles drop column if exists vehicle_number;

drop index if exists vehicles_vehicle_number_idx;
create index if not exists vehicles_plate_idx on vehicles(province_code, series_code, sequence_number);
