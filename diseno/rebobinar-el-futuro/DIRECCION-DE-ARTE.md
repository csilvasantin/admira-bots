# admira.shop · Dirección de arte «REBOBINAR EL FUTURO»

> Encargo de Steve Wozniak (a petición de Carlos Silva) · redacta el equipo de George Lucas (CSO, Consejo de Silicio) · 25-09-2026
> Destinatario: Morfeo (DeepAgent), que la aplicará sobre el prototipo estático `https://admira-shop.pages.dev`.
> Archivos de apoyo en esta carpeta: `shop-retro.css` (la capa CSS completa, lista para pegar), `maquetas/*.html` (maquetas navegables) y `maqueta-*.png` (renders), `capturas/` (estado actual del sitio y de admiranext.com).

---

## 0. Lo que hay hoy (auditoría del prototipo)

**Archivos y rutas**

| Ruta | Archivo | `data-page` | Qué pinta |
|---|---|---|---|
| `/` | `index.html` | `home` | Ventana hero (`boot xpacio --tienda`), ventana `#xpacio` con **SVG interactivo del local** (9 `a.hot` → `/catalogo/?cat=…`), ventana «Categorías» (`#categorias`, la rellena JS), `.dos` con «Véndenos tu equipo» y «¿Vienes desde Yokup?» |
| `/catalogo/?cat=<id>` | `catalogo/index.html` | `catalogo` | `#vista`: prompt `ls /xpacio/<cat>`, h1, `.filtros`, `.rejilla` de `.tarjeta` |
| `/p/<modelo>/?origen=yokup&equipo=<id>` | plantilla de ficha (la que sirve `/p/*/`) | `ficha` | `#vista`: `.prompt`, `.reposicion`, `.ficha` (`.visual` + `.compra` + `.caracteristicas` + `.datos`), `aside.vende-bloque` |
| `/carrito/` | `carrito/index.html` | `carrito` | `table.carrito-lista`, `form#pedido.campos` (mailto) |
| `/vende/` | `vende/index.html` | `vende` | `form#venta.campos` |
| `/robots.html`, `/mcp/` | propios | — | Usan **su propia hoja** (`home-agibot.css`, Inter): fuera de alcance salvo la barra (ver §9) |

- JS: `assets/shop/shop.js` (pinta con `textContent`, sin HTML inyectable) + `assets/shop/core.mjs` (lógica pura: `modeloDeRuta`, `resolverFicha`, `reposicion`, carrito; tiene tests en `test/core.test.mjs`).
- Datos: **`/data/catalogo.json`** (ojo: `/catalogo.json` devuelve HTML). 9 categorías con `color` e `icono`; 29 productos con `foto` SVG en `/assets/shop/fotos/`.
- CSS: `assets/shop/shop.css`. Clases clave: `.fondo` (vídeo), `.barra`, `.marca .admira .neon .bln-1..4`, `.menu`, `.ventana > header .puntos .ruta`, `.cuerpo`, `.prompt`, `.ok`, `.lead`, `.acento`, `.botones`, `.btn(.primario|.grande)`, `.escena .hot .pieza .etiqueta .pulso`, `.rejilla`, `.tarjeta(.icono|.foto|.pie)`, `.chip(.muestra)`, `.precio`, `.filtros`, `.ficha .visual`, `.marca-chip`, `.compra`, `.precio-grande`, `.iva`, `.opciones .opcion`, `.caracteristicas`, `.datos`, `.reposicion`, `.aviso`, `.vende-bloque`, `.carrito-lista`, `form.campos`, `.estado`, `.pie-web`, `.dos`.
- Paleta actual (= admiranext.com): `--bg #1a1a2e`, `--bg-window #252540`, `--bg-darker #1e1e35`, `--border #3a3a5c`, `--text #e2e2f0`, `--text-dim #8888aa`, `--text-muted #6a6a8a` (**3,3:1, no pasa AA**), `--accent #e8a87c`, neones del logo `#FF3366 #FFCC00 #33FF99 #FF33CC`.
- Tipografía actual: JetBrains Mono (woff2 local) para todo.
- **Límite funcional hoy**: `reposicion()` solo lee `equipo`; la ficha no puede decir de qué **local** ni qué **pantalla** es. Se propone un parámetro opcional (§6.3).

