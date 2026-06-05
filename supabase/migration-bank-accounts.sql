-- Registered bank accounts for deposit logging
create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null default 'BOC'
    check (bank_name in (
      'BOC',
      'Sampath Bank',
      'HNB',
      'Commercial Bank',
      'Peoples Bank'
    )),
  account_name text not null default '',
  account_number text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bank_accounts_bank_name_idx on bank_accounts(bank_name);
create index if not exists bank_accounts_created_at_idx on bank_accounts(created_at desc);

alter table bank_accounts enable row level security;

drop policy if exists "bank_accounts_anon_all" on bank_accounts;
create policy "bank_accounts_anon_all" on bank_accounts for all using (true) with check (true);
