import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8');
const catalogTests = readFileSync('supabase/tests/0001_rls_catalog_checks.sql', 'utf8');
const rpcTests = readFileSync('supabase/tests/0002_transactional_rpc_checks.sql', 'utf8');
const transactional = readFileSync('supabase/migrations/0002_transactional_inventory.sql', 'utf8');
const cloudClient = readFileSync('assets/js/cloud.js', 'utf8');
const appClient = readFileSync('assets/js/app.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
const serviceWorker = readFileSync('service-worker.js', 'utf8');
const pwaClient = readFileSync('assets/js/pwa.js', 'utf8');
const appIcon = readFileSync('assets/icons/shopflow.svg', 'utf8');

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
assert.match(rpcTests, /has_function_privilege\('anon'/i);
assert.match(rpcTests, /has_function_privilege\('authenticated'/i);
assert.match(rpcTests, /SECURITY DEFINER/i);

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
assert.match(cloudClient, /storeId \+ ':order:' \+ String\(orderId\)/i, 'Cloud cancellation must resolve locally mapped order IDs.');
assert.match(cloudClient, /return data === true/i, 'Cloud cancellation must distinguish already-cancelled orders.');
assert.match(appClient, /if\(!cancelled\)\{toast\(/i, 'The UI must not restore stock when a cloud order was already cancelled.');
assert.match(appClient, /cancel\.dataset\.busy==='true'/i, 'Order cancellation must block duplicate clicks.');
assert.match(cloudClient, /upsertCloudProduct/i);
assert.match(cloudClient, /deleteCloudProduct/i);
assert.match(cloudClient, /saveCloudSettings/i);
assert.match(cloudClient, /pullCloudData/i);
assert.match(cloudClient, /archived_at: new Date\(\)\.toISOString\(\)/i, 'Cloud product deletion must retain an archive tombstone.');
assert.match(cloudClient, /deletedProductIds/i, 'Cloud pull must return deleted product IDs.');
assert.match(appClient, /data\.deletedProductIds/i, 'Cloud pull must remove products archived in another browser.');
assert.match(cloudClient, /\.from\('products'\)\.select/i);
assert.match(cloudClient, /\.from\('orders'\)\.select/i);
assert.match(appClient, /mergeCloudData:data=>/i);
assert.ok(appClient.includes('confirmCloudPull:()=>window.confirm'), 'Cloud pull must ask before replacing matching data.');
assert.ok(cloudClient.includes('cloudPullStatus(data.skippedMultiLine'), 'Cloud pull should show a localized completion result.');
assert.match(html, /id="cloud-pull"[^>]*disabled/i);
assert.ok(appClient.includes('await window.ShopFlowCloud.saveSettings(state.settings)'), 'Cloud logo changes must be uploaded when connected.');

assert.match(appClient, /ShopFlowCloud\.upsertProduct/i);
assert.match(appClient, /ShopFlowCloud\.deleteProduct/i);
assert.match(appClient, /ShopFlowCloud\.saveSettings/i);
assert.match(appClient, /window\.ShopFlowBridge=\{/i);
assert.match(appClient, /ShopFlowCloud\.createOrder/i);
assert.match(appClient, /ShopFlowCloud\.cancelOrder/i);
assert.ok((appClient.match(/dataset\.saving==='true'/g) || []).length >= 2, 'Product and order forms must block duplicate submissions.');
assert.ok((appClient.match(/dataset\.saving='false'/g) || []).length >= 4, 'Product and order forms must unlock after success or failure.');
assert.ok(appClient.indexOf('I18N.en=Object.assign(I18N.en,{cloudTitle:') < appClient.indexOf("document.getElementById('backup-file')"), 'Cloud translations must load before the backup restore handler.');

assert.equal(manifest.display, 'standalone', 'PWA must be installable in standalone mode.');
assert.ok(manifest.icons?.some(icon => icon.src === 'assets/icons/shopflow.svg'), 'PWA manifest must reference the app icon.');
assert.ok(html.includes('rel="manifest" href="manifest.webmanifest"'));
assert.ok(html.includes('assets/js/pwa.js'));
assert.ok(serviceWorker.includes('addAll(SHELL_FILES'));
assert.ok(serviceWorker.includes("request.mode === 'navigate'"));
assert.ok(pwaClient.includes('serviceWorker.register'));
assert.ok(appIcon.includes('<svg'));

console.log('ShopFlow guardrails passed: tenant tables/RLS, auth, transactional inventory, cloud integration, safe import and PWA offline shell.');
