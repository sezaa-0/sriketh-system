-- Link deposits to registered bank_accounts
alter table bank_deposits add column if not exists bank_account_id uuid
  references bank_accounts(id) on delete restrict;

-- Optional: drop legacy free-text bank column after migration
-- alter table bank_deposits drop column if exists bank_account;

create index if not exists bank_deposits_bank_account_id_idx on bank_deposits(bank_account_id);
