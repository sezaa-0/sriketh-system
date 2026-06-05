-- Link helpers on lorry hires for staff cross-reference
alter table lorry_hires add column if not exists helper_names text not null default '';
