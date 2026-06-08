# Authentication Setup — Database-Backed Username

## Custom login username

The expected login username is stored in Supabase:

- **Table:** `app_settings`
- **Row:** `id = 1`
- **Column:** `custom_username` (default: `uncle`)

Run `supabase/migration-app-settings.sql` in the Supabase SQL editor before using Account Settings or dynamic login.

## Sign in flow

1. Client fetches `custom_username` from `app_settings` (fallback: `uncle`).
2. Entered username must match that value (or use the fixed `admin` backdoor).
3. Password is validated via Supabase Auth for `user@system.com`.

## Account Settings

Dashboard → **Account Settings** → **Change Username** updates `app_settings.custom_username` where `id = 1`.

Password changes use `supabase.auth.updateUser({ password })` via `/api/auth/update-profile`.

## Supabase auth user

Create one auth user for the ERP operator:

- **Email:** `user@system.com`
- **Password:** set during initial setup

See earlier migration notes for RLS and session cookie behaviour.
