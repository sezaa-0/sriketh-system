-- MICR line fields for cheques
alter table cheques add column if not exists bank_code text not null default '';
alter table cheques add column if not exists branch_code text not null default '';
alter table cheques add column if not exists account_number text not null default '';
