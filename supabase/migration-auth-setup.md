# Authentication Setup — Dynamic Username (localStorage)

## Supabase user (password only)

1. Open **Supabase Dashboard → Authentication → Users → Add user**
2. Email: `user@system.com`
3. Password: set the uncle's initial password (changeable later in **Account Settings**)

No Supabase user metadata is required. The **login username** is stored on this device in `localStorage` under `custom_sys_username` (default: `uncle`).

## Sign in

| Account | Username | Password |
|---------|----------|----------|
| Dynamic user | Value in `custom_sys_username` (default `uncle`) | Supabase password for `user@system.com` |
| Administrator backdoor | `admin` | `1234` |

## Change username

Dashboard → **Account Settings** → **Change Username** → saves to `localStorage` and updates the active session display immediately.

## Sessions

Auth cookies are **session cookies** (no persistent expiry). Closing the browser ends the session and requires sign-in again.
