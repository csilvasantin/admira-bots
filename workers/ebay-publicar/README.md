# Publicar en eBay · admira.shop

Encargo #4405. El botón **«Publicar en eBay»** de la ficha de un mueble de Pixeria
(`admira.shop/pixeria/?id=…`) llama a este Worker, que crea el anuncio con la
**Sell Inventory API** de eBay:

1. `PUT /sell/inventory/v1/inventory_item/pixeria-<id>`: título, texto de objeto físico
   (`textoWallapop`), fotos Matrix (`fotosMatrix`), estado usado y medidas.
2. `POST /sell/inventory/v1/offer` (o `PUT` si ya existe): precio `precioEUR` de
   `data/pixeria-venta.json`, EBAY_ES, categoría y políticas de envío, pago y devolución.
3. `POST /sell/inventory/v1/offer/<offerId>/publish`: devuelve el `listingId`.

Sin credenciales, o con `{"dry": true}`, solo devuelve la vista previa y no toca eBay.
Publicar exige además la clave `EBAY_PUBLISH_KEY` (la ficha la pide una vez).

## Lo que tiene que dar Carlos

| Dato | Dónde se saca | Dónde va |
|---|---|---|
| **App ID** (Client ID) | developer.ebay.com → *Application Keys*, juego **Production** | `npx wrangler secret put EBAY_APP_ID` |
| **Cert ID** (Client Secret) | el mismo juego de claves | `npx wrangler secret put EBAY_CERT_ID` |
| **RuName** | *User Tokens* → *Get a Token from eBay via Your Application*; «Auth accepted URL» = `https://<worker>/ebay/oauth/vuelta` | `EBAY_RUNAME` en `wrangler.toml` |
| **Token de usuario** (refresh token, 18 meses) | Carlos abre `https://<worker>/ebay/oauth/inicio?clave=<EBAY_PUBLISH_KEY>` y acepta con la cuenta vendedora; queda en el KV `EBAY` sin mostrarse | KV `EBAY` (o `wrangler secret put EBAY_REFRESH_TOKEN`) |
| **Política de envío** (fulfillmentPolicyId) | Seller Hub → Cuenta → Políticas empresariales (hay que activarlas una vez) | `EBAY_FULFILLMENT_POLICY_ID` |
| **Política de pago** (paymentPolicyId) | ídem | `EBAY_PAYMENT_POLICY_ID` |
| **Política de devolución** (returnPolicyId) | ídem | `EBAY_RETURN_POLICY_ID` |
| **Ubicación del artículo** | CP y ciudad desde donde se envía; se crea una vez con `POST /ebay/ubicacion {"cp","ciudad","provincia"}` | `EBAY_MERCHANT_LOCATION_KEY` |
| Clave de publicación | la inventa Carlos (larga, aleatoria) | `npx wrangler secret put EBAY_PUBLISH_KEY` |

Los ids de las políticas salen en la URL de cada política en Seller Hub, o con
`GET /sell/account/v1/fulfillment_policy?marketplace_id=EBAY_ES` (ídem `payment_policy`, `return_policy`).

## Puesta en marcha

```sh
cd workers/ebay-publicar
npx wrangler kv namespace create EBAY      # pegar el id en wrangler.toml
npx wrangler secret put EBAY_APP_ID        # y EBAY_CERT_ID, EBAY_PUBLISH_KEY
npx wrangler deploy
# poner la URL del Worker en data/pixeria-venta.json → ebay.worker
curl https://<worker>/ebay/estado          # «listo»: true cuando no falte nada
```

La categoría la sugiere la Taxonomy API a partir del título; para fijarla, `EBAY_CATEGORY_ID`
o `ebay.categoria` en el mueble. Si la categoría pide aspectos obligatorios (p. ej. Marca),
eBay lo dice en el error y se ponen en `ebay.aspectos` del mueble; no se inventan.

## Sandbox

`EBAY_ENV = "sandbox"` usa `api.sandbox.ebay.com`. Necesita las claves **Sandbox** de la
misma cuenta de desarrollador y un usuario de prueba del sandbox, así que tampoco se puede
probar sin la cuenta de Carlos. Las pruebas de este directorio simulan eBay: `npm test`.
