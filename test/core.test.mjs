import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarCatalogo, modeloDeRuta, resolverFicha, reposicion, precioTexto, carritoAnadir, carritoQuitar, carritoTotal, textoPedido, textoVenta, mailto } from '../assets/shop/core.mjs';

const cat = JSON.parse(readFileSync(new URL('../data/catalogo.json', import.meta.url), 'utf8'));

test('el catálogo cumple el contrato: slugs minúsculas-con-guiones, sin precios inventados, muestras marcadas', () => {
  assert.deepEqual(validarCatalogo(cat), []);
  assert.ok(cat.productos.every((p) => p.precio === null), 'hoy no hay fuente de precios: todo «Consultar precio»');
  assert.ok(cat.productos.filter((p) => /muestra/i.test(p.nombre)).every((p) => p.muestra === true));
  const malo = { categorias: [{ id: 'pantallas' }], productos: [{ modelo: 'Samsung QM55C', categoria: 'pantallas', muestra: true, precio: { importe: 999 } }] };
  const e = validarCatalogo(malo);
  assert.ok(e.some((x) => /minúsculas-con-guiones/.test(x)) && e.some((x) => /precio sin fuente/.test(x)));
});

test('cada categoría tiene productos y cada producto su ficha estática generada', () => {
  for (const c of cat.categorias) assert.ok(cat.productos.some((p) => p.categoria === c.id), `categoría vacía: ${c.id}`);
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
  assert.deepEqual(reposicion('?origen=yokup&equipo=PANT-0042'), { origen: 'yokup', equipo: 'PANT-0042', texto: 'Reposición para el equipo PANT-0042' });
  assert.equal(reposicion('?equipo=PANT-0042'), null, 'sin origen=yokup no es reposición');
  assert.equal(reposicion('?origen=yokup&equipo=<script>'), null);
  assert.equal(precioTexto(cat.productos[0]), 'Consultar precio');
});

test('carrito y peticiones: la reposición viaja con su equipo; el correo va a info@admira.com', () => {
  let c = carritoAnadir([], 'samsung-qm55c', 2, 'PANT-0042');
  c = carritoAnadir(c, 'samsung-qm55c', 1, 'PANT-0042');
  c = carritoAnadir(c, 'brightsign-xt1144');
  assert.equal(carritoTotal(c), 4); assert.equal(c.length, 2);
  const txt = textoPedido(c, cat, { nombre: 'Ana', email: 'ana@example.test' });
  assert.match(txt, /3 × Samsung QM55C \(samsung-qm55c\) · reposición del equipo PANT-0042 \(yokup\)/);
  assert.match(txt, /Email: ana@example.test/); assert.doesNotMatch(txt, /Teléfono/);
  assert.equal(carritoTotal(carritoQuitar(c, 0)), 1);
  assert.match(textoVenta({ categoria: 'Pantallas', modelo: 'QM55C', estado: 'funciona' }), /recompra \/ renove[\s\S]*Modelo: QM55C/);
  assert.match(mailto(cat.contacto, 'Petición', 'a b'), /^mailto:info@admira\.com\?subject=Petici%C3%B3n&body=a%20b$/);
});
