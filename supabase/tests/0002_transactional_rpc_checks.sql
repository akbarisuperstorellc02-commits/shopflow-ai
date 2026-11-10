-- Run after migrations 0001 and 0002 in Supabase SQL Editor.
-- These checks verify SECURITY DEFINER settings and function execution grants.
do $$
declare
  create_store_oid regprocedure := to_regprocedure('public.create_store(text)');
  create_order_oid regprocedure := to_regprocedure('public.create_order_atomic(uuid,text,jsonb,text)');
  cancel_order_oid regprocedure := to_regprocedure('public.cancel_order_atomic(uuid)');
  fn record;
begin
  if create_store_oid is null or create_order_oid is null or cancel_order_oid is null then
    raise exception 'Required ShopFlow RPC function is missing. Apply all migrations first.';
  end if;

  if has_function_privilege('anon', create_store_oid, 'EXECUTE')
     or has_function_privilege('anon', create_order_oid, 'EXECUTE')
     or has_function_privilege('anon', cancel_order_oid, 'EXECUTE') then
    raise exception 'Anonymous role must not execute private ShopFlow RPCs.';
  end if;

  if not has_function_privilege('authenticated', create_store_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', create_order_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', cancel_order_oid, 'EXECUTE') then
    raise exception 'Authenticated role is missing a required ShopFlow RPC grant.';
  end if;

  for fn in
    select p.proname, p.prosecdef, p.proconfig
    from pg_proc p
    where p.oid in (create_store_oid, create_order_oid, cancel_order_oid)
  loop
    if not fn.prosecdef then
      raise exception 'RPC % must be SECURITY DEFINER.', fn.proname;
    end if;
    if not coalesce(fn.proconfig, '{}'::text[]) @> array['search_path=""'] then
      raise exception 'RPC % must set an empty search_path.', fn.proname;
    end if;
  end loop;
end;
$$;

select 'ShopFlow RPC privilege and SECURITY DEFINER checks passed.' as result;
