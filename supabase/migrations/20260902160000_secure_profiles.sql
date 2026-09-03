create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text,
	first_name text not null default '',
	last_name text not null default '',
	avatar_path text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint profiles_first_name_length_check check (char_length(first_name) <= 80),
	constraint profiles_last_name_length_check check (char_length(last_name) <= 80)
);

alter table public.profiles
	add column if not exists display_name text,
	add column if not exists first_name text default '',
	add column if not exists last_name text default '',
	add column if not exists avatar_path text,
	add column if not exists created_at timestamptz default now(),
	add column if not exists updated_at timestamptz default now();

update public.profiles
set
	first_name = coalesce(first_name, ''),
	last_name = coalesce(last_name, ''),
	created_at = coalesce(created_at, now()),
	updated_at = coalesce(updated_at, now())
where first_name is null
	or last_name is null
	or created_at is null
	or updated_at is null;

alter table public.profiles
	alter column first_name set default '',
	alter column first_name set not null,
	alter column last_name set default '',
	alter column last_name set not null,
	alter column created_at set default now(),
	alter column created_at set not null,
	alter column updated_at set default now(),
	alter column updated_at set not null,
	drop constraint if exists profiles_first_name_length_check,
	drop constraint if exists profiles_last_name_length_check,
	add constraint profiles_first_name_length_check check (char_length(first_name) <= 80),
	add constraint profiles_last_name_length_check check (char_length(last_name) <= 80);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, first_name, last_name, avatar_path)
on table public.profiles to authenticated;

drop policy if exists "profiles: owners can read" on public.profiles;
create policy "profiles: owners can read"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles: owners can update" on public.profiles;
create policy "profiles: owners can update"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	insert into public.profiles (id, display_name, first_name, last_name, avatar_path)
	values (
		new.id,
		new.raw_user_meta_data ->> 'display_name',
		left(
			btrim(
				coalesce(
					new.raw_user_meta_data ->> 'first_name',
					new.raw_user_meta_data ->> 'given_name',
					''
				)
			),
			80
		),
		left(
			btrim(
				coalesce(
					new.raw_user_meta_data ->> 'last_name',
					new.raw_user_meta_data ->> 'family_name',
					''
				)
			),
			80
		),
		new.raw_user_meta_data ->> 'avatar_path'
	)
	on conflict (id) do nothing;
	return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles as profile (id, display_name, first_name, last_name, avatar_path)
select
	users.id,
	users.raw_user_meta_data ->> 'display_name',
	left(
		btrim(
			coalesce(
				users.raw_user_meta_data ->> 'first_name',
				users.raw_user_meta_data ->> 'given_name',
				''
			)
		),
		80
	),
	left(
		btrim(
			coalesce(
				users.raw_user_meta_data ->> 'last_name',
				users.raw_user_meta_data ->> 'family_name',
				''
			)
		),
		80
	),
	users.raw_user_meta_data ->> 'avatar_path'
from auth.users as users
on conflict (id) do update
set
	display_name = coalesce(profile.display_name, excluded.display_name),
	first_name = case
		when profile.first_name = '' then excluded.first_name
		else profile.first_name
	end,
	last_name = case
		when profile.last_name = '' then excluded.last_name
		else profile.last_name
	end,
	avatar_path = coalesce(profile.avatar_path, excluded.avatar_path);

notify pgrst, 'reload schema';
