import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarCatalogo, modeloDeRuta, resolverFicha, reposicion, precioTexto, carritoAnadir, carritoQuitar, carritoTotal, carritoImportes, totalTexto, textoPedido, textoVenta, mailto } from '../assets/shop/core.mjs';

// Intl separa «1.290 €» con espacio duro (U+00A0): bien en pantalla; en los tests se compara con espacio normal.
const sp = (x) => String(x).replace(/\u00a0/g, ' ');
const cat = JSON.parse(readFileSync(new URL('../data/catalogo.json', import.meta.url), 'utf8'));

test('el catálogo cumple el contrato: slugs, precio con precio_referencia, características y foto; muestras marcadas (#4293)', () => {
  assert.deepEqual(validarCatalogo(cat), []);
  assert.ok(cat.productos.every((p) => Number.isFinite(p.precio)), 'ya no hay «Consultar precio»: todo producto tiene importe');
  assert.ok(cat.productos.every((p) => /^(MediaMarkt|Fnac|estimado|admira\.shop )/.test(p.precio_referencia)), 'la referencia es MediaMarkt, Fnac, estimado o el PVP de esta web');
  assert.ok(cat.productos.filter((p) => /muestra/i.test(p.nombre)).every((p) => p.muestra === true));
  const malo = { categorias: [{ id: 'pantallas' }], productos: [{ modelo: 'Samsung QM55C', categoria: 'pantallas', muestra: true, precio: 999 }] };
  const e = validarCatalogo(malo);
  assert.ok(e.some((x) => /minúsculas-con-guiones/.test(x)) && e.some((x) => /precio_referencia/.test(x)) && e.some((x) => /características/.test(x)) && e.some((x) => /foto/.test(x)));
});

test('cada categoría tiene productos y cada producto su ficha estática generada', () => {
  for (const c of cat.categorias) assert.ok(cat.productos.filter((p) => p.categoria === c.id).length >= 3, `menos de tres productos en ${c.id}`);
  for (const p of cat.productos) assert.ok(existsSync(new URL(`..${p.foto}`, import.meta.url)), `falta la foto ${p.foto}`);
  for (const p of cat.productos) assert.ok(existsSync(new URL(`../p/${p.modelo}/index.html`, import.meta.url)), `falta /p/${p.modelo}/ (npm run build)`);
});

test('/p/<modelo>/: ficha si existe; si no, catálogo de pantallas — nunca un 404', () => {
  assert.equal(modeloDeRuta('/p/samsung-qm55c/'), 'samsung-qm55c');
  assert.equal(modeloDeRuta('/p/Samsung%20QM55C'), 'samsung-qm55c');
  assert.equal(modeloDeRuta('/p/'), null);
  const f = resolverFicha(cat, 'samsung-qm55c');
  assert.equal(f.tipo, 'producto'); assert.equal(f.categoria.id, 'pantallas');
  const n = resolverFicha(cat, 'modelo-que-no-existe');
  assert.equal(n.tipo, 'catalogo'); assert.equal(n.categoria, 'pantallas'); assert.match(n.motivo, /modelo-que-no-existe/);
  assert.equal(resolverFicha(cat, null).tipo, 'catalogo');
});

test('contrato con yokup (#4286): ?origen=yokup&equipo=<id> → «Reposición para el equipo <id>»; nada raro se cuela', () => {
  assert.deepEqual(reposicion('?origen=yokup&equipo=PANT-0042'), { origen: 'yokup', equipo: 'PANT-0042', local: null, pantalla: null, texto: 'Reposición para el equipo PANT-0042' });
  assert.equal(reposicion('?equipo=PANT-0042'), null, 'sin origen=yokup no es reposición');
  assert.equal(reposicion('?origen=yokup&equipo=<script>'), null);
  assert.equal(sp(precioTexto({ precio: 1290 })), '1.290 €');
  assert.equal(sp(precioTexto({ precio: 29, periodo: 'mes' })), '29 €/mes');
  assert.equal(sp(precioTexto({ precio: 0 })), 'Gratis');
});

