-- ShopFlow AI: secure multi-tenant foundation for Supabase / PostgreSQL.
-- Apply in a new Supabase project's SQL Editor. This migration does not connect
-- the current browser-only app to the cloud; see supabase/README.md first.

create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  sku text,
  price numeric(14,2) not null default 0 check (price >= 0),
  cost numeric(14,2) check (cost is null or cost >= 0),
  stock integer check (stock is null or stock >= 0),
  description text not null default '',
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create index if not exists products_store_updated_idx
  on public.products (store_id, updated_at desc);
create index if not exists products_store_name_idx
  on public.products (store_id, lower(name));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text,
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  customer_contact text,
  status text not null default 'completed'
    check (status in ('pending','completed','cancelled','refunded')),
  currency char(3) not null default 'USD',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  cost_total numeric(14,2) check (cost_total is null or cost_total >= 0),
  -- Immutable-at-sale line snapshots preserve historical names/prices/costs.
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  notes text not null default '',
  sold_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create index if not exists orders_store_sold_idx
  on public.orders (store_id, sold_at desc);
create index if not exists orders_store_status_idx
  on public.orders (store_id, status);

-- Audit actor fields are server-stamped so browser clients cannot impersonate
-- another user in created_by metadata.
create or replace function public.stamp_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  elsif new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable';
  end if;
  return new;
end;
$;

drop trigger if exists products_stamp_created_by on public.products;
create trigger products_stamp_created_by
before insert or update on public.products
for each row execute function public.stamp_created_by();

drop trigger if exists orders_stamp_created_by on public.orders;
create trigger orders_stamp_created_by
before insert or update on public.orders
for each row execute function public.stamp_created_by();


create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

-- SECURITY DEFINER helpers prevent recursive RLS evaluation on store_members.
create or replace function public.is_store_member(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store and sm.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_store(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store
      and sm.user_id = (select auth.uid())
      and sm.role in ('owner','admin')
  );
$$;

-- Atomic first-store creation: a caller cannot nominate another owner or
-- insert themselves into an existing store.
create or replace function public.create_store(store_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_store_id uuid;
  clean_name text := trim(coalesce(store_name, ''));
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 120 then
    raise exception 'Store name must be between 1 and 120 characters';
  end if;

  insert into public.stores (name, owner_user_id)
  values (clean_name, caller_id)
  returning id into new_store_id;

  insert into public.store_members (store_id, user_id, role)
  values (new_store_id, caller_id, 'owner');

  insert into public.store_settings (store_id, settings)
  values (new_store_id, '{}'::jsonb);

  return new_store_id;
end;
$$;

revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.can_manage_store(uuid) from public;
revoke all on function public.create_store(text) from public;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.can_manage_store(uuid) to authenticated;
grant execute on function public.create_store(text) to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "members can read their stores" on public.stores;
create policy "members can read their stores" on public.stores
for select to authenticated using (public.is_store_member(id));

drop policy if exists "owners can update their stores" on public.stores;
create policy "owners can update their stores" on public.stores
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

drop policy if exists "members can read memberships" on public.store_members;
create policy "members can read memberships" on public.store_members
for select to authenticated using (public.is_store_member(store_id));

-- Membership writes are intentionally unavailable to clients. A future
-- invitation RPC must verify owner/admin role and the invitee's consent.

drop policy if exists "members can read products" on public.products;
create policy "members can read products" on public.products
for select to authenticated using (public.is_store_member(store_id));

drop policy if exists "managers can insert products" on public.products;
create policy "managers can insert products" on public.products
for insert to authenticated with check (public.can_manage_store(store_id));

drop policy if exists "managers can update products" on public.products;
create policy "managers can update products" on public.products
for update to authenticated using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

drop policy if exists "managers can delete products" on public.products;
create policy "managers can delete products" on public.products
for delete to authenticated using (public.can_manage_store(store_id));

drop policy if exists "members can read orders" on public.orders;
create policy "members can read orders" on public.orders
for select to authenticated using (public.is_store_member(store_id));

drop policy if exists "members can create orders" on public.orders;
create policy "members can create orders" on public.orders
for insert to authenticated with check (public.is_store_member(store_id));

drop policy if exists "managers can update orders" on public.orders;
create policy "managers can update orders" on public.orders
for update to authenticated using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

drop policy if exists "managers can delete orders" on public.orders;
create policy "managers can delete orders" on public.orders
for delete to authenticated using (public.can_manage_store(store_id));

drop policy if exists "members can read store settings" on public.store_settings;
create policy "members can read store settings" on public.store_settings
for select to authenticated using (public.is_store_member(store_id));

drop policy if exists "owners can insert store settings" on public.store_settings;
create policy "owners can insert store settings" on public.store_settings
for insert to authenticated with check (public.can_manage_store(store_id));

drop policy if exists "owners can update store settings" on public.store_settings;
create policy "owners can update store settings" on public.store_settings
for update to authenticated using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

-- No public/anon policies are created. Public storefront access must be
-- implemented separately with narrowly scoped, read-only views/RPCs.

