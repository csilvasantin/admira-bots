// «Publicar en eBay» para los muebles de Pixeria en admira.shop (encargo #4405).
// Crea el anuncio con la Sell Inventory API: inventory_item (título, texto, fotos,
// estado usado) → offer (precio de data/pixeria-venta.json, políticas, categoría) →
// publish. Los datos salen de los mismos sitios que la ficha: el índice público de
// Pixeria y data/pixeria-venta.json de admira.shop. Nada de claves en el repo: van
// como secretos del Worker (ver README.md).
//
// Rutas:
//   GET  /ebay/estado                  qué está configurado y qué falta
//   POST /ebay/publicar {id, dry}      dry:true (o sin credenciales) devuelve el anuncio sin tocar eBay
//   POST /ebay/ubicacion {...}         crea la ubicación de inventario (una vez)
//   GET  /ebay/oauth/inicio?clave=…    consentimiento del vendedor → token de usuario en KV
//   GET  /ebay/oauth/vuelta            vuelta de eBay con el código

const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account'
];
const TITULO_MAX = 80;           // límite de eBay
// eBay traduce su condición «Usado» (conditionId 3000) a USED_EXCELLENT en la
// Inventory API; se puede cambiar por mueble con ebay.estado en pixeria-venta.json.
const ESTADO_USADO = 'USED_EXCELLENT';

function hosts(env) {
  const sandbox = env.EBAY_ENV === 'sandbox';
  return {
    api: sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com',
    auth: sandbox ? 'https://auth.sandbox.ebay.com' : 'https://auth.ebay.com',
    web: sandbox ? 'https://www.sandbox.ebay.com' : 'https://www.ebay.es'
  };
}

function faltan(env) {
  const f = [];
  for (const k of ['EBAY_APP_ID', 'EBAY_CERT_ID', 'EBAY_PUBLISH_KEY', 'EBAY_FULFILLMENT_POLICY_ID',
    'EBAY_PAYMENT_POLICY_ID', 'EBAY_RETURN_POLICY_ID', 'EBAY_MERCHANT_LOCATION_KEY']) {
    if (!env[k]) f.push(k);
  }
  if (!env.EBAY_REFRESH_TOKEN && !env.EBAY) f.push('EBAY_REFRESH_TOKEN (o KV EBAY con el flujo OAuth)');
  return f;
}

// ---------- anuncio (puro, se prueba sin red) ----------

function datosMueble(item) {
  try {
    const p = JSON.parse(item.prompt || '{}');
    return p && p.schema === 'pixeria.furniture/1' ? p : {};
  } catch (e) {
    return {};
  }
}

function recortar(t, max) {
  t = String(t || '').trim();
  if (t.length <= max) return t;
  t = t.slice(0, max + 1);
  return t.slice(0, t.lastIndexOf(' ')).replace(/[\s,;:.·-]+$/, '');
}

function absoluta(url, origen) {
  return new URL(url, origen + '/').href;
}

function escHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function sku(id) {
  return ('pixeria-' + id).replace(/[^A-Za-z0-9-]/g, '-').slice(0, 50);
}

export function construirAnuncio(item, venta, env) {
  const extra = (venta.assets || {})[item.id] || {};
  const eb = extra.ebay || {};
  const mueble = datosMueble(item);
  const origen = env.SHOP_ORIGIN || 'https://admira.shop';
  const dims = Array.isArray(mueble.dimensionsCm) && mueble.dimensionsCm.length === 3 ? mueble.dimensionsCm : null;
  const nombre = String(item.title || '').split(' · ').filter((x) => !/^(corregido|better|v\d+)$/i.test(x.trim()));
  const titulo = recortar(eb.titulo || extra.titulo || nombre.slice(nombre.length > 1 ? 1 : 0).join(' · '), TITULO_MAX);
  // Texto de objeto físico: el de la ficha habla del modelo 3D.
  const texto = eb.texto || extra.textoWallapop || extra.texto || titulo;
  // Fotos Matrix (hiperrealistas) primero; si no hay, las de la ficha.
  const fotos = (extra.fotosMatrix && extra.fotosMatrix.length ? extra.fotosMatrix : [extra.foto, item.thumbnail])
    .filter(Boolean).map((f) => absoluta(f, origen)).filter((f, i, a) => a.indexOf(f) === i).slice(0, 24);
  const precio = extra.precioEUR;
  const cantidad = mueble.quantity || 1;

  const lineas = [texto];
  if (dims) lineas.push('Medidas: ' + dims.map((n) => String(n).replace('.', ',')).join(' × ') + ' cm.');
  if (cantidad > 1) lineas.push('Unidades disponibles: ' + cantidad + '.');
  lineas.push('Estado: usado.');
  lineas.push('Ficha: ' + origen + '/pixeria/?id=' + item.id);
  const descripcion = lineas.map((l) => '<p>' + escHTML(l) + '</p>').join('');

  const product = { title: titulo, description: descripcion, imageUrls: fotos };
  if (eb.aspectos) product.aspects = eb.aspectos;
  const inventoryItem = {
    availability: { shipToLocationAvailability: { quantity: cantidad } },
    condition: eb.estado || ESTADO_USADO,
    product
  };
  if (dims) {
    // Medidas del objeto (cm) como bulto de envío; el peso no lo sabemos y no se inventa.
    const [a, b, c] = dims;
    inventoryItem.packageWeightAndSize = { dimensions: { length: a, width: b, height: c, unit: 'CENTIMETER' } };
  }
  const offer = {
    sku: sku(item.id),
    marketplaceId: env.EBAY_MARKETPLACE || 'EBAY_ES',
    format: 'FIXED_PRICE',
    availableQuantity: cantidad,
    categoryId: eb.categoria || env.EBAY_CATEGORY_ID || null,
    listingDescription: descripcion,
    merchantLocationKey: env.EBAY_MERCHANT_LOCATION_KEY || null,
    pricingSummary: { price: { value: typeof precio === 'number' ? precio.toFixed(2) : null, currency: venta.moneda || 'EUR' } },
    listingPolicies: {
      fulfillmentPolicyId: env.EBAY_FULFILLMENT_POLICY_ID || null,
      paymentPolicyId: env.EBAY_PAYMENT_POLICY_ID || null,
      returnPolicyId: env.EBAY_RETURN_POLICY_ID || null
    }
  };
  const problemas = [];
  if (!titulo) problemas.push('sin título');
  if (!fotos.length) problemas.push('sin fotos');
  if (typeof precio !== 'number') problemas.push('sin precioEUR en data/pixeria-venta.json');
  if (extra.enVenta === false) problemas.push('el mueble no está a la venta (enVenta:false)');
  return { sku: offer.sku, titulo, fotos, inventoryItem, offer, problemas };
}