test('reposición: local y pantalla válidos se devuelven; si faltan quedan en null', () => {
  assert.deepEqual(reposicion('?origen=yokup&equipo=TEST&local=Starbucks-Gran-Via&pantalla=P2'), {
    origen: 'yokup', equipo: 'TEST', local: 'Starbucks-Gran-Via', pantalla: 'P2', texto: 'Reposición para el equipo TEST',
  });
  assert.deepEqual(reposicion('?origen=yokup&equipo=TEST&local=  Cafetería   Gran Vía  '), {
    origen: 'yokup', equipo: 'TEST', local: 'Cafetería Gran Vía', pantalla: null, texto: 'Reposición para el equipo TEST',
  });
});

test('reposición: una etiqueta con <script> o de más de 80 caracteres pasa a null y no se inventa', () => {
  const sucio = reposicion(`?origen=yokup&equipo=TEST&local=${encodeURIComponent('<script>alert(1)</script>')}&pantalla=${'A'.repeat(81)}`);
  assert.equal(sucio.local, null);
  assert.equal(sucio.pantalla, null);
  assert.equal(sucio.equipo, 'TEST');
  assert.equal(sucio.texto, 'Reposición para el equipo TEST');
});

test('carrito y peticiones: la reposición viaja con su equipo; el correo va a info@admira.com', () => {
  let c = carritoAnadir([], 'samsung-qm55c', 2, 'PANT-0042');
  c = carritoAnadir(c, 'samsung-qm55c', 1, 'PANT-0042');
  c = carritoAnadir(c, 'brightsign-xt1144');
  assert.equal(carritoTotal(c), 4); assert.equal(c.length, 2);
  const txt = sp(textoPedido(c, cat, { nombre: 'Ana', email: 'ana@example.test' }));
  const precio = (m) => cat.productos.find((p) => p.modelo === m).precio;
  const esperado = 3 * precio('samsung-qm55c') + precio('brightsign-xt1144');
  assert.equal(carritoImportes(c, cat).unico, esperado);
  assert.match(txt, /3 × Samsung QM55C \(samsung-qm55c\) · [\d.]+ € · reposición del equipo PANT-0042 \(yokup\)/);
  assert.match(txt, new RegExp(`Total: ${sp(totalTexto(carritoImportes(c, cat))).replace(/[().]/g, '\\$&')}`));
  assert.match(txt, /Email: ana@example.test/); assert.doesNotMatch(txt, /Teléfono/);
  const conLugar = carritoAnadir([], 'samsung-qm55c', 1, 'TEST', { local: 'Starbucks-Gran-Via', pantalla: 'P2' });
  assert.equal(conLugar[0].local, 'Starbucks-Gran-Via');
  assert.match(sp(textoPedido(conLugar, cat, { nombre: 'Ana' })), /reposición del equipo TEST · local Starbucks-Gran-Via · pantalla P2 \(yokup\)/);
  assert.equal(carritoTotal(carritoQuitar(c, 0)), 1);
  assert.match(textoVenta({ categoria: 'Pantallas', modelo: 'QM55C', estado: 'funciona' }), /recompra \/ renove[\s\S]*Modelo: QM55C/);
  assert.match(mailto(cat.contacto, 'Petición', 'a b'), /^mailto:info@admira\.com\?subject=Petici%C3%B3n&body=a%20b$/);
});

test('el carrito suma importes: lo que se paga una vez y la cuota mensual van por separado, IVA incluido', () => {
  const c = carritoAnadir(carritoAnadir(carritoAnadir([], 'samsung-qm55c', 2), 'servicio-instalacion', 2), 'servicio-soporte', 2);
  const imp = carritoImportes(c, cat);
  const precio = (m) => cat.productos.find((p) => p.modelo === m).precio;
  assert.equal(imp.unico, 2 * precio('samsung-qm55c') + 2 * precio('servicio-instalacion'));
  assert.equal(imp.mensual, 2 * precio('servicio-soporte'));
  assert.equal(sp(totalTexto({ unico: 2960, mensual: 38 })), '2.960 € + 38 €/mes (IVA incluido)');
  assert.equal(carritoImportes([{ modelo: 'no-existe', cantidad: 1 }], cat).unico, 0);
});
