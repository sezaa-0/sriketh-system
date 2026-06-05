-- Link lorry hires to staff registry (drivers & helpers)
alter table lorry_hires add column if not exists driver_id uuid references staff(id) on delete set null;
alter table lorry_hires add column if not exists helper_id uuid references staff(id) on delete set null;

create index if not exists lorry_hires_driver_id_idx on lorry_hires(driver_id);
create index if not exists lorry_hires_helper_id_idx on lorry_hires(helper_id);
