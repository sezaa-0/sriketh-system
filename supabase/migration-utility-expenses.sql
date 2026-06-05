-- Utility / overhead expenses (warehouse bills)
create table if not exists utility_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_type text not null default 'electricity'
    check (expense_type in ('electricity', 'water', 'warehouse_maintenance')),
  warehouse_name text not null default 'ගබඩාව 01'
    check (warehouse_name in (
      'ගබඩාව 01', 'ගබඩාව 02', 'ගබඩාව 03',
      'ගබඩාව 04', 'ගබඩාව 05', 'ගබඩාව 06'
    )),
  bill_number text not null default '',
  billing_date date,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists utility_expenses_billing_date_idx on utility_expenses(billing_date desc);
create index if not exists utility_expenses_warehouse_idx on utility_expenses(warehouse_name);
create index if not exists utility_expenses_type_idx on utility_expenses(expense_type);
create index if not exists utility_expenses_created_at_idx on utility_expenses(created_at desc);

alter table utility_expenses enable row level security;

drop policy if exists "utility_expenses_anon_all" on utility_expenses;
create policy "utility_expenses_anon_all" on utility_expenses for all using (true) with check (true);
