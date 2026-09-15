(function () {
  'use strict';
  const A = {
    ordinance41: {
      title:'대한제국 칙령 제41호', meta:'1900년 · 관보 제1716호',
      image:'assets/archive/ordinance-41-gazette.jpg', alt:'대한제국 칙령 제41호가 실린 관보 원본',
      credit:'서울대학교 규장각한국학연구원 소장 관보 원본',
      phrase:'石島', reading:'석도', tip:'울도군수가 관할하도록 정한 섬. 이 기록의 석도는 독도를 가리킵니다.',
      modern:'제2조: 군청은 태하동에 두고, 관할 구역은 울릉도 전체와 죽도, 석도로 한다.',
      explain:'대한제국은 1900년 칙령 제41호로 울릉도를 울도군으로 바꾸고 울도군수의 관할 구역에 석도를 적었습니다. 국가가 법령과 관보로 독도를 행정적으로 관리했음을 보여 주는 1차 사료입니다.',
      sources:[['국사편찬위원회 사료·해설','https://contents.history.go.kr/front/hm/view.do?levelId=hm_122_0020'],['서울대학교 규장각 원문','https://kyudb.snu.ac.kr/pf01/rendererImg.do?item_cd=MGO&book_cd=GK17289_00&vol_no=0062&page_no=071a']],
      hot:[38,55]
    },
    samguk512: {
      title:'『삼국사기』 우산국 기록', meta:'512년 · 신라본기 지증왕 13년',
      image:'assets/archive/samguk-sagi-isabu.jpg', alt:'삼국사기 지증왕 13년 우산국 기사 원본',
      credit:'국사편찬위원회 한국고대사료DB 정덕본 원문',
      phrase:'于山國', reading:'우산국', tip:'울릉도와 그 주변 섬들을 아우르던 나라 이름입니다.',
      modern:'지증왕 13년(512) 여름 6월, 우산국이 신라에 복속하여 해마다 토산물을 바쳤다. 이사부는 나무로 만든 사자를 배에 나누어 싣고 꾀를 써서 우산국을 복속시켰다.',
      explain:'『삼국사기』는 512년 이사부가 우산국을 신라에 복속시킨 일을 전합니다. 독도만 따로 적은 문장은 아니며, 울릉도와 주변 섬으로 이루어진 우산국이 우리 역사에 편입된 사실을 보여 주는 기록입니다.',
      sources:[['국사편찬위원회 원문·번역','https://db.history.go.kr/id/sg_004r_0020_0180'],['국사편찬위원회 사료 해설','https://contents.history.go.kr/id/hm_011_0030']],
      hot:[25,46]
    },
    anyongbok1696: {
      title:'『숙종실록』 안용복 진술', meta:'1696년 · 숙종 22년 9월 25일',
      image:'assets/archive/sukjong-anyongbok.jpg', alt:'숙종실록 안용복 진술 기사 태백산사고본 원본',
      credit:'국사편찬위원회 조선왕조실록 태백산사고본 53장 뒷면',
      phrase:'鬱陵 · 子山', reading:'울릉 · 자산', tip:'울릉도와 자산도. 안용복은 자산도도 우리나라 땅이라고 진술했습니다.',
      modern:'안용복은 “울릉도는 본래 우리 경계이며, 송도는 자산도인데 그것도 우리나라 땅이다”라고 말하고 일본 배를 꾸짖었다고 진술했습니다.',
      explain:'이 기사는 조선 정부가 조사해 남긴 안용복의 진술입니다. 일본 막부가 1696년 내린 문서는 일본인의 울릉도 도해를 금지한 문서이므로, 현재의 독도를 직접 조선 영토라고 판정한 문서로 과장하지 않고 두 사료의 성격을 구분해 읽어야 합니다.',
      sources:[['국사편찬위원회 조선왕조실록','https://sillok.history.go.kr/id/ksa_12209025_002'],['외교부: 일본 도해금지령 자료','https://dokdo.mofa.go.kr/kor/dokdo/reason.jsp']],
      hot:[43,58]
    }
  };
  const alias={decree1900:'ordinance41',isabu512:'samguk512',anyongbok:'anyongbok1696',ordinance:'ordinance41',samguk:'samguk512'};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current='ordinance41', dialog;
  function sources(d){return d.sources.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener noreferrer">${escape(s[0])} ↗</a>`).join('')}
  function build(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='archive-viewer';dialog.className='archive-viewer';
    dialog.innerHTML=`<div class="archive-shell"><header><div><span class="archive-kicker">모덕초 독도 수호대 · 1차 사료실</span><h2 id="archive-title"></h2><p id="archive-meta"></p></div><button class="archive-close" type="button" aria-label="사료 뷰어 닫기">×</button></header><nav class="archive-picker" aria-label="사료 선택"></nav><div class="archive-content"><div class="archive-tabs" role="tablist"><button role="tab" aria-selected="true" data-panel="original">원본 사료 보기</button><button role="tab" aria-selected="false" data-panel="modern">현대어 풀이</button><button role="tab" aria-selected="false" data-panel="commentary">국사편찬위원회 해설</button></div><section class="archive-panel" id="archive-panel"></section></div></div>`;
    document.body.append(dialog);
    dialog.querySelector('.archive-close').onclick=close;
    dialog.onclick=e=>{if(e.target===dialog)close()};
    dialog.oncancel=e=>{e.preventDefault();close()};
    dialog.querySelectorAll('[role=tab]').forEach(b=>b.onclick=()=>panel(b.dataset.panel));
    const nav=dialog.querySelector('.archive-picker');
    Object.entries(A).forEach(([id,d],i)=>{const b=document.createElement('button');b.type='button';b.dataset.archive=id;b.textContent=`${i+1}. ${d.title}`;b.onclick=()=>{current=id;header();panel('original')};nav.append(b)});
  }
  function header(){const d=A[current];dialog.querySelector('#archive-title').textContent=d.title;dialog.querySelector('#archive-meta').textContent=d.meta;dialog.querySelectorAll('[data-archive]').forEach(b=>b.setAttribute('aria-current',b.dataset.archive===current?'true':'false'))}
  function panel(name){
    const d=A[current], host=dialog.querySelector('#archive-panel');
    dialog.querySelectorAll('[role=tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.panel===name)));
    if(name==='original'){
      host.innerHTML=`<p class="archive-help">마우스나 손가락을 원본 위에서 움직이면 2배 돋보기가 따라옵니다. 표시된 한자를 올리거나 눌러 뜻을 확인하세요.</p><figure class="archive-page"><div class="archive-image-stage"><img src="${d.image}" alt="${escape(d.alt)}" draggable="false"><div class="archive-loupe" aria-hidden="true"></div><button class="archive-hotspot" type="button" style="left:${d.hot[0]}%;top:${d.hot[1]}%"><b>${d.phrase}</b><span><strong>${d.reading}</strong><br>${d.tip}</span></button></div><figcaption>${d.credit}</figcaption></figure><div class="archive-sources">${sources(d)}</div>`;loupe(host);
    }else if(name==='modern')host.innerHTML=`<article class="archive-reading"><span class="archive-label">쉬운 현대어</span><blockquote>${d.modern}</blockquote><div class="archive-word"><b>${d.phrase}</b><span>${d.reading} · ${d.tip}</span></div></article><div class="archive-sources">${sources(d)}</div>`;
    else host.innerHTML=`<article class="archive-reading"><span class="archive-label">사료 읽기 도움</span><p>${d.explain}</p><p class="archive-caution">원본·번역·해설을 함께 비교해 사료가 말하는 범위와 뒤에 붙은 해석을 구분해 보세요.</p></article><div class="archive-sources">${sources(d)}</div>`;
  }
  function loupe(scope){const stage=scope.querySelector('.archive-image-stage'),img=stage.querySelector('img'),lens=stage.querySelector('.archive-loupe');const move=e=>{const r=img.getBoundingClientRect(),x=Math.max(0,Math.min(r.width,e.clientX-r.left)),y=Math.max(0,Math.min(r.height,e.clientY-r.top));lens.style.left=x+'px';lens.style.top=y+'px';lens.style.backgroundImage=`url("${img.currentSrc||img.src}")`;lens.style.backgroundSize=`${r.width*2}px ${r.height*2}px`;lens.style.backgroundPosition=`${-x*2+80}px ${-y*2+80}px`;lens.dataset.show='true'};stage.onpointerenter=move;stage.onpointermove=move;stage.onpointerdown=e=>{stage.setPointerCapture?.(e.pointerId);move(e)};['pointerleave','pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,()=>delete lens.dataset.show))}
  function open(id){build();current=A[id]?id:(alias[id]||'ordinance41');header();panel('original');if(!dialog.open)dialog.showModal();dialog.querySelector('.archive-close').focus()}
  function close(){if(dialog?.open)dialog.close()}
  window.DokdoArchives=A;window.openArchiveViewer=open;window.closeArchiveViewer=close;
  function wire(){if(typeof window.modal!=='function'||window.modal.__archiveWrapped)return;const old=window.modal;function wrapped(title,body,actions){old(title,body,actions);const map={'고대·조선 기록 보관함':['samguk512','anyongbok1696'],'대한제국 칙령 보관함':['ordinance41'],'역사 기록 해독대':['samguk512','anyongbok1696','ordinance41'],'세 시대 역사 기록 해독대':['samguk512','anyongbok1696','ordinance41'],'역사 증거 연결 장치':['samguk512','anyongbok1696','ordinance41'],'역사와 관리 연결 장치':['samguk512','anyongbok1696','ordinance41']},ids=map[title],host=document.querySelector('#activity .activity-body');if(!ids||!host||host.querySelector('.archive-launchers'))return;const box=document.createElement('div');box.className='archive-launchers';box.innerHTML='<strong>🔎 1차 사료 원본 조사</strong>';ids.forEach(id=>{const b=document.createElement('button');b.type='button';b.textContent=A[id].title;b.onclick=()=>open(id);box.append(b)});host.append(box)}wrapped.__archiveWrapped=true;window.modal=wrapped}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
