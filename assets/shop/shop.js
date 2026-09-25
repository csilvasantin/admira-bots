// admira.shop · interfaz de la tienda del Xpacio (encargo #4291 · MorfeoMacMini · 25-09-2026).
// Todo se pinta con textContent: ni el `equipo` de la URL ni el catálogo pueden inyectar HTML.
import { modeloDeRuta, resolverFicha, reposicion, precioTexto, euros, productosDe, carritoAnadir, carritoQuitar, carritoTotal, carritoImportes, totalTexto, textoPedido, textoVenta, mailto } from './core.mjs';

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
// Si se llega desde yokup, la reposición (equipo y, si vienen, local y pantalla) viaja a las fichas elegidas.
const urlFicha = (p, repo = null) => `/p/${p.modelo}/` + (repo ? '?' + new URLSearchParams({ origen: 'yokup', equipo: repo.equipo, ...(repo.local && { local: repo.local }), ...(repo.pantalla && { pantalla: repo.pantalla }) }) : '');

function tarjetaProducto(p, repo = null) {
  const c = categoria(p.categoria);
  const t = el('a', { class: 'tarjeta', href: urlFicha(p, repo), style: `--c:${c.color}` },
    el('div', { class: 'crt' }, el('img', { class: 'foto', src: p.foto, alt: '', loading: 'lazy', width: '600', height: '400' }), el('i', { class: 'led', 'aria-hidden': 'true' })),
    el('h3', { text: p.nombre }),
    el('p', { text: p.resumen }),
    el('div', { class: 'pie' }, el('span', { class: 'precio', text: precioTexto(p) }), p.muestra ? el('span', { class: 'chip muestra', text: 'muestra' }) : el('span', { class: 'chip', text: c.nombre })));
  return t;
}

/** Panel de orden de trabajo: rojo mientras está pendiente, verde al entrar en el carrito. Sin local no se inventa el nombre. */
function bloqueReposicion(repo, compacto = false) {
  const estado = el('p', { class: 'repo-estado', role: 'status', text: compacto ? 'Elige el modelo para reponer.' : 'Marcado para reponer desde Yokup.' });
  const datos = el('dl', { class: 'repo-datos' },
    el('dt', { text: 'Local' }), el('dd', { text: repo.local || 'Lo identificamos por el equipo en Yokup' }),
    ...(repo.pantalla ? [el('dt', { text: 'Pantalla' }), el('dd', { text: repo.pantalla })] : []),
    el('dt', { text: 'Equipo' }), el('dd', { text: repo.equipo }));
  const nodo = el('section', { class: 'reposicion', role: 'note', 'aria-label': 'Reposición', 'data-estado': 'pendiente' },
    el('span', { class: 'led', 'aria-hidden': 'true' }),
    el('div', {}, el('p', { class: 'repo-titulo', text: '↻ Reposición para' }), datos), estado);
  return { nodo, ok() { nodo.dataset.estado = 'ok'; estado.textContent = 'Reposición en el carrito. Envía el pedido y la pantalla vuelve a verde tras la instalación.'; } };
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
    el('p', { class: 'episodio', text: 'Archivo de piezas' }),
    ...(repo ? [bloqueReposicion(repo, true).nodo] : []),
    ...(motivo ? [el('p', { class: 'aviso', text: motivo })] : []),
    el('p', { class: 'prompt', text: `ls /xpacio/${cat || '*'}` }),
    el('h1', { text: c ? c.nombre : 'Todo para tu Xpacio' }),
    el('p', { class: 'lead', text: c ? c.descripcion : 'Pantallas, players, sonido, aromas, red, cámaras, kioscos, robots y servicios.' }),
    filtros,
    el('div', { class: 'rejilla' }, ...productosDe(CAT, c ? cat : null).map((p) => tarjetaProducto(p, repo))),
    el('p', { class: 'escena-pista', text: 'Precios en euros, IVA incluido. Los productos marcados «muestra» son ejemplos: te confirmamos disponibilidad y ficha técnica al tramitar el pedido.' }));
}
async function paginaCatalogo() {
  await catalogo();
  const cat = new URLSearchParams(location.search).get('cat');
  const repo = reposicion(location.search);
  pintarCatalogo($('#vista'), categoria(cat) ? cat : null, cat && !categoria(cat) ? `No existe la categoría «${cat}»: te enseñamos todo el catálogo.` : null, repo);
  if (categoria(cat)) document.title = `${categoria(cat).nombre} · admira.shop`;
}

