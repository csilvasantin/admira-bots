// admira.shop · interfaz de la tienda del Xpacio (encargo #4291 · MorfeoMacMini · 25-09-2026).
// Todo se pinta con textContent: ni el `equipo` de la URL ni el catálogo pueden inyectar HTML.
import { modeloDeRuta, resolverFicha, reposicion, precioTexto, productosDe, carritoAnadir, carritoQuitar, carritoTotal, textoPedido, textoVenta, mailto } from './core.mjs';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}, ...hijos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else if (k === 'style') n.setAttribute('style', v); else n.setAttribute(k, v);
  }
  for (const h of hijos) if (h != null) n.append(h);
  return n;
};
const CLAVE = 'admira.shop.carrito';
const leerCarrito = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; } };
const guardarCarrito = (c) => { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch {} pintarContador(c); };
function pintarContador(c = leerCarrito()) { const b = $('[data-contador]'); if (b) { b.textContent = carritoTotal(c); b.hidden = !carritoTotal(c); } }

let CAT;
async function catalogo() {
  if (!CAT) CAT = await (await fetch('/data/catalogo.json', { cache: 'no-cache' })).json();
  return CAT;
}
const categoria = (id) => CAT.categorias.find((c) => c.id === id);
// Si se llega desde yokup, la reposición viaja también a las fichas que se elijan desde un listado.
const urlFicha = (p, repo = null) => `/p/${p.modelo}/` + (repo ? `?origen=yokup&equipo=${encodeURIComponent(repo.equipo)}` : '');

function tarjetaProducto(p, repo = null) {
  const c = categoria(p.categoria);
  const t = el('a', { class: 'tarjeta', href: urlFicha(p, repo), style: `--c:${c.color}` },
    el('span', { class: 'icono', text: c.icono, 'aria-hidden': 'true' }),
    el('h3', { text: p.nombre }),
    el('p', { text: p.resumen }),
    el('div', { class: 'pie' }, el('span', { class: 'precio', text: precioTexto(p) }), p.muestra ? el('span', { class: 'chip muestra', text: 'muestra' }) : el('span', { class: 'chip', text: c.nombre })));
  return t;
}
function tarjetaCategoria(c) {
  const n = CAT.productos.filter((p) => p.categoria === c.id).length;
  return el('a', { class: 'tarjeta', href: `/catalogo/?cat=${c.id}`, style: `--c:${c.color}` },
    el('span', { class: 'icono', text: c.icono, 'aria-hidden': 'true' }), el('h3', { text: c.nombre }), el('p', { text: c.descripcion }),
    el('div', { class: 'pie' }, el('span', { text: `${n} ${n === 1 ? 'elemento' : 'elementos'}` }), el('span', { text: 'Ver →' })));
}

async function home() {
  await catalogo();
  $('#categorias').replaceChildren(...CAT.categorias.map(tarjetaCategoria));
}

function pintarCatalogo(destino, cat, motivo, repo = null) {
  const filtros = el('nav', { class: 'filtros', 'aria-label': 'Categorías' },
    el('a', { href: '/catalogo/', 'aria-current': cat ? 'false' : 'true', text: 'Todo' }),
    ...CAT.categorias.map((c) => el('a', { href: `/catalogo/?cat=${c.id}`, 'aria-current': c.id === cat ? 'true' : 'false', text: c.nombre })));
  const c = cat && categoria(cat);
  destino.replaceChildren(
    ...(repo ? [el('p', { class: 'reposicion', role: 'note' }, el('span', { text: '↻', 'aria-hidden': 'true' }), el('span', { text: `${repo.texto}: elige el modelo` }))] : []),
    ...(motivo ? [el('p', { class: 'aviso', text: motivo })] : []),
    el('p', { class: 'prompt', text: `ls /xpacio/${cat || '*'}` }),
    el('h1', { text: c ? c.nombre : 'Todo para tu Xpacio' }),
    el('p', { class: 'lead', text: c ? c.descripcion : 'Pantallas, players, sonido, aromas, red, cámaras, kioscos, robots y servicios.' }),
    filtros,
    el('div', { class: 'rejilla' }, ...productosDe(CAT, c ? cat : null).map((p) => tarjetaProducto(p, repo))),
    el('p', { class: 'escena-pista', text: 'Precios bajo consulta. Los productos marcados «muestra» son ejemplos: te confirmamos disponibilidad y ficha técnica al pedir presupuesto.' }));
}
async function paginaCatalogo() {
  await catalogo();
  const cat = new URLSearchParams(location.search).get('cat');
  pintarCatalogo($('#vista'), categoria(cat) ? cat : null, cat && !categoria(cat) ? `No existe la categoría «${cat}»: te enseñamos todo el catálogo.` : null);
  if (categoria(cat)) document.title = `${categoria(cat).nombre} · admira.shop`;
}

