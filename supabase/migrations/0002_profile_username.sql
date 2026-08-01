-- `username` becomes user-editable in this release; tighten it accordingly.

-- Case-insensitive uniqueness: replace the plain unique constraint with a
-- functional unique index so `Alice` and `alice` cannot both exist.
alter table public.profiles drop constraint if exists profiles_username_key;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Format: 3-30 chars, letters/digits/underscore. Supersedes `username_length`.
alter table public.profiles drop constraint if exists username_length;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$');
