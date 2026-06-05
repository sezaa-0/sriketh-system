-- Migrate item_type from English to Sinhala (run if table already exists)

alter table loads drop constraint if exists loads_item_type_check;

update loads set item_type = trim(item_type);
update loads set item_type = 'වී' where item_type in ('Paddy', 'paddy', 'වී ');
update loads set item_type = 'බඩඉරිඟු' where item_type in ('Maize', 'maize', 'බඩ ඉරිඟු', 'බඩඉරිඟු ');

alter table loads
  add constraint loads_item_type_check
  check (item_type in ('වී', 'බඩඉරිඟු'));
