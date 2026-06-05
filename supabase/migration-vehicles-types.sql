-- Restrict vehicle_type to lorry, jeep, car (migrate legacy van/tipper → lorry)
update vehicles set vehicle_type = 'lorry' where vehicle_type in ('van', 'tipper');

alter table vehicles drop constraint if exists vehicles_vehicle_type_check;

alter table vehicles add constraint vehicles_vehicle_type_check
  check (vehicle_type in ('lorry', 'jeep', 'car'));
