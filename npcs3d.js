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
  // An Yong-bok (Joseon, King Sukjong's reign): white cotton jeogori and baji under a navy kwaeja vest,
  // a waist sash, ankle ties, straw sandals, a wide satgat and a proper wooden oar with blade and grip.
  const {arms}=humanoid(h,{pants:'#efe7d3',shirt:'#f1ead8',sleeve:'#f1ead8',shoes:'#c8a76a',skin:'#e6b98f'});
  const kwaeja=capsule(0,1.3,0,.395,.42,'#23395d');kwaeja.scale.z=.8;box(0,1.3,.32,.16,.62,.03,'#f1ead8');
  // Otgoreum: two ribbon strips and a knot at the chest.
  box(-.03,1.14,.34,.05,.42,.015,'#4b6a8a').rotation.z=.08;box(.05,1.1,.34,.05,.36,.015,'#4b6a8a').rotation.z=-.1;oval(.02,1.36,.345,.05,.035,.02,'#4b6a8a');
  // Jeondae sash with a side knot.
  box(0,1.0,0,.8,.12,.64,'#8a6a44');oval(.42,.97,.08,.07,.05,.05,'#8a6a44');box(.45,.86,.1,.04,.18,.02,'#8a6a44');
  // Daenim ankle ties and straw sandal straps.
  for(const x of [-.2,.2]){cyl(x,.24,0,.165,.05,'#4b6a8a');box(x,.16,.13,.2,.02,.05,'#a8843f');box(x,.14,.02,.05,.02,.2,'#a8843f')}
  // Hair, beard and a satgat with a raised crown and chin cord.
  oval(0,2.38,-.02,.4,.2,.38,'#2a1f18');oval(0,1.96,.35,.19,.13,.1,'#3a2c22');
  put(new T.ConeGeometry(.9,.36,40),'#c9a86a',0,2.6,0);put(new T.ConeGeometry(.42,.32,32),'#b8965a',0,2.86,0);cyl(0,2.42,0,.34,.06,'#8f7343');
  for(const x of [-.3,.3]){const cord=cyl(x*.9,2.2,.2,.008,.5,'#3a2c22');cord.rotation.z=x<0?-.35:.35;cord.rotation.x=.25}
  // Oar: grip bar, shaft with a wrapped band, and a tapered blade.
  const oar=new T.Group();oar.position.set(.05,-.55,.05);oar.rotation.z=.18;arms[1].add(oar);
  cyl(0,.35,0,.035,2.3,'#8a6a44',oar);cyl(0,1.5,0,.03,.24,'#6f5232',oar).rotation.x=Math.PI/2;cyl(0,.05,0,.045,.14,'#3a2c22',oar);
  box(0,-1.0,0,.17,.68,.045,'#7a5a38',oar);box(0,-1.4,0,.12,.16,.035,'#6f5232',oar);
  animate=t=>{root.position.y=Math.abs(Math.sin(t*1.1))*.02};
 }else if(kind==='sealion'){
  // Gangchi, the Dokdo sea lion: glossy dark-brown hide, rounded muzzle with white whiskers,
  // streamlined fore and hind flippers, small ear flaps; rests on a rock and sways toward the sea.
  const hide=material('#4a3a2c',.35),hideLight=material('#5a4635',.35),muzzle=material('#7d6b57',.4);
  const rock=put(new T.DodecahedronGeometry(.95,0),'#6f7d78',0,.32,0);rock.scale.set(1.35,.55,1.05);
  const body=new T.Group();body.position.set(0,.6,0);root.add(body);
  oval(0,.42,-.15,.46,.4,.8,hide,body);oval(0,.72,.38,.36,.52,.38,hide,body);oval(0,.3,-.7,.3,.26,.4,hide,body);
  const head=new T.Group();head.position.set(0,1.18,.45);body.add(head);
  oval(0,0,0,.3,.28,.3,hideLight,head);oval(0,-.06,.25,.17,.13,.17,muzzle,head);oval(0,-.14,.27,.15,.06,.13,muzzle,head);put(new T.SphereGeometry(.06,12,8),'#1e1815',0,0,.42,head);
  for(const x of [-.13,.13]){oval(x,.08,.23,.065,.07,.04,'#221d1a',head);oval(x+.02,.1,.265,.022,.025,.01,'#ffffff',head);oval(x*1.9,.08,-.05,.05,.07,.03,hideLight,head)}
  for(const side of [-1,1])for(const k of [0,1,2]){const w=cyl(side*.17,-.02-k*.04,.34,.004,.34,'#f2ece0',head);w.rotation.z=side*(1.15+k*.22);w.rotation.y=side*.35}
  for(const x of [-.5,.5]){const f=oval(x,.2,.2,.13,.05,.38,'#3f3126',body);f.rotation.y=x<0?.45:-.45;f.rotation.z=x<0?.25:-.25;const tip=oval(x*1.35,.1,.5,.09,.035,.2,'#3f3126',body);tip.rotation.y=x<0?.7:-.7}
  for(const x of [-.14,.14]){const r=oval(x,.14,-.95,.12,.045,.32,'#3f3126',body);r.rotation.y=x<0?.35:-.35}
  animate=t=>{head.rotation.x=Math.sin(t*1.3)*.08;head.rotation.z=Math.sin(t*.7)*.09;head.rotation.y=Math.sin(t*.45)*.2;body.rotation.y=Math.sin(t*.45)*.06;body.scale.y=1+Math.sin(t*2)*.012};
 }else if(kind==='guard'){
  // Dokdo Guard officer: dark navy maritime duty uniform with chest pockets and belt buckle,
  // Taegeukgi patch on the left sleeve and police eagle emblem on the right, cap with badge, radio with antenna.
  const {arms}=humanoid(h,{pants:'#1b2433',shirt:'#1f2a3a',sleeve:'#1f2a3a',shoes:'#22262e',skin:'#f2c6a2'});
  box(0,1.62,.3,.36,.1,.06,'#8fb3d1');
  for(const x of [-.16,.16]){box(x,1.42,.315,.16,.15,.03,'#233042');box(x,1.5,.325,.17,.04,.03,'#2c3b50');put(new T.SphereGeometry(.013,8,6),'#c9b26a',x,1.48,.345)}
  box(0,1.02,0,.78,.1,.62,'#111418');box(0,1.02,.32,.12,.09,.03,'#c9b26a');
  cyl(0,2.53,0,.4,.2,'#1f2a3a');cyl(0,2.45,0,.415,.06,'#c9b26a');box(0,2.42,.42,.5,.05,.28,'#0f151d');put(new T.SphereGeometry(.05,12,8),'#e8c766',0,2.56,.4);
  // Left sleeve: Taegeukgi (red over blue on white). Right sleeve: round gold eagle emblem.
  box(-.125,-.18,0,.02,.11,.15,'#f4f4f4',arms[0]);oval(-.135,-.16,0,.006,.03,.045,'#c62f3b',arms[0]);oval(-.135,-.2,0,.006,.03,.045,'#2456a4',arms[0]);
  cyl(.125,-.18,0,.06,.012,'#c9a24a',arms[1]).rotation.z=Math.PI/2;cyl(.132,-.18,0,.035,.012,'#1f2a3a',arms[1]).rotation.z=Math.PI/2;
  const radio=new T.Group();radio.position.set(0,-.62,.12);arms[0].add(radio);box(0,0,0,.1,.22,.06,'#222a33',radio);box(0,.03,.031,.07,.08,.005,'#0d1116',radio);put(new T.SphereGeometry(.008,8,6),'#ff5a4a',.03,.09,.032,radio);cyl(0,.2,-.01,.008,.2,'#111418',radio);put(new T.SphereGeometry(.012,8,6),'#111418',0,.3,-.01,radio);
  // Sapsal dog (Natural Monument No. 368): shaggy tufted coat, bangs over the eyes, curled tail over the back.
  const dog=new T.Group();dog.position.set(1.25,0,.45);dog.rotation.y=-.35;root.add(dog);
  const fur='#c9a96e',tuft='#d9bd86',tuftDark='#b8965a';
  oval(0,.55,0,.42,.38,.6,fur,dog);for(let k=0;k<18;k++){const a=k/18*Math.PI*2;oval(Math.sin(a)*.36,.5+Math.cos(a*1.7)*.22,Math.cos(a)*.48,.13,.1,.13,k%3?tuft:tuftDark,dog)}
  const dogHead=new T.Group();dogHead.position.set(0,.92,.55);dog.add(dogHead);
  oval(0,0,0,.3,.28,.3,fur,dogHead);
  for(const x of [-.12,.12])oval(x,.02,.26,.04,.04,.02,'#221d1a',dogHead);
  oval(0,.12,.2,.32,.15,.17,tuft,dogHead);for(const x of [-.18,-.06,.06,.18])oval(x,.03,.29,.06,.11,.05,tuft,dogHead);
  for(const x of [-.27,.27])oval(x,-.06,.12,.12,.16,.12,tuftDark,dogHead);
  oval(0,-.08,.3,.15,.12,.14,fur,dogHead);put(new T.SphereGeometry(.06,12,8),'#2a2420',0,-.06,.43,dogHead);
  for(const x of [-.3,.3])oval(x,-.02,-.02,.11,.25,.11,tuftDark,dogHead);
  for(const x of [-.2,.2])for(const z of [-.3,.32]){capsule(x,.22,z,.09,.22,fur,dog);oval(x,.3,z,.12,.09,.13,tuft,dog)}
  const tail=new T.Group();tail.position.set(0,.8,-.5);dog.add(tail);const curl=put(new T.TorusGeometry(.2,.07,10,24,Math.PI*1.3),tuft,0,.12,0,tail);curl.rotation.y=Math.PI/2;curl.rotation.z=-.4;oval(0,.05,.02,.09,.09,.09,tuftDark,tail);
  animate=t=>{tail.rotation.z=Math.sin(t*8)*.35;dogHead.rotation.y=Math.sin(t*.9)*.25;dogHead.rotation.z=Math.sin(t*1.7)*.05;radio.rotation.x=Math.sin(t*1.5)*.06};
 }else if(kind==='isabu'){
  // Stone statue of General Isabu (Silla, 512): lamellar cuirass, layered pauldrons, plumed helmet,
  // ring-pommel sword at the hip, and beside the plinth the wooden lion from the Samguk Sagi episode.
  const stone='#9aa39d',dark='#7f8984';
  box(0,.25,0,1.4,.5,1.4,dark);box(0,.55,0,1.1,.1,1.1,stone);
  const fig=new T.Group();fig.position.y=.6;root.add(fig);const g=build(fig);
  const {arms}=humanoid(g,{skin:stone,pants:stone,shirt:stone,sleeve:stone,shoes:dark});
  for(let row=0;row<4;row++)for(let col=-2;col<=2;col++)g.box(col*.13,1.06+row*.15,.31-row*.003,.115,.11,.035,row%2?dark:stone);
  for(const x of [-.5,.5]){g.oval(x,1.74,0,.24,.11,.26,dark);g.oval(x*1.1,1.64,0,.2,.08,.22,stone)}
  g.box(0,1.35,-.35,.9,1.1,.12,dark);g.box(0,1.0,0,.82,.1,.64,dark);
  g.oval(0,2.4,0,.45,.36,.42,stone);g.cyl(0,2.22,0,.47,.06,dark);g.cyl(0,2.75,0,.04,.32,stone);for(let k=0;k<3;k++)g.oval(0,2.98+k*.1,-.08-k*.05,.05,.14,.12,dark);
  const sword=new T.Group();sword.position.set(-.42,1.0,.05);sword.rotation.z=.3;fig.add(sword);g.cyl(0,-.4,0,.035,.95,dark,sword);g.cyl(0,.15,0,.03,.22,stone,sword);g.box(0,.03,0,.2,.04,.06,dark,sword);g.put(new T.TorusGeometry(.06,.014,8,20),stone,0,.32,0,sword);
  // Wooden lion (moku-sa-ja): the tale says Isabu frightened Usanguk with carved lions.
  const lion=new T.Group();lion.position.set(1.15,0,.35);lion.rotation.y=-.5;root.add(lion);const L=build(lion);
  const wood='#9c7b55',mane='#6f5232';
  L.box(0,.08,0,.9,.16,.6,'#7a8380');L.oval(0,.42,-.05,.26,.2,.38,wood);
  const lionHead=new T.Group();lionHead.position.set(0,.6,.32);lion.add(lionHead);
  L.oval(0,0,0,.2,.19,.2,wood,lionHead);for(let k=0;k<12;k++){const a=k/12*Math.PI*2;L.oval(Math.cos(a)*.22,Math.sin(a)*.22,-.04,.09,.09,.06,mane,lionHead)}
  L.oval(0,-.05,.17,.11,.08,.1,wood,lionHead);L.box(0,-.1,.22,.12,.05,.05,'#2a1f18',lionHead);for(const x of [-.08,.08])L.oval(x,.05,.17,.035,.035,.02,'#2a1f18',lionHead);
  for(const x of [-.14,.14])for(const z of [-.2,.18])L.cyl(x,.25,z,.05,.34,wood);
  L.cyl(0,.5,-.4,.03,.3,mane).rotation.x=.8;L.oval(0,.62,-.52,.06,.06,.06,mane);
  fig.traverse(m=>{if(m.isMesh&&m.material!==material(dark))m.material=material(stone,.95)});
 }
 root.userData.animate=animate;
 return root;
}
