#!/usr/bin/env python3
"""Paso Matrix (hiperrealista) de las fotos de venta de un mueble de Pixeria (encargo #4405).
Mismo método que admira-xp/tools/walk-sprites/photo-pass.py: render Best de Blender →
grok-imagine (xAI, edición de imagen, grok-imagine-image-quality) → foto.
Uso: matrix-pass.py RENDER_DIR OUT_DIR · clave XAI_API_KEY en el entorno."""
import sys,os,io,json,base64,time,urllib.request,concurrent.futures as cf
from PIL import Image
SRC,OUT=sys.argv[1],sys.argv[2];os.makedirs(OUT,exist_ok=True)
KEY=os.environ['XAI_API_KEY']
COMMON=("Keep EXACTLY the same object, geometry, proportions, parts, number of group heads, buttons and handles, "
  "camera angle and framing. Do not add any logo, brand name, label, text or sticker. Do not add objects that are not in the input. "
  "Photorealistic, sharp focus, natural colours, looks like a real photo taken with a camera for a second-hand listing.")
SHOTS={
 'frente':"Turn this 3D render of a commercial espresso machine with its grinder into a hyperrealistic product photograph, front view, "
   "on a plain light grey studio background with soft even daylight and a soft contact shadow. "+COMMON,
 'tresquartos':"Turn this 3D render of a commercial espresso machine with its grinder into a hyperrealistic product photograph, three-quarter view, "
   "on a plain light grey studio background with soft even daylight and a soft contact shadow. "+COMMON,
 'detalle':"Turn this close-up 3D render of a commercial espresso machine into a hyperrealistic close-up detail photograph of the group heads, "
   "portafilter handles, button panels and drip tray, shallow depth of field, soft daylight. "+COMMON,
 'xpacio':"Turn this isometric 3D render of a coffee shop into a hyperrealistic photograph of the same coffee shop interior from the same high isometric angle: "
   "green counter, wooden back cabinets, pendant lamps, the espresso machine with its grinder standing on the counter exactly where it is, "
   "the small card terminal, the menu boards on the wall. Keep the same layout, positions, colours and camera angle. "
   "Do not add any logo, brand name or readable text. No people. Photorealistic, natural light.",
}
def edit(name):
    buf=io.BytesIO();Image.open(os.path.join(SRC,name+'.png')).convert('RGB').save(buf,'PNG')
    body=json.dumps({"model":"grok-imagine-image-quality","prompt":SHOTS[name],
      "image":{"url":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode(),"type":"image_url"},"response_format":"b64_json"}).encode()
    for a in range(4):
        try:
            req=urllib.request.Request("https://api.x.ai/v1/images/edits",data=body,headers={"Authorization":"Bearer "+KEY,"content-type":"application/json"})
            d=json.load(urllib.request.urlopen(req,timeout=300))
            im=Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB')
            im.save(os.path.join(OUT,name+'.jpg'),quality=90);return name,im.size
        except Exception as e:
            err=getattr(e,'read',lambda:b'')()[:300];print('retry',name,a,e,err,flush=True);time.sleep(10*(a+1))
    raise RuntimeError('fallo '+name)
names=sys.argv[3:] or list(SHOTS)
with cf.ThreadPoolExecutor(4) as ex:
    for f in cf.as_completed([ex.submit(edit,n) for n in names]):
        try:print('ok',f.result(),flush=True)
        except Exception as e:print('FAIL',e,flush=True)
