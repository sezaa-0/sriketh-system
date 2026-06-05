-- Bank deposit logger (SMS / transfer alerts)
create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null default 'BOC'
    check (bank_name in (
      'BOC', 'Sampath Bank', 'HNB', 'Commercial Bank', 'Peoples Bank'
    )),
  account_name text not null default '',
  account_number text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists bank_deposits (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references bank_accounts(id) on delete restrict,
  amount numeric not null default 0,
  deposited_at timestamptz not null default now(),
  reference_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bank_accounts_created_at_idx on bank_accounts(created_at desc);
create index if not exists bank_deposits_deposited_at_idx on bank_deposits(deposited_at desc);
create index if not exists bank_deposits_bank_account_id_idx on bank_deposits(bank_account_id);

alter table bank_accounts enable row level security;
alter table bank_deposits enable row level security;

drop policy if exists "bank_accounts_anon_all" on bank_accounts;
create policy "bank_accounts_anon_all" on bank_accounts for all using (true) with check (true);

drop policy if exists "bank_deposits_anon_all" on bank_deposits;
create policy "bank_deposits_anon_all" on bank_deposits for all using (true) with check (true);
