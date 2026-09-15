import * as T from './vendor/three.module.js';

// Room guides built from primitives in the same soft style as the student mascots.
// Every figure stands on y=0 and faces +Z; world3d.js turns it toward the player.
const materials=new Map();
function material(color,roughness=.7,extra){const key=color+roughness+(extra?JSON.stringify(extra):'');if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,...extra}));return materials.get(key)}
function build(root){
 const put=(geo,color,x,y,z,parent=root)=>{const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 const oval=(x,y,z,rx,ry,rz,color,parent=root)=>{const m=put(new T.SphereGeometry(1,28,20),color,x,y,z,parent);m.scale.set(rx,ry,rz);return m};
 const capsule=(x,y,z,r,length,color,parent=root)=>put(new T.CapsuleGeometry(r,length,8,20),color,x,y,z,parent);
 const cyl=(x,y,z,r,h,color,parent=root,top=r)=>put(new T.CylinderGeometry(top,r,h,28),color,x,y,z,parent);
 const box=(x,y,z,w,h,d,color,parent=root)=>put(new T.BoxGeometry(w,h,d),color,x,y,z,parent);
 return {root,put,oval,capsule,cyl,box};
}
// Shared human body: legs, torso, arms, head with eyes. Returns the parts accessories attach to.
function humanoid(h,{skin='#f5c7a5',pants='#3f5470',shirt='#dfe6ea',shoes='#3b3f4a',sleeve=shirt}){
 const {oval,capsule}=h;
 for(const x of [-.2,.2]){capsule(x,.5,0,.15,.42,pants);oval(x,.1,.08,.19,.1,.3,shoes)}
 const torso=capsule(0,1.32,0,.37,.5,shirt);torso.scale.z=.78;
 const arms=[];for(const x of [-.5,.5]){const arm=new T.Group();arm.position.set(x,1.6,0);arm.rotation.z=x<0?-.16:.16;h.root.add(arm);capsule(0,-.26,0,.12,.34,sleeve,arm);oval(0,-.56,.02,.12,.13,.11,skin,arm);arms.push(arm)}
 capsule(0,1.8,0,.12,.1,skin);
 const head=oval(0,2.15,0,.42,.44,.4,skin);
 for(const x of [-.15,.15]){oval(x,2.2,.36,.06,.075,.03,'#2a2420');oval(x+.02,2.22,.385,.02,.028,.01,'#ffffff')}
 oval(0,2.0,.39,.07,.03,.02,'#b5705c');
 return {arms,head};
}
export function createNpc(kind){
 const root=new T.Group();root.name=kind;const h=build(root),{put,oval,capsule,cyl,box}=h;
 let animate=()=>{};
 if(kind==='keeper'){
  // Lighthouse keeper: white jacket, navy trousers, peaked cap and a lantern.
  const {arms}=humanoid(h,{pants:'#2f4360',shirt:'#f4f1e8',shoes:'#2b2f3a',skin:'#f0c4a0'});
  cyl(0,2.53,0,.4,.2,'#f4f1e8');cyl(0,2.45,0,.415,.07,'#243447');box(0,2.42,.42,.5,.05,.28,'#243447');put(new T.SphereGeometry(.05,12,8),'#e8c766',0,2.55,.4);
  oval(0,2.03,.4,.16,.05,.05,'#8b8a86');
  const lantern=new T.Group();lantern.position.set(0,-.62,.1);arms[1].add(lantern);cyl(0,.12,0,.08,.05,'#3b3b3b',lantern);cyl(0,-.16,0,.08,.05,'#3b3b3b',lantern);put(new T.BoxGeometry(.13,.24,.13),material('#ffd27a',.4,{emissive:'#ffb347',emissiveIntensity:.9,transparent:true,opacity:.85}),0,-.02,0,lantern);cyl(0,.17,0,.02,.07,'#3b3b3b',lantern);
  animate=t=>{lantern.rotation.z=Math.sin(t*1.4)*.12};
 }else if(kind==='researcher'){
  // Field ecologist: teal shirt, khaki vest, wide-brim hat, binoculars and a notebook.
  const {arms}=humanoid(h,{pants:'#8a7a5a',shirt:'#3f8f8a',sleeve:'#3f8f8a',shoes:'#5a4a36',skin:'#f3c9a8'});
  const vest=capsule(0,1.3,0,.395,.3,'#c9b37a');vest.scale.z=.8;
  cyl(0,2.5,0,.56,.04,'#b99a62');cyl(0,2.62,0,.34,.24,'#b99a62');cyl(0,2.53,0,.35,.06,'#6d5a3a');
  oval(0,2.05,-.34,.2,.32,.16,'#3a2a22');oval(0,1.6,-.36,.11,.4,.11,'#3a2a22');
  for(const x of [-.09,.09]){const lens=cyl(x,1.5,.4,.06,.18,'#333333');lens.rotation.x=Math.PI/2}
  box(0,-.62,.14,.2,.26,.04,'#f2e6c8',arms[0]);box(0,-.62,.165,.18,.24,.005,'#7fa3c2',arms[0]);
  animate=t=>{arms[0].rotation.x=-.5+Math.sin(t*1.2)*.05};
 }else if(kind==='anyongbok'){
  // An Yong-bok: Joseon fisherman in white hanbok, straw hat, straw sandals and an oar.
  const {arms}=humanoid(h,{pants:'#efe7d3',shirt:'#f1ead8',sleeve:'#f1ead8',shoes:'#c8a76a',skin:'#e6b98f'});
  box(0,1.2,.31,.12,.5,.03,'#4b6a8a');box(0,1.02,.0,.78,.1,.62,'#8a6a44');
  oval(0,1.96,.35,.19,.13,.1,'#3a2c22');
  put(new T.ConeGeometry(.78,.42,32),'#c9a86a',0,2.63,0);cyl(0,2.42,0,.3,.06,'#8f7343');
  const oar=new T.Group();oar.position.set(.05,-.55,.05);oar.rotation.z=.18;arms[1].add(oar);cyl(0,.35,0,.035,2.3,'#8a6a44',oar);box(0,-.95,0,.14,.55,.05,'#7a5a38',oar);
  animate=t=>{root.position.y=Math.abs(Math.sin(t*1.1))*.02};
 }else if(kind==='sealion'){
  // Gangchi, the Dokdo sea lion, resting on a rock with its head raised.
  const rock=put(new T.DodecahedronGeometry(.95,0),'#6f7d78',0,.32,0);rock.scale.set(1.35,.55,1.05);
  const body=new T.Group();body.position.set(0,.6,0);root.add(body);
  oval(0,.42,-.15,.46,.4,.8,'#7b6a55',body);oval(0,.72,.38,.36,.52,.38,'#7b6a55',body);
  const head=new T.Group();head.position.set(0,1.18,.45);body.add(head);
  oval(0,0,0,.3,.28,.3,'#8a7a62',head);oval(0,-.06,.25,.17,.13,.17,'#a89478',head);put(new T.SphereGeometry(.06,12,8),'#2a2420',0,0,.42,head);
  for(const x of [-.13,.13]){oval(x,.08,.23,.065,.07,.04,'#221d1a',head);oval(x+.02,.1,.265,.022,.025,.01,'#ffffff',head)}
  for(const side of [-1,1])for(const k of [0,1]){const w=cyl(side*.2,-.04-k*.05,.3,.005,.3,'#e8e0d0',head);w.rotation.z=side*(1.25+k*.2);w.rotation.y=side*.3}
  for(const x of [-.5,.5]){const f=oval(x,.2,.2,.13,.05,.36,'#6d5c48',body);f.rotation.y=x<0?.45:-.45}
  for(const x of [-.12,.12])oval(x,.14,-.9,.14,.05,.3,'#6d5c48',body);
  animate=t=>{head.rotation.x=Math.sin(t*1.3)*.08;head.rotation.z=Math.sin(t*.7)*.06;body.scale.y=1+Math.sin(t*2)*.012};
 }else if(kind==='guard'){
  // Dokdo guard: navy uniform, cap with badge and a radio; the sapsal dog stands beside.
  const {arms}=humanoid(h,{pants:'#2b3a4d',shirt:'#33475f',sleeve:'#33475f',shoes:'#22262e',skin:'#f2c6a2'});
  box(0,1.62,.3,.36,.1,.06,'#9fc3dd');cyl(0,2.53,0,.4,.2,'#2f4360');box(0,2.42,.42,.5,.05,.28,'#1d2735');put(new T.SphereGeometry(.05,12,8),'#e8c766',0,2.56,.4);
  const radio=new T.Group();radio.position.set(0,-.62,.12);arms[0].add(radio);box(0,0,0,.1,.22,.06,'#222a33',radio);cyl(0,.2,-.01,.01,.18,'#222a33',radio);
  const dog=new T.Group();dog.position.set(1.25,0,.45);dog.rotation.y=-.35;root.add(dog);
  const fur='#cfb890',tuft='#dcc9a4';
  oval(0,.55,0,.42,.38,.6,fur,dog);for(let k=0;k<12;k++){const a=k/12*Math.PI*2;oval(Math.sin(a)*.36,.5+Math.cos(a*1.7)*.22,Math.cos(a)*.48,.12,.1,.12,tuft,dog)}
  const dogHead=new T.Group();dogHead.position.set(0,.92,.55);dog.add(dogHead);
  oval(0,0,0,.3,.28,.3,fur,dogHead);oval(0,.1,.2,.31,.14,.16,tuft,dogHead);oval(0,-.06,.28,.15,.12,.14,fur,dogHead);put(new T.SphereGeometry(.06,12,8),'#2a2420',0,-.04,.42,dogHead);
  for(const x of [-.3,.3])oval(x,-.02,-.02,.1,.24,.1,tuft,dogHead);
  for(const x of [-.2,.2])for(const z of [-.3,.32])capsule(x,.22,z,.08,.22,fur,dog);
  const tail=oval(0,.78,-.62,.1,.1,.3,tuft,dog);tail.rotation.x=-.6;
  animate=t=>{tail.rotation.z=Math.sin(t*9)*.5;dogHead.rotation.y=Math.sin(t*.9)*.25;radio.rotation.x=Math.sin(t*1.5)*.06};
 }else if(kind==='isabu'){
  // Stone statue of General Isabu on a plinth: monochrome, helmet, cape and a sword.
  const stone='#9aa39d',dark='#7f8984';
  box(0,.25,0,1.4,.5,1.4,dark);box(0,.55,0,1.1,.1,1.1,stone);
  const fig=new T.Group();fig.position.y=.6;root.add(fig);const g=build(fig);
  const {arms}=humanoid(g,{skin:stone,pants:stone,shirt:stone,sleeve:stone,shoes:dark});
  g.box(0,1.35,-.35,.9,1.1,.12,dark);g.oval(0,2.4,0,.45,.36,.42,stone);g.cyl(0,2.72,0,.05,.35,stone);g.oval(0,2.9,-.05,.06,.14,.2,dark);
  g.cyl(0,-.45,.05,.03,1.1,dark,arms[1]);g.box(0,.03,.05,.22,.05,.05,dark,arms[1]);
  fig.traverse(m=>{if(m.isMesh&&m.material!==material(dark))m.material=material(stone,.95)});
 }
 root.userData.animate=animate;
 return root;
}
