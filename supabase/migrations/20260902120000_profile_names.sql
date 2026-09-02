alter table public.profiles
	add column first_name text not null default '',
	add column last_name text not null default '',
	add constraint profiles_first_name_length_check check (char_length(first_name) <= 80),
	add constraint profiles_last_name_length_check check (char_length(last_name) <= 80);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	insert into public.profiles (id, display_name, first_name, last_name, avatar_path)
	values (
		new.id,
		new.raw_user_meta_data ->> 'display_name',
		coalesce(
			new.raw_user_meta_data ->> 'first_name',
			new.raw_user_meta_data ->> 'given_name',
			''
		),
		coalesce(
			new.raw_user_meta_data ->> 'last_name',
			new.raw_user_meta_data ->> 'family_name',
			''
		),
		new.raw_user_meta_data ->> 'avatar_path'
	);
	return new;
end;
$$;