**ADN admiranext.com que NO se toca**: fondo `#1a1a2e`, ventana-terminal con tres puntos (rojo `#ff5f57`, ámbar `#febc2e`, verde `#28c840`), texto de arranque tipo consola (`Booting… ok`, `ready.`), JetBrains Mono, logotipo con las letras finales en neón (N·e·X·T → S·H·O·P en rosa, amarillo, verde y magenta), vídeo de fondo desenfocado, menú en versalitas espaciadas.

---

## 1. Concepto

**«Rebobinar el futuro».** admira.shop es el almacén del mañana montado con la luz de 1985: una tienda-terminal donde cada pieza del Xpacio brilla como un cartucho recién insertado y cada pedido devuelve una pantalla del rojo al verde.

**La escena de la portada (hero).** Noche de apertura. Detrás de las ventanas-terminal se enciende un horizonte de neón: un sol de ocaso cortado en franjas y una rejilla magenta que corre hacia el espectador. En primer plano, el local, el Xpacio, sigue siendo el SVG interactivo de hoy, ahora de noche: pared del fondo en violeta crepuscular, una cinta de cuatro neones (los colores del logo) recorriendo el techo, suelo convertido en rejilla magenta y líneas de barrido sobre toda la escena. La pantalla central cuenta la saga en bucle: **«SIN SEÑAL»** en rojo → **«● EN LÍNEA»** en verde con el logo ADmiraNeXT. Es la historia de la casa en 9 segundos: admira.app ve la caída, Yokup pulsa «Reponer» y admira.shop la devuelve a verde.

Guiño a la familia (XpaceOS 8/16/32 bits, terminal verde de Pixeria) **sin copiarla**: aquí el verde fósforo solo significa «OK» y el píxel aparece en detalles (cantos de cartucho, precios VT323), no como piel completa.

---

## 2. Paleta

| Token | Hex | Rol | Contraste (sobre `#1a1a2e` / `#252540`) |
|---|---|---|---|
| `--bg` | `#1a1a2e` | Fondo general (ADN) | — |
| `--bg-deep` | `#100e24` | Cielo nocturno, barra, pie, cabecera de ventanas | — |
| `--bg-window` | `#252540` | Superficie de ventana | — |
| `--bg-darker` | `#1e1e35` | Tarjetas, bloques internos | — |
| `--crt` | `#0b0a16` | Interior de monitor de tubo, inputs | — |
| `--border` / `--border-dashed` | `#3a3a5c` / `#5a5a8a` | Bordes | decorativo |
| `--text` | `#e2e2f0` | Texto principal | 13,3 / 11,6 ✔ |
| `--text-dim` | `#a9a9c8` | Texto secundario (**antes `#8888aa`**) | 7,5 / 6,5 ✔ |
| `--text-muted` | `#9a9abb` | Metadatos, pies (**antes `#6a6a8a`, suspendía**) | 6,3 / 5,4 ✔ |
| `--accent` | `#e8a87c` | Acento de marca «ocaso»: enlaces, CTA primario | 8,4 / 7,3 ✔ |
| `--accent-bright` / `--accent-deep` | `#f0c4a0` / `#d98f5e` | Hover y degradado del botón primario | texto `#1a1a2e` sobre `#e8a87c`: 8,4 ✔ |
| `--n-pink` | `#FF3366` | Neón S / categoría pantallas: halos, bordes | 4,8 / 4,2 (solo ≥ 18,66 px negrita o decorativo) |
| `--n-yellow` | `#FFCC00` | Neón H · **precios** · contador del carrito · «muestra» | 11,3 / 9,8 ✔ |
| `--n-green` | `#33FF99` | Neón O · **OK** · botón «Reponer» | 12,9 / 11,2 ✔ |
| `--n-magenta` | `#FF33CC` | Neón P · rejilla del horizonte · menú activo | 5,4 / 4,7 ✔ |
| `--n-cyan` | `#7ce8d8` | Rótulos «episodio», foco, hover secundario | 11,7 / 10,2 ✔ |
| `--alerta` | `#ff5c7a` | **Texto** de alerta / reposición pendiente | 5,7 / 5,0 ✔ |
| `--alerta-neon` | `#FF3366` | LED, borde y halo rojo (nunca texto pequeño) | decorativo |
| `--ok` | `#33FF99` | Texto, LED y borde de OK (la pantalla vuelve a verde) | 12,9 ✔ |
| `--aviso` | `#FFCC00` | Avisos («producto de muestra») | 11,3 ✔ |