// Servicios AdmiraXperience que se ofrecen como opción en la ficha de cualquier equipo.
const OPCIONES = [
  { modelo: 'servicio-instalacion', texto: 'Instalación AdmiraXperience', detalle: 'montaje, cableado y alta en Admira, por unidad' },
  { modelo: 'servicio-soporte', texto: 'Soporte AdmiraXperience', detalle: 'atención remota y red de técnicos Yokup, por unidad' },
];
async function ficha() {
  await catalogo();
  const vista = $('#vista');
  const r = resolverFicha(CAT, modeloDeRuta(location.pathname));
  const repo = reposicion(location.search);
  if (r.tipo === 'catalogo') { pintarCatalogo(vista, r.categoria, r.motivo, repo); document.title = 'Pantallas · admira.shop'; return; }
  const { producto: p, categoria: c } = r;
  document.title = `${p.nombre} · admira.shop`;
  const esServicio = !!p.servicio;
  const cantidad = el('input', { class: 'cantidad', type: 'number', min: '1', max: '999', value: '1', 'aria-label': 'Cantidad' });
  const estado = el('p', { class: 'estado', role: 'status' });
  // Opción de instalación y soporte (solo en equipos: un servicio no se instala).
  const opciones = esServicio ? [] : OPCIONES.map((o) => ({ ...o, p: CAT.productos.find((x) => x.modelo === o.modelo) })).filter((o) => o.p)
    .map((o) => ({ ...o, check: el('input', { type: 'checkbox', value: o.modelo }) }));
  const repoUI = repo ? bloqueReposicion(repo) : null;
  const anadir = el('button', { class: repo ? 'btn reponer grande' : 'btn primario grande', type: 'button', text: repo ? 'Añadir reposición al carrito' : 'Añadir al carrito' });
  anadir.onclick = () => {
    const equipo = repo ? repo.equipo : null;
    const lugar = repo ? { local: repo.local, pantalla: repo.pantalla } : null;
    let c2 = carritoAnadir(leerCarrito(), p.modelo, cantidad.value, equipo, lugar);
    for (const o of opciones) if (o.check.checked) c2 = carritoAnadir(c2, o.modelo, cantidad.value, equipo, lugar);
    guardarCarrito(c2);
    if (repoUI) repoUI.ok();
    const b = document.querySelector('[data-contador]');
    if (b) { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
    const extra = opciones.filter((o) => o.check.checked).map((o) => o.texto.toLowerCase());
    estado.replaceChildren(`Añadido${extra.length ? ` con ${extra.join(' y ')}` : ''}. `, el('a', { href: '/carrito/', text: 'Ver carrito →' }));
  };
  const compra = el('div', { class: 'compra' },
    el('p', { class: 'precio-grande' }, el('span', { text: precioTexto(p) })),
    el('p', { class: 'iva', text: p.precio === 0 ? 'Sin coste' : `IVA incluido${p.periodo === 'mes' ? ' · cuota mensual' : ''}` }),
    ...(opciones.length ? [el('fieldset', { class: 'opciones' }, el('legend', { text: 'Añade AdmiraXperience' }),
      ...opciones.map((o) => el('label', { class: 'opcion' }, o.check,
        el('span', {}, el('b', { text: o.texto }), el('small', { text: o.detalle })), el('span', { class: 'precio', text: `+ ${precioTexto(o.p)}` }))))] : []),
    el('div', { class: 'botones' }, cantidad, anadir),
    estado);
  const caracteristicas = el('ul', { class: 'caracteristicas' }, ...(p.caracteristicas || []).map((t) => el('li', { text: t })));
  const datos = el('dl', { class: 'datos' },
    el('dt', { text: 'Modelo' }), el('dd', { text: p.modelo }),
    el('dt', { text: 'Marca' }), el('dd', { text: p.marca }),
    el('dt', { text: 'Categoría' }), el('dd', {}, el('a', { href: `/catalogo/?cat=${c.id}`, text: c.nombre })));
  const vende = p.categoria === 'servicios' ? null : el('aside', { class: 'vende-bloque' },
    el('h2', { text: 'Véndenos el tuyo' }),
    el('p', { text: `¿Renuevas? Te compramos o recogemos tu equipo usado de ${c.nombre.toLowerCase()} y lo descontamos de este pedido.` }),
    el('a', { class: 'btn', href: `/vende/?categoria=${encodeURIComponent(c.id)}`, text: 'Tasar mi equipo usado →' }));
  vista.replaceChildren(
    el('p', { class: 'prompt' }, 'cat ', el('span', { text: `/p/${p.modelo}/` })),
    ...(repoUI ? [repoUI.nodo] : []),
    el('div', { class: 'ficha' },
      el('div', { class: 'visual crt', style: `--c:${c.color}` }, el('img', { src: p.foto, alt: `${p.nombre} (ilustración)`, width: '600', height: '400' }), el('i', { class: 'led', 'aria-hidden': 'true' })),
      el('div', { style: `--c:${c.color}` },
        el('p', { class: 'marca-chip', text: `${p.marca !== '—' ? p.marca + ' · ' : ''}${c.nombre}` }),
        el('h1', { text: p.nombre }), el('p', { class: 'lead', text: p.resumen }),
        compra,
        el('h2', { class: 'sub', text: 'Características clave' }), caracteristicas,
        ...(p.muestra ? [el('p', { class: 'aviso', text: 'Producto de muestra: te confirmamos disponibilidad y ficha técnica al tramitar el pedido.' })] : []),
        datos,
        ...(p.url ? [el('div', { class: 'botones' }, el('a', { class: 'btn', href: p.url, text: p.categoria === 'robots' ? 'Ver ficha completa del robot' : 'Ir al servicio' }))] : []))),
    ...(vende ? [vende] : []));
  const otras = productosDe(CAT, p.categoria).filter((x) => x.modelo !== p.modelo).slice(0, 3);
  document.querySelector('[data-relacionadas]')?.remove();
  if (otras.length) {
    const puntos = el('span', { class: 'puntos', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'));
    vista.closest('main')?.append(el('section', { class: 'ventana', 'data-relacionadas': '' },
      el('header', {}, puntos, el('span', { class: 'ruta', text: `ls /xpacio/${c.id}` })),
      el('div', { class: 'cuerpo' },
        el('p', { class: 'episodio', text: 'Otras piezas del mismo capítulo' }),
        el('div', { class: 'rejilla' }, ...otras.map((x) => tarjetaProducto(x, repo))))));
  }
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
      const notaRepo = l.equipo ? `Reposición del equipo ${l.equipo}${l.local ? ` · ${l.local}` : ''}${l.pantalla ? ` · ${l.pantalla}` : ''}` : '';
      return el('tr', {}, el('td', {}, el('a', { href: `/p/${l.modelo}/`, text: p ? p.nombre : l.modelo }), notaRepo ? el('small', { text: notaRepo }) : null),
        el('td', { text: String(l.cantidad) }), el('td', { text: precioTexto(p) }),
        el('td', { class: 'precio', text: p ? euros(p.precio * l.cantidad) + (p.periodo === 'mes' ? '/mes' : '') : '—' }), el('td', {}, quitar));
    });
    const imp = carritoImportes(c, CAT);
    vista.replaceChildren(...(c.length ? [el('table', { class: 'carrito-lista' },
      el('thead', {}, el('tr', {}, ...['Producto', 'Uds.', 'Precio', 'Importe', ''].map((t) => el('th', { text: t })))), el('tbody', {}, ...filas),
      el('tfoot', {}, el('tr', {}, el('th', { colspan: '3', text: 'Total' }), el('td', { colspan: '2', class: 'precio total', text: totalTexto(imp) }))))] : []));
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const cuerpo = textoPedido(leerCarrito(), CAT, datos);
    location.href = mailto(CAT.contacto, `Pedido admira.shop · ${datos.empresa || datos.nombre || ''}`.trim(), cuerpo);
    estado.textContent = `Abriendo tu correo para enviar el pedido a ${CAT.contacto}. Si no se abre, usa «Copiar pedido».`;
  };
  $('#copiar-pedido').onclick = async () => {
    const texto = textoPedido(leerCarrito(), CAT, Object.fromEntries(new FormData(form)));
    try { await navigator.clipboard.writeText(texto); estado.textContent = `Pedido copiado: pégalo en un correo a ${CAT.contacto}.`; } catch { estado.textContent = texto; }
  };
  pintar();
}

async function vende() {
  await catalogo();
  const form = $('#venta'), estado = $('#estado-venta'), sel = $('#venta-categoria');
  sel.replaceChildren(el('option', { value: '', text: 'Elige…' }), ...CAT.categorias.filter((c) => c.id !== 'servicios').map((c) => el('option', { value: c.nombre, text: c.nombre })));
  const pre = categoria(new URLSearchParams(location.search).get('categoria'));
  if (pre && pre.id !== 'servicios') sel.value = pre.nombre;
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
