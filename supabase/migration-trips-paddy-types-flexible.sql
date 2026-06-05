-- Allow custom paddy types on trips (e.g. රතු වී, නාඩු)
alter table trips drop constraint if exists trips_paddy_type_check;
