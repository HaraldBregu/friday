begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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
		'{"given_name":"Ada","family_name":"Lovelace"}',
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
		select first_name, last_name
		from public.profiles
		where id = '11111111-1111-4111-8111-111111111111'
	$$,
	$$ values ('Ada'::text, 'Lovelace'::text) $$,
	'new auth users receive a profile populated from trusted auth metadata'
);

select results_eq(
	$$
		update public.profiles
		set first_name = 'Grace', last_name = 'Hopper'
		where id = '11111111-1111-4111-8111-111111111111'
		returning first_name, last_name
	$$,
	$$ values ('Grace'::text, 'Hopper'::text) $$,
	'owner can store first and last name on their profile'
);

select throws_ok(
	$$
		insert into public.profiles (id, first_name, last_name)
		values ('33333333-3333-4333-8333-333333333333', 'Blocked', 'Insert')
	$$,
	'42501',
	'permission denied for table profiles',
	'authenticated users cannot create arbitrary profiles'
);

select throws_ok(
	$$
		delete from public.profiles
		where id = '11111111-1111-4111-8111-111111111111'
	$$,
	'42501',
	'permission denied for table profiles',
	'authenticated users cannot delete profiles'
);

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
	$$
		select id
		from public.profiles
		where id = '11111111-1111-4111-8111-111111111111'
	$$,
	'another user cannot read the owner profile'
);

select results_eq(
	$$
		update public.profiles
		set first_name = 'Blocked'
		where id = '11111111-1111-4111-8111-111111111111'
		returning first_name
	$$,
	$$ select null::text where false $$,
	'another user cannot update the owner profile'
);

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
	'new row violates row-level security policy for table "chat_sessions"',
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
	'insert or update on table "chat_messages" violates foreign key constraint "chat_messages_session_owner_fkey"',
	'a cross-owner session relationship is rejected'
);

set local role anon;

select throws_ok(
	$$ select id from public.profiles $$,
	'42501',
	'permission denied for table profiles',
	'anonymous users cannot read profiles'
);

select * from finish();
rollback;
