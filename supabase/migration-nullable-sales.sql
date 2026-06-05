-- Run if loads table already exists with NOT NULL sales columns

alter table loads alter column selling_price_per_kg drop not null;
alter table loads alter column buyer_name drop not null;

alter table loads alter column selling_price_per_kg drop default;
update loads set selling_price_per_kg = null where selling_price_per_kg = 0;
update loads set buyer_name = null where buyer_name = '';
