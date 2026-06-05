-- Cheque tracker
create table if not exists cheques (
  id uuid primary key default gen_random_uuid(),
  cheque_number text not null default '',
  bank_name text not null default '',
  branch_name text not null default '',
  amount numeric not null default 0,
  settle_date date,
  cheque_type text not null default 'received' check (cheque_type in ('received', 'issued')),
  status text not null default 'pending' check (status in ('pending', 'settled', 'returned')),
  created_at timestamptz not null default now()
);

create index if not exists cheques_status_idx on cheques(status);
create index if not exists cheques_settle_date_idx on cheques(settle_date);
create index if not exists cheques_created_at_idx on cheques(created_at desc);

alter table cheques enable row level security;

drop policy if exists "cheques_anon_all" on cheques;
create policy "cheques_anon_all" on cheques for all using (true) with check (true);
