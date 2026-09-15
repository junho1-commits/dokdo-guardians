/* Recorded narration system for Dokdo Explorers (First Room Faye Voices) */
(()=>{
  const AUDIO_BASE = new URL('assets/audio/', document.currentScript.src).href;
  const currentAudio = new Audio();
  currentAudio.preload = 'none';
  let serial = 0;

  function status(message, targetId = 'npc-voice-status') {
    const el = document.getElementById(targetId);
    if (el) el.textContent = message;
  }

  function stop() {
    serial++;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (window.BGM) window.BGM.unduck();
    status('음성을 멈췄어요. 다시 듣기를 누르면 처음부터 들을 수 있어요.');
    status('음성을 멈췄어요. 다시 듣기를 누르면 처음부터 들을 수 있어요.', 'album-voice-status');
  }

  async function playClip(filename, desc = '독이가 이야기하고 있어요. 아래 글을 함께 읽어 봐요.', statusId = 'npc-voice-status') {
    stop();
    const id = ++serial;
    currentAudio.src = AUDIO_BASE + filename;
    status('독이의 음성을 준비하고 있어요…', statusId);
    if (window.BGM) window.BGM.duck();
    try {
      await currentAudio.play();
      if (id === serial) status(desc, statusId);
    } catch (e) {
      if (window.BGM) window.BGM.unduck();
      if (id === serial) status('듣기 버튼을 다시 눌러 주세요. 소리가 나지 않으면 기기 음량과 연결 상태를 확인해 주세요.', statusId);
    }
  }

  currentAudio.addEventListener('ended', () => {
    if (window.BGM) window.BGM.unduck();
    status('이야기를 다 들었어요.');
    status('이야기를 다 들었어요.', 'album-voice-status');
  });
  currentAudio.addEventListener('pause', () => {
    if (window.BGM) window.BGM.unduck();
  });
  currentAudio.addEventListener('error', () => {
    if (window.BGM) window.BGM.unduck();
    status('음성을 불러오지 못했어요. 다시 듣기를 누르거나 아래 글을 읽어 주세요.');
    status('음성을 불러오지 못했어요. 다시 듣기를 누르거나 아래 글을 읽어 주세요.', 'album-voice-status');
  });

  // 활동 타이틀에 따라 적절한 음성 클립 반환
  function resolveClip(title) {
    if (!title) return null;

    // 1. 길잡이 독이 환영 음성
    if (title === escapeNodes?.welcome?.name || title === '괭이갈매기 길잡이 · 독이' || title === '탐험 안내원') {
      return { file: 'doki-welcome-faye.mp3', label: '🔊 독이 이야기 듣기', desc: '독이가 이야기하고 있어요. 아래 글을 함께 읽어 봐요.' };
    }

    // 2. 지도 보관함
    if (title === escapeNodes?.map?.name || title === '지도 보관함') {
      return { file: 'room1-map-faye.mp3', label: '🔊 독이의 지도 설명 듣기', desc: '독이가 지도 속 독도의 위치를 설명해 줘요.' };
    }

    // 3. 탐사 장비함 (쌍안경)
    if (title === escapeNodes?.scope?.name || title === '탐사 장비함') {
      return { file: 'room1-scope-faye.mp3', label: '🔊 독이의 쌍안경 설명 듣기', desc: '독이가 쌍안경 사용법을 설명해 줘요.' };
    }

    // 4. 출항 경로 해독판 (학년별 문제 음성)
    if (title === escapeNodes?.depart?.name || title === '출항 경로 해독판' || title === '출항 준비판') {
      const g = (typeof choice !== 'undefined' && choice.grade) ? choice.grade : '1';
      const file = g === '5' ? 'room1-depart-grade5-faye.mp3' : (g === '3' ? 'room1-depart-grade3-faye.mp3' : 'room1-depart-grade1-faye.mp3');
      return { file, label: `🔊 독이의 출항 문제 안내 듣기 (${g}~${+g + 1}학년)`, desc: '독이가 출항 문제 단서를 읽어 줘요.' };
    }

    // 5. 첫 번째 방 출구 위치 잠금장치
    if (typeof state !== 'undefined' && state.stage === 0 && (title === EscapeRooms?.[0]?.lock || title === '위치 잠금장치')) {
      return { file: 'room1-gate-faye.mp3', label: '🔊 독이의 잠금장치 힌트 듣기', desc: '독이가 단서 조합 힌트를 알려 줘요.' };
    }

    // 6. 첫 번째 방 잠금 해제 성공 (단서 까닭/해설)
    if (typeof state !== 'undefined' && state.stage === 0 && title === '철컥! 비밀 문이 열렸어') {
      return { file: 'room1-evidence-faye.mp3', label: '🔊 독이의 단서 해설 듣기', desc: '독이가 지도 단서의 까닭을 설명해 줘요.' };
    }

    return null;
  }

  // 모달 래핑: 팝업이 열릴 때 알맞은 음성 안내 컨트롤 삽입 및 자동 재생
  const previousModal = modal;
  modal = function(title, body, actions = []) {
    stop();
    previousModal(title, body, actions);

    const clip = resolveClip(title);
    if (!clip) return;

    const controls = document.createElement('div');
    controls.className = 'npc-voice-controls';
    controls.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="npc-voice-play">${clip.label}</button><button type="button" id="npc-voice-stop">음성 멈추기</button></div><p id="npc-voice-status" role="status" style="font-size:12px;margin:6px 0 0">독이의 안내 음성이 흘러나와요.</p>`;

    const targetBody = activity.querySelector('.activity-body');
    if (targetBody) {
      targetBody.prepend(controls);
      const playBtn = document.getElementById('npc-voice-play');
      const stopBtn = document.getElementById('npc-voice-stop');
      if (playBtn) playBtn.onclick = () => playClip(clip.file, clip.desc);
      if (stopBtn) stopBtn.onclick = stop;
      playClip(clip.file, clip.desc);
    }
  };

  // 실제 사진집(파노라마 전경) 열람 시 파노라마 음성 연동
  if (typeof openPhotoAlbum === 'function') {
    const originalPhotoAlbum = openPhotoAlbum;
    openPhotoAlbum = function() {
      stop();
      originalPhotoAlbum();
      const album = document.getElementById('photo-album');
      if (!album) return;

      const existing = album.querySelector('.npc-voice-controls');
      if (existing) existing.remove();

      const controls = document.createElement('div');
      controls.className = 'npc-voice-controls';
      controls.style.marginBottom = '14px';
      controls.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="album-voice-play">🔊 독이의 사진 설명 듣기</button><button type="button" id="album-voice-stop">음성 멈추기</button></div><p id="album-voice-status" role="status" style="font-size:12px;margin:6px 0 0">독이가 독도 전경 사진을 설명해 줘요.</p>';

      const h2 = album.querySelector('h2');
      if (h2) h2.after(controls);

      const playBtn = document.getElementById('album-voice-play');
      const stopBtn = document.getElementById('album-voice-stop');
      if (playBtn) playBtn.onclick = () => playClip('room1-panorama-faye.mp3', '독이가 독도 전경 사진을 설명하고 있어요.', 'album-voice-status');
      if (stopBtn) stopBtn.onclick = stop;

      playClip('room1-panorama-faye.mp3', '독이가 독도 전경 사진을 설명하고 있어요.', 'album-voice-status');
    };
  }

  // 창 닫힘 및 페이지 전환 시 정지 처리
  activity.addEventListener('close', stop);
  const photoAlbumEl = document.getElementById('photo-album');
  if (photoAlbumEl) photoAlbumEl.addEventListener('close', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
})();