Regla de estados: **rojo = pendiente/caída** (`--alerta` + LED `--alerta-neon` latiendo), **verde = resuelto/en línea** (`--ok`, LED fijo). Los colores por categoría siguen viniendo de `catalogo.json` (`--c`) y solo tiñen iconos, cantos y halos, nunca texto de cuerpo.

Degradados de marca (en `:root`):
```css
--cinta: linear-gradient(90deg, #FF3366 0 25%, #FFCC00 25% 50%, #33FF99 50% 75%, #FF33CC 75% 100%); /* los 4 neones del logo */
--cromo: linear-gradient(180deg, #ffffff 0%, #e2e2f0 40%, #9a9abb 50%, #f0f0ff 53%, #c9c9e0 78%, #ffffff 100%);
--ocaso: linear-gradient(180deg, #FFCC00 0%, #e8a87c 38%, #FF3366 70%, #FF33CC 100%);
--scan:  repeating-linear-gradient(0deg, rgba(0,0,0,.30) 0 1px, transparent 1px 3px);
```

---

## 3. Tipografías (todas libres, OFL)

| Uso | Familia | Pesos | Dónde |
|---|---|---|---|
| Titulares | **Chakra Petch** | 500, 700 | `h1`, `h2`, `h3`, nombre de producto. Tecnológica, angulosa, con tildes y ñ |
| Texto / interfaz | **JetBrains Mono** (ya local, ADN admiranext) | 400–800 (variable) | Cuerpo, menú, botones, prompts, formularios |
| Datos, precios y rótulos | **VT323** | 400 | Precios, `.precio-grande`, chips, `dt`, rótulos «episodio», cabeceras de tabla, pantallas CRT. Siempre ≥ 15 px (su tamaño óptico es pequeño) |

`<link>` exacto, **antes** de `shop.css` en cada HTML (JetBrains Mono sigue con su `preload` local):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=VT323&display=swap" rel="stylesheet">
```
Variables: `--f-titular: 'Chakra Petch', 'JetBrains Mono', system-ui, sans-serif;` · `--f-dato: 'VT323', 'JetBrains Mono', ui-monospace, monospace;`

---

## 4. Recursos visuales y dónde va cada uno

| Recurso | Dónde | Clase |
|---|---|---|
| **Horizonte de neón** (sol en franjas + rejilla magenta en perspectiva, animada) | Fondo fijo de todas las páginas, bajo las ventanas; el vídeo actual se mantiene más apagado | `.horizonte > .sol + .suelo` |
| **Cinta de 4 neones** (2 px) | Borde superior de cada `.ventana`, bajo la `.barra`, sobre el `.pie-web`, techo del SVG del local | `--cinta` |
| **Cromado** | Solo el `h1` de la portada y titulares de campaña (texto grande, AA de texto grande garantizado: el tono más oscuro del cromo da 6,3:1) | `.cromado` |
| **Monitor de tubo (CRT)**: carcasa con bisel, pantalla curva, scanlines, viñeta y LED | Foto de cada tarjeta de producto y `.visual` de la ficha | `.crt` (+ `i.led`) |
| **Scanlines** | Solo sobre imágenes/escena (`.escena::after`, `.crt::after`), **nunca sobre texto** | `--scan` |
| **Cartucho de píxel**: canto superior discontinuo del color de la categoría | Todas las `.tarjeta` | `.tarjeta::before` |
| **Brillo de cromo que barre** la tarjeta al pasar | `.tarjeta:hover` | `.tarjeta::after` |
| **Bisel 90s** (la huella gris de admiranext) | Botones, caja de compra, CRT | `--bisel` |
| **Rótulo de episodio** (VT323 cian con ▶ magenta) | Encima de cada `h1/h2` de sección | `.episodio` |
| **LED** rojo latiendo / verde fijo | Bloque de reposición, CRT | `.led` |

Fragmentos clave (la versión completa, en orden de cascada, está en **`shop-retro.css`**):

```css
/* Horizonte */
.horizonte { position: fixed; left: 0; right: 0; bottom: 0; height: 62vh; z-index: -1; pointer-events: none;
  overflow: hidden; perspective: 300px; perspective-origin: 50% 40%; }
