begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

set local role postgres;

insert into auth.users (
	id,
	aud,
	role,
	email,
	encrypted_password,
	raw_app_meta_data,
	raw_user_meta_data,
	created_at,
	updated_at
)
values
	(
		'11111111-1111-4111-8111-111111111111',
		'authenticated',
		'authenticated',
		'vault-owner@example.test',
		'',
		'{}',
		'{}',
		now(),
		now()
	),
	(
		'22222222-2222-4222-8222-222222222222',
		'authenticated',
		'authenticated',
		'vault-other@example.test',
		'',
		'{}',
		'{}',
		now(),
		now()
	);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
	$$
		insert into public.provider_vaults (
			vault_id,
			wrapped_data_key,
			wrapping_nonce,
			wrapping_tag,
			kdf_salt
		)
		values (
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			encode(decode(repeat('00', 32), 'hex'), 'base64'),
			encode(decode(repeat('00', 12), 'hex'), 'base64'),
			encode(decode(repeat('00', 16), 'hex'), 'base64'),
			encode(decode(repeat('11', 16), 'hex'), 'base64')
		)
		returning owner_id
	$$,
	$$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
	'owner creates one vault with server-derived ownership'
);

select lives_ok(
	$$
		update public.provider_vaults
		set
			wrapped_data_key = encode(decode(repeat('22', 32), 'hex'), 'base64'),
			kdf_salt = encode(decode(repeat('33', 16), 'hex'), 'base64')
		where vault_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
	$$,
	'owner can rewrap the same data key'
);

