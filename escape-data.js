/* A separate save slot keeps the earlier open-world expedition intact. */
const EscapeRooms=[
 {name:'잠긴 탐사 준비실',subtitle:'첫 번째 문 · 대한민국 최동단 독도로',goal:'주소·방향·거리를 확인하고 지도와 쌍안경을 찾아 출항 준비를 마쳐 줘.',lock:'위치 잠금장치',prompt:'독도가 있는 바다 → 독도의 큰 두 섬 순서로 단서를 넣어 줘.',cards:[['동해','map'],['동도와 서도','land'],['서해','sea']],answer:[0,1],visual:'map'},
 {name:'화산섬 지형 관측실',subtitle:'두 번째 문 · 바다 위와 바다 아래 독도',goal:'동도·서도와 89개 부속도서, 해저 화산체, 동도 등대의 단서를 모아 줘.',lock:'지형 관찰 잠금장치',prompt:'실제 사진에서 동도 → 서도 순서로 골라 줘. 촬영 방향에 따라 좌우는 달라질 수 있어.',cards:[['동도 사진','east'],['서도 사진','west']],answer:[0,1],visual:'islands'},
 {name:'천연보호구역 생태실',subtitle:'세 번째 문 · 생물의 삶터 지키기',goal:'천연기념물 제336호의 바닷새와 조경수역의 해조숲을 조사해 삶터를 연결해 줘.',lock:'삶터 연결 장치',prompt:'바닷새의 번식지 → 해조숲이 자라는 곳 순서로 연결해 줘.',cards:[['바닷속','sea'],['바위섬','land'],['모래사막','map']],answer:[1,0],visual:'sea'},
 {name:'봉인된 역사 기록실',subtitle:'네 번째 문 · 세 시대의 기록',goal:'『삼국사기』, 안용복 관련 기록, 대한제국 관보의 내용을 확인하고 세 사건을 시간순으로 배열해 줘.',lock:'3단계 역사 시간 잠금장치',prompt:'가장 오래된 기록부터 배열해 줘: 신라 → 조선 → 대한제국.',cards:[['대한제국 칙령 제41호 · 1900년','today'],['신라 이사부 · 512년','isabu'],['조선 안용복 · 숙종 때','anyongbok']],answer:[1,2,0],visual:'history'},
 {name:'강치 기억·보전 작전실',subtitle:'다섯 번째 문 · 사라진 생명이 남긴 교훈',goal:'독도 강치의 역사를 기억하고 쓰레기와 자연물을 구별해 보호 행동을 선택해 줘.',lock:'보전 행동 잠금장치',prompt:'사람이 버린 포장지 → 독도의 자연석에 알맞은 행동을 차례로 골라 줘.',cards:[['제자리에 두기','land'],['되가져오기','gloves'],['생물에게 먹이 주기','bird']],answer:[1,0],visual:'care'},
 {name:'독도 수호 통신실',subtitle:'마지막 임무 · 평화로운 대한민국 생활 터전',goal:'경비대·등대·주민·주소·통신 기록을 확인하고 세 가지 증거로 수호 메시지를 완성해 줘.',lock:'수호 메시지 전송 장치',prompt:'독도의 모습 → 역사적 기록 → 앞으로의 보호 실천 순서로 증거를 연결해 줘.',cards:[['앞으로의 보호 실천','care'],['독도의 모습','land'],['역사적 기록','archive']],answer:[1,2,0],visual:'final'}
];
EscapeRooms.forEach((r,i)=>Object.assign(DokdoData.stages[i],{name:r.name,subtitle:r.subtitle,goal:r.goal}));
const escapeNodes=Object.fromEntries(DokdoData.stages.flatMap(s=>s.nodes.map(n=>[n.id,n])));
escapeNodes.welcome.name='괭이갈매기 길잡이 · 독이';
escapeNodes.welcome.text='모덕초등학교 독도 수호대에 온 걸 환영해! 이곳은 독도를 지키는 방법을 배우는 가상 체험 기지야. 여섯 방의 잠금을 풀려면 위치·자연·역사를 관찰하고, 근거를 모아야 해. 마지막 통신실에서 우리의 독도 보호 계획을 완성하자. 먼저 수첩을 받아 줘.';
escapeNodes.depart.name='출항 경로 해독판';escapeNodes.route.name='항로 단서 조합대';escapeNodes.landscape.name='지형 암호 해독대';escapeNodes.habitat.name='생태 단서 연결대';escapeNodes.timeline.name='역사 기록 해독대';escapeNodes.care.name='해안 보호 계획판';
escapeNodes.welcome.text='안녕! 나는 괭이갈매기 길잡이, 독이야. 모덕초등학교 독도 수호대에 온 걸 환영해! 여기는 독도를 지키는 방법을 배우는 가상 체험 기지야. 우리 함께 여섯 방의 비밀을 풀어 볼까? 독도의 모습과 자연, 역사를 살펴보고, 숨겨진 단서를 모아 줘. 마지막 통신실에서 우리의 독도 보호 계획을 완성하는 거야. 자, 먼저 탐험 수첩을 받아 줘!';
escapeNodes.displayLand.name='지형 증거 연결 장치';escapeNodes.displayHistory.name='역사 증거 연결 장치';escapeNodes.displayCare.name='보전 약속 연결 장치';
escapeNodes.displayLand.text='실제 사진과 지형 자료에서 확인한 동도·서도, 89개 부속도서와 해저 화산체의 특징을 연결했어.';escapeNodes.displayHistory.text='512년 이사부, 조선 숙종 때 안용복, 1900년 칙령 제41호를 시간순으로 확인해 역사 증거를 연결했어.';escapeNodes.displayCare.text='강치의 교훈을 기억하며 생물과 거리를 두기, 쓰레기 되가져오기, 자연석 제자리에 두기를 보호 계획에 연결했어.';
