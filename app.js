// Dependency-free block-art renderer. Original characters based on provided Sani/Nari references.
const $=s=>document.querySelector(s);let choice={character:'sani',grade:'1'};
try{const saved=JSON.parse(localStorage.getItem('modeok-dokdo-start'));if(saved&&['sani','nari'].includes(saved.character)&&['1','3','5'].includes(saved.grade))choice=saved;}catch{}
function sync(){document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.character===choice.character));document.querySelectorAll('[data-grade]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.grade===choice.grade));$('#selection').textContent=`${choice.character==='sani'?'산이':'나리'} · ${choice.grade}~${Number(choice.grade)+1}학년 · 준비 완료!`;try{localStorage.setItem('modeok-dokdo-start',JSON.stringify(choice));}catch{}}
document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{choice.character=b.dataset.character;sync()});document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{choice.grade=b.dataset.grade;sync()});sync();
$('#help').onclick=()=>$('#guide').showModal();$('#start').onclick=()=>{sync();$('#ready-title').textContent=`${choice.character==='sani'?'산이':'나리'}, 출항 준비 완료!`;$('#ready-text').textContent=`모덕초등학교 독도 탐험대 · ${choice.grade}~${Number(choice.grade)+1}학년 코스`;$('#ready').showModal()};document.querySelectorAll('dialog').forEach(d=>{d.querySelectorAll('.close,[data-close]').forEach(b=>b.onclick=()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
function shade(hex,k){const n=parseInt(hex.slice(1),16);return `rgb(${Math.min(255,(n>>16)*k)},${Math.min(255,((n>>8)&255)*k)},${Math.min(255,(n&255)*k)})`}
function poly(ctx,pts,c){ctx.fillStyle=c;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill()}
function box(ctx,x,y,w,h,d,c){poly(ctx,[[x,y],[x+d,y-d*.48],[x+w+d,y-d*.48],[x+w,y]],shade(c,1.13));poly(ctx,[[x+w,y],[x+w+d,y-d*.48],[x+w+d,y+h-d*.48],[x+w,y+h]],shade(c,.72));ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function avatar(id){const ctx=document.getElementById(id).getContext('2d');ctx.clearRect(0,0,400,460);ctx.save();ctx.translate(45,12);const girl=id==='nari';poly(ctx,[[38,406],[157,428],[286,399],[170,373]],'#b2bc96');box(ctx,56,393,185,17,27,'#81945b');box(ctx,56,384,185,10,27,'#adc877');
// boots and legs
box(ctx,100,301,43,77,24,'#3884af');box(ctx,166,301,43,77,24,'#3884af');box(ctx,92,366,51,25,28,'#34334c');box(ctx,161,366,51,25,28,'#34334c');
const shirt=girl?'#e78fac':'#bdd885',sleeve=girl?'#f7dd87':shirt;box(ctx,87,211,128,101,27,shirt);box(ctx,54,214,31,79,24,sleeve);box(ctx,220,210,30,79,24,sleeve);box(ctx,54,290,31,28,24,'#f1c49e');box(ctx,220,286,30,28,24,'#f1c49e');
if(!girl){for(let i=0;i<7;i++)box(ctx,43+i*15,181-i*24,221-i*30,27,27,i>4?'#eef5df':'#368962');}else{[[51,133,31,37],[28,88,57,26],[43,76,35,12],[79,41,31,47],[128,13,29,70],[136,3,13,10],[181,41,31,47],[217,88,56,26],[223,76,34,12],[219,133,31,37]].forEach(([x,y,w,h])=>box(ctx,x,y,w,h,14,'#f3cc45'));}
box(ctx,91,107,119,103,32,'#f5c9a6');const hair=girl?'#994839':'#604333';box(ctx,87,91,126,29,34,hair);[[87,113,22,33],[114,114,25,15],[172,113,18,22],[200,112,13,35]].forEach(a=>box(ctx,...a,5,hair));
if(girl){for(let i=0;i<4;i++){box(ctx,73+(i%2)*5,175+i*25,25,26,16,hair);box(ctx,219-(i%2)*5,169+i*25,25,26,16,hair)}ctx.fillStyle='#edbd45';ctx.fillRect(79,257,22,7);ctx.fillRect(214,250,22,7)}
ctx.fillStyle='#382f2c';ctx.fillRect(116,150,10,13);ctx.fillRect(175,150,10,13);ctx.fillRect(139,179,30,4);ctx.fillRect(134,174,5,5);ctx.fillRect(169,174,5,5);ctx.fillStyle='#e7a28c';ctx.fillRect(103,168,20,7);ctx.fillRect(180,168,20,7);box(ctx,129,237,45,44,3,'#fff8dd');ctx.fillStyle='#367450';ctx.fillRect(134,263,35,13);ctx.fillStyle='#e9c343';ctx.fillRect(145,240,13,12);ctx.fillStyle='#304a3b';ctx.font='bold 15px Malgun Gothic';ctx.fillText('모덕',135,265);ctx.restore()}
avatar('sani');avatar('nari');
const world=$('#world'),ctx=world.getContext('2d');
function render(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);world.width=w*dpr;world.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#9bcdd4');g.addColorStop(.56,'#d3e9da');g.addColorStop(.57,'#6db7be');g.addColorStop(1,'#287f96');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
const sx=w/1440,sy=h/900;ctx.save();ctx.scale(sx,sy);ctx.fillStyle='#fff8d1';ctx.fillRect(696,100,72,72);ctx.fillStyle='#fff8d140';ctx.fillRect(685,89,94,94);
[[70,100,140],[410,65,145],[860,150,170],[1160,66,120]].forEach(([x,y,l])=>{ctx.fillStyle='#f7fbebc9';ctx.fillRect(x,y,l,20);ctx.fillRect(x+30,y-18,l*.5,20);ctx.fillStyle='#e6f2e4';ctx.fillRect(x+10,y+20,l-28,7)});
for(let i=0;i<75;i++){let x=(i*193)%1440,y=524+(i*71)%374;ctx.fillStyle=i%3?'#e0f4db28':'#e8f9e45c';ctx.fillRect(x,y,18+(i*13)%92,2+(y-520)/80)}
// Stacked isometric basalt columns; scene is an illustrative island landscape.
function island(cx,cy,rx,rz,height,seed){let blocks=[];for(let z=-rz;z<=rz;z++)for(let x=-rx;x<=rx;x++){let v=1-(x*x/(rx*rx)+z*z/(rz*rz));if(v>0){let n=Math.sin(x*13+z*47+seed)*.5+.5;let ht=Math.max(1,Math.round(v*height+n*2));blocks.push({x,z,ht,n})}}blocks.sort((a,b)=>a.x+a.z-b.x-b.z);for(const b of blocks){let px=cx+(b.x-b.z)*17,py=cy+(b.x+b.z)*8;let ht=b.ht*21;poly(ctx,[[px,py-ht],[px+17,py+8-ht],[px+17,py+8],[px,py]],b.n>.5?'#697e71':'#7b8876');poly(ctx,[[px+17,py+8-ht],[px+34,py-ht],[px+34,py],[px+17,py+8]],'#536d67');poly(ctx,[[px,py-ht],[px+17,py-8-ht],[px+34,py-ht],[px+17,py+8-ht]],b.ht>height*.55?'#91aa65':'#a1a58a');if(b.ht>2){ctx.fillStyle='#334f4725';ctx.fillRect(px+3,py-ht+18,11,3)}}}
island(525,675,5,4,9,3);island(785,696,5,3,6,8);island(658,717,2,2,2,5);island(898,739,2,2,2,1);
// Lighthouse silhouette on the lower island.
box(ctx,785,531,19,68,13,'#f6f3d8');box(ctx,781,523,27,12,15,'#577b70');box(ctx,785,506,19,17,13,'#ecf2ce');box(ctx,782,500,25,6,14,'#d46d51');
// Near shore and timber embarkation dock.
poly(ctx,[[0,793],[158,750],[330,824],[405,900],[0,900]],'#6e8e60');poly(ctx,[[0,817],[159,775],[310,846],[332,900],[0,900]],'#859a69');poly(ctx,[[290,900],[557,753],[624,769],[449,900]],'#756952');for(let i=0;i<14;i++){let y=782+i*10;let x=557-(y-753)*1.8;poly(ctx,[[x,y],[x+82+(y-780)*.3,y+16],[x+96+(y-780)*.3,y+9],[x+13,y-7]],i%2?'#b6a179':'#c2ad83')}
[[417,845],[537,779]].forEach(([x,y])=>box(ctx,x,y,10,52,8,'#655e48'));
// Pixel gulls.
[[620,291],[706,324],[560,334]].forEach(([x,y])=>{ctx.fillStyle='#faffec';ctx.fillRect(x,y,14,4);ctx.fillRect(x+14,y+4,8,4);ctx.fillRect(x+22,y,14,4)});ctx.restore()}
addEventListener('resize',render);render();
