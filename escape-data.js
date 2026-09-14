/* A separate save slot keeps the earlier open-world expedition intact. */
const EscapeRooms=[
 {name:'잠긴 탐사 준비실',subtitle:'첫 번째 문 · 독도에 도착하기',goal:'수첩·지도·쌍안경을 찾고 출항 준비판을 해결해. 출구의 위치 잠금장치를 열면 바깥 관측실로 갈 수 있어.',lock:'위치 잠금장치',prompt:'독도가 있는 바다 → 독도의 큰 두 섬 순서로 단서를 넣어 줘.',cards:[['동해','map'],['동도와 서도','land'],['서해','sea']],answer:[0,1],visual:'map'},
 {name:'바다 전망 관측실',subtitle:'두 번째 문 · 진짜 독도를 알아보기',goal:'쌍안경과 실제 사진으로 동도·서도를 구별해. 지형 단서를 모아 사진 잠금장치를 해제하자.',lock:'사진 잠금장치',prompt:'동도 사진 → 서도 사진 순서로 넣어 줘. 선착장과 봉우리 모습을 살펴봐.',cards:[['사진 A','east'],['사진 B','west']],answer:[0,1],visual:'islands'},
 {name:'생태 연구실',subtitle:'세 번째 문 · 생물의 삶터 지키기',goal:'새와 해조숲의 삶터를 조사해. 관찰 기록을 연결해 생태 보호실의 문을 열자.',lock:'삶터 연결 장치',prompt:'바닷새가 쉬는 곳 → 해조숲이 자라는 곳 순서로 삶터를 연결해 줘.',cards:[['바닷속','sea'],['바위섬','land'],['모래사막','map']],answer:[1,0],visual:'sea'},
 {name:'봉인된 역사 기록실',subtitle:'네 번째 문 · 기록으로 독도 알리기',goal:'1900년 기록과 오늘의 활동 기록을 조사해. 출처와 시간을 확인하면 기록실의 봉인을 풀 수 있어.',lock:'시간 순서 잠금장치',prompt:'먼저 있었던 기록 → 나중의 활동 순서로 연결해 줘.',cards:[['오늘날의 활동','today'],['1900년 칙령','archive']],answer:[1,0],visual:'history'},
 {name:'해안 보호 작전실',subtitle:'다섯 번째 문 · 보호 행동 선택하기',goal:'보호 장갑으로 포장지를 정리하고 생태 기록으로 보전 계획을 세워. 올바른 보호 행동이 마지막 문을 열어.',lock:'보전 행동 잠금장치',prompt:'사람이 버린 포장지 → 자연석에 각각 알맞은 행동을 골라 줘.',cards:[['제자리에 두기','land'],['되가져오기','gloves'],['생물에게 먹이 주기','bird']],answer:[1,0],visual:'care'},
 {name:'독도 수호 통신실',subtitle:'마지막 임무 · 우리의 보호 계획',goal:'지형·역사·보전 기록을 통신 장치에 연결해. 세 가지 증거를 모아 독도 수호 메시지를 완성하자.',lock:'수호 메시지 전송 장치',prompt:'독도의 모습 → 역사적 기록 → 앞으로의 보호 실천 순서로 증거를 연결해 줘.',cards:[['보전 약속','care'],['지형 기록','land'],['1900년 기록','archive']],answer:[1,2,0],visual:'final'}
];
EscapeRooms.forEach((r,i)=>Object.assign(DokdoData.stages[i],{name:r.name,subtitle:r.subtitle,goal:r.goal}));
const escapeNodes=Object.fromEntries(DokdoData.stages.flatMap(s=>s.nodes.map(n=>[n.id,n])));
escapeNodes.welcome.name='괭이갈매기 길잡이 · 독이';
escapeNodes.welcome.text='모덕초등학교 독도 수호대에 온 걸 환영해! 이곳은 독도를 지키는 방법을 배우는 가상 체험 기지야. 여섯 방의 잠금을 풀려면 위치·자연·역사를 관찰하고, 근거를 모아야 해. 마지막 통신실에서 우리의 독도 보호 계획을 완성하자. 먼저 수첩을 받아 줘.';
escapeNodes.depart.name='출항 경로 해독판';escapeNodes.route.name='항로 단서 조합대';escapeNodes.landscape.name='지형 암호 해독대';escapeNodes.habitat.name='생태 단서 연결대';escapeNodes.timeline.name='역사 기록 해독대';escapeNodes.care.name='해안 보호 계획판';
escapeNodes.welcome.text='안녕! 나는 괭이갈매기를 본떠 만든 독도 길잡이 독이야. '+escapeNodes.welcome.text;
escapeNodes.displayLand.name='지형 증거 연결 장치';escapeNodes.displayHistory.name='역사 증거 연결 장치';escapeNodes.displayCare.name='보전 약속 연결 장치';
escapeNodes.displayLand.text='실제 사진에서 확인한 동도·서도와 주변 바위섬의 특징을 수호 메시지에 연결했어.';escapeNodes.displayHistory.text='1900년 기록의 시기와 뜻을 확인하고 역사 증거를 연결했어. 출처가 있는 기록으로 독도를 알려 보자.';escapeNodes.displayCare.text='생물과 거리를 두고 관찰하기, 쓰레기 되가져오기, 정해진 길 이용하기를 보호 계획에 연결했어.';
