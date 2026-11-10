-- Run after 0001_initial_schema.sql in the Supabase SQL Editor.
-- These catalog assertions verify the guardrails are present; they are not a
-- substitute for two-user end-to-end authorization tests.

do $$
declare
  table_name text;
  expected_tables text[] := array[
    'stores','store_members','products','orders','store_settings'
  ];
begin
  foreach table_name in array expected_tables loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relkind = 'r'
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.create_store(text)', 'EXECUTE') then
    raise exception 'anon must not execute create_store';
  end if;

  if not has_function_privilege('authenticated', 'public.create_store(text)', 'EXECUTE') then
    raise exception 'authenticated must be able to execute create_store';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = any(expected_tables)
      and 'anon' = any(roles)
  ) then
    raise exception 'Unexpected anon policy found on a tenant table';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'members can read products'
  ) then
    raise exception 'Missing products member-read policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'members can create orders'
  ) then
    raise exception 'Missing orders member-insert policy';
  end if;
end;
$$;

select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('stores','store_members','products','orders','store_settings')
order by tablename, policyname;
