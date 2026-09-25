# Fotos Matrix para vender muebles de Pixeria

Encargo #4405. Mismo paso que el modo Matrix de las Xperiences
(`admira-xp/tools/walk-sprites/photo-pass.py` en xpaceos): render Best → grok-imagine.

```sh
curl -o mueble.glb "<url del GLB en stock.admira.store>"
blender -b --factory-startup --python render_best.py -- mueble.glb render/   # frente, tresquartos, detalle
# render/xpacio.png: recorte de la captura del Xpacio con el mueble en su sitio
XAI_API_KEY=… python3 matrix_pass.py render/ matrix/                         # api.x.ai/v1/images/edits · grok-imagine-image-quality
```

Las fotos van a `pixeria/fotos/<id>/` y se listan en `fotosMatrix` del mueble en
`data/pixeria-venta.json`. Son imágenes generadas a partir del modelo, no fotos del objeto.
