// Muebles de Pixeria en admira.shop (encargo #4396).
// Lee en vivo el índice público de Pixeria y lo cruza con data/pixeria-venta.json
// (a la venta, precio en euros y textos de ficha). Un mueble dado de alta en
// Pixeria aparece aquí sin tocar nada: la regla de Carlos es que todo se vende.
(function () {
  'use strict';

  var INDICE = 'https://stock.admira.store/stock/index.json';
  var VENTA = '/data/pixeria-venta.json';
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
      foto: extra.foto || item.thumbnail || (item.mime && item.mime.indexOf('image/') === 0 ? item.url : ''),
      modelo: es3d ? item.url : null,
      dims: dims,
      cantidad: mueble.quantity || null,
      enVenta: 'enVenta' in extra ? extra.enVenta !== false : base.enVenta !== false,
      precio: typeof precio === 'number' && isFinite(precio) ? precio : null,
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
        '</div>' +
      '</article>';

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
