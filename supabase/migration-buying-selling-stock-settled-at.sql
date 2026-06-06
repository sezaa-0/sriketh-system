-- Add settled_at timestamp for buying & selling stock settlements

alter table buying_selling_stock
  add column if not exists settled_at timestamptz;