async function ficha() {
  await catalogo();
  const vista = $('#vista');
  const r = resolverFicha(CAT, modeloDeRuta(location.pathname));
  const repo = reposicion(location.search);
  if (r.tipo === 'catalogo') { pintarCatalogo(vista, r.categoria, r.motivo, repo); document.title = 'Pantallas · admira.shop'; return; }
  const { producto: p, categoria: c } = r;
  document.title = `${p.nombre} · admira.shop`;
  const cantidad = el('input', { class: 'cantidad', type: 'number', min: '1', max: '999', value: '1', 'aria-label': 'Cantidad' });
  const estado = el('p', { class: 'estado', role: 'status' });
  const anadir = el('button', { class: 'btn primario', type: 'button', text: repo ? 'Añadir reposición al carrito' : 'Añadir al carrito' });
  anadir.onclick = () => {
    guardarCarrito(carritoAnadir(leerCarrito(), p.modelo, cantidad.value, repo ? repo.equipo : null));
    estado.replaceChildren('Añadido. ', el('a', { href: '/carrito/', text: 'Ver carrito y pedir presupuesto →' }));
  };
  const datos = el('dl', { class: 'datos' },
    el('dt', { text: 'Modelo' }), el('dd', { text: p.modelo }),
    el('dt', { text: 'Marca' }), el('dd', { text: p.marca }),
    el('dt', { text: 'Categoría' }), el('dd', {}, el('a', { href: `/catalogo/?cat=${c.id}`, text: c.nombre })),
    el('dt', { text: 'Precio' }), el('dd', { class: 'precio', text: precioTexto(p) }));
  const acciones = el('div', { class: 'botones' }, cantidad, anadir,
    ...(p.url ? [el('a', { class: 'btn', href: p.url, text: p.categoria === 'robots' ? 'Ver ficha completa del robot' : 'Ir al servicio' })] : []),
    el('a', { class: 'btn', href: '/vende/', text: 'Véndenos el tuyo usado' }));
  vista.replaceChildren(
    el('p', { class: 'prompt' }, 'cat ', el('span', { text: `/p/${p.modelo}/` })),
    ...(repo ? [el('p', { class: 'reposicion', role: 'note' }, el('span', { text: '↻', 'aria-hidden': 'true' }), el('span', { text: repo.texto }))] : []),
    el('div', { class: 'ficha' },
      el('div', { class: 'visual', style: `--c:${c.color}`, 'aria-hidden': 'true', text: c.icono }),
      el('div', {},
        el('h1', { text: p.nombre }), el('p', { class: 'lead', text: p.resumen }),
        ...(p.muestra ? [el('p', { class: 'aviso', text: 'Producto de muestra: te confirmamos disponibilidad, ficha técnica y precio al pedir presupuesto.' })] : []),
        datos, acciones, estado)));
}

async function carrito() {
  await catalogo();
  const vista = $('#lista'), form = $('#pedido'), estado = $('#estado-pedido');
  const pintar = () => {
    const c = leerCarrito();
    $('#vacio').hidden = c.length > 0; form.hidden = c.length === 0;
    const filas = c.map((l, i) => {
      const p = CAT.productos.find((x) => x.modelo === l.modelo);
      const quitar = el('button', { class: 'btn', type: 'button', text: 'Quitar' });
      quitar.onclick = () => { guardarCarrito(carritoQuitar(leerCarrito(), i)); pintar(); };
      return el('tr', {}, el('td', {}, el('a', { href: `/p/${l.modelo}/`, text: p ? p.nombre : l.modelo }), l.equipo ? el('small', { text: `Reposición del equipo ${l.equipo}` }) : null),
        el('td', { text: String(l.cantidad) }), el('td', { class: 'precio', text: precioTexto(p) }), el('td', {}, quitar));
    });
    vista.replaceChildren(...(c.length ? [el('table', { class: 'carrito-lista' },
      el('thead', {}, el('tr', {}, ...['Producto', 'Uds.', 'Precio', ''].map((t) => el('th', { text: t })))), el('tbody', {}, ...filas))] : []));
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const cuerpo = textoPedido(leerCarrito(), CAT, datos);
    location.href = mailto(CAT.contacto, `Petición de presupuesto admira.shop · ${datos.empresa || datos.nombre || ''}`.trim(), cuerpo);
    estado.textContent = `Abriendo tu correo para enviar la petición a ${CAT.contacto}. Si no se abre, usa «Copiar petición».`;
  };
  $('#copiar-pedido').onclick = async () => {
    const texto = textoPedido(leerCarrito(), CAT, Object.fromEntries(new FormData(form)));
    try { await navigator.clipboard.writeText(texto); estado.textContent = `Petición copiada: pégala en un correo a ${CAT.contacto}.`; } catch { estado.textContent = texto; }
  };
  pintar();
}

async function vende() {
  await catalogo();
  const form = $('#venta'), estado = $('#estado-venta'), sel = $('#venta-categoria');
  sel.replaceChildren(el('option', { value: '', text: 'Elige…' }), ...CAT.categorias.filter((c) => c.id !== 'servicios').map((c) => el('option', { value: c.nombre, text: c.nombre })));
  form.onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    location.href = mailto(CAT.contacto, `Véndenos tu equipo · ${d.marca || ''} ${d.modelo || ''}`.trim(), textoVenta(d));
    estado.textContent = `Abriendo tu correo para enviar la oferta a ${CAT.contacto}.`;
  };
}

pintarContador();
const pagina = document.body.dataset.page;
({ home, catalogo: paginaCatalogo, ficha, carrito, vende }[pagina] || (() => {}))().catch((e) => {
  const v = $('#vista') || $('main');
  if (v) v.prepend(el('p', { class: 'aviso', text: 'No se pudo cargar el catálogo. Recarga la página o escríbenos a info@admira.com.' }));
  console.error(e);
});