select results_eq(
	$$
		select server_revision, ciphertext
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('cipher-one', 'UTF8'), 'base64'),
			encode(decode(repeat('01', 12), 'hex'), 'base64'),
			encode(decode(repeat('01', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:01Z',
			'33333333-3333-4333-8333-333333333333',
			null
		)
	$$,
	$$ values (1::bigint, encode(convert_to('cipher-one', 'UTF8'), 'base64')) $$,
	'first sync write starts at revision one'
);

select results_eq(
	$$
		select server_revision, ciphertext
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('cipher-two', 'UTF8'), 'base64'),
			encode(decode(repeat('02', 12), 'hex'), 'base64'),
			encode(decode(repeat('02', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:02Z',
			'33333333-3333-4333-8333-333333333333',
			null
		)
	$$,
	$$ values (2::bigint, encode(convert_to('cipher-two', 'UTF8'), 'base64')) $$,
	'a newer client timestamp wins and increments revision'
);

select results_eq(
	$$
		select server_revision, ciphertext
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('stale', 'UTF8'), 'base64'),
			encode(decode(repeat('03', 12), 'hex'), 'base64'),
			encode(decode(repeat('03', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:01Z',
			'99999999-9999-4999-8999-999999999999',
			null
		)
	$$,
	$$ values (2::bigint, encode(convert_to('cipher-two', 'UTF8'), 'base64')) $$,
	'an older timestamp returns the canonical winner'
);

select results_eq(
	$$
		select server_revision, ciphertext
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('writer-wins', 'UTF8'), 'base64'),
			encode(decode(repeat('04', 12), 'hex'), 'base64'),
			encode(decode(repeat('04', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:02Z',
			'44444444-4444-4444-8444-444444444444',
			null
		)
	$$,
	$$ values (3::bigint, encode(convert_to('writer-wins', 'UTF8'), 'base64')) $$,
	'a greater writer id breaks equal-timestamp ties'
);

select results_eq(
	$$
		select server_revision, tombstoned_at
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('empty-tombstone', 'UTF8'), 'base64'),
			encode(decode(repeat('05', 12), 'hex'), 'base64'),
			encode(decode(repeat('05', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:03Z',
			'33333333-3333-4333-8333-333333333333',
			'2026-09-01T00:00:03Z'
		)
	$$,
	$$ values (4::bigint, '2026-09-01T00:00:03Z'::timestamptz) $$,
	'a newer deletion becomes a retained tombstone'
);

select results_eq(
	$$
		select server_revision, tombstoned_at
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('old-live-value', 'UTF8'), 'base64'),
			encode(decode(repeat('06', 12), 'hex'), 'base64'),
			encode(decode(repeat('06', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:02Z',
			'99999999-9999-4999-8999-999999999999',
			null
		)
	$$,
	$$ values (4::bigint, '2026-09-01T00:00:03Z'::timestamptz) $$,
	'an older live value cannot resurrect a tombstone'
);

select results_eq(
	$$
		update public.provider_credentials
		set
			ciphertext = encode(convert_to('direct-stale', 'UTF8'), 'base64'),
			client_modified_at = '2026-09-01T00:00:01Z',
			writer_device_id = '99999999-9999-4999-8999-999999999999'
		where kind = 'models' and provider_id = 'openai'
		returning server_revision, tombstoned_at
	$$,
	$$ values (4::bigint, '2026-09-01T00:00:03Z'::timestamptz) $$,
	'the trigger also rejects stale direct table updates'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select results_eq(
	$$
		select
			(select count(*) from public.provider_vaults)::bigint,
			(select count(*) from public.provider_credentials)::bigint
	$$,
	$$ values (0::bigint, 0::bigint) $$,
	'another user cannot read the owner vault or credentials'
);

select results_eq(
	$$
		update public.provider_vaults
		set kdf_salt = encode(decode(repeat('44', 16), 'hex'), 'base64')
		where vault_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
		returning vault_id
	$$,
	$$ select null::uuid where false $$,
	'another user cannot update the owner vault'
);

insert into public.provider_vaults (
	vault_id,
	wrapped_data_key,
	wrapping_nonce,
	wrapping_tag,
	kdf_salt
)
values (
	'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	encode(decode(repeat('55', 32), 'hex'), 'base64'),
	encode(decode(repeat('55', 12), 'hex'), 'base64'),
	encode(decode(repeat('55', 16), 'hex'), 'base64'),
	encode(decode(repeat('66', 16), 'hex'), 'base64')
);

select results_eq(
	$$
		select owner_id
		from public.sync_provider_credential(
			'models',
			'openai',
			encode(convert_to('other-cipher', 'UTF8'), 'base64'),
			encode(decode(repeat('07', 12), 'hex'), 'base64'),
			encode(decode(repeat('07', 16), 'hex'), 'base64'),
			1,
			'2026-09-01T00:00:10Z',
			'77777777-7777-4777-8777-777777777777',
			null
		)
	$$,
	$$ values ('22222222-2222-4222-8222-222222222222'::uuid) $$,
	'the RPC always derives ownership from the authenticated user'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
	$$ select count(*)::bigint from public.provider_credentials $$,
	$$ values (1::bigint) $$,
	'the other user RPC cannot alter the first owner row'
);

set local role anon;

select throws_ok(
	$$ select count(*) from public.provider_vaults $$,
	'42501',
	'permission denied for table provider_vaults',
	'anonymous users cannot read provider vaults'
);

select throws_ok(
	$$
		select *
		from public.sync_provider_credential(
			'models',
			'openai',
			'YQ==',
			'AAAAAAAAAAAAAAAA',
			'AAAAAAAAAAAAAAAAAAAAAA==',
			1,
			now(),
			'88888888-8888-4888-8888-888888888888',
			null
		)
	$$,
	'42501',
	'permission denied for function sync_provider_credential',
	'anonymous users cannot execute the credential sync RPC'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
	$$
		delete from public.provider_vaults
		where vault_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
		returning owner_id
	$$,
	$$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
	'owner can explicitly delete their cloud vault'
);

select results_eq(
	$$ select count(*)::bigint from public.provider_credentials $$,
	$$ values (0::bigint) $$,
	'owner-confirmed vault deletion cascades through their credentials'
);

select * from finish();
rollback;
