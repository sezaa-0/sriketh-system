-- Bank loans & repayments
create table if not exists bank_loans (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null default '',
  loan_amount numeric not null default 0,
  duration_months integer not null default 0,
  interest_rate numeric not null default 0,
  interest_type text not null default 'monthly' check (interest_type in ('monthly', 'yearly')),
  started_date date,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references bank_loans(id) on delete cascade,
  paid_amount numeric not null default 0,
  payment_date date,
  created_at timestamptz not null default now()
);

create index if not exists bank_loans_status_idx on bank_loans(status);
create index if not exists bank_loans_started_date_idx on bank_loans(started_date desc);
create index if not exists loan_repayments_loan_id_idx on loan_repayments(loan_id);

alter table bank_loans enable row level security;
alter table loan_repayments enable row level security;

drop policy if exists "bank_loans_anon_all" on bank_loans;
create policy "bank_loans_anon_all" on bank_loans for all using (true) with check (true);

drop policy if exists "loan_repayments_anon_all" on loan_repayments;
create policy "loan_repayments_anon_all" on loan_repayments for all using (true) with check (true);
