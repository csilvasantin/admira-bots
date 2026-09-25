# Render Best de la cafetera (GLB de Pixeria) en 3 vistas para el paso Matrix (encargo #4405).
import bpy, math, sys
from mathutils import Vector
glb, out = sys.argv[sys.argv.index('--')+1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box]
mn=Vector((min(p.x for p in pts),min(p.y for p in pts),min(p.z for p in pts)))
mx=Vector((max(p.x for p in pts),max(p.y for p in pts),max(p.z for p in pts)))
c=(mn+mx)/2; size=(mx-mn).length
print('BOUNDS',mn,mx)
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.samples=64; sc.cycles.device='CPU'
sc.render.resolution_x=sc.render.resolution_y=1024
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.92,0.92,0.9,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.8
# suelo neutro
bpy.ops.mesh.primitive_plane_add(size=size*20, location=(c.x,c.y,mn.z))
m=bpy.data.materials.new('floor'); m.use_nodes=True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.85,0.84,0.82,1)
bpy.context.object.data.materials.append(m)
bpy.ops.object.light_add(type='AREA', location=(c.x-size, c.y-size*1.5, mx.z+size*1.5)); L=bpy.context.object; L.data.energy=400*size*size; L.data.size=size*2
L.rotation_euler=(Vector((c.x,c.y,c.z))-L.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('c',cam); sc.collection.objects.link(co); sc.camera=co
cam.lens=50
def shot(name, az, el, dist, target, lens=50):
    cam.lens=lens
    d=Vector((math.sin(math.radians(az))*math.cos(math.radians(el)), -math.cos(math.radians(az))*math.cos(math.radians(el)), math.sin(math.radians(el))))
    co.location=target+d*dist
    co.rotation_euler=(target-co.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=f'{out}/{name}.png'; bpy.ops.render.render(write_still=True)
shot('frente',0,8,size*1.35,c)
shot('tresquartos',35,20,size*1.4,c)
# detalle: los grupos (frente, mitad alta)
shot('detalle',15,12,size*0.9,Vector((c.x,c.y,c.z+ (mx.z-mn.z)*0.05)),lens=60)
