-- Day Cash log (independent from P&L / stock metrics)

create table if not exists day_cash_log (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null default '',
  transaction_type text not null check (transaction_type in ('Deposit', 'Withdrawal')),
  amount numeric not null default 0 check (amount >= 0),
  description text not null default '',
  transaction_date date not null default current_date,
  transaction_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists day_cash_log_transaction_date_idx
  on day_cash_log (transaction_date desc);

create index if not exists day_cash_log_active_date_idx
  on day_cash_log (is_active, transaction_date desc);

alter table day_cash_log enable row level security;

drop policy if exists "day_cash_log_anon_all" on day_cash_log;
create policy "day_cash_log_anon_all" on day_cash_log
  for all using (true) with check (true);
