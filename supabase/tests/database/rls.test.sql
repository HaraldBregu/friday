begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

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
		'owner@example.test',
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
		'other@example.test',
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
		insert into public.chat_sessions (id, title)
		values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Owner chat')
		returning owner_id
	$$,
	$$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
	'owner can create a chat session'
);

select results_eq(
	$$
		insert into public.chat_messages (id, session_id, ordinal, role, content)
		values (
			'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			0,
			'user',
			'"hello"'::jsonb
		)
		returning owner_id
	$$,
	$$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
	'owner can create a message in their session'
);

select results_eq(
	$$ select count(*)::bigint from public.chat_sessions $$,
	$$ values (1::bigint) $$,
	'owner can read their chat session'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select is_empty(
	$$ select id from public.chat_sessions $$,
	'another user cannot read the owner chat'
);

select throws_ok(
	$$
		insert into public.chat_sessions (id, owner_id, title)
		values (
			'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
			'11111111-1111-4111-8111-111111111111',
			'Spoofed chat'
		)
	$$,
	'42501',
	'another user cannot spoof chat ownership'
);

select throws_ok(
	$$
		insert into public.chat_messages (id, session_id, owner_id, ordinal, role, content)
		values (
			'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			'22222222-2222-4222-8222-222222222222',
			1,
			'user',
			'"blocked"'::jsonb
		)
	$$,
	'23503',
	'a cross-owner session relationship is rejected'
);

select * from finish();
rollback;
