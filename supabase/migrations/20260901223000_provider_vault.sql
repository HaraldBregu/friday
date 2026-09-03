create table public.provider_vaults (
	owner_id uuid primary key default auth.uid()
		references auth.users (id) on delete cascade,
	vault_id uuid not null unique,
	wrapped_data_key text not null
		check (
			wrapped_data_key ~ '^[A-Za-z0-9+/]{43}=$'
			and octet_length(decode(wrapped_data_key, 'base64')) = 32
		),
	wrapping_nonce text not null
		check (
			wrapping_nonce ~ '^[A-Za-z0-9+/]{16}$'
			and octet_length(decode(wrapping_nonce, 'base64')) = 12
		),
	wrapping_tag text not null
		check (
			wrapping_tag ~ '^[A-Za-z0-9+/]{22}==$'
			and octet_length(decode(wrapping_tag, 'base64')) = 16
		),
	kdf_salt text not null
		check (
			kdf_salt ~ '^[A-Za-z0-9+/]{22}==$'
			and octet_length(decode(kdf_salt, 'base64')) = 16
		),
	kdf_n integer not null default 131072 check (kdf_n = 131072),
	kdf_r smallint not null default 8 check (kdf_r = 8),
	kdf_p smallint not null default 1 check (kdf_p = 1),
	key_version integer not null default 1 check (key_version = 1),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.provider_credentials (
	owner_id uuid not null default auth.uid()
		references public.provider_vaults (owner_id) on delete cascade,
	kind text not null check (kind in ('models', 'databases', 'search')),
	provider_id text not null
		check (
			octet_length(provider_id) <= 128
			and provider_id ~ '^[a-z0-9][a-z0-9._-]*$'
		),
	ciphertext text not null
		check (
			length(ciphertext) % 4 = 0
			and ciphertext ~ '^[A-Za-z0-9+/]+={0,2}$'
			and octet_length(decode(ciphertext, 'base64')) > 0
		),
	nonce text not null
		check (
			nonce ~ '^[A-Za-z0-9+/]{16}$'
			and octet_length(decode(nonce, 'base64')) = 12
		),
	tag text not null
		check (
			tag ~ '^[A-Za-z0-9+/]{22}==$'
			and octet_length(decode(tag, 'base64')) = 16
		),
	key_version integer not null check (key_version = 1),
	client_modified_at timestamptz not null,
	writer_device_id uuid not null,
	server_revision bigint not null default 1 check (server_revision > 0),
	tombstoned_at timestamptz,
	server_modified_at timestamptz not null default now(),
	primary key (owner_id, kind, provider_id)
);

create index provider_credentials_owner_id_idx
on public.provider_credentials (owner_id);

alter table public.provider_vaults enable row level security;
alter table public.provider_credentials enable row level security;

revoke all on table public.provider_vaults, public.provider_credentials
from public, anon, authenticated;

grant select, delete on table public.provider_vaults to authenticated;
grant insert (
	vault_id,
	wrapped_data_key,
	wrapping_nonce,
	wrapping_tag,
	kdf_salt,
	kdf_n,
	kdf_r,
	kdf_p,
	key_version
) on public.provider_vaults to authenticated;
grant update (
	wrapped_data_key,
	wrapping_nonce,
	wrapping_tag,
	kdf_salt,
	kdf_n,
	kdf_r,
	kdf_p
) on public.provider_vaults to authenticated;

grant select on table public.provider_credentials to authenticated;
grant insert (
	kind,
	provider_id,
	ciphertext,
	nonce,
	tag,
	key_version,
	client_modified_at,
	writer_device_id,
	tombstoned_at
) on public.provider_credentials to authenticated;
grant update (
	ciphertext,
	nonce,
	tag,
	key_version,
	client_modified_at,
	writer_device_id,
	tombstoned_at
) on public.provider_credentials to authenticated;

create policy "provider_vaults: owners can read"
on public.provider_vaults for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "provider_vaults: owners can insert"
on public.provider_vaults for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "provider_vaults: owners can update"
on public.provider_vaults for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "provider_vaults: owners can delete"
on public.provider_vaults for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "provider_credentials: owners can read"
on public.provider_credentials for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "provider_credentials: owners can insert"
on public.provider_credentials for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "provider_credentials: owners can update"
on public.provider_credentials for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create trigger provider_vaults_set_updated_at
before update on public.provider_vaults
for each row execute function public.set_updated_at();

create or replace function public.enforce_provider_credential_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
	current_owner_id uuid := auth.uid();
begin
	if current_owner_id is null then
		raise exception using errcode = '42501', message = 'Authentication required';
	end if;

	if tg_op = 'UPDATE' then
		if new.owner_id is distinct from old.owner_id
			or new.kind is distinct from old.kind
			or new.provider_id is distinct from old.provider_id
		then
			raise exception using
				errcode = '22023',
				message = 'Provider credential identity is immutable';
		end if;

		if (new.client_modified_at, new.writer_device_id)
			<= (old.client_modified_at, old.writer_device_id)
		then
			return old;
		end if;
	end if;

	if new.owner_id is distinct from current_owner_id then
		raise exception using errcode = '42501', message = 'Provider credential owner mismatch';
	end if;

	if not exists (
		select 1
		from public.provider_vaults as vault
		where vault.owner_id = current_owner_id
			and vault.key_version = new.key_version
	) then
		raise exception using
			errcode = '22023',
			message = 'Provider credential key version does not match vault';
	end if;

	if tg_op = 'INSERT' then
		new.server_revision := 1;
	else
		new.server_revision := old.server_revision + 1;
	end if;
	new.server_modified_at := statement_timestamp();
	return new;
end;
$$;

create trigger provider_credentials_enforce_write
before insert or update on public.provider_credentials
for each row execute function public.enforce_provider_credential_write();

revoke all on function public.enforce_provider_credential_write()
from public, anon, authenticated;

create or replace function public.sync_provider_credential(
	p_kind text,
	p_provider_id text,
	p_ciphertext text,
	p_nonce text,
	p_tag text,
	p_key_version integer,
	p_client_modified_at timestamptz,
	p_writer_device_id uuid,
	p_tombstoned_at timestamptz default null
)
returns public.provider_credentials
language plpgsql
security invoker
set search_path = ''
as $$
declare
	current_owner_id uuid := auth.uid();
	canonical public.provider_credentials%rowtype;
begin
	if current_owner_id is null then
		raise exception using errcode = '42501', message = 'Authentication required';
	end if;

	insert into public.provider_credentials as credential (
		kind,
		provider_id,
		ciphertext,
		nonce,
		tag,
		key_version,
		client_modified_at,
		writer_device_id,
		tombstoned_at
	)
	values (
		p_kind,
		p_provider_id,
		p_ciphertext,
		p_nonce,
		p_tag,
		p_key_version,
		p_client_modified_at,
		p_writer_device_id,
		p_tombstoned_at
	)
	on conflict (owner_id, kind, provider_id) do update
	set
		ciphertext = excluded.ciphertext,
		nonce = excluded.nonce,
		tag = excluded.tag,
		key_version = excluded.key_version,
		client_modified_at = excluded.client_modified_at,
		writer_device_id = excluded.writer_device_id,
		tombstoned_at = excluded.tombstoned_at
	where (excluded.client_modified_at, excluded.writer_device_id)
		> (credential.client_modified_at, credential.writer_device_id)
	returning credential.* into canonical;

	if not found then
		select credential.*
		into canonical
		from public.provider_credentials as credential
		where credential.owner_id = current_owner_id
			and credential.kind = p_kind
			and credential.provider_id = p_provider_id;
	end if;

	if not found then
		raise exception using
			errcode = '40001',
			message = 'Provider credential reconciliation failed';
	end if;

	return canonical;
end;
$$;

revoke all on function public.sync_provider_credential(
	text,
	text,
	text,
	text,
	text,
	integer,
	timestamptz,
	uuid,
	timestamptz
) from public, anon, authenticated;

grant execute on function public.sync_provider_credential(
	text,
	text,
	text,
	text,
	text,
	integer,
	timestamptz,
	uuid,
	timestamptz
) to authenticated;
