// admira.shop · lógica pura de la tienda del Xpacio (encargo #4291 · FLT-100997 · MorfeoMacMini · 25-09-2026).
// Sin DOM: la usan la web (assets/shop/shop.js) y los tests (test/core.test.mjs) por igual.

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CATEGORIA_POR_DEFECTO = 'pantallas';
const EQUIPO = /^[\w.:@-]{1,80}$/;

/** Errores del contrato del catálogo (vacío = válido). Un precio solo vale con su fuente: no se inventan precios. */
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
    if (p.precio !== null && !(p.precio && Number.isFinite(p.precio.importe) && typeof p.precio.fuente === 'string' && p.precio.fuente.trim()))
      errores.push(`${id}: precio sin fuente (usa null = «Consultar precio»)`);
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

/** ?origen=yokup&equipo=<id> → {equipo}: la ficha se abre como reposición del equipo del inventario de yokup. */
export function reposicion(search) {
  const q = new URLSearchParams(search || '');
  const equipo = (q.get('equipo') || '').trim();
  if (q.get('origen') !== 'yokup' || !EQUIPO.test(equipo)) return null;
  return { origen: 'yokup', equipo, texto: `Reposición para el equipo ${equipo}` };
}

export function precioTexto(p) {
  return p && p.precio ? `${p.precio.importe.toLocaleString('es-ES')} € · ${p.precio.fuente}` : 'Consultar precio';
}

export function productosDe(cat, categoria) {
  return (cat?.productos || []).filter((p) => !categoria || p.categoria === categoria);
}

// ── Carrito (se guarda en localStorage desde shop.js) ────────────────────────────────────────────────────
export function carritoAnadir(carrito, modelo, cantidad = 1, equipo = null) {
  const lista = Array.isArray(carrito) ? carrito.map((l) => ({ ...l })) : [];
  const n = Math.max(1, Math.min(999, Math.trunc(Number(cantidad) || 1)));
  const clave = (l) => l.modelo === modelo && (l.equipo || null) === (equipo || null);
  const linea = lista.find(clave);
  if (linea) linea.cantidad = Math.min(999, linea.cantidad + n); else lista.push({ modelo, cantidad: n, ...(equipo ? { equipo } : {}) });
  return lista;
}
export function carritoQuitar(carrito, indice) { return (carrito || []).filter((_, i) => i !== indice); }
export function carritoTotal(carrito) { return (carrito || []).reduce((s, l) => s + (l.cantidad || 0), 0); }

// ── Peticiones por correo (sin pasarela de pago todavía) ─────────────────────────────────────────────────
const linea = (k, v) => (v ? `${k}: ${v}` : null);
export function textoPedido(carrito, cat, datos = {}) {
  const nombre = (m) => (cat?.productos || []).find((p) => p.modelo === m)?.nombre || m;
  const items = (carrito || []).map((l) => `- ${l.cantidad} × ${nombre(l.modelo)} (${l.modelo})${l.equipo ? ` · reposición del equipo ${l.equipo} (yokup)` : ''}`);
  return ['Hola, quiero pedir presupuesto en admira.shop:', '', ...items, '',
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
