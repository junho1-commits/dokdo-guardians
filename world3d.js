import * as THREE from './vendor/three.module.js';
import {createMascot} from './characters3d.js';
import {createNpc} from './npcs3d.js';

// Genuine 3D scene; progression and learning remain in adventure.js.
const canvas3d=document.createElement('canvas');canvas3d.id='view3d';canvas3d.tabIndex=0;canvas3d.setAttribute('aria-label','독도 3D 탐험 공간. 1 일인칭, 2 뒤에서 보기, 3 위에서 보기. 방향키 이동.');
let renderer3d;
try{renderer3d=new THREE.WebGLRenderer({canvas:canvas3d,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){console.warn('3D graphics unavailable; original renderer remains available.',error);}
if(renderer3d){
const oldCanvas=view;oldCanvas.hidden=true;oldCanvas.style.display='none';oldCanvas.after(canvas3d);view=canvas3d;
const T=THREE,scene3d=new T.Scene();scene3d.background=new T.Color('#b5dce8');scene3d.fog=new T.Fog('#b5dce8',65,160);
renderer3d.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer3d.shadowMap.enabled=true;renderer3d.shadowMap.type=T.PCFSoftShadowMap;renderer3d.outputColorSpace=T.SRGBColorSpace;renderer3d.toneMapping=T.ACESFilmicToneMapping;renderer3d.toneMappingExposure=1.15;
scene3d.add(new T.HemisphereLight('#eef9ff','#618469',2.3));const sun=new T.DirectionalLight('#fff1ce',3.1);sun.position.set(-35,65,-15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:170});sun.shadow.bias=-.0003;scene3d.add(sun);
const cam=new T.PerspectiveCamera(58,1,.08,240);scene3d.add(cam);
const centers=[[-33,-33],[0,-33],[33,-33],[33,18],[0,18],[-33,18]];
const colors=['#91b799','#8baf86','#69ad9d','#c4ad8c','#a8be7e','#c0aa78'];
const mats=new Map(),geometryCache=new Map();
function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.78,metalness:0}));return mats.get(c)}
function mesh(geometry,color,x,y,z,parent=scene3d){let m=new T.Mesh(geometry,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function roundedGeometry(w,h,d,r=.08){let key=[w,h,d,r].join('/');if(geometryCache.has(key))return geometryCache.get(key);const sh=new T.Shape(),x=-w/2+r,y=-h/2+r;sh.moveTo(x,y);sh.lineTo(x+w-2*r,y);sh.lineTo(x+w-2*r,y+h-2*r);sh.lineTo(x,y+h-2*r);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:Math.max(.01,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,steps:1});g.translate(0,0,-d/2+r);geometryCache.set(key,g);return g}
function rb(x,y,z,w,h,d,c,parent=scene3d,r=.07){return mesh(roundedGeometry(w,h,d,Math.min(r,w/4,h/4,d/4)),c,x,y,z,parent)}
function cyl(x,y,z,r,h,c,parent=scene3d,top=r){return mesh(new T.CylinderGeometry(top,r,h,24),c,x,y,z,parent)}
function sphere(x,y,z,r,c,parent=scene3d,sx=1,sy=1,sz=1){let m=mesh(new T.SphereGeometry(r,20,12),c,x,y,z,parent);m.scale.set(sx,sy,sz);return m}
const textureLoader=new T.TextureLoader(),textures={};function tex(url){if(!textures[url]){textures[url]=textureLoader.load(url);textures[url].colorSpace=T.SRGBColorSpace}return textures[url]}
function panelPhoto(url,x,y,z,w,h,parent=scene3d){rb(x,y,z+.025,w+.12,h+.12,.12,'#f8f1db',parent);const material=new T.MeshBasicMaterial({map:tex(url)});const front=mesh(new T.PlaneGeometry(w,h),material,x,y,z-.05,parent);front.rotation.y=Math.PI;mesh(new T.PlaneGeometry(w,h),material,x,y,z+.10,parent);return front}
function label(text,x,y,z,scale=1,color='#335d50',parent=scene3d){const c=document.createElement('canvas');c.width=768;c.height=160;const g=c.getContext('2d');g.fillStyle='#fffbed';g.beginPath();g.roundRect(6,8,756,140,30);g.fill();g.strokeStyle='#87a790';g.lineWidth=5;g.stroke();g.fillStyle=color;g.font='bold 42px Malgun Gothic';g.textAlign='center';g.fillText(text,384,98);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;let s=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:true}));s.position.set(x,y,z);s.scale.set(4.3*scale,.9*scale,1);parent.add(s);return s}
// Ocean, soft islands and bridges occupy one continuous space.
const ocean=mesh(new T.PlaneGeometry(340,340),new T.MeshStandardMaterial({color:'#419eb4',roughness:.3,metalness:.2}),0,-.85,0);ocean.rotation.x=-Math.PI/2;ocean.receiveShadow=true;
for(let i=0;i<46;i++){const x=Math.sin(i*13.7)*83,z=Math.cos(i*9.4)*76;let wave=mesh(new T.PlaneGeometry(1.5+i%4,.05),new T.MeshBasicMaterial({color:'#bee9e7',transparent:true,opacity:.3}),x,-.825,z);wave.rotation.x=-Math.PI/2;}
const worldSolids=[],markerObjects=[],flags=[],escapeDoors=[],npcObjects=[];
// Room footprints: room 2 is a round lighthouse observatory, the others stay rectangular halls.
// Halls are 1.5× the original footprint (walkable ±10.2 × -15.6..16.6); the observatory is r=14. door/spawn are z offsets from the room centre.
const roomShapes=centers.map((c,i)=>i===1?{shape:'circle',x:c[0],z:c[1]+1.5,r:14,door:15,spawn:-6}:{shape:'rect',x:c[0],z:c[1],hw:10.2,zMin:-15.6,zMax:16.6,door:17,spawn:-6});
const decks=[],worldArcs=[];
function floorY(x,z){let h=0;for(const d of decks)if(Math.hypot(x-d.x,z-d.z)<d.r)h=Math.max(h,d.h);return h}
// Angles below follow CylinderGeometry: x=r·sinθ, z=r·cosθ, so θ=0 faces the sealed door at +z.
function arcWall(x,y,z,rIn,rOut,h,gap,c,parent=scene3d){const s=new T.Shape(),a0=Math.PI*1.5+gap,a1=Math.PI*3.5-gap;s.absarc(0,0,rOut,a0,a1,false);s.absarc(0,0,rIn,a1,a0,true);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:96});g.rotateX(-Math.PI/2);return mesh(g,c,x,y,z,parent)}
function flatRing(x,y,z,r,tube,c,parent=scene3d,start=0,length=Math.PI*2){const g=new T.TorusGeometry(r,tube,8,96,length);g.rotateZ(start-Math.PI/2);g.rotateX(-Math.PI/2);return mesh(g,c,x,y,z,parent)}
function buildObservatory(i,cx,cz,shape,wallColor){const C=[shape.x,shape.z],R=shape.r,gap=.26,doorZ=cz+shape.door;
// Round floor with an observatory dial instead of the plank walkway.
cyl(cx,-.5,C[1],R+.6,1,'#afa188');cyl(cx,-.06,C[1],R+.2,.2,colors[i]);
for(const r of [4,8,12])flatRing(cx,.06,C[1],r,.035,'#d1c49f');
for(let k=0;k<8;k++){const a=k*Math.PI/4;rb(cx+Math.sin(a)*6.5,.06,C[1]+Math.cos(a)*6.5,.06,.06,13,'#d1c49f').rotation.y=a;}
// Solid lower wall, a 360° glass band with mullions and dark rims; open to the sky like the other rooms.
arcWall(cx,0,C[1],R,R+.4,1.3,gap,wallColor);
flatRing(cx,1.32,C[1],R+.2,.09,'#405e5d',scene3d,gap,Math.PI*2-2*gap);
flatRing(cx,3.86,C[1],R+.2,.16,'#405e5d',scene3d,gap,Math.PI*2-2*gap);
const glass=new T.MeshStandardMaterial({color:'#97c7cf',transparent:true,opacity:.14,roughness:.2,depthWrite:false,side:T.DoubleSide});
mesh(new T.CylinderGeometry(R+.2,R+.2,2.5,96,1,true,gap,Math.PI*2-2*gap),glass,cx,2.55,C[1]);
for(let k=1;k<32;k++){const a=k*Math.PI/16;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<gap+.05)continue;rb(cx+Math.sin(a)*(R+.2),2.55,C[1]+Math.cos(a)*(R+.2),.3,2.5,.3,'#56716a').rotation.y=a;}
for(const side of [-1,1])rb(cx+side*2.7,1.9,doorZ-.25,2.3,3.8,.8,wallColor);
rb(cx,3.65,doorZ,3.8,.5,.5,wallColor);
// Open rafter ring: the centre stays clear so the top-down camera still works.
for(let k=0;k<12;k++){const a=k*Math.PI/6;rb(cx+Math.sin(a)*12,4.4,C[1]+Math.cos(a)*12,.2,.16,4.4,'#405e5d').rotation.set(.24,a,0,'YXZ');}
// Raised observation deck at the back with a railing and two telescopes aimed at the windows.
const dx=cx,dz=cz+shape.spawn,dr=5.5,dh=.55;decks.push({x:dx,z:dz,r:dr,h:dh});
cyl(dx,dh/2,dz,dr,dh,'#b8a67f');cyl(dx,dh-.02,dz,dr-.15,.06,'#e6d9b6');
rb(cx,.14,dz+dr+.3,3.6,.28,.7,'#c9b98f');
worldArcs.push({x:dx,z:dz,r:dr-.15,from:Math.PI*.56,to:Math.PI*1.44});
flatRing(dx,dh+1,dz,dr-.15,.05,'#8d7b58',scene3d,Math.PI*.56,Math.PI*.88);
for(let k=0;k<=14;k++){const a=Math.PI*.56+k*Math.PI*.88/14;cyl(dx+Math.sin(a)*(dr-.15),dh+.5,dz+Math.cos(a)*(dr-.15),.04,1,'#8d7b58');}
for(const a of [Math.PI*.72,Math.PI*1.28]){const x=dx+Math.sin(a)*(dr-.9),z=dz+Math.cos(a)*(dr-.9);cyl(x,dh+.5,z,.06,1,'#5d6d70',scene3d,.08);cyl(x+Math.sin(a)*.18,dh+1.12,z+Math.cos(a)*.18,.09,.6,'#3f5a63',scene3d,.12).rotation.set(1.05,a,0,'YXZ');}
for(const a of [Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75]){const x=cx+Math.sin(a)*12.9,z=C[1]+Math.cos(a)*12.9;cyl(x,.55,z,.08,1.1,'#d5ccae');sphere(x,1.15,z,.13,'#fff0ba');}
for(const side of [-1,1]){const x=cx+side*6.5,z=C[1]+10.5;cyl(x,.25,z,.65,.5,'#c9ad88');sphere(x,.85,z,.72,'#769c6b',scene3d,1,.9,1);}
rb(cx+10,1.35,cz+9.5,.13,2.7,.13,'#b8a17b');panelPhoto('교표.jpg',cx+10,2.45,cz+9.5,.8,.8);label('모덕초등학교 제작',cx+10,3.15,cz+9.5,.5);
// Dokdo silhouettes beyond the windows: a learning illustration, not real topography.
for(const [x,z,r,sy,c] of [[cx-9,cz-35,4.6,1.7,'#748a82'],[cx+8,cz-31,3.9,1,'#7f9189'],[cx-1,cz-40,1.4,.8,'#8a9a94'],[cx+13,cz-35,1.1,.6,'#8a9a94'],[cx-15,cz-30,1.3,.7,'#8a9a94']]){mesh(new T.DodecahedronGeometry(r,0),c,x,r*sy*.55-.6,z).scale.set(1,sy,.85);}
sphere(cx-9,7.6,cz-35,2,'#7fa078',scene3d,1.4,.5,1.1);sphere(cx+8,4.4,cz-31,2,'#86a97c',scene3d,1.5,.4,1.1);
cyl(cx+8,5.6,cz-31,.32,2.4,'#faf2d8');cyl(cx+8,6.9,cz-31,.45,.2,'#cf7959');sphere(cx+8,7.1,cz-31,.25,'#fff2bd');
}
function buildDoor(i,cx,doorZ){
for(const side of [-1,1]){rb(cx+side*1.63,1.72,doorZ,.26,3.44,.65,'#354f56');}rb(cx,3.48,doorZ,3.5,.28,.65,'#354f56');
const leftDoor=rb(cx-.76,1.65,doorZ,1.58,3.3,.24,'#597c7c'),rightDoor=rb(cx+.76,1.65,doorZ,1.58,3.3,.24,'#597c7c');for(const side of [-1,1])rb(cx+side*.17,1.6,doorZ-.22,.075,.55,.08,'#edcf80');const light=rb(cx,3.50,doorZ-.39,.7,.12,.07,'#d6a263');escapeDoors.push({index:i,left:leftDoor,right:rightDoor,cx,light});
label(i===5?'수호 메시지 전송':'봉인된 문 · 단서 조합',cx,3.1,doorZ-.35,.55);
}
for(let i=0;i<6;i++){const [cx,cz]=centers[i];D.stages[i].nodes.forEach(n=>{n.localX=n.x;n.localZ=n.z;n.x+=cx;n.z+=cz;n.chapter=i});
const wallColor=['#bfcab7','#bacbd0','#b7cbbb','#cdbfa8','#bac5ad','#b7c6c4'][i];
if(roomShapes[i].shape==='circle')buildObservatory(i,cx,cz,roomShapes[i],wallColor);else{
const doorZ=cz+roomShapes[i].door;
rb(cx,-.5,cz+1.5,25.5,1,40.5,'#afa188',scene3d,.2);rb(cx,-.06,cz+1.5,24,.2,39,colors[i],scene3d,.04);rb(cx,.05,cz+1.5,3,.08,37.5,'#ece0bd',scene3d,.015);
for(let j=0;j<23;j++)rb(cx,.11,cz-15+j*1.55,2.9,.08,.045,'#d1c49f',scene3d,.01);
// Cutaway escape-room architecture: ocean windows, shelves, arches and a sealed exit.
// Continuous opaque shells close the room perimeter; decorative windows stay inset.
for(const side of [-1,1])rb(cx+side*10.83,1.9,cz+.5,.42,3.8,35,wallColor);
rb(cx,1.9,doorZ+.9,3.8,3.8,.35,wallColor);
for(const side of [-1,1]){rb(cx+side*10.75,.65,cz+.5,.38,1.3,35,wallColor);rb(cx+side*10.75,3.8,cz+.5,.38,.25,35,'#405e5d');for(const dz of [-15,-7.5,0,7.5,15])rb(cx+side*10.75,2.3,cz+dz,.4,3,.4,'#56716a');const glass=new T.MeshStandardMaterial({color:'#97c7cf',transparent:true,opacity:.12,roughness:.2,depthWrite:false});mesh(new T.BoxGeometry(.10,2.8,33.5),glass,cx+side*10.73,2.2,cz+.5);}
for(const dx of [-6.3,6.3]){rb(cx+dx,1.9,doorZ+.2,9.05,3.8,.45,wallColor);rb(cx+dx,2.4,doorZ-.1,5.5,1.5,.10,'#254954');}
rb(cx,1.9,cz-16.2,21.9,3.8,.45,wallColor);rb(cx,3.65,doorZ+.2,3.5,.5,.45,wallColor);
rb(cx,3.85,doorZ+.1,21.7,.3,.6,'#405e5d');rb(cx,3.85,cz-15.9,21.7,.3,.6,'#405e5d');for(const dx of [-10.5,10.5])rb(cx+dx,1.9,cz-15.9,.48,3.8,.48,'#405e5d');
for(const dx of [-9.5,9.5]){rb(cx+dx,.62,cz-7.5,1.15,1.2,2.1,'#8f8668');for(let k=0;k<4;k++)rb(cx+dx-.35+k*.22,1.40,cz-7.5,.14,.36+(k%2)*.13,.55,['#ceab79','#708f83','#90a5ac','#b5937b'][k]);}
// Curved canopy and small exhibition pavilions rather than stacks of blocks.
for(const dx of [-10.3,10.3])for(const dz of [-13,15]){cyl(cx+dx,.55,cz+dz,.08,1.1,'#d5ccae');sphere(cx+dx,1.15,cz+dz,.13,'#fff0ba');}
for(const dx of [-9.6,9.6]){cyl(cx+dx,.25,cz+12, .65,.5,'#c9ad88');sphere(cx+dx,.85,cz+12,.72,'#769c6b',scene3d,1,.9,1);}
// Entry plaque carries the real school emblem within the scene.
rb(cx-7.5,1.35,cz-13,.13,2.7,.13,'#b8a17b');panelPhoto('교표.jpg',cx-7.5,2.45,cz-13,.8,.8);label('모덕초등학교 제작',cx-7.5,3.15,cz-13,.5);
}
buildDoor(i,cx,cz+roomShapes[i].door);
const deskLight=new T.PointLight('#ffe6a6',8,18,2);deskLight.position.set(cx,3.4,cz+3);scene3d.add(deskLight);
label(`${i+1} · ${D.stages[i].name}`,cx,4.5,cz+roomShapes[i].door-.3,.95);
for(const n of D.stages[i].nodes){const x=n.x,z=n.z,g=new T.Group();g.position.y=floorY(x,z);scene3d.add(g);worldSolids.push({x:x-.85,z:z-.55,w:1.7,d:1.5});
if(n.kind==='npc'){const npc=makeGullGuide();npc.position.set(x,0,z);npc.rotation.y=Math.PI;g.add(npc)}
else if(n.kind==='bird'){sphere(x,.38,z,.85,'#9fa79d',g,1,.45,.8);sphere(x,.83,z,.25,'#fffaf0',g,1.3,1,1);sphere(x,1.05,z-.18,.16,'#fffaf0',g);let beak=mesh(new T.ConeGeometry(.085,.23,12),'#eac56a',x,1.04,z-.39,g);beak.rotation.x=-Math.PI/2;for(const side of [-1,1]){sphere(x+side*.10,1.08,z-.305,.035,'#263b46',g);sphere(x+side*.105,1.092,z-.33,.009,'#ffffff',g);}}
else if(n.kind==='litter'){// 해안 정화 구역: 모래밭 위에 쓰레기 2개(정리 후 사라짐)와 자연물 2개(제자리에 남음)
rb(x,.06,z,1.5,.12,1.1,'#e9d6a5',g,.12);
const wrap=rb(x-.42,.15,z-.2,.3,.04,.22,'#ee6fa0',g,.02);wrap.rotation.y=.5;wrap.userData.trash=true;
const can=cyl(x+.4,.2,z-.25,.09,.26,'#d94236',g);can.rotation.z=Math.PI/2;can.rotation.y=.4;can.userData.trash=true;
sphere(x+.05,.2,z+.2,.16,'#6f6a63',g,1.2,.7,1);
const feather=rb(x-.35,.14,z+.28,.42,.02,.1,'#f6f2e6',g,.01);feather.rotation.y=-.6;feather.rotation.z=.15;}
else if(n.kind==='chest'){rb(x,.46,z,1.25,.86,.8,'#b98951',g,.1);rb(x,.93,z,1.33,.2,.89,'#e7c173',g);rb(x,.53,z-.43,.16,.25,.05,'#fff0b4',g,.02);}
else{rb(x,.53,z,1.6,1.05,.8,colors[i],g);rb(x,1.09,z,1.8,.13,.95,'#fcf4df',g);const id=['rocks','landscape','displayLand'].includes(n.id)?'west':['today','bird','care','habitat'].includes(n.id)?'east':null;if(id)panelPhoto('assets/photos/'+(id==='west'?'seodo.jpg':'dongdo-birds.jpg'),x,1.65,z,1.55,1.04,g);else if(n.id==='sea'){rb(x,1.57,z,1.5,.9,.55,'#49a7b5',g);for(let k=0;k<4;k++)cyl(x-.5+k*.3,1.45,z-.32,.035,.5+k%2*.2,'#b9d580',g);}else{const it=n.use||(n.grant||[])[0]||'notebook';panelPhoto(ItemIcons[it],x,1.57,z,.8,.8,g)}
if(n.id==='depart'){// 출항 경로 해독판 위의 나침반: 조사 완료 후 바늘이 독도 방향(114°)을 가리킨다
cyl(x+.62,1.2,z-.05,.27,.08,'#375d4a',g);cyl(x+.62,1.25,z-.05,.23,.03,'#fffbe8',g);
const needle=new T.Group();needle.position.set(x+.62,1.29,z-.05);needle.userData.needle=true;g.add(needle);rb(0,0,-.1,.05,.02,.2,'#d94236',needle,.01);rb(0,0,.1,.05,.02,.2,'#587063',needle,.01);cyl(0,0,0,.035,.03,'#f1c75b',needle);}}
const tag=label(n.name,x,2.7+g.position.y,z,.67);markerObjects.push({n,g,tag});}
// Room guide: optional conversation partner, turned toward the player at runtime.
for(const npc of [].concat(D.npcs[i]||[])){const x=cx+npc.x,z=cz+npc.z,h=floorY(x,z),g=createNpc(npc.kind);g.position.set(x,h,z);g.rotation.y=npc.fixed?0:Math.PI;scene3d.add(g);worldSolids.push({x:x-.6,z:z-.6,w:1.2,d:1.2});if(npc.kind==='guard')worldSolids.push({x:x+.6,z:z-.2,w:1.2,d:1.2});const tag=label(npc.name,x,(npc.fixed?3.9:3.15)+h,z,.67);npcObjects.push({npc:{...npc,x,z,chapter:i,id:'npc-'+npc.id,isNpc:true},g,tag,rest:g.rotation.y});}
const flagGroup=new T.Group();flagGroup.position.set(cx,0,cz+roomShapes[i].door-.3);scene3d.add(flagGroup);cyl(0,1.4,0,.055,2.8,'#b9ab86',flagGroup);const flag=rb(.48,2.3,0,.95,.65,.05,'#f3cf70',flagGroup);flags.push({group:flagGroup,flag,index:i});flagGroup.visible=false;
}
const bridges=[];for(let i=0;i<5;i++){const a=centers[i],b=centers[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);let bridge=rb((a[0]+b[0])/2,-.02,(a[1]+b[1])/2,3.3,.2,len,'#e2cfa6');bridge.rotation.y=Math.atan2(dx,dz);bridges.push({a,b,to:i+1});}
// Distant sculpted cliffs, a lighthouse and drifting clouds.
for(let i=0;i<13;i++){let x=-30+i*5.2,z=49+Math.sin(i)*5;let rock=mesh(new T.DodecahedronGeometry(4+i%3,0),'#8fa29b',x,1.7+i%4,z);rock.scale.set(.9,1.2+i%2*.8,.85);sphere(x,4.5+i%4,z,2.3,'#8eac81',scene3d,1.3,.4,1);}
cyl(14,7,48,.55,4.5,'#faf2d8');cyl(14,9.5,48,.8,.25,'#cf7959');sphere(14,9.8,48,.42,'#fff2bd');
for(let i=0;i<7;i++){let g=new T.Group();g.position.set(-70+i*21,23+i%3*3,10+(i%2)*35);scene3d.add(g);for(let j=0;j<4;j++)sphere(j*2.3,Math.sin(j)*.5,0,2,'#f7fcf4',g,1.8,.7,1);}

