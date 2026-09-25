// admira.shop · lógica pura de la tienda del Xpacio (encargo #4291 · FLT-100997 · MorfeoMacMini · 25-09-2026).
// Sin DOM: la usan la web (assets/shop/shop.js) y los tests (test/core.test.mjs) por igual.

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CATEGORIA_POR_DEFECTO = 'pantallas';
const EQUIPO = /^[\w.:@-]{1,80}$/;

/** Errores del contrato del catálogo (vacío = válido). Todo producto lleva precio (€, IVA incluido) y su precio_referencia
 *  (tienda usada o 'estimado') para poder revisarlo (#4293); una ficha sin foto ni características no se publica. */
export function validarCatalogo(cat) {
  const errores = [];
  const cats = new Set((cat?.categorias || []).map((c) => c.id));
  if (!cats.has(CATEGORIA_POR_DEFECTO)) errores.push(`falta la categoría ${CATEGORIA_POR_DEFECTO}`);
  const vistos = new Set();
  for (const p of cat?.productos || []) {
    const id = p?.modelo;
    if (!SLUG.test(id || '')) errores.push(`modelo no es minúsculas-con-guiones: ${id}`);
    if (vistos.has(id)) errores.push(`modelo repetido: ${id}`);
    vistos.add(id);
    if (!cats.has(p.categoria)) errores.push(`${id}: categoría desconocida ${p.categoria}`);
    if (typeof p.muestra !== 'boolean') errores.push(`${id}: falta marcar muestra true/false`);
    if (!(Number.isFinite(p.precio) && p.precio >= 0)) errores.push(`${id}: falta el precio en euros (IVA incluido)`);
    if (!(typeof p.precio_referencia === 'string' && p.precio_referencia.trim())) errores.push(`${id}: precio sin precio_referencia (tienda usada o 'estimado')`);
    if (p.periodo != null && p.periodo !== 'mes') errores.push(`${id}: periodo desconocido ${p.periodo}`);
    if (!(Array.isArray(p.caracteristicas) && p.caracteristicas.length >= 2)) errores.push(`${id}: faltan características clave`);
    if (typeof p.foto !== 'string' || !p.foto.startsWith('/')) errores.push(`${id}: falta la foto`);
  }
  return errores;
}

