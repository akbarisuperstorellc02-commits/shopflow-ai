import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8');
const catalogTests = readFileSync('supabase/tests/0001_rls_catalog_checks.sql', 'utf8');
const transactional = readFileSync('supabase/migrations/0002_transactional_inventory.sql', 'utf8');
const cloudClient = readFileSync('assets/js/cloud.js', 'utf8');
const appClient = readFileSync('assets/js/app.js', 'utf8');

const requiredTables = ['stores', 'store_members', 'products', 'orders', 'store_settings'];
for (const table of requiredTables) {
  assert.ok(migration.includes('create table if not exists public.' + table + ' ('), 'Missing table: ' + table);
  assert.ok(migration.includes('alter table public.' + table + ' enable row level security;'), 'RLS is not enabled: ' + table);
}
assert.match(migration, /create or replace function public\.create_store\(store_name text\)[\s\S]*?security definer[\s\S]*?set search_path = ''/i);
assert.match(migration, /revoke all on function public\.create_store\(text\) from public/i);
assert.match(migration, /grant execute on function public\.create_store\(text\) to authenticated/i);
assert.match(migration, /create policy "members can read products"/i);
assert.match(migration, /create policy "managers can insert products"/i);
assert.match(migration, /create policy "members can create orders"/i);
assert.match(migration, /create policy "managers can update orders"/i);
assert.match(migration, /create policy "owners can update their stores"/i);
assert.match(catalogTests, /RLS is not enabled on public\.%/i);
assert.match(catalogTests, /Unexpected anon policy found/i);

assert.match(transactional, /create or replace function public\.create_order_atomic/i);
assert.match(transactional, /for update/i);
assert.match(transactional, /create or replace function public\.cancel_order_atomic/i);
assert.match(transactional, /revoke all on function public\.create_order_atomic/i);
assert.match(cloudClient, /service_role/i);
assert.match(cloudClient, /sb_secret_/i);
assert.match(cloudClient, /\.rpc\('create_store'/i);
assert.match(cloudClient, /storeId \+ ':product'/i);
assert.match(cloudClient, /local-import: stock values are the current inventory snapshot/i);
assert.match(cloudClient, /saveMap\(map\); \/\//i);
assert.match(cloudClient, /create_order_atomic/i);
assert.match(cloudClient, /cancel_order_atomic/i);
assert.match(appClient, /window\.ShopFlowBridge=\{/i);
assert.match(appClient, /ShopFlowCloud\.createOrder/i);
assert.match(appClient, /ShopFlowCloud\.cancelOrder/i);

console.log('ShopFlow guardrails passed: tenant tables/RLS, auth, transactional inventory, cloud order integration and safe import.');