.horizonte .sol { position: absolute; left: 50%; bottom: 60%; width: min(34vw, 420px); aspect-ratio: 1; transform: translate(-50%, 12%);
  border-radius: 50%; background: var(--ocaso); opacity: .30;
  mask-image: linear-gradient(#000 0 50%, transparent 50% 55%, #000 55% 62%, transparent 62% 68%, #000 68% 75%, transparent 75% 83%, #000 83% 88%, transparent 88%); }
.horizonte::before { content: ''; position: absolute; left: 0; right: 0; top: 40%; height: 2px; background: #FF33CC; box-shadow: 0 0 18px 4px rgba(255,51,204,.45); opacity: .7; }
.horizonte .suelo { position: absolute; left: -60%; right: -60%; top: 40%; height: 120%; transform-origin: 50% 0%; transform: rotateX(70deg);
  background-image: linear-gradient(rgba(255,51,204,.55) 2px, transparent 2px), linear-gradient(90deg, rgba(255,51,204,.45) 2px, transparent 2px);
  background-size: 72px 72px; animation: rejilla 4s linear infinite; mask-image: linear-gradient(to bottom, transparent, #000 30%); }
@keyframes rejilla { to { background-position: 0 72px, 0 0; } }
.fondo video { opacity: .30; filter: blur(4px) saturate(.7) hue-rotate(-12deg); }

/* Ventana con cinta de neón */
.ventana { background: var(--cinta) top / 100% 2px no-repeat, rgba(37,37,64,.94); }
.ventana > header { background: rgba(16,14,36,.92); }

/* Monitor de tubo */
.crt { position: relative; padding: 12px; border-radius: 16px / 20px; background: linear-gradient(150deg, #474770, #22223b 60%, #17172a);
  box-shadow: var(--bisel), 0 14px 34px rgba(0,0,0,.45); }
.crt > img { display: block; width: 100%; height: auto; border-radius: 10px / 14px; background: var(--crt); }
.crt::after { content: ''; position: absolute; inset: 12px; border-radius: 10px / 14px; pointer-events: none;
  background: var(--scan), radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55)); }

/* Cromado accesible (con respaldo) */
.cromado { color: #e2e2f0; }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .cromado { background: var(--cromo); -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 2px 0 rgba(16,14,36,.9)) drop-shadow(0 0 14px rgba(255,51,204,.25)); } }
```

**Accesibilidad**
- Todos los textos cumplen AA (tabla §2). Ningún texto pequeño en `#FF3366`; para texto rojo, `--alerta #ff5c7a`.
- Scanlines solo sobre imágenes. Foco visible: `outline: 2px solid var(--n-cyan)`.
- El estado rojo/verde **nunca depende solo del color**: siempre lleva texto («Marcado para reponer…» / «Reposición en el carrito…») y `role="status"`.
- `prefers-reduced-motion: reduce` → rejilla quieta, sin parpadeo del logo, sin encendido CRT, sin latido del LED y pantalla del hero fija en **verde** (bloque final de `shop-retro.css`, §16). El vídeo ya se oculta hoy con esa preferencia, y así sigue.

---

## 5. Componentes

### 5.1 Fichas de producto (tarjetas del catálogo) = cartuchos
- Canto superior de 6 px en píxeles discontinuos del color de la categoría (`--c`), fondo `#1e1e35` con un velo del 12 % de `--c` arriba.
- La foto va **dentro de un `.crt`** (monitor de tubo con LED verde abajo a la derecha).
- `h3` en Chakra Petch 700 18 px; resumen `--text-dim` 13 px.
- Pie: precio en **VT323 amarillo `#FFCC00`** con halo suave (marcador arcade) + chip VT323 en versalitas (`muestra` en amarillo, categoría en gris).
- Hover/foco: sube 3 px, borde y halo del color de categoría, brillo de cromo que barre (§7).

### 5.2 Página de producto
- Orden: `prompt cat /p/<modelo>/` → **bloque de reposición** (si `origen=yokup`) → rejilla `.ficha`.
- Izquierda: `.visual.crt` (monitor grande, se enciende al cargar).
- Derecha: `.marca-chip` en VT323 cian · `h1` Chakra Petch · `.lead` · **`.compra` = «TERMINAL DE COMPRA»** (rótulo VT323 incrustado en el borde, fondo `#100e24`→`#1e1e35`, bisel) con `.precio-grande` en VT323 56–84 px amarillo y sombra dura `0 3px 0 #7a5c00` · opciones AdmiraXperience (precios también VT323) · cantidad + botón · `.caracteristicas` con viñeta ■ del color de categoría · `.aviso` de muestra · `.datos` con `dt` en VT323.
- Después, opcional: ventana «Otras piezas del mismo capítulo» con 3 tarjetas de la misma categoría (ver maqueta; es solo presentación, los datos salen del catálogo).

### 5.3 Bloque «Reposición para: local / equipo» (`origen=yokup`)
Panel de orden de trabajo, **en rojo mientras está pendiente y en verde cuando se añade al carrito**:

```
● ↻ REPOSICIÓN PARA
   LOCAL     Cafetería Gran Vía            ← parámetro opcional ?local=
   PANTALLA  Menú board izquierda          ← parámetro opcional ?pantalla=
   EQUIPO    EJEMPLO-01                    ← ?equipo= (el de hoy)
   Marcado para reponer desde Yokup.       ← role="status"
```
- Si falta `local`: se muestra «Lo identificamos por el equipo en Yokup» (no se inventa nada). Si falta `pantalla`, se omite la fila.
- Pendiente: borde `#FF3366`, franja izquierda 4 px, fondo con velo rojo al 14 %, LED rojo latiendo, título y estado en `#ff5c7a`.
- OK (`data-estado="ok"`): mismo panel en `#33FF99`, LED fijo; estado: «Reposición en el carrito. Envía el pedido y la pantalla vuelve a verde tras la instalación.»
- En el listado (catálogo con reposición) se usa el mismo bloque con el estado «Elige el modelo para reponer.»

### 5.4 Carrito
- Tabla con cabeceras en VT323 versalitas; separadores discontinuos `#5a5a8a`.
- Línea de reposición: `small` verde VT323 con «↻ Reposición del equipo EJEMPLO-01».
- Total en VT323 34 px amarillo. Botón «Enviar pedido» = primario; «Copiar pedido» = secundario.
- Inputs: fondo `#0b0a16` hundido (sombra interior), foco cian con halo.

### 5.5 Botones
| Tipo | Clase | Aspecto |
|---|---|---|
| Primario | `.btn.primario` | Degradado ocaso `#f0c4a0 → #e8a87c → #d98f5e`, texto `#1a1a2e` (8,4:1), sombra dura `0 3px 0 #7a4524` + halo ámbar. Versalitas JetBrains Mono 700 |
| Secundario | `.btn` | Degradado `#2c2c4c → #1e1e35`, borde `#5a5a8a`, bisel; hover: borde y halo cian |
| **Reponer** | `.btn.reponer` | Verde fósforo `#7dffbf → #33FF99 → #22d97f`, texto `#0b0a16` (14:1), icono ↻ por `::before`, sombra `0 3px 0 #127a47` + halo verde. Sustituye a `.primario` en la ficha cuando hay `origen=yokup` y en «Ver un ejemplo» de la portada |
| Todos | `:active` | Se hunden 3 px (la sombra dura desaparece): tecla física de los 80 |

---

## 6. Microinteracciones

### 6.1 El neón del logo se enciende (solo CSS, una vez al cargar)
```css
.bln { animation: neon-on 1.1s steps(1) both; }
.bln-2 { animation-delay: .15s; } .bln-3 { animation-delay: .3s; } .bln-4 { animation-delay: .45s; }
@keyframes neon-on { 0% { opacity: .15; text-shadow: none; } 20% { opacity: 1; } 28% { opacity: .2; } 40% { opacity: 1; } 46% { opacity: .4; } 60%, 100% { opacity: 1; } }
```

### 6.2 El monitor se enciende (ficha, solo CSS)
```css
.ficha .visual.crt > img { animation: tubo-on .7s cubic-bezier(.2,.8,.2,1) both; }
@keyframes tubo-on { 0%, 45% { transform: scale(1, .004); filter: brightness(4); } 70% { transform: scale(1, 1.04); filter: brightness(1.6); } 100% { transform: none; filter: none; } }
```

### 6.3 Del rojo al verde + el contador salta (JS mínimo en `shop.js`)
```js
// dentro de anadir.onclick, tras guardarCarrito(c2):
if (repoUI) repoUI.ok();                               // panel de reposición a verde
const b = document.querySelector('[data-contador]');
if (b) { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
```
```css
.menu .carrito-link b.salta { animation: salta .45s cubic-bezier(.3,1.6,.5,1); }
@keyframes salta { 0% { transform: scale(1); } 40% { transform: scale(1.5); } 100% { transform: scale(1); } }
```
Extra, solo CSS: brillo de cromo que barre la tarjeta al pasar (`.tarjeta::after`, en `shop-retro.css` §8).
Con `prefers-reduced-motion` las tres se reducen a su estado final (el verde se aplica igual, sin transición).

---

## 7. Textos de cabecera (tono saga, cortos)

| Sección (ubicación) | `.ruta` de ventana | Rótulo `.episodio` | Titular / texto |
|---|---|---|---|
| Hero portada | `user@admira.shop ~ %` | Episodio I · La tienda del Xpacio | Prompts: `boot xpacio --desde 1985 --hasta mañana` / `montando pantallas, sonido, aroma y red… ok` · h1 (se mantiene): **Todo lo que hace vivo tu Xpacio.** (`.cromado`, «Xpacio» en `.acento`) |
| Escena del local | `~/xpacio · noche de apertura` | Escena 1 · El local despierta | Pista: «Pulsa cualquier pieza del local: cada una abre su capítulo del catálogo.» |
| Categorías | `ls ~/xpacio/categorias` | Nueve piezas · un solo circuito | h2: Categorías |
| Renove (portada) | `~/renove` | Episodio II · Segunda vida | h2: Véndenos tu equipo (texto actual) |
| Yokup (portada) | `~/yokup` | Episodio III · La pantalla en rojo | h2: ¿Vienes desde Yokup? · lead: «Una pantalla cae en rojo, Yokup la ve y pulsas «Reponer»: llegas aquí con el local y el equipo ya identificados. Del rojo al verde en un pedido.» · botón `.btn.reponer` «Ver un ejemplo» |
| Catálogo | `ls ~/xpacio` | Archivo de piezas | h1: Todo para tu Xpacio / nombre de la categoría (sin cambios) |
| Ficha | `cat /p/<modelo>/` | (se usa `.marca-chip`) | Rótulo de caja: TERMINAL DE COMPRA · h2.sub: Características clave · bloque vende: «Véndenos el tuyo» |
| Relacionados (opcional) | `ls /xpacio/<cat>` | Otras piezas del mismo capítulo | — |
| Carrito | `cat ~/carrito` | Bodega de carga | h1: Tu carrito (lead actual, es información real de proceso) |
| Vende | `sell ~/equipo-usado` | Segunda vida | h1: Véndenos tu equipo |
| Pie | — | — | «ADmira.shop · la tienda del Xpacio AdmiraXperience» + enlaces actuales |

Los textos de proceso y de precio (IVA, «muestra», mailto) **no cambian**: son información, no ambientación.

---

## 8. Lista de cambios por archivo (para Morfeo)

### `assets/shop/shop.css`
1. **Añadir al final** el contenido íntegro de `shop-retro.css` (capa que sobrescribe; no hay que borrar reglas previas). Alternativa limpia: subirlo como `assets/shop/shop-retro.css` y enlazarlo tras `shop.css`.
2. Sube el `?v=` de las hojas en los HTML para romper caché.

### Todos los HTML que usan `shop.css` (`index.html`, `catalogo/index.html`, plantilla de `/p/<modelo>/`, `carrito/index.html`, `vende/index.html`)
1. Insertar el bloque `<link>` de Google Fonts (§3) antes de `shop.css`.
2. Justo después de `<div class="fondo">…</div>`, añadir:
   ```html
   <div class="horizonte" aria-hidden="true"><div class="sol"></div><div class="suelo"></div></div>
   ```
3. Añadir `<p class="episodio">…</p>` como primer hijo de cada `.cuerpo` según §7, y cambiar los `.ruta` indicados.
4. Pie: «ADmira.shop · la tienda del Xpacio AdmiraXperience».

### `index.html` (portada)
1. `h1` → `<h1 class="cromado">Todo lo que hace vivo tu <span class="acento">Xpacio</span>.</h1>`; primer prompt → `boot xpacio --desde 1985 --hasta mañana`.
2. SVG `#xpacio`, **conservando** todos los `a.hot`, `href`, `aria-label`, `<title>` y `<desc>`:
   - `xp-pared` → `<stop offset="0" stop-color="#3a2152"/><stop offset=".55" stop-color="#2a2244"/><stop offset="1" stop-color="#1f1f38"/>`.
   - En `<defs>`: `<linearGradient id="xp-cinta" x1="0" x2="1"><stop offset="0" stop-color="#FF3366"/><stop offset=".33" stop-color="#FFCC00"/><stop offset=".66" stop-color="#33FF99"/><stop offset="1" stop-color="#FF33CC"/></linearGradient>`.
   - Sustituir `<g stroke="#3a3a5c" stroke-width="1" opacity=".7">` por:
     ```svg
     <rect x="180" y="58" width="640" height="3" fill="url(#xp-cinta)" opacity=".9"/>
     <g class="rejilla-suelo" stroke="#FF33CC" stroke-opacity=".45" stroke-width="1.5">
       <line x1="260" y1="330" x2="100" y2="560"/><line x1="420" y1="330" x2="380" y2="560"/>
       <line x1="580" y1="330" x2="620" y2="560"/><line x1="740" y1="330" x2="900" y2="560"/>
       <line x1="160" y1="360" x2="840" y2="360"/><line x1="30" y1="520" x2="970" y2="520"/>
       <!-- …y a continuación las líneas que ya había -->
     ```
   - En la pantalla (hot 1), sustituir el `<text>` ADmiraNeXT y el `rect.pulso` por:
     ```svg
     <g class="estado-pantalla">
       <g class="rojo"><rect x="382" y="112" width="236" height="126" rx="4" fill="#3a0716" opacity=".85"/>
         <text x="500" y="168" text-anchor="middle" fill="#ff5c7a" font-family="VT323, monospace" font-size="34">SIN SEÑAL</text>
         <text x="500" y="196" text-anchor="middle" fill="#ff5c7a" font-family="VT323, monospace" font-size="18" opacity=".85">yokup · equipo marcado</text></g>
       <g class="verde"><text x="500" y="166" text-anchor="middle" fill="#fff" font-family="Chakra Petch, monospace" font-weight="700" font-size="24">ADmira<tspan fill="#FF3366">N</tspan><tspan fill="#FFCC00">e</tspan><tspan fill="#33FF99">X</tspan><tspan fill="#FF33CC">T</tspan></text>
         <text x="500" y="198" text-anchor="middle" fill="#33FF99" font-family="VT323, monospace" font-size="22">● EN LÍNEA</text></g>
     </g>
     ```
3. Ventana Yokup: texto de §7 y botón `class="btn reponer"`; su `href` de ejemplo puede pasar a `/p/samsung-qm55c/?origen=yokup&equipo=EJEMPLO-01&local=Local%20de%20ejemplo&pantalla=Pantalla%20de%20ejemplo`, con rótulos que digan «ejemplo» (sin datos que parezcan reales).

### `assets/shop/core.mjs` (cambio pequeño y compatible)
`reposicion()` acepta **`local` y `pantalla` opcionales** (texto, validados; `texto` no cambia, así los tests actuales siguen pasando):
```js
const ETIQUETA = /^[\p{L}\p{N} .,:;#@&'’()\/+_-]{1,80}$/u;
export function reposicion(search) {
  const q = new URLSearchParams(search || '');
  const equipo = (q.get('equipo') || '').trim();
  if (q.get('origen') !== 'yokup' || !EQUIPO.test(equipo)) return null;
  const limpio = (v) => { const s = (v || '').trim().replace(/\s+/g, ' '); return s && ETIQUETA.test(s) ? s : null; };
  return { origen: 'yokup', equipo, local: limpio(q.get('local')), pantalla: limpio(q.get('pantalla')), texto: `Reposición para el equipo ${equipo}` };
}
```
Añadir 2 tests en `test/core.test.mjs`: con `local`/`pantalla` válidos se devuelven; con `<script>` o más de 80 caracteres pasan a `null`.
Contrato ampliado para Yokup (**propuesta**, no se toca yokup.com desde aquí): `https://admira.shop/p/<modelo>/?origen=yokup&equipo=<id>&local=<nombre del local>&pantalla=<nombre de la pantalla>`. Sin esos parámetros, todo sigue funcionando como hoy.

### `assets/shop/shop.js`
1. **Bloque de reposición** (reemplaza los dos `el('p', { class: 'reposicion' … })`):
   ```js
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
   ```
   En `ficha()`: `const repoUI = repo ? bloqueReposicion(repo) : null;` y pintar `repoUI?.nodo`. En `pintarCatalogo()`: `bloqueReposicion(repo, true).nodo`.
2. `urlFicha` debe arrastrar también `local` y `pantalla`:
   ```js
   const urlFicha = (p, repo = null) => `/p/${p.modelo}/` + (repo ? '?' + new URLSearchParams({ origen: 'yokup', equipo: repo.equipo, ...(repo.local && { local: repo.local }), ...(repo.pantalla && { pantalla: repo.pantalla }) }) : '');
   ```
3. Botón de añadir: `class: repo ? 'btn reponer grande' : 'btn primario grande'`; en su `onclick`, el fragmento de §6.3.
4. `tarjetaProducto`: envolver la imagen → `el('div', { class: 'crt' }, el('img', { class: 'foto', … }), el('i', { class: 'led', 'aria-hidden': 'true' }))`.
5. `ficha()`: `.visual` → `class: 'visual crt'` y añadir `el('i', { class: 'led', 'aria-hidden': 'true' })`; en la columna derecha, `style: \`--c:${c.color}\`` para las viñetas.
6. `pintarCatalogo()`: `el('p', { class: 'episodio', text: 'Archivo de piezas' })` antes del `h1`.
7. (Opcional) Guardar `local` en la línea del carrito para verlo en `/carrito/` y en el correo del pedido: requiere un 5.º argumento en `carritoAnadir` y en `textoPedido` (y sus tests). Si no se hace, el carrito sigue mostrando el equipo, que ya identifica la pantalla.

### `carrito/index.html` y `vende/index.html`
Solo el `<link>` de fuentes, `.horizonte`, `.episodio` («Bodega de carga» / «Segunda vida»). El resto lo resuelve la hoja.

### `data/catalogo.json`
**Sin cambios.** El color de cada categoría ya alimenta `--c`. (No hace falta ningún campo nuevo: local y pantalla viajan en la URL, no en el catálogo.)

---

## 9. Qué NO hacer
- **No romper rutas** `/p/<modelo>/`, `/catalogo/?cat=<id>`, `/carrito/`, `/vende/`, ni los parámetros `origen=yokup&equipo=`; `local`/`pantalla` son opcionales y nunca obligatorios. No cambiar `modelo` (slugs) ni `data-page`.
- No usar `innerHTML` para pintar datos de la URL (seguir con `textContent`/`el()`: `local` y `pantalla` vienen de fuera).
- **No fuentes de pago** ni kits de iconos de pago: solo Chakra Petch, VT323 (Google Fonts, OFL) y JetBrains Mono (local).
- **Sin cifras inventadas**: no añadir «+500 locales», «entrega en 24 h», valoraciones, descuentos, stock ni cuentas atrás. Los precios salen solo de `catalogo.json`, con su aviso de «muestra».
- No copiar la piel de XpaceOS ni la terminal verde completa de Pixeria: el verde fósforo solo significa **OK**.
- No poner scanlines, parpadeos ni texto cromado sobre párrafos: solo en imágenes, titulares grandes y rótulos.
- No bajar el contraste de `--text-dim`/`--text-muted` ni escribir texto pequeño en `#FF3366`.
- No animar sin su versión `prefers-reduced-motion`. Nada que parpadee más de 3 veces por segundo (el neón del logo son 5 cambios en 1,1 s y una sola vez).
- No usar marcas de terceros en ilustraciones (Starbucks, Alsea, JTI…): el Xpacio de ejemplo es genérico. Las marcas de los productos del catálogo aparecen solo como texto.
- No quitar el ADN admiranext: ventanas con tres puntos, JetBrains Mono, logo con letras de neón, fondo `#1a1a2e`.
- No tocar `robots.html` ni `/mcp/` en esta pasada (tienen su hoja propia); como mucho, otra tarea para alinear la barra y las fuentes.

---

## 10. Imágenes de referencia (maquetas HTML/CSS renderizadas con Chrome sin interfaz)
No había generador de imágenes disponible; son maquetas reales que usan `shop.css` + `shop-retro.css` con datos de `catalogo.json`:
- `maqueta-portada.png` (página entera) y `maqueta-portada-pantalla1.png` (primer pantallazo, 1440 px) · `maqueta-portada-movil.png` (390 px)
- `maqueta-ficha-reposicion-rojo.png`: ficha `samsung-qm55c` con `origen=yokup`, reposición pendiente
- `maqueta-ficha-reposicion-verde.png`: la misma tras «Añadir reposición al carrito»
- `maqueta-crt-rojo-verde.png`: los dos monitores de tubo, «SIN SEÑAL» → Reponer → «EN LÍNEA»
- Fuentes navegables: `maquetas/portada.html`, `maquetas/ficha-pendiente.html`, `maquetas/ficha-ok.html`, `maquetas/crt-rojo-verde.html`
- Estado actual como referencia: `capturas/shop-*.png`, `capturas/admiranext-home.png`

Los datos «Cafetería Gran Vía (ejemplo)» y «Menú board izquierda» de las maquetas son **de relleno**, solo para ilustrar el parámetro `local`/`pantalla`.