// ---------- eBay ----------

async function tokenUsuario(env) {
  const refresh = env.EBAY_REFRESH_TOKEN || (env.EBAY && await env.EBAY.get('refresh_token'));
  if (!refresh) throw new Error('falta el token de usuario de eBay');
  const r = await fetch(hosts(env).api + '/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(env.EBAY_APP_ID + ':' + env.EBAY_CERT_ID)
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh, scope: SCOPES.join(' ') })
  });
  const d = await r.json();
  if (!r.ok) throw new Error('OAuth eBay ' + r.status + ': ' + (d.error_description || d.error || ''));
  return d.access_token;
}

async function ebay(env, token, metodo, ruta, cuerpo) {
  const r = await fetch(hosts(env).api + ruta, {
    method: metodo,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Language': env.EBAY_IDIOMA || 'es-ES',
      'Accept-Language': env.EBAY_IDIOMA || 'es-ES',
      'X-EBAY-C-MARKETPLACE-ID': env.EBAY_MARKETPLACE || 'EBAY_ES'
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const txt = await r.text();
  const d = txt ? JSON.parse(txt) : {};
  if (!r.ok) {
    const e = new Error('eBay ' + metodo + ' ' + ruta.split('?')[0] + ' → ' + r.status);
    e.ebay = d.errors || d;
    throw e;
  }
  return d;
}

async function categoriaSugerida(env, token, titulo) {
  const arbol = await ebay(env, token, 'GET',
    '/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=' + (env.EBAY_MARKETPLACE || 'EBAY_ES'));
  const s = await ebay(env, token, 'GET', '/commerce/taxonomy/v1/category_tree/' + arbol.categoryTreeId +
    '/get_category_suggestions?q=' + encodeURIComponent(titulo));
  const c = s.categorySuggestions && s.categorySuggestions[0];
  if (!c) throw new Error('eBay no sugiere categoría para «' + titulo + '»: pon EBAY_CATEGORY_ID o ebay.categoria');
  return c.category.categoryId;
}

export async function publicar(env, anuncio) {
  const token = await tokenUsuario(env);
  const offer = Object.assign({}, anuncio.offer);
  if (!offer.categoryId) offer.categoryId = await categoriaSugerida(env, token, anuncio.titulo);
  await ebay(env, token, 'PUT', '/sell/inventory/v1/inventory_item/' + encodeURIComponent(anuncio.sku), anuncio.inventoryItem);
  // Una oferta por SKU y mercado: si ya existe (se pulsó antes), se actualiza en vez de duplicar.
  let offerId = null;
  try {
    const lista = await ebay(env, token, 'GET', '/sell/inventory/v1/offer?sku=' + encodeURIComponent(anuncio.sku) +
      '&marketplace_id=' + offer.marketplaceId);
    offerId = (lista.offers || [])[0] && lista.offers[0].offerId;
  } catch (e) {
    if (!/→ 404$/.test(e.message)) throw e;   // 404 = SKU sin ofertas
  }
  if (offerId) await ebay(env, token, 'PUT', '/sell/inventory/v1/offer/' + offerId, offer);
  else offerId = (await ebay(env, token, 'POST', '/sell/inventory/v1/offer', offer)).offerId;
  const pub = await ebay(env, token, 'POST', '/sell/inventory/v1/offer/' + offerId + '/publish');
  return { offerId, listingId: pub.listingId, url: hosts(env).web + '/itm/' + pub.listingId, categoryId: offer.categoryId };
}

// ---------- HTTP ----------

function cors(env, req) {
  const o = req.headers.get('Origin') || '';
  const ok = o === (env.SHOP_ORIGIN || 'https://admira.shop') || /^http:\/\/localhost(:\d+)?$/.test(o);
  return {
    'Access-Control-Allow-Origin': ok ? o : (env.SHOP_ORIGIN || 'https://admira.shop'),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin'
  };
}

function json(d, status, h) {
  return new Response(JSON.stringify(d, null, 2), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, h) });
}

