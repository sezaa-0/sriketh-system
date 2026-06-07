-- Extend buying_selling_stock commodity types: Rice, Black Seed

alter table buying_selling_stock
  drop constraint if exists buying_selling_stock_commodity_type_check;

alter table buying_selling_stock
  add constraint buying_selling_stock_commodity_type_check
  check (commodity_type in ('Paddy', 'Maize', 'Rice', 'Black Seed'));
