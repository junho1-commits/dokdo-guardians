import * as T from './vendor/three.module.js';

// Smooth, articulated geometry following the school's original mascot silhouettes.
const materials=new Map();
function material(color,roughness=.68){const key=color+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness}));return materials.get(key)}
export function createMascot(kind,crestTexture){
 const root=new T.Group();root.name=kind==='nari'?'나리':'산이';const girl=kind==='nari',skin='#f5c7a5',hair=girl?'#984831':'#64402d',shirt=girl?'#eea0b6':'#b6cf7d';
 function put(geo,color,x,y,z,parent=root){const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function oval(x,y,z,rx,ry,rz,color,parent=root){const m=put(new T.SphereGeometry(1,32,24),color,x,y,z,parent);m.scale.set(rx,ry,rz);return m}
 function stroke(points,color,r=.012,parent=root){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return put(new T.TubeGeometry(curve,24,r,8,false),color,0,0,0,parent)}
 function capsule(x,y,z,r,length,color,parent=root){return put(new T.CapsuleGeometry(r,length,8,24),color,x,y,z,parent)}
 function softShape(shape,depth,color,x,y,z){const geo=new T.ExtrudeGeometry(shape,{steps:1,depth,bevelEnabled:true,bevelSegments:6,bevelSize:.06,bevelThickness:.065,curveSegments:32});geo.translate(0,0,-depth/2);return put(geo,color,x,y,z)}
 const legs=[],arms=[];
 for(const x of [-.215,.215]){const leg=new T.Group();leg.position.set(x,.91,0);root.add(leg);capsule(0,-.34,0,.168,.43,'#477fae',leg);oval(0,-.74,.09,.205,.11,.32,'#f4e9d6',leg);oval(0,-.685,.08,.2,.13,.30,'#373951',leg);stroke([[-.12,-.6,.20],[0,-.58,.23],[.12,-.6,.20]],'#7a8198',.012,leg);legs.push(leg)}
 // Lathed tunic: softly rounded hem, shoulders and waist, elliptical cross-section.
 const profile=[new T.Vector2(0,0),new T.Vector2(.32,0),new T.Vector2(girl?.45:.39,.035),new T.Vector2(girl?.46:.40,.10),new T.Vector2(.36,.69),new T.Vector2(.29,.79),new T.Vector2(.17,.81),new T.Vector2(0,.81)];
 const torso=put(new T.LatheGeometry(profile,48),shirt,0,.90,0);torso.scale.z=.70;
 capsule(0,1.76,0,.135,.13,skin);
 for(const x of [-.43,.43]){const arm=new T.Group();arm.position.set(x,1.61,0);arm.rotation.z=x<0?-.18:.18;root.add(arm);capsule(0,-.25,0,.145,.31,girl?'#f6dc92':shirt,arm);oval(0,-.58,.015,.143,.163,.13,skin,arm);oval(x<0?.105:-.105,-.57,.085,.065,.085,.065,skin,arm);arms.push(arm)}
 // Rear head/hair volume and soft peach face. Face points toward +Z.
 oval(0,2.28,-.09,.575,.61,.48,hair);
 oval(0,2.22,.115,.535,.535,.455,skin);
 // Features follow the face ellipsoid instead of hovering on a flat plane.
 const faceZ=(x,y)=>.115+.455*Math.sqrt(Math.max(0,1-(x/.535)**2-((y-2.22)/.535)**2));
 const faceStroke=(points,color,r)=>stroke(points.map(([x,y])=>[x,y,faceZ(x,y)+r*.45]),color,r);
 for(const x of [-.53,.53]){oval(x,2.19,.09,.14,.18,.115,skin);oval(x,2.19,.187,.075,.115,.025,'#e8aa8a')}
 for(const x of [-.205,.205]){
  oval(x,2.30,.528,.122,.151,.045,'#fff9ef');
  oval(x+.015,2.295,.569,.079,.112,.033,material('#613b26',.24));
  oval(x+.02,2.295,.595,.048,.081,.016,material('#251d19',.20));
  oval(x-.007,2.343,.61,.026,.032,.010,'#ffffff');
  oval(x+.044,2.263,.612,.011,.015,.007,'#fff4dc');
  faceStroke([[x-.105,2.43],[x,2.465],[x+.09,2.435]],hair,.017);
  const cheek=oval(x*1.54,2.09,faceZ(x*1.54,2.09)+.003,.075,.035,.009,new T.MeshBasicMaterial({color:'#eda29a',transparent:true,opacity:.65}));
  cheek.rotation.y=Math.sign(x)*.54;
 }
 oval(0,2.16,faceZ(0,2.16)-.012,.054,.052,.045,'#efb593');
 faceStroke([[-.118,2.055],[-.075,2.03],[-.025,2.017],[.025,2.019],[.068,2.034],[.105,2.052]],'#894b37',.012);
 // Sculpted overlapping fringe locks instead of rectangular hair tiles.
 // A continuous crown joins the locks, hiding gaps when seen from above.
 oval(0,2.635,.235,.475,.225,.285,hair);
 for(let i=0;i<5;i++){const x=(i-2)*.18;const lock=oval(x,2.62+(Math.abs(i-2)*-.025),.40,.13,.215+(i%2)*.025,.13,hair);lock.rotation.z=(i-2)*.17;}
 if(girl){
  for(const side of [-1,1]){for(let j=0;j<5;j++){const x=side*(.48+.035*Math.sin(j*1.9)),y=1.99-j*.14;const braid=oval(x,y,-.015,.115,.135,.125,hair);braid.rotation.z=side*(j%2?.48:-.35)}const tie=put(new T.TorusGeometry(.099,.034,10,24),'#f4c34f',side*.5,1.40,0);tie.rotation.x=Math.PI/2;oval(side*.51,1.27,0,.08,.15,.09,hair);}
  // Pointed curved petals radiate behind the head, with a raised central vein.
  for(let j=0;j<7;j++){const a=(j-3)*.80,px=Math.sin(a)*.50,py=2.32+Math.cos(a)*.48;const sh=new T.Shape();sh.moveTo(0,0);sh.bezierCurveTo(-.24,.17,-.18,.43,0,.69);sh.bezierCurveTo(.18,.43,.24,.17,0,0);const petal=softShape(sh,.105,j%2?'#f6ce54':'#f7d967',px,py,-.29);petal.rotation.z=-a;const vein=stroke([[0,.10,.075],[0,.32,.085],[0,.55,.075]],'#dfae40',.011,petal);}
 }else{
  // Mountain hood surrounds the entire face; it is not a small cone hat.
  const hood=new T.Shape();hood.moveTo(-.84,1.79);hood.bezierCurveTo(-1.04,1.85,-.88,2.20,-.73,2.43);hood.bezierCurveTo(-.52,2.79,-.40,3.33,0,3.36);hood.bezierCurveTo(.40,3.33,.52,2.79,.73,2.43);hood.bezierCurveTo(.88,2.20,1.04,1.85,.84,1.79);hood.quadraticCurveTo(0,1.62,-.84,1.79);softShape(hood,.68,'#3d956c',0,0,-.26);
  const snow=new T.Shape();snow.moveTo(-.34,3.03);snow.quadraticCurveTo(-.13,3.43,0,3.40);snow.quadraticCurveTo(.13,3.43,.34,3.03);snow.quadraticCurveTo(.29,2.92,.20,3.03);snow.lineTo(.10,3.12);snow.quadraticCurveTo(.02,2.93,-.04,3.03);snow.lineTo(-.13,3.12);snow.quadraticCurveTo(-.27,2.90,-.34,3.03);softShape(snow,.025,'#fffbed',0,0,.17);
  softShape(snow,.025,'#fffbed',0,0,-.60);
 }
 if(crestTexture){
  // Subdivide the patch before projecting every vertex onto the lathed tunic.
  // A triangle fan would leave its interior flat and clip through the shirt.
  const radiusAt=y=>{for(let i=1;i<profile.length;i++){const a=profile[i-1],b=profile[i];if(b.y>a.y&&y>=a.y&&y<=b.y)return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y)}return .36};
  const positions=[],uvs=[],indices=[],rings=12,segments=64,badgeRadius=.205;
  for(let ring=0;ring<=rings;ring++)for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,r=badgeRadius*ring/rings,x=Math.cos(angle)*r,y=Math.sin(angle)*r,bodyRadius=radiusAt(1.32+y-.90);
   positions.push(x,1.32+y,.70*Math.sqrt(Math.max(0,bodyRadius*bodyRadius-x*x))+.006);uvs.push(.5+x/(badgeRadius*2),.5+y/(badgeRadius*2));
  }
  for(let ring=0;ring<rings;ring++)for(let i=0;i<segments;i++){const a=ring*(segments+1)+i,b=a+segments+1;indices.push(a,b,b+1,a,b+1,a+1)}
  const patch=new T.BufferGeometry();patch.setAttribute('position',new T.Float32BufferAttribute(positions,3));patch.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));patch.setIndex(indices);patch.computeVertexNormals();
  const badge=put(patch,new T.MeshBasicMaterial({map:crestTexture,side:T.FrontSide}),0,0,0);badge.name='모덕초등학교 교표';
 }
 root.userData={arms,legs,mascotVersion:4};return root;
}
