#!/usr/bin/env node
// scripts/build.mjs — genera las páginas de admira.shop desde una sola plantilla (encargo #4291 · MorfeoMacMini · 25-09-2026).
//   node scripts/build.mjs
// · La home antigua de Agibot se conserva como /robots.html (la primera vez); agibot/, unitree/ y las páginas de robots no se tocan.
// · Una ficha estática por modelo en /p/<modelo>/ (HTTP 200). /p/ y cualquier /p/<desconocido>/ (vía 404.html de GitHub
//   Pages) muestran el catálogo de pantallas: nunca una página de «no encontrado».
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarCatalogo } from '../assets/shop/core.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = process.env.SHOP_VERSION || 'v.26.09.25.r1';
const DOMINIO = 'https://admira.shop';
const cat = JSON.parse(readFileSync(join(RAIZ, 'data/catalogo.json'), 'utf8'));
const errores = validarCatalogo(cat);
if (errores.length) { console.error('✖ catálogo no válido:\n  ' + errores.join('\n  ')); process.exit(1); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escena = readFileSync(join(RAIZ, 'scripts/xpacio-escena.svg'), 'utf8');

const MENU = [['/', 'Xpacio', 'home'], ['/catalogo/', 'Catálogo', 'catalogo'], ['/vende/', 'Véndenos tu equipo', 'vende'], ['/robots.html', 'Robots', 'robots']];
function pagina({ page, titulo, descripcion, ruta, main }) {
  const menu = MENU.map(([h, t, p]) => `<a href="${h}"${p === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')
    + `<a class="carrito-link" href="/carrito/"${page === 'carrito' ? ' aria-current="page"' : ''}>Carrito<b data-contador hidden>0</b></a>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="admiranext-version" content="AdmiraNeXT ${VERSION}">
<link rel="canonical" href="${DOMINIO}${ruta}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${DOMINIO}/og-image.jpg"><meta property="og:url" content="${DOMINIO}${ruta}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1a1a2e">
<link rel="preload" href="/assets/shop/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/shop/shop.css?v=${VERSION}">
<script type="module" src="/assets/shop/shop.js?v=${VERSION}"></script>
</head>
<body data-page="${page}">
<div class="fondo" aria-hidden="true"><video autoplay muted loop playsinline preload="metadata" poster="/assets/shop/robots.jpg"><source src="/assets/shop/fondo.mp4" type="video/mp4"></video></div>
<header class="barra">
  <a class="marca" href="/" aria-label="ADmira.shop, inicio"><span class="admira">ADmira.</span><span class="neon"><span class="bln bln-1">S</span><span class="bln bln-2">H</span><span class="bln bln-3">O</span><span class="bln bln-4">P</span></span></a>
  <nav class="menu" aria-label="Principal">${menu}</nav>
</header>
<main>
${main}
</main>
<footer class="pie-web">
  <span>ADmira.shop · tienda del Xpacio AdmiraXperience</span>
  <a href="mailto:${cat.contacto}">${cat.contacto}</a>
  <a href="https://www.admiranext.com/">admiranext.com</a>
  <a href="/robots.html">Robots Agibot y Unitree</a>
  <a href="/mcp/">MCP</a>
  <span>AdmiraNeXT ${VERSION}</span>
</footer>
</body>
</html>
`;
}
const ventana = (ruta, cuerpo, extra = '') => `<section class="ventana"${extra}><header><span class="puntos" aria-hidden="true"><i></i><i></i><i></i></span><span class="ruta">${ruta}</span></header><div class="cuerpo">${cuerpo}</div></section>`;
const escribir = (rel, html) => { const f = join(RAIZ, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); };

// La home de robots de siempre queda en /robots.html (solo la primera vez: después la home ya es la del Xpacio).
if (!existsSync(join(RAIZ, 'robots.html'))) copyFileSync(join(RAIZ, 'index.html'), join(RAIZ, 'robots.html'));

// ── Home ──
escribir('index.html', pagina({ page: 'home', ruta: '/', titulo: 'ADmira.shop · Todo para tu Xpacio: compra, renueva y véndenos tu equipo',
  descripcion: 'Pantallas, players, sonido, aromas, wifi, cámaras, kioscos, robots y servicios para el Xpacio AdmiraXperience. Compra, pide presupuesto o véndenos tu equipo usado.',
  main: [
    ventana('user@admira.shop ~ %', `<p class="prompt">boot xpacio --tienda</p><p class="prompt">montando pantallas, sonido, aroma y red… <span class="ok">ok</span></p>
<h1>Todo lo que hace vivo tu <span class="acento">Xpacio</span>.</h1>
<p class="lead">Compra, renueva o véndenos lo que ya tienes. Pantallas, players, hilo musical, aromas, wifi, cámaras, kioscos, robots y los servicios para que todo funcione.</p>
<div class="botones"><a class="btn primario" href="#xpacio">Entra en el Xpacio ↓</a><a class="btn" href="/catalogo/">Ver catálogo</a><a class="btn" href="/vende/">Véndenos tu equipo</a></div>`),
    ventana('~/xpacio · pulsa cualquier elemento', `<div class="escena">${escena}</div><p class="escena-pista">Pulsa un elemento del local para ver su categoría. También puedes elegirla abajo.</p>`, ' id="xpacio"'),
    ventana('ls ~/xpacio/categorias', `<h2>Categorías</h2><div class="rejilla" id="categorias"><p class="lead">Cargando categorías…</p></div>`),
    `<div class="dos">${ventana('~/renove', `<h2>Véndenos tu equipo</h2><p class="lead">¿Renuevas pantallas, players o robots? Te compramos o recogemos el equipo usado y lo tenemos en cuenta en tu nuevo presupuesto.</p><div class="botones"><a class="btn primario" href="/vende/">Ofrecer mi equipo →</a></div>`)}
${ventana('~/yokup', `<h2>¿Vienes desde Yokup?</h2><p class="lead">Desde la ficha de inventario de un equipo, «Reponer» te trae aquí con el equipo ya identificado: pides la reposición y sabemos para qué pantalla es.</p><div class="botones"><a class="btn" href="/p/samsung-qm55c/?origen=yokup&amp;equipo=EJEMPLO-01">Ver un ejemplo →</a></div>`)}</div>`,
  ].join('\n') }));

// ── Catálogo ──
escribir('catalogo/index.html', pagina({ page: 'catalogo', ruta: '/catalogo/', titulo: 'Catálogo · ADmira.shop', descripcion: 'Catálogo por categorías de todo lo que necesita un Xpacio AdmiraXperience.',
  main: ventana('ls ~/xpacio', '<div id="vista"><p class="lead">Cargando catálogo…</p></div>') }));

// ── Fichas: una estática por modelo + /p/ + 404.html (mismo esqueleto; shop.js decide qué pintar) ──
const fichaHtml = (p) => pagina({ page: 'ficha', ruta: p ? `/p/${p.modelo}/` : '/p/', titulo: p ? `${p.nombre} · ADmira.shop` : 'Pantallas · ADmira.shop',
  descripcion: p ? `${p.nombre}: ${p.resumen} Pide presupuesto en admira.shop.` : 'Pantallas profesionales para tu Xpacio.',
  main: ventana(p ? `cat /p/${esc(p.modelo)}/` : 'ls /p/', `<div id="vista"><noscript>${p ? `<h1>${esc(p.nombre)}</h1><p>${esc(p.resumen)}</p><p>Consultar precio: <a href="mailto:${cat.contacto}">${cat.contacto}</a></p>` : '<p>Activa JavaScript para ver el catálogo.</p>'}</noscript><p class="lead">Cargando…</p></div>`) });
for (const p of cat.productos) escribir(`p/${p.modelo}/index.html`, fichaHtml(p));
escribir('p/index.html', fichaHtml(null));
escribir('404.html', fichaHtml(null));

// ── Carrito ──
escribir('carrito/index.html', pagina({ page: 'carrito', ruta: '/carrito/', titulo: 'Carrito · ADmira.shop', descripcion: 'Tu petición de pedido o presupuesto para el Xpacio.',
  main: ventana('cat ~/carrito', `<h1>Tu carrito</h1><p class="lead">Aún no cobramos en la web: envías la petición y te respondemos con presupuesto, disponibilidad y plazos.</p>
<div id="lista"></div><p id="vacio" class="aviso" hidden>Tu carrito está vacío. <a href="/catalogo/">Ver catálogo →</a></p>
<form id="pedido" class="campos" hidden>
<label>Nombre<input name="nombre" autocomplete="name" required></label><label>Empresa<input name="empresa" autocomplete="organization"></label>
<label>Email<input name="email" type="email" autocomplete="email" required></label><label>Teléfono<input name="telefono" type="tel" autocomplete="tel"></label>
<label class="ancho">Ciudad o dirección de entrega<input name="ciudad" autocomplete="address-level2"></label>
<label class="ancho">Comentarios<textarea name="comentarios" placeholder="Plazos, instalación, número de locales…"></textarea></label>
<div class="botones ancho"><button class="btn primario">Enviar petición de presupuesto</button><button class="btn" type="button" id="copiar-pedido">Copiar petición</button></div>
<p id="estado-pedido" class="estado ancho" role="status"></p></form>`) }));

// ── Véndenos tu equipo ──
escribir('vende/index.html', pagina({ page: 'vende', ruta: '/vende/', titulo: 'Véndenos tu equipo · ADmira.shop', descripcion: 'Recompra y renove: véndenos o entréganos tu pantalla, player, robot o equipo usado.',
  main: ventana('sell ~/equipo-usado', `<h1>Véndenos tu equipo</h1><p class="lead">Recompra y renove: cuéntanos qué tienes y te hacemos una oferta o lo descontamos de tu nuevo presupuesto.</p>
<form id="venta" class="campos">
<label>Categoría<select name="categoria" id="venta-categoria" required></select></label><label>Marca<input name="marca" required></label>
<label>Modelo<input name="modelo" required></label><label>Cantidad<input name="cantidad" type="number" min="1" value="1"></label>
<label>Estado<select name="estado"><option>Funciona perfectamente</option><option>Funciona con detalles</option><option>No funciona</option></select></label>
<label>Antigüedad<input name="antiguedad" placeholder="p. ej. 3 años"></label>
<label class="ancho">Ubicación del equipo<input name="ciudad"></label>
<label>Nombre<input name="nombre" autocomplete="name" required></label><label>Empresa<input name="empresa" autocomplete="organization"></label>
<label>Email<input name="email" type="email" autocomplete="email" required></label><label>Teléfono<input name="telefono" type="tel" autocomplete="tel"></label>
<label class="ancho">Comentarios<textarea name="comentarios" placeholder="Accesorios, soportes, fotos disponibles…"></textarea></label>
<div class="botones ancho"><button class="btn primario">Enviar oferta</button></div><p id="estado-venta" class="estado ancho" role="status"></p></form>`) }));

// ── Sitemap: se mantienen las páginas de robots y se añaden las nuevas ──
const urls = ['/', '/catalogo/', '/vende/', '/carrito/', '/robots.html', '/catalogo.html', '/venta.html', '/alquiler.html', '/contacto.html',
  ...cat.categorias.map((c) => `/catalogo/?cat=${c.id}`), ...cat.productos.map((p) => `/p/${p.modelo}/`)];
writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${DOMINIO}${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`✓ admira.shop ${VERSION}: home, catálogo, ${cat.productos.length} fichas, /p/, 404, carrito, vende, sitemap`);
