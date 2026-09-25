#!/usr/bin/env python3
"""Paso fotorrealista del Xpacio Cafetería Alsea completo (encargo #4411 · FLT-101057).
Mismo método que #4405 (flt-4405-matrix/matrix-pass.py): render Best de Blender → grok-imagine
(xAI images/edits, grok-imagine-image-quality). Una generación por llamada.
Uso: photo_pass.py RENDER.png OUT.jpg · clave XAI_API_KEY en el entorno."""
import sys,os,io,json,base64,urllib.request
from PIL import Image
SRC,OUT=sys.argv[1],sys.argv[2]
PROMPT=("Turn this isometric 3D render of a complete coffee shop into a hyperrealistic architectural photograph of the same "
 "cutaway interior, seen from exactly the same high isometric angle, with the same framing and the same plain light grey background "
 "around the cutaway room. Keep EXACTLY the same layout, every piece of furniture in the same position, same count and same colours: "
 "the glazed window wall with the glass door and the long wooden bar shelf with four black stools, the drinks fridge and the grey door, "
 "the green fluted counter with the glass pastry display case, the stainless steel two-group espresso machine with its black grinder "
 "standing on the counter exactly where it is, the small card terminal, the wooden back cabinets, the yellow cone pendant lamps, "
 "the green menu boards on the wall, the small wall shelf with cups, the wooden bookshelf with books, the green sofa, the low coffee table, "
 "the three round tables with wooden chairs, the potted plants and the light wooden plank floor. "
 "The whole cutaway room must stay fully visible exactly as framed in the input, including the top edges of both walls and all four floor corners: do not zoom in, do not crop, do not change the perspective. "
 "There is ONLY ONE espresso machine and ONE grinder, both on the counter; the small wall shelf next to the bookshelf only holds three cups; keep the small dark green screen above that shelf and the fourth pendant lamp in front of it. "
 "Do not add, remove or move any object. Do not add people, logos or brand names. Photorealistic materials, natural daylight, soft realistic shadows, sharp focus.")
buf=io.BytesIO();Image.open(SRC).convert('RGB').save(buf,'JPEG',quality=93)
body=json.dumps({"model":"grok-imagine-image-quality","prompt":PROMPT,
  "image":{"url":"data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode(),"type":"image_url"},"response_format":"b64_json"}).encode()
req=urllib.request.Request("https://api.x.ai/v1/images/edits",data=body,headers={"Authorization":"Bearer "+os.environ['XAI_API_KEY'],"content-type":"application/json"})
try: d=json.load(urllib.request.urlopen(req,timeout=300))
except urllib.error.HTTPError as e: print('HTTP',e.code,e.read()[:400]); sys.exit(1)
meta={k:v for k,v in d.items() if k!='data'}; meta['item']={k:v for k,v in d['data'][0].items() if k!='b64_json'}
print('META',json.dumps(meta)[:600])
im=Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB');im.save(OUT,quality=92);print('ok',im.size)
