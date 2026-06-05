-- Staff registry & payroll
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text not null default '',
  local_address text not null default '',
  role text not null default 'driver' check (role in ('driver', 'helper')),
  photo_url text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists staff_advances (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  amount numeric not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists staff_role_idx on staff(role);
create index if not exists staff_advances_staff_id_idx on staff_advances(staff_id);

alter table staff enable row level security;
alter table staff_advances enable row level security;

drop policy if exists "staff_anon_all" on staff;
create policy "staff_anon_all" on staff for all using (true) with check (true);

drop policy if exists "staff_advances_anon_all" on staff_advances;
create policy "staff_advances_anon_all" on staff_advances for all using (true) with check (true);

-- Storage bucket staff-photos (run in dashboard or via API)
insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "staff_photos_public_read" on storage.objects;
create policy "staff_photos_public_read" on storage.objects for select using (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_anon_insert" on storage.objects;
create policy "staff_photos_anon_insert" on storage.objects for insert with check (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_anon_update" on storage.objects;
create policy "staff_photos_anon_update" on storage.objects for update using (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_anon_delete" on storage.objects;
create policy "staff_photos_anon_delete" on storage.objects for delete using (bucket_id = 'staff-photos');
