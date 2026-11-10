let createClient = null;
const SUPABASE_JS_URL = 'https://esm.sh/@supabase/supabase-js@2.57.0';

const CONFIG_KEY = 'shopflow-cloud-config-v1';
const MAP_KEY = 'shopflow-cloud-id-map-v1';
const $ = id => document.getElementById(id);
let client = null;
let activeUser = null;
let stores = [];

function message(text, bad = false) {
  const el = $('cloud-message');
  if (el) { el.textContent = text; el.dataset.error = bad ? 'true' : 'false'; }
}
function config() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); }
  catch { return {}; }
}
function saveConfig(url, key) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
}
function loadMap() {
  try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}'); }
  catch { return {}; }
}
function saveMap(map) { localStorage.setItem(MAP_KEY, JSON.stringify(map)); }
function uuidFor(map, group, id) {
  const key = group + ':' + String(id);
  if (!map[key]) map[key] = crypto.randomUUID();
  return map[key];
}
function decodeRole(key) {
  try {
    const part = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)).role || '';
  } catch { return ''; }
}
function setConnected(connected) {
  $('cloud-auth').classList.toggle('hidden', !connected || !!activeUser);
  $('cloud-workspace').classList.toggle('hidden', !activeUser);
  $('cloud-signout').disabled = !activeUser;
  $('cloud-state').textContent = activeUser ? 'Signed in' : connected ? 'Connected' : 'Not connected';
  $('cloud-connect').textContent = connected ? 'Reconnect' : 'Connect';
}
function requireClient() {
  if (!client) throw new Error('Connect your Supabase project first.');
  return client;
}
async function refreshStores() {
  const api = requireClient();
  const { data, error } = await api.from('stores').select('id,name').order('created_at');
  if (error) throw error;
  stores = data || [];
  const select = $('cloud-store');
  select.replaceChildren();
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.id;
    option.textContent = store.name;
    select.appendChild(option);
  });
  if (!stores.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No cloud store yet';
    select.appendChild(option);
  }
  $('cloud-create-store').disabled = false;
  $('cloud-import').disabled = !stores.length;
}
async function applySession(session) {
  activeUser = session?.user || null;
  $('cloud-user').textContent = activeUser ? activeUser.email : '';
  setConnected(!!client);
  if (activeUser) {
    await refreshStores();
    message('Signed in. Choose a cloud store or create one.');
  } else {
    stores = [];
    $('cloud-store').replaceChildren();
    message(client ? 'Project connected. Sign in or create an account.' : 'Not connected.');
  }
}
async function connect() {
  const url = $('cloud-url').value.trim().replace(/\/$/, '');
  const key = $('cloud-key').value.trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) throw new Error('Enter a valid Supabase project URL.');
  if (!key || key.startsWith('sb_secret_') || decodeRole(key) === 'service_role' || (!key.startsWith('sb_publishable_') && decodeRole(key) !== 'anon')) throw new Error('Use only a publishable key or legacy anon key. Secret and service_role keys are blocked.');
  if (!createClient) ({ createClient } = await import(SUPABASE_JS_URL));
  saveConfig(url, key);
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  await applySession(data.session);
}
async function createStore() {
  const api = requireClient();
  const local = window.ShopFlowBridge.exportData();
  const name = String(local.settings.name || 'My Store').trim().slice(0, 120) || 'My Store';
  const { data, error } = await api.rpc('create_store', { store_name: name });
  if (error) throw error;
  await refreshStores();
  $('cloud-store').value = data;
  message('Cloud store created. You can now import your local data.');
}
function toIso(order) {
  if (order.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(order.dateISO)) return order.dateISO + 'T12:00:00.000Z';
  const parsed = new Date(order.date || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
function cloudReady() { return !!(client && activeUser && $('cloud-store').value); }\nasync function createCloudOrder({ customer, productId, quantity }) {\n  if (!cloudReady()) return null;\n  const storeId = $('cloud-store').value;\n  const map = loadMap();\n  const cloudProductId = map[storeId + ':product:' + String(productId)];\n  if (!cloudProductId) throw new Error('Import this product to the selected cloud store before recording a cloud sale.');\n  const settings = window.ShopFlowBridge.exportData().settings;\n  const { data, error } = await client.rpc('create_order_atomic', { target_store: storeId, order_customer: customer, item_lines: [{ product_id: cloudProductId, quantity }], order_currency: settings.currency || 'USD' });\n  if (error) throw error;\n  return data;\n}\nasync function cancelCloudOrder(orderId) {\n  if (!cloudReady()) throw new Error('Cloud connection is not ready.');\n  const { data, error } = await client.rpc('cancel_order_atomic', { target_order: orderId });\n  if (error) throw error;\n  return data;\n}\nwindow.ShopFlowCloud = { isReady: cloudReady, createOrder: createCloudOrder, cancelOrder: cancelCloudOrder };\n\nasync function importLocalData() {
  const api = requireClient();
  const storeId = $('cloud-store').value;
  if (!activeUser || !storeId) throw new Error('Sign in and select a cloud store first.');
  const local = window.ShopFlowBridge.exportData();
  const map = loadMap();
  const productIds = new Map();
  const products = local.products.map(p => {
    const id = uuidFor(map, storeId + ':product', p.id);
    productIds.set(String(p.id), id);
    return {
      id, store_id: storeId, name: String(p.name).slice(0, 160),
      price: Number(p.price) || 0,
      cost: p.cost === null || p.cost === undefined || p.cost === '' ? null : Number(p.cost),
      stock: Number.isInteger(p.stock) && p.stock >= 0 ? p.stock : null,
      description: String(p.description || '').slice(0, 500),
      archived_at: null
    };
  });
  saveMap(map); // Keep deterministic IDs even if a later batch fails; retrying is idempotent.
  for (let i = 0; i < products.length; i += 100) {
    const { error } = await api.from('products').upsert(products.slice(i, i + 100), { onConflict: 'id' });
    if (error) throw new Error('Products import stopped: ' + error.message);
  }
  const orders = local.orders.filter(o => !o.cloudOrder).map(o => {
    const id = uuidFor(map, storeId + ':order', o.id);
    const quantity = Math.max(1, Number(o.quantity) || 1);
    const productId = productIds.get(String(o.productId));
    const unitPrice = quantity ? (Number(o.total) || 0) / quantity : 0;
    const costUnit = Number.isFinite(o.costTotal) ? o.costTotal / quantity : null;
    return {
      id, store_id: storeId, order_number: String(o.id || '').slice(0, 80),
      customer_name: String(o.customer || 'Customer').slice(0, 160),
      status: o.status === 'cancelled' ? 'cancelled' : 'completed',
      notes: 'local-import: stock values are the current inventory snapshot',
      currency: String(local.settings.currency || 'USD').slice(0, 3),
      subtotal: Number(o.total) || 0,
      cost_total: Number.isFinite(o.costTotal) ? o.costTotal : null,
      items: [{
        product_id: productId || null,
        product_name: String(o.product || 'Product').slice(0, 160),
        quantity, unit_price: unitPrice, line_total: Number(o.total) || 0,
        cost_unit: costUnit
      }],
      sold_at: toIso(o)
    };
  });
  for (let i = 0; i < orders.length; i += 100) {
    const { error } = await api.from('orders').upsert(orders.slice(i, i + 100), { onConflict: 'id' });
    if (error) throw new Error('Orders import stopped: ' + error.message);
  }
  const { error: settingsError } = await api.from('store_settings').upsert({
    store_id: storeId,
    settings: {
      name: local.settings.name || 'My Store',
      email: local.settings.email || '',
      phone: local.settings.phone || '',
      address: local.settings.address || '',
      currency: local.settings.currency || 'USD',
      language: local.settings.language || 'en',
      logo: local.settings.logo || ''
    }
  }, { onConflict: 'store_id' });
  if (settingsError) throw new Error('Settings import stopped: ' + settingsError.message);
  saveMap(map);
  message('Import completed: ' + products.length + ' products and ' + orders.length + ' orders. Local data remains unchanged.');
}
$('cloud-connect').addEventListener('click', async () => {
  try { await connect(); } catch (error) { message(error.message || 'Connection failed.', true); }
});
$('cloud-login').addEventListener('click', async () => {
  try {
    const { error } = await requireClient().auth.signInWithPassword({
      email: $('cloud-email').value.trim(), password: $('cloud-password').value
    });
    if (error) throw error;
    const { data } = await client.auth.getSession();
    await applySession(data.session);
  } catch (error) { message(error.message || 'Sign in failed.', true); }
});
$('cloud-signup').addEventListener('click', async () => {
  try {
    const { data, error } = await requireClient().auth.signUp({
      email: $('cloud-email').value.trim(), password: $('cloud-password').value
    });
    if (error) throw error;
    if (data.session) await applySession(data.session);
    else message('Account request submitted. Check your email to confirm, then sign in.');
  } catch (error) { message(error.message || 'Account creation failed.', true); }
});
$('cloud-signout').addEventListener('click', async () => {
  try {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
    await applySession(null);
  } catch (error) { message(error.message || 'Sign out failed.', true); }
});
$('cloud-create-store').addEventListener('click', async () => {
  try { await createStore(); } catch (error) { message(error.message || 'Could not create store.', true); }
});
$('cloud-import').addEventListener('click', async () => {
  if (!window.confirm('Import this browser’s products, orders and settings into the selected cloud store? Existing local data will not be deleted.')) return;
  $('cloud-import').disabled = true;
  try { await importLocalData(); } catch (error) { message(error.message || 'Import failed.', true); }
  finally { $('cloud-import').disabled = !stores.length; }
});
const saved = config();
if (saved.url) $('cloud-url').value = saved.url;
if (saved.key) $('cloud-key').value = saved.key;
if (saved.url && saved.key) {
  connect().catch(error => { client = null; activeUser = null; setConnected(false); message(error.message || 'Could not restore cloud connection.', true); });
}
