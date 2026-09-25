// Muebles de Pixeria en admira.shop (encargo #4396). Secciones Xtanco, Cafetería
// y Libros de la estantería (encargo #4407).
// Lee en vivo el índice público de Pixeria y lo cruza con data/pixeria-venta.json
// (a la venta, precio en euros y textos de ficha). Un mueble dado de alta en
// Pixeria aparece aquí sin tocar nada: la regla de Carlos es que todo se vende.
(function () {
  'use strict';

  var INDICE = 'https://stock.admira.store/stock/index.json';
  var VENTA = '/data/pixeria-venta.json';
  // Libros reales de la estantería de la Cafetería (encargo #4407): título, autor,
  // ISBN y dónde comprarlos, nuevos (Casa del Libro) o de segunda mano.
  var LIBROS = '/data/libros-estanteria.json';
  // Estancias de los Xpacios: el slug del prompt pixeria.furniture/1 dice de cuál es.
  var ESTANCIAS = [
    { id: 'xtanco', nombre: 'Xtanco', slugs: ['xtanco'] },
    { id: 'cafeteria', nombre: 'Cafetería', slugs: ['alsea'] },
    { id: 'libros', nombre: 'Libros de la estantería' }
  ];
  // Wallapop no ofrece enlace oficial con datos precargados: su única vía de publicar
  // desde fuera es la Connect API (developers.wallapop.com), que exige credenciales
  // de integrador dadas por Wallapop y el login OAuth del vendedor. Mientras tanto,
  // el anuncio se prepara aquí para copiar y se sube a mano en su formulario.
  var WALLAPOP_SUBIR = 'https://es.wallapop.com/app/catalog/upload';
  var WALLAPOP_CATEGORIA = 'Hogar y jardín > Muebles';
  var WALLAPOP_TITULO_MAX = 50;
  var EBAY_CLAVE = 'admira-shop-ebay-clave';
  var app = document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function num(n) {
    return (Math.round(n * 10) / 10).toLocaleString('es-ES');
  }

  function euros(n) {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  // El prompt de un furni es JSON pixeria.furniture/1: slug del Xpacio, medidas...
  function datosMueble(item) {
    try {
      var p = JSON.parse(item.prompt || '{}');
      return p && (p.schema === 'pixeria.furniture/1' || p.schema === 'pixeria.book/1') ? p : {};
    } catch (e) {
      return {};
    }
  }

  function capital(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  // "Alsea · Cafetera espresso 3 grupos · corregido" → colección + nombre limpio.
  function limpiarTitulo(t) {
    var partes = String(t || 'Mueble de Pixeria').split(' · ')
      .filter(function (x) { return !/^(corregido|better|v\d+)$/i.test(x.trim()); });
    var coleccion = partes.length > 1 ? partes.shift() : '';
    return { coleccion: coleccion, nombre: partes.join(' · ') };
  }

  function producto(item, venta) {
    var extra = venta.assets[item.id] || {};
    var base = venta.porDefecto || {};
    var mueble = datosMueble(item);
    var t = limpiarTitulo(item.title);
    var dims = Array.isArray(mueble.dimensionsCm) && mueble.dimensionsCm.length === 3 ? mueble.dimensionsCm : null;
    var es3d = item.mime === 'model/gltf-binary';
    var precio = 'precioEUR' in extra ? extra.precioEUR : base.precioEUR;
    var esLibro = mueble.schema === 'pixeria.book/1';
    var estancia = esLibro ? 'libros' : (ESTANCIAS.filter(function (e) {
      return e.slugs && e.slugs.indexOf(mueble.slug) !== -1;
    })[0] || {}).id || null;
    return {
      id: item.id,
      titulo: extra.titulo || t.nombre,
      coleccion: t.coleccion || capital(mueble.slug),
      texto: extra.texto || null,
      textoWallapop: extra.textoWallapop || null,
      foto: extra.foto || item.thumbnail || (item.mime && item.mime.indexOf('image/') === 0 ? item.url : ''),
      modelo: es3d ? item.url : null,
      dims: dims,
      cantidad: mueble.quantity || null,
      enVenta: 'enVenta' in extra ? extra.enVenta !== false : base.enVenta !== false,
      precio: typeof precio === 'number' && isFinite(precio) ? precio : null,
      fotos: [extra.foto, item.thumbnail].concat(extra.fotos || []).filter(function (f, i, a) { return f && a.indexOf(f) === i; }),
      // Fotos hiperrealistas del modo Matrix (encargo #4405): mandan en los anuncios.
      fotosMatrix: (extra.fotosMatrix || []).filter(Boolean),
      wallapopUrl: /^https:\/\/([a-z]+\.)?wallapop\.com\//.test(extra.wallapopUrl || '') ? extra.wallapopUrl : null,
      destacado: extra.destacado || 0,
      estancia: estancia,
      libro: null,
      alta: item.createdAt || ''
    };
  }

  function textoPorDefecto(p) {
    var s = 'Mueble diseñado en Pixeria';
    if (p.coleccion) s += ' para el Xpacio de ' + p.coleccion;
    s += '.';
    if (p.dims) s += ' Medidas reales: ' + p.dims.map(num).join(' × ') + ' cm.';
    if (p.modelo) s += ' Es un modelo 3D listo para colocarlo en tu propio Xpacio y editarlo en Pixeria.';
    return s;
  }

  // Título de Wallapop: corto, sin cortar palabras.
  function tituloWallapop(p) {
    var t = p.titulo.split(' · ')[0];
    if (t.length <= WALLAPOP_TITULO_MAX) return t;
    t = t.slice(0, WALLAPOP_TITULO_MAX + 1);
    return t.slice(0, t.lastIndexOf(' ')).replace(/[\s,;:.-]+$/, '');
  }

  function descripcionWallapop(p) {
    // textoWallapop manda: el de la ficha habla del modelo 3D, no del mueble físico.
    var s = (p.textoWallapop || p.texto || textoPorDefecto(p)) + '\n\n';
    if (p.dims) s += 'Medidas: ' + p.dims.map(num).join(' × ') + ' cm.\n';
    if (p.isbn) s += 'ISBN: ' + p.isbn + '.\n';
    if (p.cantidad > 1) s += 'Unidades disponibles: ' + p.cantidad + '.\n';
    s += 'Estado: de segunda mano.\n';
    s += 'Ficha y visor 3D: https://admira.shop/pixeria/?id=' + p.id;
    return s;
  }

  function nombreFoto(p, i, url) {
    var ext = (/\.(jpe?g|png|webp)(\?|$)/i.exec(url) || [0, 'jpg'])[1].toLowerCase();
    return 'wallapop-' + p.id + '-' + (i + 1) + '.' + ext;
  }

  // Descarga cruzada: el atributo download no vale entre orígenes, así que se baja
  // como blob; si el servidor no da CORS, se abre la foto en otra pestaña.
  function descargar(url, nombre) {
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }).catch(function () { window.open(url, '_blank', 'noopener'); });
  }

  function copiar(texto, boton) {
    var hecho = function () {
      var antes = boton.textContent;
      boton.textContent = 'Copiado';
      setTimeout(function () { boton.textContent = antes; }, 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(hecho, function () { copiarViejo(texto); hecho(); });
    } else {
      copiarViejo(texto);
      hecho();
    }
  }

  function copiarViejo(texto) {
    var t = document.createElement('textarea');
    t.value = texto;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) { /* sin portapapeles */ }
    t.remove();
  }

  function campoWallapop(clave, etiqueta, valor, largo) {
    return '<div class="campo">' +
      '<div class="campo-cab"><label for="wp-' + clave + '">' + etiqueta + '</label>' +
      '<button type="button" class="copiar" data-copia="wp-' + clave + '">Copiar</button></div>' +
      (largo
        ? '<textarea id="wp-' + clave + '" rows="8">' + esc(valor) + '</textarea>'
        : '<input id="wp-' + clave + '" type="text" value="' + esc(valor) + '">') +
    '</div>';
  }

  // Para anunciar, las fotos Matrix; si el mueble aún no las tiene, los renders.
  function fotosAnuncio(p) {
    return p.fotosMatrix.length ? p.fotosMatrix : p.fotos;
  }

  function panelWallapop(p, venta) {
    var wp = venta.wallapop || {};
    var fotos = fotosAnuncio(p);
    var precio = p.precio == null ? 'precio pendiente' : String(p.precio).replace('.', ',') + ' €';
    var d = document.createElement('dialog');
    d.className = 'wallapop';
    d.innerHTML =
      '<form method="dialog" class="wp-cab"><h2>Anuncio para Wallapop</h2>' +
        '<button class="cerrar" aria-label="Cerrar">×</button></form>' +
      '<p class="aviso">Se ha abierto el formulario de Wallapop en otra pestaña. Copia cada campo y sube las fotos. ' +
        'Nada se publica desde aquí.</p>' +
      campoWallapop('titulo', 'Título', tituloWallapop(p)) +
      campoWallapop('descripcion', 'Descripción', descripcionWallapop(p), true) +
      campoWallapop('precio', 'Precio', precio) +
      campoWallapop('categoria', 'Categoría sugerida', p.categoriaWallapop || wp.categoria || WALLAPOP_CATEGORIA) +
      campoWallapop('estado', 'Estado', wp.estado || 'De segunda mano') +
      '<div class="campo"><div class="campo-cab"><span>Fotos</span>' +
        (fotos.length ? '<button type="button" class="copiar" data-todas>Descargar todas</button>' : '') + '</div>' +
        (fotos.length
          ? '<div class="wp-fotos">' + fotos.map(function (f, i) {
              return '<button type="button" class="wp-foto" data-foto="' + i + '" title="Descargar">' +
                '<img src="' + esc(f) + '" alt="Foto ' + (i + 1) + '"><span>Descargar</span></button>';
            }).join('') + '</div>'
          : '<p class="aviso">Este mueble no tiene fotos en Pixeria.</p>') +
      '</div>' +
      '<p class="wp-pie"><a href="' + WALLAPOP_SUBIR + '" target="_blank" rel="noopener">Abrir otra vez el formulario de Wallapop ↗</a></p>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.copia) copiar(document.getElementById(b.dataset.copia).value, b);
      if (b.dataset.foto) descargar(fotos[+b.dataset.foto], nombreFoto(p, +b.dataset.foto, fotos[+b.dataset.foto]));
      if ('todas' in b.dataset) fotos.forEach(function (f, i) { descargar(f, nombreFoto(p, i, f)); });
    });
    d.showModal();
  }

  // Publicar en eBay (encargo #4405): el Worker workers/ebay-publicar crea el anuncio
  // con la Sell Inventory API. Sin Worker o sin credenciales, solo vista previa.
  function panelEbay(p, venta) {
    var eb = venta.ebay || {};
    var fotos = fotosAnuncio(p);
    var d = document.createElement('dialog');
    d.className = 'wallapop ebay';
    d.innerHTML =
      '<form method="dialog" class="wp-cab"><h2>Anuncio para eBay</h2>' +
        '<button class="cerrar" aria-label="Cerrar">×</button></form>' +
      '<p class="aviso eb-estado">' + (p.soloVistaPrevia ? 'Vista previa del anuncio del libro para copiarlo en eBay; nada se publica desde aquí.' : eb.worker ? 'Consultando el enlace con eBay…' :
        'eBay aún no está conectado: faltan las credenciales de la cuenta vendedora. Esto es la vista previa; nada se publica.') + '</p>' +
      '<div class="campo"><div class="campo-cab"><span>Título</span></div><p class="eb-dato">' + esc(p.titulo.slice(0, 80)) + '</p></div>' +
      '<div class="campo"><div class="campo-cab"><span>Precio · estado</span></div><p class="eb-dato">' +
        (p.precio == null ? 'precio pendiente' : euros(p.precio)) + ' · Usado</p></div>' +
      '<div class="campo"><div class="campo-cab"><span>Texto</span></div><p class="eb-dato">' + esc(p.textoWallapop || p.texto || textoPorDefecto(p)) + '</p></div>' +
      '<div class="campo"><div class="campo-cab"><span>Fotos</span></div><div class="wp-fotos">' +
        fotos.map(function (f, i) { return '<span class="wp-foto"><img src="' + esc(f) + '" alt="Foto ' + (i + 1) + '"></span>'; }).join('') +
      '</div></div>' +
      '<button type="button" class="publicar-ebay" hidden>Publicar ahora en eBay</button>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
    if (!eb.worker || p.soloVistaPrevia) return;
    var estado = d.querySelector('.eb-estado');
    var boton = d.querySelector('.publicar-ebay');
    var llamar = function (cuerpo, clave) {
      return fetch(eb.worker.replace(/\/$/, '') + '/ebay/publicar', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, clave ? { Authorization: 'Bearer ' + clave } : {}),
        body: JSON.stringify(cuerpo)
      }).then(function (r) { return r.json(); });
    };
    llamar({ id: p.id, dry: true }).then(function (r) {
      if (r.error) throw new Error(r.error);
      if (r.faltan && r.faltan.length) {
        estado.textContent = 'eBay aún no está conectado: faltan ' + r.faltan.join(', ') + '. Esto es la vista previa; nada se publica.';
        return;
      }
      if (r.anuncio && r.anuncio.problemas.length) {
        estado.textContent = 'No se puede publicar todavía: ' + r.anuncio.problemas.join(', ') + '.';
        return;
      }
      estado.textContent = 'eBay conectado. Revisa el anuncio y publícalo.';
      boton.hidden = false;
    }).catch(function (e) { estado.textContent = 'No he podido hablar con el enlace de eBay (' + e.message + ').'; });
    boton.addEventListener('click', function () {
      var clave = '';
      try { clave = localStorage.getItem(EBAY_CLAVE) || ''; } catch (e) { /* sin almacenamiento */ }
      clave = clave || window.prompt('Clave de publicación de admira.shop') || '';
      if (!clave) return;
      boton.disabled = true;
      estado.textContent = 'Publicando en eBay…';
      llamar({ id: p.id }, clave).then(function (r) {
        if (!r.publicado) throw new Error(r.error + (r.problemas ? ': ' + r.problemas.join(', ') : ''));
        try { localStorage.setItem(EBAY_CLAVE, clave); } catch (e) { /* sin almacenamiento */ }
        estado.innerHTML = 'Publicado. <a href="' + esc(r.url) + '" target="_blank" rel="noopener">Ver el anuncio en eBay ↗</a>';
        boton.hidden = true;
      }).catch(function (e) {
        if (/clave/.test(e.message)) { try { localStorage.removeItem(EBAY_CLAVE); } catch (x) { /* nada */ } }
        estado.textContent = 'eBay no lo ha aceptado: ' + e.message;
        boton.disabled = false;
      });
    });
  }

  function precioHTML(p) {
    return p.precio == null
      ? '<span class="precio pendiente">Precio pendiente</span>'
      : '<span class="precio">' + euros(p.precio) + ' <small>IVA incl.</small></span>';
  }

  function tarjeta(p) {
    return '<a class="tarjeta" href="/pixeria/?id=' + encodeURIComponent(p.id) + '">' +
      '<span class="foto">' + (p.foto ? '<img loading="lazy" src="' + esc(p.foto) + '" alt="">' : '') + '</span>' +
      '<span class="cuerpo">' +
        (p.coleccion ? '<span class="coleccion">' + esc(p.coleccion) + '</span>' : '') +
        '<strong>' + esc(p.titulo) + '</strong>' +
        (p.dims ? '<span class="dims">' + p.dims.map(num).join(' × ') + ' cm</span>' : '') +
        precioHTML(p) +
      '</span></a>';
  }

  function pestanas(actual, productos, libros) {
    var cuenta = function (id) {
      return id === 'libros' ? libros.length : productos.filter(function (p) { return p.estancia === id; }).length;
    };
    return '<nav class="secciones" aria-label="Estancias de los Xpacios">' +
      '<a href="/pixeria/"' + (actual ? '' : ' aria-current="page"') + '>Todo <small>' + productos.length + '</small></a>' +
      ESTANCIAS.map(function (e) {
        return '<a href="/pixeria/?seccion=' + e.id + '"' + (actual === e.id ? ' aria-current="page"' : '') +
          (e.id === 'libros' ? ' class="foco"' : '') + '>' + esc(e.nombre) + ' <small>' + cuenta(e.id) + '</small></a>';
      }).join('') +
    '</nav>';
  }

  var BUSCAR_CDL = 'https://www.casadellibro.com/busqueda-generica?busqueda=';

  // Enlaces de compra de un libro: los del JSON si constan; si no, búsquedas.
  function comprasLibro(l) {
    var q = [l.titulo_es || l.titulo, (l.autor || '').split(',')[0]].filter(Boolean).join(' ');
    var nuevo = l.comprar_nuevo || {};
    var sm = l.segunda_mano || {};
    return {
      nuevo: /^https:\/\/www\.casadellibro\.com\//.test(nuevo.url || '') ? nuevo.url : BUSCAR_CDL + encodeURIComponent(l.isbn || q),
      fichaExacta: nuevo.tipo === 'ficha',
      wallapop: /^https:\/\/es\.wallapop\.com\//.test(sm.wallapop || '') ? sm.wallapop : 'https://es.wallapop.com/app/search?keywords=' + encodeURIComponent(q),
      ebay: /^https:\/\/www\.ebay\.es\//.test(sm.ebay || '') ? sm.ebay : 'https://www.ebay.es/sch/i.html?_nkw=' + encodeURIComponent(l.isbn || q) + '&LH_ItemCondition=3000'
    };
  }

  // Anuncio de segunda mano del libro físico (no del modelo 3D).
  function anuncioLibro(p, l) {
    var edicion = l.edicion ? ' Edición: ' + l.edicion + '.' : '';
    return {
      id: p.id,
      titulo: l.titulo + (l.autor ? ' · ' + l.autor : ''),
      texto: null,
      textoWallapop: 'Libro «' + (l.titulo_es || l.titulo) + '», de ' + l.autor + '.' + edicion +
        ' De segunda mano, en buen estado. Pregunta lo que necesites antes de comprar.',
      isbn: l.isbn,
      dims: null,
      cantidad: null,
      precio: null,
      fotos: [l.portada].filter(Boolean),
      fotosMatrix: [],
      categoriaWallapop: 'Cine, libros y música > Libros',
      soloVistaPrevia: true
    };
  }

  function bloqueLibro(l) {
    if (!l.identificado) {
      return '<div class="compra"><span class="precio pendiente">Sin identificar</span>' +
        '<p class="aviso">No hemos podido identificar este libro con seguridad, así que no damos enlace de compra.</p></div>';
    }
    var c = comprasLibro(l);
    return '<div class="compra">' +
        '<p class="eyebrow">Comprar nuevo</p>' +
        '<a class="comprar comprar-libro" href="' + esc(c.nuevo) + '" target="_blank" rel="noopener">Casa del Libro ↗</a>' +
        '<p class="aviso">' + (c.fichaExacta ? 'Ficha de la edición indicada.' : 'Sin ficha exacta comprobada: abre la búsqueda de Casa del Libro.') + '</p>' +
      '</div>' +
      '<div class="segunda-mano">' +
        '<p class="eyebrow">Segunda mano</p>' +
        '<button class="vender-wallapop" type="button">Vender en Wallapop</button>' +
        '<button class="publicar-ebay-ficha" type="button">Vender en eBay</button>' +
        '<p class="aviso">¿Lo buscas usado? <a href="' + esc(c.wallapop) + '" target="_blank" rel="noopener">Wallapop ↗</a> · ' +
          '<a href="' + esc(c.ebay) + '" target="_blank" rel="noopener">eBay ↗</a></p>' +
      '</div>';
  }

  function tarjetaLibro(l) {
    var c = l.identificado ? comprasLibro(l) : null;
    var enlace = l.modelo_pixeria ? '/pixeria/?id=' + encodeURIComponent(l.modelo_pixeria) : (c ? c.nuevo : '');
    return '<article class="tarjeta libro">' +
      '<a class="foto" href="' + esc(enlace) + '">' + (l.portada ? '<img loading="lazy" src="' + esc(l.portada) + '" alt="">' : '') + '</a>' +
      '<span class="cuerpo">' +
        '<span class="coleccion">Estantería · Cafetería</span>' +
        '<strong>' + esc(l.identificado ? l.titulo : 'Sin identificar') + '</strong>' +
        (l.titulo_es && l.titulo_es !== l.titulo ? '<span class="dims">En castellano: ' + esc(l.titulo_es) + '</span>' : '') +
        (l.autor ? '<span class="dims">' + esc(l.autor) + '</span>' : '') +
        (l.isbn ? '<span class="dims">ISBN <code>' + esc(l.isbn) + '</code></span>' : '') +
        (c ? '<span class="libro-botones">' +
          '<a href="' + esc(c.nuevo) + '" target="_blank" rel="noopener">Nuevo · Casa del Libro</a>' +
          '<a href="' + esc(c.wallapop) + '" target="_blank" rel="noopener">Wallapop</a>' +
          '<a href="' + esc(c.ebay) + '" target="_blank" rel="noopener">eBay</a></span>' : '') +
      '</span></article>';
  }

  function catalogo(productos, libros, seccion) {
    var e = ESTANCIAS.filter(function (x) { return x.id === seccion; })[0];
    var cab = function (titulo, texto) {
      return '<section class="cabecera"><p class="eyebrow">Pixeria · Xpacios</p><h1>' + titulo + '</h1><p>' + texto + '</p></section>';
    };
    if (e && e.id === 'libros') {
      document.title = 'Libros de la estantería · Admira.shop';
      app.innerHTML = cab('Libros de la estantería',
          'Los libros que están en la estantería de la Cafetería de los Xpacios. Cómpralos nuevos en Casa del Libro o búscalos de segunda mano en Wallapop y eBay. ' +
          libros.length + ' libros.') +
        pestanas(seccion, productos, libros) +
        (libros.length ? '<section class="rejilla">' + libros.map(tarjetaLibro).join('') + '</section>'
          : '<p class="estado">No he podido leer la lista de libros. Prueba de nuevo en un momento.</p>');
      return;
    }
    var lista = e ? productos.filter(function (p) { return p.estancia === e.id; }) : productos;
    document.title = (e ? e.nombre + ' · ' : '') + 'Admira.shop | Muebles 3D de Pixeria';
    app.innerHTML =
      (e ? cab(e.id === 'cafeteria' ? 'Objetos de la Cafetería' : 'Objetos del ' + esc(e.nombre),
            'Las piezas que están en ' + (e.id === 'cafeteria' ? 'la Cafetería' : 'el Xtanco') + ' de los Xpacios, a la venta: modelo 3D con sus medidas reales. ' + lista.length + ' piezas.')
         : cab('Muebles 3D para tu Xpacio',
            'Cada mueble que se diseña en Pixeria para un Xpacio se puede comprar aquí: modelo 3D con sus medidas reales, listo para colocar y editar. ' +
            productos.length + ' piezas a la venta.')) +
      pestanas(seccion, productos, libros) +
      '<section class="rejilla">' + lista.map(tarjeta).join('') + '</section>';
  }

  function ficha(p, venta) {
    document.title = p.titulo + ' · Admira.shop';
    var cobro = venta.cobro || {};
    var visor = p.modelo
      ? '<model-viewer src="' + esc(p.modelo) + '" poster="' + esc(p.foto) + '" alt="' + esc(p.titulo) + '" camera-controls auto-rotate shadow-intensity="1" touch-action="pan-y"></model-viewer>'
      : '';
    app.innerHTML =
      '<p class="migas"><a href="/pixeria/">← Muebles 3D</a>' +
        (p.estancia ? ' · <a href="/pixeria/?seccion=' + p.estancia + '">' + esc((ESTANCIAS.filter(function (e) { return e.id === p.estancia; })[0] || {}).nombre) + '</a>' : '') +
        (p.coleccion ? ' · ' + esc(p.coleccion) : '') + '</p>' +
      '<article class="ficha" data-asset="' + esc(p.id) + '">' +
        '<div class="medios">' +
          (p.foto ? '<img class="foto-ficha" src="' + esc(p.foto) + '" alt="' + esc(p.titulo) + '">' : '') +
          (p.fotosMatrix.length
            ? '<div class="fotos-matrix">' + p.fotosMatrix.map(function (f, i) {
                return '<button type="button" data-foto="' + esc(f) + '" title="Ver grande"><img loading="lazy" src="' + esc(f) + '" alt="Foto ' + (i + 1) + '"></button>';
              }).join('') + '</div>'
            : '') +
          visor +
        '</div>' +
        '<div class="info">' +
          (p.coleccion ? '<p class="eyebrow">' + esc(p.coleccion) + '</p>' : '') +
          '<h1>' + esc(p.titulo) + '</h1>' +
          '<p class="texto">' + esc(p.texto || textoPorDefecto(p)) + '</p>' +
          (p.libro && p.libro.autor ? '<p class="autor">' + esc(p.libro.autor) + '</p>' : '') +
          '<dl>' +
            (p.libro && p.libro.isbn ? '<dt>ISBN</dt><dd><code>' + esc(p.libro.isbn) + '</code></dd>' : '') +
            (p.libro && p.libro.edicion ? '<dt>Edición</dt><dd>' + esc(p.libro.edicion) + '</dd>' : '') +
            (p.dims ? '<dt>Medidas</dt><dd>' + p.dims.map(num).join(' × ') + ' cm</dd>' : '') +
            '<dt>Formato</dt><dd>' + (p.modelo ? 'Modelo 3D (GLB), editable en Pixeria' : 'Imagen') + '</dd>' +
            '<dt>Referencia</dt><dd><code>' + esc(p.id) + '</code></dd>' +
          '</dl>' +
          (p.libro ? bloqueLibro(p.libro) + '<p class="eyebrow modelo-3d">Modelo 3D del libro</p>' : '') +
          '<div class="compra">' +
            precioHTML(p) +
            (p.precio == null ? '<p class="aviso">El precio lo fija Admira en breve. Pide la pieza y te avisamos.</p>' : '') +
            '<button class="comprar" type="button" data-asset="' + esc(p.id) + '" data-precio="' + (p.precio == null ? '' : p.precio) + '">Comprar</button>' +
            (cobro.activo ? '' : '<p class="aviso">Pago online en preparación: al pulsar se abre una solicitud de compra por correo.</p>') +
          '</div>' +
          (p.libro && p.libro.identificado ? '' : '<div class="segunda-mano">' +
            '<p class="eyebrow">Segunda mano</p>' +
            (p.wallapopUrl ? '<a class="ver-wallapop" href="' + esc(p.wallapopUrl) + '" target="_blank" rel="noopener">Ver en Wallapop ↗</a>' : '') +
            '<button class="vender-wallapop" type="button">' + (p.wallapopUrl ? 'Preparar otro anuncio' : 'Vender en Wallapop') + '</button>' +
            '<button class="publicar-ebay-ficha" type="button">Publicar en eBay</button>' +
          '</div>') +
        '</div>' +
      '</article>';

    // En un libro, los anuncios son del libro físico, no del modelo 3D.
    var anuncio = p.libro && p.libro.identificado ? anuncioLibro(p, p.libro) : p;

    app.querySelector('.vender-wallapop').addEventListener('click', function () {
      // Abrir la pestaña dentro del clic, o el bloqueador de ventanas la corta.
      window.open(WALLAPOP_SUBIR, '_blank', 'noopener');
      panelWallapop(anuncio, venta);
    });

    app.querySelector('.publicar-ebay-ficha').addEventListener('click', function () {
      panelEbay(anuncio, venta);
    });

    var galeria = app.querySelector('.fotos-matrix');
    if (galeria) galeria.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      var grande = app.querySelector('.foto-ficha');
      if (b && grande) grande.src = b.dataset.foto;
    });

    app.querySelector('.comprar').addEventListener('click', function () {
      // Punto de enganche del cobro: cuando esté montado, aquí va el checkout.
      if (cobro.activo && typeof window.admiraCheckout === 'function') {
        window.admiraCheckout({ asset: p.id, titulo: p.titulo, precio: p.precio });
        return;
      }
      var asunto = 'Quiero comprar: ' + p.titulo + ' (' + p.id + ')';
      var cuerpo = 'Hola, me interesa el mueble de Pixeria «' + p.titulo + '».\n' +
        'Referencia: ' + p.id + '\nFicha: ' + location.href + '\n';
      location.href = 'mailto:' + (venta.contacto || 'info@admira.com') +
        '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
    });
  }

  function orden(a, b) {
    if (a.destacado || b.destacado) return (a.destacado || 99) - (b.destacado || 99);
    return a.alta < b.alta ? 1 : a.alta > b.alta ? -1 : 0;
  }

  Promise.all([
    fetch(INDICE, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('Pixeria ' + r.status); return r.json(); }),
    fetch(VENTA, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('venta ' + r.status); return r.json(); }),
    // Sin la lista de libros la tienda sigue: solo falta la sección de libros.
    fetch(LIBROS, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { libros: [] }; }).catch(function () { return { libros: [] }; })
  ]).then(function (res) {
    var venta = res[1];
    var libros = res[2].libros || [];
    var libroDe = {};
    libros.forEach(function (l) { if (l.modelo_pixeria) libroDe[l.modelo_pixeria] = l; });
    var tipos = venta.tipos || ['furni'];
    var productos = (res[0].items || [])
      .filter(function (i) { return tipos.indexOf(i.type) !== -1; })
      .map(function (i) { return producto(i, venta); })
      .filter(function (p) { return p.enVenta; })
      .sort(orden);
    productos.forEach(function (p) {
      p.libro = libroDe[p.id] || null;
      if (p.estancia === 'libros') {
        p.coleccion = 'Estantería · Cafetería';
        p.texto = p.texto || 'Libro de la estantería de la Cafetería de los Xpacios. Cómpralo nuevo o de segunda mano con los enlaces de abajo; ' +
          'más abajo está también su modelo 3D, con sus medidas reales, para tu propio Xpacio.';
      }
      if (p.libro && p.libro.identificado) p.titulo = p.libro.titulo;
      if (p.libro && p.libro.portada && !p.foto) p.foto = p.libro.portada;
    });
    var q = new URLSearchParams(location.search);
    var id = q.get('id');
    if (!id) return catalogo(productos, libros, q.get('seccion'));
    var p = productos.filter(function (x) { return x.id === id; })[0];
    if (p) return ficha(p, venta);
    app.innerHTML = '<p class="estado">Ese mueble no está a la venta o ya no existe en Pixeria. <a href="/pixeria/">Ver todos los muebles</a>.</p>';
  }).catch(function (e) {
    app.innerHTML = '<p class="estado">No he podido leer el catálogo de Pixeria (' + esc(e.message) + '). Prueba de nuevo en un momento.</p>';
  });
})();