function makeGullGuide(){
const g=new T.Group();
// A fictional black-tailed gull guide, distinct from the two student avatars.
sphere(0,1.05,0,.64,'#fffdf3',g,1,1.12,.8);
for(const side of [-1,1]){
const wing=sphere(side*.53,1.13,-.05,.35,'#9aaab4',g,.55,1.35,.8);wing.rotation.z=side*.2;
sphere(side*.58,.83,-.06,.18,'#354750',g,.65,1.2,.9);
cyl(side*.23,.24,.03,.06,.35,'#e8b84b',g);
sphere(side*.23,.09,.17,.16,'#edbd53',g,1.2,.45,1.7);
}
sphere(0,1.95,.05,.58,'#fffdf3',g,1,1,.9);
for(const side of [-1,1]){
sphere(side*.22,2.04,.51,.095,'#263b46',g,.8,1.1,.5);
sphere(side*.20,2.07,.552,.026,'#ffffff',g);
sphere(side*.36,1.86,.48,.09,'#efc1ad',g,1,.5,.25);
}
const beak=mesh(new T.ConeGeometry(.15,.43,24),'#e8bc4d',0,1.88,.69,g);beak.rotation.x=Math.PI/2;
sphere(0,1.88,.89,.055,'#cb6651',g,1,.7,.5);
const scarf=mesh(new T.TorusGeometry(.35,.09,10,32),'#37a9ad',0,1.54,.02,g);scarf.rotation.x=Math.PI/2;
rb(.18,1.24,.52,.17,.42,.09,'#37a9ad',g);
// Doki wears only the scarf; school branding remains on the school signs.
return g;
}
function makeAvatar(kind){return createMascot(kind,tex('교표.jpg'));}
function legacyAvatar(kind){const g=new T.Group(),girl=kind==='nari',shirt=girl?'#ed9cb6':'#b5d484',skin='#f0c7a4',hair=girl?'#984b36':'#6c4935';
const legs=[];for(const x of [-.22,.22]){const limb=new T.Group();limb.position.set(x,.87,0);g.add(limb);rb(0,-.36,0,.32,.7,.36,'#5484a3',limb);rb(0,-.73,.09,.36,.19,.5,'#354256',limb);legs.push(limb)}
rb(0,1.27,0,.79,.87,.48,shirt,g,.12);cyl(0,1.76,0,.17,.15,skin,g);
const arms=[];for(const x of [-.54,.54]){const a=new T.Group();a.position.set(x,1.63,0);g.add(a);rb(0,-.31,0,.27,.64,.31,girl?'#f4dc93':shirt,a,.1);sphere(0,-.66,0,.155,skin,a,1,1.1,1);arms.push(a)}
rb(0,2.12,0,.75,.72,.64,skin,g,.15);rb(0,2.16,-.23,.77,.66,.27,hair,g,.12);sphere(0,2.38,-.015,.42,hair,g,1,.55,.9);
for(const x of [-.16,.16])sphere(x,2.15,.326,.036,'#292c29',g,1,1.35,.35);
const smile=new T.Mesh(new T.TorusGeometry(.12,.015,6,20,Math.PI),mat('#794f3a'));smile.rotation.z=Math.PI;smile.position.set(0,2.025,.337);g.add(smile);
const emblemMesh=mesh(new T.CircleGeometry(.2,32),new T.MeshBasicMaterial({map:tex('교표.jpg')}),0,1.3,.254,g);
rb(0,1.29,-.33,.55,.6,.26,'#bd985f',g,.09);rb(0,1.39,-.48,.23,.17,.035,'#f1d687',g,.02);
if(girl){for(const x of [-.39,.39])for(let j=0;j<4;j++)sphere(x,2.04-j*.17,-.01,.115,hair,g,.8,1.15,.85);for(let j=0;j<7;j++){let angle=j/7*Math.PI*2;const petal=sphere(Math.sin(angle)*.47,2.34+Math.cos(angle)*.43,-.19,.18,'#f5ce53',g,.7,1.7,.3);petal.rotation.z=-angle;} }else{cyl(0,2.43,-.04,.5,.12,'#4c956c',g);let hat=mesh(new T.ConeGeometry(.52,.7,4),'#4c956c',0,2.79,-.04,g);hat.rotation.y=Math.PI/4;let snow=mesh(new T.ConeGeometry(.18,.24,4),'#fff9e4',0,3.02,-.04,g);snow.rotation.y=Math.PI/4;}
g.userData={arms,legs};return g}
let player3d=makeAvatar(choice.character),playerKind=choice.character;scene3d.add(player3d);
const hands=new T.Group();cam.add(hands);rb(.39,-.42,-.67,.17,.5,.18,'#b5d484',hands,.04);sphere(.38,-.17,-.68,.1,'#f0c7a4',hands);let heldPlane=mesh(new T.PlaneGeometry(.37,.37),new T.MeshBasicMaterial({transparent:true,depthTest:false}),.36,-.12,-.82,hands);heldPlane.renderOrder=99;let heldId=null;
let cameraLocked=false;let mode=2,orbitDistance=6,orbitTarget=6,runToggle=false,avatarYaw=0,previousX=px,previousZ=pz;const switches=document.createElement('div');switches.className='camera-switches';switches.innerHTML='<button data-camera="1">1 <span>일인칭</span></button><button data-camera="2">2 <span>자유 시점</span></button><button data-camera="3">3 <span>위에서</span></button>';game.append(switches);
function setMode(m){if(m===2&&mode!==2){orbitTarget=Math.max(2.2,orbitTarget);orbitDistance=Math.max(1.2,orbitDistance)}mode=m;switches.querySelectorAll('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.camera===m));$('.crosshair').style.display=m===1?'':'none';}
switches.querySelectorAll('button').forEach(b=>b.onclick=()=>setMode(+b.dataset.camera));setMode(2);
const lockButton=document.createElement('button');lockButton.textContent='CapsLock · 방향 고정 끔';lockButton.setAttribute('aria-pressed','false');switches.append(lockButton);function toggleCameraLock(){cameraLocked=!cameraLocked;drag=null;lockButton.textContent='CapsLock · 방향 고정 '+(cameraLocked?'켬':'끔');lockButton.setAttribute('aria-pressed',String(cameraLocked));}lockButton.onclick=toggleCameraLock;
// Touch users get a run toggle since they have no Shift key.
const runButton=document.createElement('button');runButton.textContent='Shift · 달리기 끔';runButton.setAttribute('aria-pressed','false');switches.append(runButton);runButton.onclick=()=>{runToggle=!runToggle;runButton.textContent='Shift · 달리기 '+(runToggle?'켬':'끔');runButton.setAttribute('aria-pressed',String(runToggle));canvas3d.focus()};
addEventListener('keydown',e=>{if(!active||e.repeat)return;const k=e.key.toLowerCase();if(k==='m'){if(photoAlbum.open)return;if(activity.open&&!activity.querySelector('#full-world-map'))return;e.preventDefault();e.stopImmediatePropagation();if(activity.open)closeModal();else map();}if(k==='capslock'&&!activity.open&&!photoAlbum.open){e.preventDefault();e.stopImmediatePropagation();toggleCameraLock();}},true);
addEventListener('keydown',e=>{if(!active||activity.open||photoAlbum.open)return;if(e.key==='Shift'){e.preventDefault();keys.add('shift');}if(['1','2','3'].includes(e.key)){e.preventDefault();setMode(+e.key)}});
canvas3d.oncontextmenu=e=>e.preventDefault();
// Roblox-style: right-drag (or touch-drag) orbits the camera; left click only focuses the canvas so UI clicks never spin the view.
canvas3d.onpointerdown=e=>{if(!active||activity.open||photoAlbum.open)return;canvas3d.focus();if(e.pointerType==='mouse'&&e.button!==2)return;e.preventDefault();drag=[e.clientX,e.clientY];canvas3d.setPointerCapture(e.pointerId)};canvas3d.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.0035;pitch=Math.max(-.85,Math.min(.7,pitch-(e.clientY-drag[1])*.0028));drag=[e.clientX,e.clientY]};for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas3d.addEventListener(ev,()=>drag=null);
canvas3d.addEventListener('wheel',e=>{if(!active||activity.open||photoAlbum.open)return;e.preventDefault();const step=Math.sign(e.deltaY);if(!step)return;if(mode===1){if(step>0){orbitTarget=2.2;orbitDistance=1.2;setMode(2)}}else{orbitTarget=Math.max(1,Math.min(13,orbitTarget*(step>0?1.18:1/1.18)));if(orbitTarget<=1.25)setMode(1);else if(mode!==2)setMode(2)}},{passive:false});
const navPanel=document.createElement('button');navPanel.id='live-minimap';navPanel.setAttribute('aria-label','현재 위치가 표시된 전체 지도 열기');game.append(navPanel);
const MX=6.26,MZ=4.57;function mapPoint(x,z){return [(x+46)*MX,(40-z)*MZ]}
function worldMapSVG(big=false){const p=mapPoint(px,pz);return `<svg viewBox="0 0 576 420" role="img" aria-label="전체 6개 구역 지도. 노란 화살표가 현재 위치와 바라보는 방향입니다."><rect width="576" height="420" rx="20" fill="#c1e0e4"/><text x="550" y="25" text-anchor="end" fill="#407279" font-size="18">↑ N</text>${bridges.map(b=>{let a=mapPoint(...b.a),c=mapPoint(...b.b);return `<path d="M${a[0]} ${a[1]}L${c[0]} ${c[1]}" stroke="#eddbb3" stroke-width="22"/>`}).join('')}${centers.map(([x,z],i)=>{let a=mapPoint(x,z+1);const shape=roomShapes[i],fill=i<=state.stage?colors[i]:'#a9b7b2',stroke=i===state.stage?'#456c4c':'#ecf5e7';let body;if(shape.shape==='circle'){const c=mapPoint(shape.x,shape.z);body=`<ellipse cx="${c[0]}" cy="${c[1]}" rx="${shape.r*MX}" ry="${shape.r*MZ}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`}else body=`<rect x="${a[0]-67.6}" y="${a[1]-79}" width="135" height="158" rx="19" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;return body+`<text x="${a[0]}" y="${a[1]-56}" text-anchor="middle" fill="#254e40" font-size="${big?13:20}">${big?D.stages[i].name:i+1}</text>${D.stages[i].nodes.map(n=>{let b=mapPoint(n.x,n.z);return `<circle cx="${b[0]}" cy="${b[1]}" r="${big?6:5}" fill="${state.done.includes(n.id)?'#edf7d7':'#fff8e6'}" stroke="#557656" stroke-width="2"/>`}).join('')}${i>state.stage?`<text x="${a[0]}" y="${a[1]+22}" text-anchor="middle" fill="#4e6560" font-size="17">잠김</text>`:''}`}).join('')}<g transform="translate(${p[0]},${p[1]}) rotate(${yaw*180/Math.PI})"><circle r="15" fill="#fff" opacity=".8"/><path d="M0 -20L12 12L0 6L-12 12Z" fill="#f3a92e" stroke="#674d25" stroke-width="3"/></g>${big?`<text x="${p[0]+17}" y="${p[1]-12}" fill="#543f22" font-size="14" font-weight="bold">나</text>`:''}</svg>`}
map=function(){let s=D.stages[state.stage];modal('전체 탐험 지도',`<div id="full-world-map">${worldMapSVG(true)}</div><p class="map-legend">▲ 노란 화살표: 나의 위치·방향　○ 조사 지점　회색: 아직 열리지 않은 구역</p><p class="note">학습용 가상 공간의 전체 지도입니다. 실제 독도의 지형·방위·거리와 다릅니다.</p><div class="world-zone-buttons">${D.stages.map((v,i)=>`<button data-zone="${i}" ${i>state.stage&&!freeRoam?'disabled':''}>${i+1}. ${v.name}${i<state.stage?' · 다시 방문':i===state.stage?' · 현재 임무로 돌아가기':''}</button>`).join('')}</div><p class="note">이전 방은 다시 관찰할 수 있어. 탐험을 계속하려면 ‘현재 임무로 돌아가기’를 눌러 줘.</p><h3>현재 임무의 조사 지점</h3><div class="node-map">${s.nodes.map(n=>`<button data-nav="${n.id}">${state.done.includes(n.id)?'✓ ':''}${n.name}</button>`).join('')}<button data-nav="gate">출구 잠금장치</button></div>`,[['지도를 접기',closeModal]]);activity.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{const c=centers[+b.dataset.zone];px=c[0];pz=c[1]+roomShapes[+b.dataset.zone].spawn;yaw=0;camSnap=true;closeModal()});activity.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{const c=centers[state.stage],n=b.dataset.nav==='gate'?{x:c[0],z:c[1]+roomShapes[state.stage].door-.3}:s.nodes.find(n=>n.id===b.dataset.nav);px=n.x;pz=n.z-1.6;yaw=0;camSnap=true;closeModal()});};$('#map-button').onclick=map;navPanel.onclick=map;
function zoneAt(x,z){return centers.reduce((best,c,i)=>Math.hypot(x-c[0],z-c[1])<Math.hypot(x-centers[best][0],z-centers[best][1])?i:best,0)}
function inBridge(x,z,b){const dx=b.b[0]-b.a[0],dz=b.b[1]-b.a[1],len=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-b.a[0])*dx+(z-b.a[1])*dz)/len));return Math.hypot(x-b.a[0]-t*dx,z-b.a[1]-t*dz)<1.35}
// Hidden test cheat: typing "dokdo" while exploring toggles free roaming across every zone, unseals all 6 doors, unlocks all items and quests.
let freeRoam=false,cheatBuffer='';
addEventListener('keydown',e=>{if(!active||activity.open||photoAlbum.open||e.key.length!==1)return;cheatBuffer=(cheatBuffer+e.key.toLowerCase()).slice(-5);if(cheatBuffer!=='dokdo')return;cheatBuffer='';freeRoam=!freeRoam;if(freeRoam){state.seals=[0,1,2,3,4,5];state.bag=Array.from(new Set([...state.bag,...Object.keys(D.items)]));state.done=Array.from(new Set([...state.done,...D.stages.flatMap(s=>s.nodes.map(n=>n.id))]));state.notes=Array.from(new Set([...(state.notes||[]),...['지형 관찰 기록','괭이갈매기 수첩','바다 생물 표','대한제국 칙령 카드','독도 수호 일지','생태 보전 서약']]));state.met=Array.from(new Set([...(state.met||[]),...D.npcs.flat().filter(Boolean).map(n=>'npc-'+n.id)]));buildStations();refresh();save();tone();toast('치트 발동 · 모든 구역 이동 & 모든 퀘스트·아이템·비밀문 봉인 해제!');}else{toast('테스트 모드 해제');}});
canWalk=function(x,z){return (freeRoam||centers.some((c,i)=>{if(i>state.stage)return false;const s=roomShapes[i];return s.shape==='circle'?Math.hypot(x-s.x,z-s.z)<s.r-.75:Math.abs(x-s.x)<s.hw&&z>s.z+s.zMin&&z<s.z+s.zMax}))&&!worldSolids.some(c=>x>c.x-.22&&x<c.x+c.w+.22&&z>c.z-.22&&z<c.z+c.d+.22)&&!worldArcs.some(a=>{if(Math.abs(Math.hypot(x-a.x,z-a.z)-a.r)>.35)return false;const t=(Math.atan2(x-a.x,z-a.z)-a.from+Math.PI*4)%(Math.PI*2);return t<(a.to-a.from+Math.PI*4)%(Math.PI*2)})};
function talk(npc){const lines=npc.lines[choice.grade]||npc.lines['3'];const first=!(state.met||[]).includes(npc.id);if(first){state={...state,met:[...(state.met||[]),npc.id]};save();}tone();modal(npc.name,`<p class="npc-role">${npc.role}</p>${lines.map(l=>`<p>${l}</p>`).join('')}<p class="tool-use">${npc.task}</p>${first?'<p class="note">탐험 수첩의 「만난 사람들」에 기록했어.</p>':''}`,[['고마워, 다녀올게!',closeModal]])}
const baseInteract=interact;interact=function(){if(active&&!activity.open&&nearest&&nearest.isNpc){talk(nearest);return}baseInteract()};$('.interact').onclick=interact;
const baseJournal=$('#journal-button').onclick;$('#journal-button').onclick=()=>{baseJournal();const met=(state.met||[]).map(id=>D.npcs.flat().find(n=>n&&'npc-'+n.id===id)).filter(Boolean);if(met.length)activity.querySelector('.activity-body').insertAdjacentHTML('beforeend',`<h3>만난 사람들</h3><p>${met.map(n=>n.name).join(' · ')}</p>`)};
buildStations=function(){escapeDoors.forEach(o=>{const opened=(state.seals||[]).includes(o.index)||o.index<state.stage;o.left.position.x=o.cx-.76-(opened?1.45:0);o.right.position.x=o.cx+.76+(opened?1.45:0);o.light.material=mat(opened?'#80cf9b':'#e5b56c')});markerObjects.forEach(o=>{o.tag.material.opacity=o.n.chapter<=state.stage?1:.5;const done=state.done.includes(o.n.id);o.g.traverse(m=>{if(m.userData.trash)m.visible=!done;if(m.userData.needle)m.rotation.y=done?-T.MathUtils.degToRad(114):0})});flags.forEach(o=>o.flag.material=mat(o.index===state.stage&&D.gate(state)?'#ffd56b':'#aac0ae'))};
buildWorld=function(){const c=centers[state.stage];px=c[0];pz=c[1]+roomShapes[state.stage].spawn;yaw=0;pitch=-.04;camSnap=true;buildStations();if(playerKind!==choice.character){scene3d.remove(player3d);player3d=makeAvatar(choice.character);scene3d.add(player3d);playerKind=choice.character}};
function resize3d(){renderer3d.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.fov=cam.aspect<1?85:58;cam.updateProjectionMatrix()}resize=resize3d;addEventListener('resize',resize3d);resize3d();
let lastMapTime=0,playerY=0,lean=0,camSnap=true;const camFocus=new T.Vector3();
loop=function(t){if(!active)return;const dt=Math.min((t-last)/1000||0,.045);last=t;let moving=false,running=false;if(!activity.open&&!photoAlbum.open){const fw=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),norm=Math.hypot(fw,side)||1;moving=!!(fw||side);yaw-=((keys.has('r')?1:0)-(keys.has('q')?1:0))*dt*1.4;running=keys.has('shift')||runToggle;const speed=running?6.2:3.5;let nx=px+(Math.sin(yaw)*fw-Math.cos(yaw)*side)/norm*dt*speed,nz=pz+(Math.cos(yaw)*fw+Math.sin(yaw)*side)/norm*dt*speed;if(canWalk(nx,pz))px=nx;if(canWalk(px,nz))pz=nz;}
const dx=px-previousX,dz=pz-previousZ;
if(mode===1||cameraLocked)avatarYaw=yaw;
else if(moving&&Math.hypot(dx,dz)>.0001&&Math.hypot(dx,dz)<1){const target=Math.atan2(dx,dz);avatarYaw+=Math.atan2(Math.sin(target-avatarYaw),Math.cos(target-avatarYaw))*Math.min(1,dt*14)}
previousX=px;previousZ=pz;
// Sprint: faster stride, wider swing, a forward lean and a step bounce synced to the stride.
running=running&&moving;const stride=running?.015:.009,bob=moving?Math.abs(Math.sin(t*stride))*(running?.08:.02):0;lean+=((running?.1:0)-lean)*Math.min(1,dt*8);
playerY+=(floorY(px,pz)-playerY)*Math.min(1,dt*9);player3d.position.set(px,playerY+bob,pz);player3d.rotation.set(lean,avatarYaw,0,'YXZ');player3d.visible=mode!==1;player3d.userData.legs.forEach((a,i)=>a.rotation.x=moving?Math.sin(t*stride+i*Math.PI)*(running?.75:.45):0);player3d.userData.arms.forEach((a,i)=>a.rotation.x=moving?-Math.sin(t*stride+i*Math.PI)*(running?.55:.32):0);
// Third-person camera orbits a damped pivot: rotation and zoom respond at once, while the pivot eases after the character.
const dir=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw));orbitDistance+=(orbitTarget-orbitDistance)*Math.min(1,dt*10);const focus=new T.Vector3(px,(mode===3?.9:1.55)+playerY,pz);if(camSnap||mode===1){camFocus.copy(focus);camSnap=false}else camFocus.lerp(focus,1-Math.exp(-dt*8));
if(mode===1){cam.position.set(px,2.12+playerY+bob*.5,pz);cam.lookAt(px+dir.x*6,2.12+playerY+Math.tan(pitch)*6,pz+dir.z*6)}else if(mode===2){const elevation=.28-pitch,horizontal=orbitDistance*Math.cos(elevation);cam.position.set(camFocus.x-dir.x*horizontal,camFocus.y+orbitDistance*Math.sin(elevation),camFocus.z-dir.z*horizontal);cam.lookAt(camFocus)}else{cam.position.set(camFocus.x-dir.x*5,camFocus.y+10.1,camFocus.z-dir.z*5);cam.lookAt(camFocus)}
if(mode!==1&&!freeRoam){const zone=zoneAt(px,pz),shape=roomShapes[zone],target=camFocus,offset=cam.position.clone().sub(target);let fraction=1;const bounds=shape.shape==='circle'?[['y',.45,30]]:[['x',shape.x-shape.hw-.25,shape.x+shape.hw+.25],['z',shape.z+shape.zMin-.25,shape.z+shape.zMax+.25],['y',.45,30]];for(const [axis,low,high] of bounds){if(offset[axis]>0)fraction=Math.min(fraction,(high-target[axis])/offset[axis]);else if(offset[axis]<0)fraction=Math.min(fraction,(low-target[axis])/offset[axis]);}if(shape.shape==='circle'){const tx=target.x-shape.x,tz=target.z-shape.z,rr=shape.r-.45,a=offset.x*offset.x+offset.z*offset.z,b=2*(tx*offset.x+tz*offset.z),c=tx*tx+tz*tz-rr*rr,disc=b*b-4*a*c;if(a>1e-6&&disc>=0){const t=(-b+Math.sqrt(disc))/(2*a);if(t>=0)fraction=Math.min(fraction,t)}}cam.position.copy(target).addScaledVector(offset,Math.max(.03,fraction));cam.lookAt(target);player3d.visible=cam.position.distanceTo(target)>1.15;}
hands.visible=mode===1;if(selected!==heldId){heldId=selected;heldPlane.visible=!!selected;if(selected){heldPlane.material.map=tex(ItemIcons[selected]);heldPlane.material.needsUpdate=true}}heldPlane.visible=!!selected;
const c=centers[state.stage],all=[...D.stages.slice(0,state.stage+1).flatMap(s=>s.nodes),{id:'gate',name:state.stage===5?'수호 메시지 장치':'출구 잠금장치',x:c[0],z:c[1]+roomShapes[state.stage].door-.3},...npcObjects.filter(o=>o.npc.chapter<=state.stage||freeRoam).map(o=>o.npc)];nearest=null;let dist=2.9;for(const n of all){let d=Math.hypot(n.x-px,n.z-pz);if(d<dist){nearest=n;dist=d}}
$('.interact').hidden=!nearest||activity.open||photoAlbum.open;$('.interact').textContent=nearest?`E · ${nearest.id==='gate'?'출구 잠금장치 조사':nearest.isNpc?(nearest.prompt||'이야기 듣기'):state.done.includes(nearest.id)?'다시 관찰하기':nearest.use?(selected===nearest.use?D.items[nearest.use][1]+' 사용하기':D.items[nearest.use][1]+' 꺼내는 방법'):'조사하기'}`:'';$('#target').textContent=nearest&&!activity.open?nearest.name:'';$('#heading').textContent=`${['북 N','동 E','남 S','서 W'][((Math.round(yaw/(Math.PI/2))%4)+4)%4]} · ${D.stages[zoneAt(px,pz)].name}`;
markerObjects.forEach(o=>{const d=Math.hypot(o.n.x-px,o.n.z-pz),same=o.n.chapter===zoneAt(px,pz);o.g.visible=same&&d<24;o.tag.visible=same&&d<12;});
npcObjects.forEach(o=>{const d=Math.hypot(o.npc.x-px,o.npc.z-pz),same=o.npc.chapter===zoneAt(px,pz);o.g.visible=same&&d<26;o.tag.visible=same&&d<12;if(!same)return;const want=d<8&&!o.npc.fixed?Math.atan2(px-o.npc.x,pz-o.npc.z):o.rest;o.g.rotation.y+=Math.atan2(Math.sin(want-o.g.rotation.y),Math.cos(want-o.g.rotation.y))*Math.min(1,dt*3);o.g.userData.animate(t*.001)});
if(t-lastMapTime>120){navPanel.innerHTML=worldMapSVG()+'<span>전체 지도 · 현재 위치 ▲</span>';const full=$('#full-world-map');if(full)full.innerHTML=worldMapSVG(true);lastMapTime=t}renderer3d.render(scene3d,cam);frame=requestAnimationFrame(loop)};
$('.game-tip').firstChild.textContent='WASD 이동 · Shift 달리기 · 우클릭 드래그 회전 · 휠 확대·축소 · M 지도';
canvas3d.setAttribute('aria-label','독도 3D 탐험. 방향키 이동, 우클릭 드래그로 자유 회전, 휠로 확대 축소. 1 일인칭, 2 자유 시점, 3 위에서 보기.');
const cameraHelp=itemHow;itemHow=function(){cameraHelp();activity.querySelector('.activity-body').insertAdjacentHTML('afterbegin','<p><b>자유 시점 조작</b><br>오른쪽 마우스 버튼을 누르고 드래그하면 캐릭터 앞·옆·뒤를 360도로 둘러볼 수 있어. 휠을 굴리면 부드럽게 확대·축소되고, 아주 가까이 가면 일인칭으로 바뀌어. Q/R로도 회전할 수 있어. CapsLock이나 방향 고정 버튼은 캐릭터를 카메라 방향에 맞춰 줘. 고정 중에도 화면을 회전할 수 있어. Shift를 누르며 이동하면 달려(터치 화면은 ‘Shift · 달리기’ 버튼). M으로 지도를 열고 닫아. 터치 화면에서는 손가락으로 드래그해 봐.<br>1 일인칭 · 2 자유 시점 · 3 위에서 보기. 캐릭터는 걷는 방향을 바라봐.</p>')};$('#help-game').onclick=itemHow;
$('footer span:last-child').textContent='독도 수호대 · 방탈출 v1.0';
if(active){cancelAnimationFrame(frame);buildWorld();last=performance.now();frame=requestAnimationFrame(loop)}
window.dokdo3DReady=true;
document.querySelector('#engine-status').textContent='✓ 3D 버전 적용됨 · 1 / 2 / 3 시점 전환';
// The selection portraits use the same models as the playable characters.
function paintPortraits(){if(active)return;const ps=new T.Scene();ps.background=new T.Color('#e4eedb');ps.add(new T.HemisphereLight('#ffffff','#8eaa7d',3));const light=new T.DirectionalLight('#fff0d1',3);light.position.set(-3,6,5);ps.add(light);const pc=new T.PerspectiveCamera(36,400/460,.1,30);pc.position.set(3,2.6,6);pc.lookAt(0,1.5,0);renderer3d.setSize(400,460,false);for(const id of ['sani','nari']){const model=makeAvatar(id);ps.add(model);renderer3d.render(ps,pc);const target=document.getElementById(id),g=target.getContext('2d');g.clearRect(0,0,target.width,target.height);g.drawImage(canvas3d,0,0,target.width,target.height);target.parentElement.dataset.portraitReady="true";ps.remove(model)}resize3d();}
emblem.onload=paintPortraits;T.DefaultLoadingManager.onLoad=paintPortraits;paintPortraits();
// A still frame of the actual 3D world replaces the old block-art backdrop.
function paintBackdrop(){if(active||!innerWidth||!innerHeight)return;const bc=new T.PerspectiveCamera(53,innerWidth/innerHeight,.1,240);bc.position.set(-58,30,-78);bc.lookAt(-9,0,-15);renderer3d.render(scene3d,bc);world.width=innerWidth;world.height=innerHeight;ctx.drawImage(canvas3d,0,0,world.width,world.height);}
const portraitsOnly=paintPortraits;T.DefaultLoadingManager.onLoad=()=>{portraitsOnly();paintBackdrop()};paintBackdrop();addEventListener('resize',paintBackdrop);
}




