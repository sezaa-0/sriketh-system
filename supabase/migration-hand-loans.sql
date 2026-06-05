-- Hand loans (අත් මුදල්)
create table if not exists hand_loans (
  id uuid primary key default gen_random_uuid(),
  person_name text not null default '',
  amount numeric not null default 0,
  description text not null default '',
  loan_type text not null default 'receivable' check (loan_type in ('receivable', 'payable')),
  is_settled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists hand_loans_active_idx on hand_loans (is_settled, loan_type);
create index if not exists hand_loans_created_at_idx on hand_loans (created_at desc);

alter table hand_loans enable row level security;

drop policy if exists "hand_loans_anon_all" on hand_loans;
create policy "hand_loans_anon_all" on hand_loans for all using (true) with check (true);
