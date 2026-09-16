/* Clean audio player for Dokdo Guardians character dialogues and gate hints.
   Plays pre-recorded high-quality audio clips with BGM ducking, with zero UI clutter. */
(()=>{
  const AUDIO_BASE = new URL('assets/audio/', document.currentScript.src).href;
  let currentAudio = null;
  let serial = 0;

  function stop() {
    serial++;
    if (currentAudio) {
      currentAudio.onended = currentAudio.onerror = currentAudio.onpause = null;
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
      currentAudio = null;
    }
    if (window.BGM) window.BGM.unduck();
  }

  async function playClip(filename) {
    stop();
    const id = ++serial;
    const audio = currentAudio = new Audio(AUDIO_BASE + filename);
    const finish = () => {
      if (id !== serial) return;
      if (window.BGM) window.BGM.unduck();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.onpause = finish;
    if (window.BGM) window.BGM.duck();
    try {
      await audio.play();
    } catch (e) {
      finish();
    }
  }

  // 활동 타이틀에 따라 적절한 음성 클립 반환 (모든 음성에 Microsoft Edge Neural 보이스 적용)
  function resolveClip(title) {
    if (!title) return null;
    const nodes = typeof escapeNodes !== 'undefined' ? escapeNodes : {};
    const g = (typeof choice !== 'undefined' && choice.grade) ? choice.grade : '1';
    const gradeSuffix = g === '5' ? 'grade5' : (g === '3' ? 'grade3' : 'grade1');

    // --- 인트로 & 게임 시작 ---
    if (title.includes('탐험을 시작하자!')) {
      const char = (typeof choice !== 'undefined' && choice.character) ? choice.character : 'sani';
      const file = char === 'nari' ? 'intro-nari.mp3' : 'intro-sani.mp3';
      return { file, label: '🔊 독이의 탐험 시작 안내 듣기', desc: '독이가 기지 출항과 탐험 방법을 안내해요.' };
    }
    if (title.includes('탐험 기록을 찾았어!')) {
      return { file: 'save-found.mp3', label: '🔊 독이의 이전 기록 확인 듣기', desc: '독이가 이전 탐험 기록을 확인해 줘요.' };
    }
    if (title.includes('독도 탐험을 완주했어!') || title.includes('독도 탐험 완료증')) {
      return { file: 'cert-finish.mp3', label: '🔊 독도 수호 완료 축하 듣기', desc: '모덕초 독도 수호대 완주를 축하해요!' };
    }

    // --- 1번 방 (Microsoft Edge Neural SunHi 음성) ---
    if (title === nodes.welcome?.name || title === '괭이갈매기 길잡이 · 독이' || title === '탐험 안내원') {
      return { file: 'doki-welcome.mp3', label: '🔊 독이 이야기 듣기', desc: '독이가 이야기하고 있어요. 아래 글을 함께 읽어 봐요.' };
    }
    if (title === nodes.map?.name || title === '지도 보관함') {
      return { file: 'room1-map.mp3', label: '🔊 독이의 지도 설명 듣기', desc: '독이가 지도 속 독도의 위치를 설명해 줘요.' };
    }
    if (title === nodes.scope?.name || title === '탐사 장비함') {
      return { file: 'room1-scope.mp3', label: '🔊 독이의 쌍안경 설명 듣기', desc: '독이가 쌍안경 사용법을 설명해 줘요.' };
    }
    if (title === nodes.depart?.name || title === '출항 경로 해독판' || title === '출항 준비판') {
      return { file: `room1-depart-${gradeSuffix}.mp3`, label: `🔊 독이의 출항 문제 안내 듣기 (${g}~${+g + 1}학년)`, desc: '독이가 출항 문제 단서를 읽어 줘요.' };
    }
    if (title === '위치 잠금장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[0]?.lock)) {
      return { file: 'room1-gate.mp3', label: '🔊 독이의 잠금장치 힌트 듣기', desc: '독이가 단서 조합 힌트를 알려 줘요.' };
    }
    if (title === '철컥! 비밀 문이 열렸어') {
      if (typeof state !== 'undefined' && state.stage === 0) {
        return { file: 'room1-evidence.mp3', label: '🔊 독이의 단서 해설 듣기', desc: '독이가 지도 단서의 까닭을 설명해 줘요.' };
      }
      return { file: 'room-unlocked.mp3', label: '🔊 비밀 문 열림 해설 듣기', desc: '잠금장치를 풀고 다음 비밀 문이 열렸어요.' };
    }
    if (title === '독도 수호 메시지 완성!') {
      return { file: 'final-signal.mp3', label: '🔊 독도 수호 계획 완성 듣기', desc: '네가 모은 증거로 독도 수호 계획이 완성되었어요.' };
    }

    // --- 2번 방: 등대 아저씨 & 지형 잠금장치 ---
    if (title.includes('등대 아저씨')) {
      return { file: `npc-keeper-${gradeSuffix}.mp3`, label: '🔊 등대 아저씨 이야기 듣기', desc: '등대 아저씨가 독도 등대와 화산섬 지형에 대해 이야기해요.' };
    }
    if (title === '지형 관찰 잠금장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[1]?.lock)) {
      return { file: 'room2-gate.mp3', label: '🔊 독이의 지형 관찰 힌트 듣기', desc: '독이가 동도와 서도의 특징을 비교하는 힌트를 줘요.' };
    }

    // --- 3번 방: 바다 박사 & 삶터 잠금장치 ---
    if (title.includes('바다 박사')) {
      return { file: `npc-researcher-${gradeSuffix}.mp3`, label: '🔊 바다 박사 이야기 듣기', desc: '바다 박사가 천연보호구역과 해조숲에 대해 이야기해요.' };
    }
    if (title === '삶터 연결 장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[2]?.lock)) {
      return { file: 'room3-gate.mp3', label: '🔊 독이의 생태 삶터 힌트 듣기', desc: '독이가 바닷새와 물고기의 삶터 연결 힌트를 줘요.' };
    }

    // --- 4번 방: 안용복, 이사부 & 역사 잠금장치 ---
    if (title.includes('안용복')) {
      return { file: `npc-anyongbok-${gradeSuffix}.mp3`, label: '🔊 안용복의 이야기 듣기', desc: '안용복이 조선 숙종 때의 활동을 들려줘요.' };
    }
    if (title.includes('이사부')) {
      return { file: `npc-isabu-${gradeSuffix}.mp3`, label: '🔊 이사부 장군 안내판 듣기', desc: '이사부 장군의 우산국 복속 기록을 들려줘요.' };
    }
    if (title === '3단계 역사 시간 잠금장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[3]?.lock)) {
      return { file: 'room4-gate.mp3', label: '🔊 독이의 역사 시간 힌트 듣기', desc: '독이가 세 시대 역사의 순서 힌트를 줘요.' };
    }

    // --- 5번 방: 강치 강이 & 보전 잠금장치 ---
    if (title.includes('강치')) {
      return { file: `npc-gangchi-${gradeSuffix}.mp3`, label: '🔊 강치 강이의 이야기 듣기', desc: '강치 강이가 생태 보전의 소중한 교훈을 전해요.' };
    }
    if (title === '보전 행동 잠금장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[4]?.lock)) {
      return { file: 'room5-gate.mp3', label: '🔊 독이의 보전 행동 힌트 듣기', desc: '독이가 쓰레기와 자연물 구별 힌트를 줘요.' };
    }

    // --- 6번 방: 수호 대원 & 수호 메시지 잠금장치 ---
    if (title.includes('수호 대원')) {
      return { file: `npc-guard-${gradeSuffix}.mp3`, label: '🔊 수호 대원 이야기 듣기', desc: '독도를 지키는 대원과 삽사리의 이야기를 들려줘요.' };
    }
    if (title === '수호 메시지 전송 장치' || (typeof EscapeRooms !== 'undefined' && title === EscapeRooms[5]?.lock)) {
      return { file: 'room6-gate.mp3', label: '🔊 독이의 마지막 수호 메시지 힌트 듣기', desc: '독이가 독도 수호 선언 완성 힌트를 줘요.' };
    }

    return null;
  }

  // 모달 래핑: 팝업이 열릴 때 알맞은 사전 녹음 음성 클립 자동 재생 (UI 컨트롤 삽입 없음)
  const previousModal = modal;
  modal = function(title, body, actions = []) {
    stop();
    previousModal(title, body, actions);

    // 단순 조작/기능 UI 모달은 음성 재생 제외
    if (/가방에서|전체 탐험 지도|출항 준비|새 탐험 시작/i.test(title)) return;

    const clip = resolveClip(title);
    if (clip && clip.file) {
      playClip(clip.file);
    }
  };

  // 모달 닫기 시 음성 정지 및 BGM 복원
  if (typeof closeModal === 'function') {
    const originalCloseModal = closeModal;
    closeModal = function() {
      stop();
      originalCloseModal();
    };
  }

  // 실제 사진집(파노라마 전경) 열람 시 파노라마 음성 연동 (UI 컨트롤 삽입 없음)
  if (typeof openPhotoAlbum === 'function') {
    const originalPhotoAlbum = openPhotoAlbum;
    openPhotoAlbum = function() {
      stop();
      originalPhotoAlbum();
      playClip('room1-panorama.mp3');
    };
  }

  // 창 닫힘 및 페이지 전환 시 정지 처리
  const activityEl = document.getElementById('activity');
  if (activityEl) activityEl.addEventListener('close', stop);
  const photoAlbumEl = document.getElementById('photo-album');
  if (photoAlbumEl) photoAlbumEl.addEventListener('close', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
})();
