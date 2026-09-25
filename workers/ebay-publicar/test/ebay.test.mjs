// Pruebas sin red: eBay e índices simulados con un fetch falso (encargo #4405).
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { construirAnuncio, sku } from '../src/index.js';

const ITEM = {
  id: '1790370186236-n4eyaq', type: 'furni', title: 'Alsea · Cafetera espresso 3 grupos + molinos · corregido',
  prompt: JSON.stringify({ schema: 'pixeria.furniture/1', quantity: 1, dimensionsCm: [94.0, 56.8, 50.0] }),
  thumbnail: 'https://stock.admira.store/stock/1790370186236-n4eyaq/poster.jpg'
};
const VENTA = {
  moneda: 'EUR',
  assets: { '1790370186236-n4eyaq': {
    titulo: 'Cafetera de la cafetería de Alsea', texto: 'modelo 3D', textoWallapop: 'Cafetera espresso de tres grupos con molino.',
    precioEUR: 500, fotosMatrix: ['/pixeria/fotos/1790370186236-n4eyaq/frente.jpg', '/pixeria/fotos/1790370186236-n4eyaq/detalle.jpg']
  } }
};
const ENV = {
  EBAY_ENV: 'sandbox', EBAY_MARKETPLACE: 'EBAY_ES', SHOP_ORIGIN: 'https://admira.shop', STOCK_INDEX: 'https://stock.test/index.json',
  EBAY_APP_ID: 'app', EBAY_CERT_ID: 'cert', EBAY_PUBLISH_KEY: 'k', EBAY_REFRESH_TOKEN: 'rt',
  EBAY_FULFILLMENT_POLICY_ID: 'f1', EBAY_PAYMENT_POLICY_ID: 'p1', EBAY_RETURN_POLICY_ID: 'r1', EBAY_MERCHANT_LOCATION_KEY: 'admira-bcn'
};

function simular(llamadas, ofertaPrevia) {
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url); const m = o.method || 'GET';
    llamadas.push(m + ' ' + u.replace(/^https:\/\/[^/]+/, ''));
    const r = (d, s = 200) => new Response(d == null ? null : JSON.stringify(d), { status: s });
    if (u === ENV.STOCK_INDEX) return r({ items: [ITEM] });
    if (u.endsWith('/data/pixeria-venta.json')) return r(VENTA);
    if (u.includes('/oauth2/token')) return r({ access_token: 'at' });
    if (u.includes('get_default_category_tree_id')) return r({ categoryTreeId: '186' });
    if (u.includes('get_category_suggestions')) return r({ categorySuggestions: [{ category: { categoryId: '38252' } }] });
    if (u.includes('/inventory_item/')) return r(null, 204);
    if (m === 'GET' && u.includes('/offer?sku=')) return ofertaPrevia ? r({ offers: [{ offerId: 'O-9' }] }) : r({ errors: [{ errorId: 25713 }] }, 404);
    if (m === 'POST' && u.endsWith('/offer')) return r({ offerId: 'O-1' }, 201);
    if (m === 'PUT' && u.includes('/offer/')) return r(null, 204);
    if (u.endsWith('/publish')) return r({ listingId: '1100' });
    return r({ errors: ['?'] }, 500);
  };
}

const post = (b, clave) => new Request('https://w.test/ebay/publicar', {
  method: 'POST', body: JSON.stringify(b), headers: Object.assign({ 'Content-Type': 'application/json' }, clave ? { Authorization: 'Bearer ' + clave } : {})
});

test('el anuncio lleva título, texto físico, fotos Matrix absolutas, precio y estado usado', () => {
  const a = construirAnuncio(ITEM, VENTA, ENV);
  assert.equal(a.sku, sku(ITEM.id));
  assert.equal(a.titulo, 'Cafetera de la cafetería de Alsea');
  assert.deepEqual(a.fotos, ['https://admira.shop/pixeria/fotos/1790370186236-n4eyaq/frente.jpg', 'https://admira.shop/pixeria/fotos/1790370186236-n4eyaq/detalle.jpg']);
  assert.match(a.inventoryItem.product.description, /Cafetera espresso de tres grupos con molino/);
  assert.doesNotMatch(a.inventoryItem.product.description, /modelo 3D/);
  assert.equal(a.inventoryItem.condition, 'USED_EXCELLENT');
  assert.equal(a.offer.pricingSummary.price.value, '500.00');
  assert.equal(a.offer.listingPolicies.returnPolicyId, 'r1');
  assert.deepEqual(a.problemas, []);
});

test('sin credenciales devuelve la vista previa y no llama a eBay', async () => {
  const ll = []; simular(ll);
  const r = await worker.fetch(post({ id: ITEM.id }), { SHOP_ORIGIN: ENV.SHOP_ORIGIN, STOCK_INDEX: ENV.STOCK_INDEX });
  const d = await r.json();
  assert.equal(d.publicado, false);
  assert.ok(d.faltan.includes('EBAY_APP_ID'));
  assert.ok(!ll.some((l) => l.includes('/sell/')));
});

test('con credenciales y clave mala no publica', async () => {
  const ll = []; simular(ll);
  const r = await worker.fetch(post({ id: ITEM.id }, 'mala'), ENV);
  assert.equal(r.status, 401);
  assert.ok(!ll.some((l) => l.includes('/sell/')));
});

test('publica: token, categoría sugerida, inventory_item, offer nueva, publish', async () => {
  const ll = []; simular(ll);
  const d = await (await worker.fetch(post({ id: ITEM.id }, 'k'), ENV)).json();
  assert.equal(d.publicado, true);
  assert.equal(d.listingId, '1100');
  assert.equal(d.categoryId, '38252');
  assert.equal(d.url, 'https://www.sandbox.ebay.com/itm/1100');
  assert.ok(ll.includes('PUT /sell/inventory/v1/inventory_item/pixeria-1790370186236-n4eyaq'));
  assert.ok(ll.includes('POST /sell/inventory/v1/offer'));
  assert.ok(ll.includes('POST /sell/inventory/v1/offer/O-1/publish'));
});

test('si ya había oferta la actualiza en vez de duplicarla', async () => {
  const ll = []; simular(ll, true);
  const d = await (await worker.fetch(post({ id: ITEM.id }, 'k'), ENV)).json();
  assert.equal(d.offerId, 'O-9');
  assert.ok(ll.includes('PUT /sell/inventory/v1/offer/O-9'));
  assert.ok(!ll.includes('POST /sell/inventory/v1/offer'));
});