function autorizado(env, req, clave) {
  const k = clave || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(env.EBAY_PUBLISH_KEY) && k === env.EBAY_PUBLISH_KEY;
}

async function cargar(env, id) {
  const origen = env.SHOP_ORIGIN || 'https://admira.shop';
  const [indice, venta] = await Promise.all([
    fetch(env.STOCK_INDEX || 'https://stock.admira.store/stock/index.json', { cf: { cacheTtl: 0 } }).then((r) => r.json()),
    fetch(origen + '/data/pixeria-venta.json', { cf: { cacheTtl: 0 } }).then((r) => r.json())
  ]);
  const item = (indice.items || []).find((i) => i.id === id);
  return { item, venta };
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/ebay/estado') {
        const f = faltan(env);
        return json({ entorno: env.EBAY_ENV || 'production', mercado: env.EBAY_MARKETPLACE || 'EBAY_ES', listo: !f.length, faltan: f }, 200, h);
      }

      if (url.pathname === '/ebay/publicar' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!b.id) return json({ error: 'falta id' }, 400, h);
        const { item, venta } = await cargar(env, b.id);
        if (!item) return json({ error: 'ese mueble no está en Pixeria' }, 404, h);
        const anuncio = construirAnuncio(item, venta, env);
        const f = faltan(env);
        // Vista previa: no necesita clave ni credenciales, y no toca eBay.
        if (b.dry || f.length) return json({ publicado: false, motivo: b.dry ? 'vista previa' : 'faltan credenciales', faltan: f, anuncio }, 200, h);
        if (!autorizado(env, req)) return json({ error: 'clave de publicación incorrecta' }, 401, h);
        if (anuncio.problemas.length) return json({ error: 'anuncio incompleto', problemas: anuncio.problemas }, 422, h);
        const r = await publicar(env, anuncio);
        return json(Object.assign({ publicado: true }, r), 200, h);
      }

      if (url.pathname === '/ebay/ubicacion' && req.method === 'POST') {
        if (!autorizado(env, req)) return json({ error: 'clave de publicación incorrecta' }, 401, h);
        const b = await req.json();
        const token = await tokenUsuario(env);
        await ebay(env, token, 'POST', '/sell/inventory/v1/location/' + encodeURIComponent(env.EBAY_MERCHANT_LOCATION_KEY), {
          location: { address: { postalCode: b.cp, city: b.ciudad, stateOrProvince: b.provincia, country: b.pais || 'ES' } },
          name: b.nombre || 'Admira', merchantLocationStatus: 'ENABLED', locationTypes: ['WAREHOUSE']
        });
        return json({ ok: true, merchantLocationKey: env.EBAY_MERCHANT_LOCATION_KEY }, 200, h);
      }

      if (url.pathname === '/ebay/oauth/inicio') {
        if (!autorizado(env, req, url.searchParams.get('clave'))) return json({ error: 'clave de publicación incorrecta' }, 401, h);
        if (!env.EBAY || !env.EBAY_RUNAME) return json({ error: 'falta el KV EBAY o EBAY_RUNAME' }, 500, h);
        const state = crypto.randomUUID();
        await env.EBAY.put('state:' + state, '1', { expirationTtl: 600 });
        const q = new URLSearchParams({ client_id: env.EBAY_APP_ID, redirect_uri: env.EBAY_RUNAME, response_type: 'code', scope: SCOPES.join(' '), state });
        return Response.redirect(hosts(env).auth + '/oauth2/authorize?' + q, 302);
      }

      if (url.pathname === '/ebay/oauth/vuelta') {
        const state = url.searchParams.get('state');
        if (!env.EBAY || !state || !(await env.EBAY.get('state:' + state))) return json({ error: 'state no válido' }, 400, h);
        await env.EBAY.delete('state:' + state);
        const r = await fetch(hosts(env).api + '/identity/v1/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + btoa(env.EBAY_APP_ID + ':' + env.EBAY_CERT_ID) },
          body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code') || '', redirect_uri: env.EBAY_RUNAME })
        });
        const d = await r.json();
        if (!r.ok) return json({ error: 'eBay no dio el token', detalle: d.error_description || d.error }, 502, h);
        // El token se guarda y no se enseña.
        await env.EBAY.put('refresh_token', d.refresh_token);
        return new Response('eBay conectado. Ya puedes cerrar esta pestaña y usar «Publicar en eBay» en admira.shop.',
          { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      return json({ error: 'ruta desconocida' }, 404, h);
    } catch (e) {
      return json({ error: e.message, ebay: e.ebay || undefined }, 502, h);
    }
  }
};
