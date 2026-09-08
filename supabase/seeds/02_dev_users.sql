-- ============================================================================
-- LOCAL-ONLY demo users. Never push this file to a hosted project.
-- Local development seed. Runs after migrations on `supabase db reset`.
-- GoTrue cannot scan NULL token columns, so every manual insert sets them to '' (else sign-in
-- fails with "Database error querying schema").
-- Demo users (password for all: "password123"):
--   owner@petati.local    platform owner (sees hidden multi-store UI when FEATURE_MULTI_STORE=true)
--   manager@petati.local  manager of the "default" store
--   staff@petati.local    staff of the "default" store
--   customer@petati.local a shopper
-- ============================================================================
set client_min_messages to warning;

-- ---------- auth users ----------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'owner@petati.local', crypt('password123', gen_salt('bf')), now(),
   '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Olivia Owner","phone":"+905550000001","phone_country":"TR"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'manager@petati.local', crypt('password123', gen_salt('bf')), now(),
   '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Mehmet Manager","phone":"+905550000002","phone_country":"TR"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'staff@petati.local', crypt('password123', gen_salt('bf')), now(),
   '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Staff","phone":"+905550000003","phone_country":"TR"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'customer@petati.local', crypt('password123', gen_salt('bf')), now(),
   '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Cem Customer","phone":"+905550000004","phone_country":"TR"}', now(), now());

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u where u.email like '%@petati.local';

update public.profiles set platform_role = 'owner' where id = '00000000-0000-0000-0000-000000000001';

insert into public.store_members (store_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'manager'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'staff');

insert into public.customers (store_id, user_id, email, full_name) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'customer@petati.local', 'Cem Customer');

-- ---------- a couple of approved reviews ----------
insert into public.reviews (store_id, product_id, user_id, rating, title, body, status, is_verified_purchase)
select p.store_id, p.id, '00000000-0000-0000-0000-000000000004', 5, 'Great quality',
       'My dog has not put it down since it arrived.', 'approved', true
from public.products p where p.slug in ('rope-tug-toy', 'orthopedic-dog-bed');

-- Link the demo owner to the seeded store (created_by is null in 01_store.sql so that file is environment-agnostic).
update public.stores set created_by = '00000000-0000-0000-0000-000000000001' where slug = 'default';
