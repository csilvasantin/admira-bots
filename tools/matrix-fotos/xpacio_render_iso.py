# Render Best isométrico del Xpacio Cafetería Alsea completo (encargo #4411 · FLT-101057).
# Escena: alsea-books-scene.blend (GLB de producción 1790370079244-cv7t5i + estantería de libros #4397/#4399).
# Uso: blender -b alsea-books-scene.blend --python render_iso.py -- OUT.png SAMPLES RES_X
import bpy, math, sys
from mathutils import Vector
out, samples, rx = sys.argv[sys.argv.index('--')+1:][:3]
sc=bpy.context.scene
for o in [o for o in sc.objects if o.type in ('CAMERA','LIGHT')]: bpy.data.objects.remove(o)
ms=[o for o in sc.objects if o.type=='MESH' and o.visible_get()]
pts=[o.matrix_world@Vector(c) for o in ms for c in o.bound_box]
mn=Vector([min(p[i] for p in pts) for i in range(3)]); mx=Vector([max(p[i] for p in pts) for i in range(3)])
c=(mn+mx)/2; print('BOUNDS',mn,mx)
sc.render.engine='CYCLES'; sc.cycles.samples=int(samples); sc.cycles.device='CPU'; sc.cycles.use_denoising=True
sc.render.resolution_x=int(rx); sc.render.resolution_y=int(int(rx)*10/16); sc.render.film_transparent=False
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
bg=w.node_tree.nodes['Background']; bg.inputs[0].default_value=(0.86,0.89,0.86,1); bg.inputs[1].default_value=1.0
bpy.ops.object.light_add(type='SUN', location=(0,0,10)); s=bpy.context.object
s.data.energy=3.5; s.data.angle=math.radians(8); s.rotation_euler=(math.radians(40),0,math.radians(-35))
cam=bpy.data.cameras.new('iso'); co=bpy.data.objects.new('iso',cam); sc.collection.objects.link(co); sc.camera=co
cam.type='ORTHO'; az, el = math.radians(45), math.radians(35.264)
d=Vector((math.sin(az)*math.cos(el), -math.cos(az)*math.cos(el), math.sin(el)))
co.location=c+d*40; co.rotation_euler=(-d).to_track_quat('-Z','Y').to_euler()
cam.clip_end=200
# encuadre: proyecta las esquinas y ajusta ortho_scale con margen
bpy.context.view_layer.update()
from bpy_extras.object_utils import world_to_camera_view
cam.ortho_scale=30
corners=[Vector((x,y,z)) for x in (mn.x,mx.x) for y in (mn.y,mx.y) for z in (mn.z,mx.z)]
uv=[world_to_camera_view(sc,co,p) for p in corners]
aspect=sc.render.resolution_x/sc.render.resolution_y
spanx=(max(u.x for u in uv)-min(u.x for u in uv)); spany=(max(u.y for u in uv)-min(u.y for u in uv))
cam.ortho_scale=30*max(spanx, spany/aspect)*1.12
cx=(max(u.x for u in uv)+min(u.x for u in uv))/2-0.5; cy=(max(u.y for u in uv)+min(u.y for u in uv))/2-0.5
cam.shift_x=cx*30/cam.ortho_scale*max(1,1); cam.shift_y=cy*30/cam.ortho_scale/aspect
sc.render.filepath=out; bpy.ops.render.render(write_still=True)
