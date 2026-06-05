-- driver_name for lorry_hires (02 කොටස)
alter table lorry_hires
  add column if not exists driver_name text not null default '';
