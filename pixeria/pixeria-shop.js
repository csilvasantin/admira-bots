// Muebles de Pixeria en admira.shop (encargo #4396).
// Lee en vivo el índice público de Pixeria y lo cruza con data/pixeria-venta.json
// (a la venta, precio en euros y textos de ficha). Un mueble dado de alta en
// Pixeria aparece aquí sin tocar nada: la regla de Carlos es que todo se vende.
(function () {
  'use strict';

  var INDICE = 'https://stock.admira.store/stock/index.json';
  var VENTA = '/data/pixeria-venta.json';
  // Wallapop no ofrece enlace oficial con datos precargados: su única vía de publicar
  // desde fuera es la Connect API (developers.wallapop.com), que exige credenciales
  // de integrador dadas por Wallapop y el login OAuth del vendedor. Mientras tanto,
  // el anuncio se prepara aquí para copiar y se sube a mano en su formulario.
  var WALLAPOP_SUBIR = 'https://es.wallapop.com/app/catalog/upload';
  var WALLAPOP_CATEGORIA = 'Hogar y jardín > Muebles';
  var WALLAPOP_TITULO_MAX = 50;
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
      return p && p.schema === 'pixeria.furniture/1' ? p : {};
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
      wallapopUrl: /^https:\/\/([a-z]+\.)?wallapop\.com\//.test(extra.wallapopUrl || '') ? extra.wallapopUrl : null,
      destacado: extra.destacado || 0,
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

  function panelWallapop(p, venta) {
    var wp = venta.wallapop || {};
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
      campoWallapop('categoria', 'Categoría sugerida', wp.categoria || WALLAPOP_CATEGORIA) +
      campoWallapop('estado', 'Estado', wp.estado || 'De segunda mano') +
      '<div class="campo"><div class="campo-cab"><span>Fotos</span>' +
        (p.fotos.length ? '<button type="button" class="copiar" data-todas>Descargar todas</button>' : '') + '</div>' +
        (p.fotos.length
          ? '<div class="wp-fotos">' + p.fotos.map(function (f, i) {
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
      if (b.dataset.foto) descargar(p.fotos[+b.dataset.foto], nombreFoto(p, +b.dataset.foto, p.fotos[+b.dataset.foto]));
      if ('todas' in b.dataset) p.fotos.forEach(function (f, i) { descargar(f, nombreFoto(p, i, f)); });
    });
    d.showModal();
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

  function catalogo(productos) {
    document.title = 'Admira.shop | Muebles 3D de Pixeria';
    app.innerHTML =
      '<section class="cabecera">' +
        '<p class="eyebrow">Pixeria · Xpacios</p>' +
        '<h1>Muebles 3D para tu Xpacio</h1>' +
        '<p>Cada mueble que se diseña en Pixeria para un Xpacio se puede comprar aquí: modelo 3D con sus medidas reales, listo para colocar y editar. ' +
        productos.length + ' piezas a la venta.</p>' +
      '</section>' +
      '<section class="rejilla">' + productos.map(tarjeta).join('') + '</section>';
  }

  function ficha(p, venta) {
    document.title = p.titulo + ' · Admira.shop';
    var cobro = venta.cobro || {};
    var visor = p.modelo
      ? '<model-viewer src="' + esc(p.modelo) + '" poster="' + esc(p.foto) + '" alt="' + esc(p.titulo) + '" camera-controls auto-rotate shadow-intensity="1" touch-action="pan-y"></model-viewer>'
      : '';
    app.innerHTML =
      '<p class="migas"><a href="/pixeria/">← Muebles 3D</a>' + (p.coleccion ? ' · ' + esc(p.coleccion) : '') + '</p>' +
      '<article class="ficha" data-asset="' + esc(p.id) + '">' +
        '<div class="medios">' +
          (p.foto ? '<img class="foto-ficha" src="' + esc(p.foto) + '" alt="' + esc(p.titulo) + '">' : '') +
          visor +
        '</div>' +
        '<div class="info">' +
          (p.coleccion ? '<p class="eyebrow">' + esc(p.coleccion) + '</p>' : '') +
          '<h1>' + esc(p.titulo) + '</h1>' +
          '<p class="texto">' + esc(p.texto || textoPorDefecto(p)) + '</p>' +
          '<dl>' +
            (p.dims ? '<dt>Medidas</dt><dd>' + p.dims.map(num).join(' × ') + ' cm</dd>' : '') +
            '<dt>Formato</dt><dd>' + (p.modelo ? 'Modelo 3D (GLB), editable en Pixeria' : 'Imagen') + '</dd>' +
            '<dt>Referencia</dt><dd><code>' + esc(p.id) + '</code></dd>' +
          '</dl>' +
          '<div class="compra">' +
            precioHTML(p) +
            (p.precio == null ? '<p class="aviso">El precio lo fija Admira en breve. Pide la pieza y te avisamos.</p>' : '') +
            '<button class="comprar" type="button" data-asset="' + esc(p.id) + '" data-precio="' + (p.precio == null ? '' : p.precio) + '">Comprar</button>' +
            (cobro.activo ? '' : '<p class="aviso">Pago online en preparación: al pulsar se abre una solicitud de compra por correo.</p>') +
          '</div>' +
          '<div class="segunda-mano">' +
            '<p class="eyebrow">Segunda mano</p>' +
            (p.wallapopUrl ? '<a class="ver-wallapop" href="' + esc(p.wallapopUrl) + '" target="_blank" rel="noopener">Ver en Wallapop ↗</a>' : '') +
            '<button class="vender-wallapop" type="button">' + (p.wallapopUrl ? 'Preparar otro anuncio' : 'Vender en Wallapop') + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';

    app.querySelector('.vender-wallapop').addEventListener('click', function () {
      // Abrir la pestaña dentro del clic, o el bloqueador de ventanas la corta.
      window.open(WALLAPOP_SUBIR, '_blank', 'noopener');
      panelWallapop(p, venta);
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
    fetch(VENTA, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('venta ' + r.status); return r.json(); })
  ]).then(function (res) {
    var venta = res[1];
    var tipos = venta.tipos || ['furni'];
    var productos = (res[0].items || [])
      .filter(function (i) { return tipos.indexOf(i.type) !== -1; })
      .map(function (i) { return producto(i, venta); })
      .filter(function (p) { return p.enVenta; })
      .sort(orden);
    var id = new URLSearchParams(location.search).get('id');
    if (!id) return catalogo(productos);
    var p = productos.filter(function (x) { return x.id === id; })[0];
    if (p) return ficha(p, venta);
    app.innerHTML = '<p class="estado">Ese mueble no está a la venta o ya no existe en Pixeria. <a href="/pixeria/">Ver todos los muebles</a>.</p>';
  }).catch(function (e) {
    app.innerHTML = '<p class="estado">No he podido leer el catálogo de Pixeria (' + esc(e.message) + '). Prueba de nuevo en un momento.</p>';
  });
})();
