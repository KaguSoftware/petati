-- ============================================================================
-- Mandatory phone number on profiles (collected at sign-up or on first sign-in).
-- Stored in E.164 with the ISO alpha-2 country the user picked. One account per number.
-- ============================================================================

alter table public.profiles
  add column phone text,
  add column phone_country char(2),
  add constraint profiles_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  add constraint profiles_phone_country_iso check (phone_country is null or phone_country ~ '^[A-Z]{2}$');

create unique index profiles_phone_key on public.profiles (phone) where phone is not null;

comment on column public.profiles.phone is 'E.164, e.g. +905551234567. Required by the app after first sign-in.';
comment on column public.profiles.phone_country is 'ISO 3166-1 alpha-2 of the dial code chosen, e.g. TR.';

-- Carry phone from sign-up metadata so email-confirm sign-ups (no session yet) get it atomically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, phone, phone_country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(upper(new.raw_user_meta_data->>'phone_country'), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