/** '/p/samsung-qm55c/' → 'samsung-qm55c'. Tolera mayúsculas y espacios convirtiéndolos al slug. */
export function modeloDeRuta(pathname) {
  const m = /\/p\/([^/?#]+)\/?/.exec(String(pathname || ''));
  if (!m) return null;
  let raw; try { raw = decodeURIComponent(m[1]); } catch { raw = m[1]; }
  const slug = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || null;
}

/** Qué pintar en /p/: la ficha si el modelo existe; si no, el catálogo de pantallas. Nunca un 404. */
export function resolverFicha(cat, modelo) {
  const producto = (cat?.productos || []).find((p) => p.modelo === modelo);
  if (producto) return { tipo: 'producto', producto, categoria: (cat.categorias || []).find((c) => c.id === producto.categoria) || null };
  return { tipo: 'catalogo', categoria: CATEGORIA_POR_DEFECTO, motivo: modelo ? `No tenemos el modelo «${modelo}» en el catálogo: estas son nuestras pantallas.` : null };
}

const ETIQUETA = /^[\p{L}\p{N} .,:;#@&'’()\/+_-]{1,80}$/u;
/** ?origen=yokup&equipo=<id>&local=&pantalla= → reposición del inventario de yokup.
 *  local y pantalla son opcionales: si faltan o no pasan la etiqueta, quedan en null (no se inventan). */
export function reposicion(search) {
  const q = new URLSearchParams(search || '');
  const equipo = (q.get('equipo') || '').trim();
  if (q.get('origen') !== 'yokup' || !EQUIPO.test(equipo)) return null;
  const limpio = (v) => { const s = (v || '').trim().replace(/\s+/g, ' '); return s && ETIQUETA.test(s) ? s : null; };
  return { origen: 'yokup', equipo, local: limpio(q.get('local')), pantalla: limpio(q.get('pantalla')), texto: `Reposición para el equipo ${equipo}` };
}

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0, useGrouping: 'always' });
export const euros = (n) => EUR.format(Math.round((Number(n) || 0) * 100) / 100);
/** '1.290 €', '29 €/mes' o 'Gratis'. */
export function precioTexto(p) {
  if (!p || !Number.isFinite(p.precio)) return '—';
  if (p.precio === 0) return 'Gratis';
  return euros(p.precio) + (p.periodo === 'mes' ? '/mes' : '');
}

export function productosDe(cat, categoria) {
  return (cat?.productos || []).filter((p) => !categoria || p.categoria === categoria);
}

// ── Carrito (se guarda en localStorage desde shop.js) ────────────────────────────────────────────────────
export function carritoAnadir(carrito, modelo, cantidad = 1, equipo = null, lugar = null) {
  const lista = Array.isArray(carrito) ? carrito.map((l) => ({ ...l })) : [];
  const n = Math.max(1, Math.min(999, Math.trunc(Number(cantidad) || 1)));
  const local = lugar && typeof lugar.local === 'string' && lugar.local ? lugar.local : null;
  const pantalla = lugar && typeof lugar.pantalla === 'string' && lugar.pantalla ? lugar.pantalla : null;
  const clave = (l) => l.modelo === modelo && (l.equipo || null) === (equipo || null) && (l.local || null) === local && (l.pantalla || null) === pantalla;
  const linea = lista.find(clave);
  if (linea) linea.cantidad = Math.min(999, linea.cantidad + n);
  else lista.push({ modelo, cantidad: n, ...(equipo ? { equipo } : {}), ...(local ? { local } : {}), ...(pantalla ? { pantalla } : {}) });
  return lista;
}
export function carritoQuitar(carrito, indice) { return (carrito || []).filter((_, i) => i !== indice); }
export function carritoTotal(carrito) { return (carrito || []).reduce((s, l) => s + (l.cantidad || 0), 0); }
/** Importes del carrito (IVA incluido): lo que se paga una vez y la cuota mensual de los servicios, por separado. */
export function carritoImportes(carrito, cat) {
  const r = { unico: 0, mensual: 0, lineas: [] };
  for (const l of carrito || []) {
    const p = (cat?.productos || []).find((x) => x.modelo === l.modelo);
    const subtotal = p && Number.isFinite(p.precio) ? p.precio * (l.cantidad || 0) : 0;
    r.lineas.push({ ...l, precio: p ? p.precio : null, periodo: p?.periodo || null, subtotal });
    if (p?.periodo === 'mes') r.mensual += subtotal; else r.unico += subtotal;
  }
  r.unico = Math.round(r.unico * 100) / 100; r.mensual = Math.round(r.mensual * 100) / 100;
  return r;
}
/** Lo que sale en el pie del carrito: «Total 2.580 €» y, si hay servicios mensuales, «+ 38 €/mes». */
export function totalTexto(imp) {
  return euros(imp.unico) + (imp.mensual ? ` + ${euros(imp.mensual)}/mes` : '') + ' (IVA incluido)';
}

// ── Peticiones por correo (sin pasarela de pago todavía) ─────────────────────────────────────────────────
const linea = (k, v) => (v ? `${k}: ${v}` : null);
export function textoPedido(carrito, cat, datos = {}) {
  const nombre = (m) => (cat?.productos || []).find((p) => p.modelo === m)?.nombre || m;
  const imp = carritoImportes(carrito, cat);
  const items = imp.lineas.map((l) => `- ${l.cantidad} × ${nombre(l.modelo)} (${l.modelo}) · ${euros(l.subtotal)}${l.periodo === 'mes' ? '/mes' : ''}${l.equipo ? ` · reposición del equipo ${l.equipo}${l.local ? ` · local ${l.local}` : ''}${l.pantalla ? ` · pantalla ${l.pantalla}` : ''} (yokup)` : ''}`);
  return ['Hola, quiero hacer este pedido en admira.shop:', '', ...items, '', `Total: ${totalTexto(imp)}`, '',
    linea('Nombre', datos.nombre), linea('Empresa', datos.empresa), linea('Email', datos.email), linea('Teléfono', datos.telefono),
    linea('Ciudad', datos.ciudad), linea('Comentarios', datos.comentarios)].filter((x) => x !== null).join('\n');
}
export function textoVenta(d = {}) {
  return ['Hola, quiero venderos o entregaros este equipo usado (recompra / renove):', '',
    linea('Categoría', d.categoria), linea('Marca', d.marca), linea('Modelo', d.modelo), linea('Cantidad', d.cantidad),
    linea('Estado', d.estado), linea('Antigüedad', d.antiguedad), linea('Ubicación', d.ciudad), '',
    linea('Nombre', d.nombre), linea('Empresa', d.empresa), linea('Email', d.email), linea('Teléfono', d.telefono), linea('Comentarios', d.comentarios)]
    .filter((x) => x !== null).join('\n');
}
export function mailto(destino, asunto, cuerpo) {
  return `mailto:${destino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
