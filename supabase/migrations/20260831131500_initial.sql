create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text,
	avatar_path text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.chat_sessions (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	title text not null default 'New chat',
	model text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint chat_sessions_id_owner_key unique (id, owner_id)
);

create table public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null,
	owner_id uuid not null default auth.uid(),
	ordinal bigint not null check (ordinal >= 0),
	role text not null check (role in ('system', 'user', 'assistant')),
	content jsonb not null,
	tool_calls jsonb not null default '[]'::jsonb,
	usage jsonb,
	created_at timestamptz not null default now(),
	constraint chat_messages_session_owner_fkey
		foreign key (session_id, owner_id)
		references public.chat_sessions (id, owner_id) on delete cascade,
	constraint chat_messages_session_ordinal_key unique (session_id, ordinal)
);

create table public.files (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null,
	owner_id uuid not null default auth.uid(),
	object_path text not null unique,
	file_name text not null,
	mime_type text not null,
	size_bytes bigint not null check (size_bytes >= 0),
	created_at timestamptz not null default now(),
	constraint files_session_owner_fkey
		foreign key (session_id, owner_id)
		references public.chat_sessions (id, owner_id) on delete cascade,
	constraint files_owner_path_check check (object_path like owner_id::text || '/%')
);

create index chat_sessions_owner_id_idx on public.chat_sessions (owner_id);
create index chat_messages_owner_id_idx on public.chat_messages (owner_id);
create index chat_messages_session_id_idx on public.chat_messages (session_id);
create index files_owner_id_idx on public.files (owner_id);
create index files_session_id_idx on public.files (session_id);

alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.files enable row level security;

revoke all on table public.profiles, public.chat_sessions, public.chat_messages, public.files
from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.chat_sessions, public.chat_messages, public.files
to authenticated;

create policy "profiles: owners can read"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles: owners can update"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "chat_sessions: owners can read"
on public.chat_sessions for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "chat_sessions: owners can insert"
on public.chat_sessions for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "chat_sessions: owners can update"
on public.chat_sessions for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "chat_sessions: owners can delete"
on public.chat_sessions for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "chat_messages: owners can read"
on public.chat_messages for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "chat_messages: owners can insert"
on public.chat_messages for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "chat_messages: owners can update"
on public.chat_messages for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "chat_messages: owners can delete"
on public.chat_messages for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "files: owners can read"
on public.files for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "files: owners can insert"
on public.files for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "files: owners can update"
on public.files for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "files: owners can delete"
on public.files for delete to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	insert into public.profiles (id, display_name, avatar_path)
	values (
		new.id,
		new.raw_user_meta_data ->> 'display_name',
		new.raw_user_meta_data ->> 'avatar_path'
	);
	return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do update set public = false;

create policy "user-files: owners can read"
on storage.objects for select to authenticated
using (
	bucket_id = 'user-files'
	and owner_id = (select auth.uid())::text
);

create policy "user-files: owners can insert"
on storage.objects for insert to authenticated
with check (
	bucket_id = 'user-files'
	and owner_id = (select auth.uid())::text
	and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "user-files: owners can update"
on storage.objects for update to authenticated
using (
	bucket_id = 'user-files'
	and owner_id = (select auth.uid())::text
)
with check (
	bucket_id = 'user-files'
	and owner_id = (select auth.uid())::text
	and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "user-files: owners can delete"
on storage.objects for delete to authenticated
using (
	bucket_id = 'user-files'
	and owner_id = (select auth.uid())::text
);

create policy "chat broadcasts: owners can receive"
on realtime.messages for select to authenticated
using (
	realtime.messages.extension = 'broadcast'
	and exists (
		select 1
		from public.chat_sessions
		where owner_id = (select auth.uid())
		and 'chat:' || id::text = (select realtime.topic())
	)
);

create policy "chat broadcasts: owners can send"
on realtime.messages for insert to authenticated
with check (
	realtime.messages.extension = 'broadcast'
	and exists (
		select 1
		from public.chat_sessions
		where owner_id = (select auth.uid())
		and 'chat:' || id::text = (select realtime.topic())
	)
);

create or replace function public.broadcast_chat_message_changes()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	perform realtime.broadcast_changes(
		'chat:' || coalesce(new.session_id, old.session_id)::text,
		tg_op,
		tg_op,
		tg_table_name,
		tg_table_schema,
		new,
		old
	);
	return null;
end;
$$;

create trigger broadcast_chat_message_changes
after insert or update or delete on public.chat_messages
for each row execute function public.broadcast_chat_message_changes();
