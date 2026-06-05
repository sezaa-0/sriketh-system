-- Partial payments for lorry_hires
alter table lorry_hires
  add column if not exists paid_amount numeric not null default 0;
