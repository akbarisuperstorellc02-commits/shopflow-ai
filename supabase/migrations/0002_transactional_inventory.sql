-- Transactional inventory-safe order operations for multi-user stores.
-- Apply after 0001_initial_schema.sql. Browser clients should use these RPCs
-- for live sales and cancellations instead of changing stock/order rows directly.

create or replace function public.create_order_atomic(
  target_store uuid,
  order_customer text,
  item_lines jsonb,
  order_currency text default 'USD'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_customer text := trim(coalesce(order_customer, ''));
  new_order_id uuid;
  line_count integer;
  calculated_subtotal numeric(14,2);
  calculated_cost numeric(14,2);
  all_costs_known boolean;
  item_snapshot jsonb;
  requested record;
  locked_product public.products%rowtype;
begin
  if caller_id is null or not public.is_store_member(target_store) then
    raise exception 'Store membership required';
  end if;
  if char_length(clean_customer) < 1 or char_length(clean_customer) > 160 then
    raise exception 'Customer name must be between 1 and 160 characters';
  end if;
  if jsonb_typeof(item_lines) is distinct from 'array' then
    raise exception 'Items must be a JSON array';
  end if;
  line_count := jsonb_array_length(item_lines);
  if line_count < 1 or line_count > 50 then
    raise exception 'An order must contain between 1 and 50 lines';
  end if;
  if order_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a three-letter code';
  end if;

  -- Lock every requested product in a stable order to prevent overselling
  -- and reduce deadlocks when two staff members sell at the same time.
  for requested in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(item_lines) as x(product_id uuid, quantity integer)
    group by x.product_id
    order by x.product_id
  loop
    if requested.product_id is null or requested.quantity is null or requested.quantity < 1 then
      raise exception 'Each order line needs a valid product and positive quantity';
    end if;
    select * into locked_product
    from public.products
    where id = requested.product_id and store_id = target_store and archived_at is null
    for update;
    if not found then
      raise exception 'A product does not belong to this store or is archived';
    end if;
    if locked_product.stock is not null and locked_product.stock < requested.quantity then
      raise exception 'Insufficient stock for product %', locked_product.name;
    end if;
  end loop;

  with requested as (
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(item_lines) as x(product_id uuid, quantity integer)
    group by x.product_id
  )
  select
    coalesce(sum(p.price * r.quantity), 0),
    coalesce(bool_and(p.cost is not null), false),
    case when bool_and(p.cost is not null) then sum(p.cost * r.quantity) else null end,
    jsonb_agg(jsonb_build_object(
      'product_id', p.id,
      'product_name', p.name,
      'quantity', r.quantity,
      'unit_price', p.price,
      'line_total', p.price * r.quantity,
      'cost_unit', p.cost
    ))
  into calculated_subtotal, all_costs_known, calculated_cost, item_snapshot
  from requested r
  join public.products p on p.id = r.product_id and p.store_id = target_store;

  for requested in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(item_lines) as x(product_id uuid, quantity integer)
    group by x.product_id
    order by x.product_id
  loop
    update public.products
    set stock = stock - requested.quantity
    where id = requested.product_id and store_id = target_store and stock is not null;
  end loop;

  insert into public.orders (
    store_id, customer_name, status, currency, subtotal, cost_total, items, sold_at
  ) values (
    target_store, clean_customer, 'completed', order_currency,
    calculated_subtotal, calculated_cost, item_snapshot, now()
  ) returning id into new_order_id;

  return new_order_id;
end;
$$;

create or replace function public.cancel_order_atomic(target_order uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.orders%rowtype;
  item record;
begin
  select * into target
  from public.orders
  where id = target_order
  for update;

  if not found then
    raise exception 'Order not found';
  end if;
  if not public.can_manage_store(target.store_id) then
    raise exception 'Store manager permission required';
  end if;
  if target.status = 'cancelled' then
    return false;
  end if;
  if target.status <> 'completed' then
    raise exception 'Only completed orders can be cancelled';
  end if;

  for item in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(target.items) as x(product_id uuid, quantity integer)
    where x.product_id is not null
    group by x.product_id
    order by x.product_id
  loop
    update public.products
    set stock = stock + item.quantity
    where id = item.product_id and store_id = target.store_id and stock is not null;
  end loop;

  update public.orders set status = 'cancelled' where id = target_order;
  return true;
end;
$$;

revoke all on function public.create_order_atomic(uuid, text, jsonb, text) from public;
revoke all on function public.cancel_order_atomic(uuid) from public;
grant execute on function public.create_order_atomic(uuid, text, jsonb, text) to authenticated;
grant execute on function public.cancel_order_atomic(uuid) to authenticated;
