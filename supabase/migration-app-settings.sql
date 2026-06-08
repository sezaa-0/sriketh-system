-- App settings: database-backed custom login username

create table if not exists public.app_settings (
  id integer primary key,
  custom_username text not null default 'uncle',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, custom_username)
values (1, 'uncle')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_anon_all" on public.app_settings;
create policy "app_settings_anon_all" on public.app_settings
  for all using (true) with check (true);
