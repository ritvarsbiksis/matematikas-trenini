-- Seed data for local development. Runs on `pnpm db:reset`.
--
-- Profiles are created automatically by the `on_auth_user_created` trigger, so seed
-- users through `auth.users` and then fill in the profile fields.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo User"}'
)
on conflict (id) do nothing;

update public.profiles
set username = 'demo'
where id = '00000000-0000-0000-0000-000000000001';
