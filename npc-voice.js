/* Hybrid recorded narration / Korean Web Speech narration. */
(()=>{
  const AUDIO_BASE = new URL('assets/audio/', document.currentScript.src).href;
  let currentAudio = null;
  const synth = window.speechSynthesis;
  let currentUtterance = null;
  let serial = 0;

  function status(message, targetId = 'npc-voice-status') {
    const el = document.getElementById(targetId);
    if (el) el.textContent = message;
  }

  function stop() {
    serial++;
    if (currentAudio) {
      currentAudio.onended = currentAudio.onerror = currentAudio.onpause = null;
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
      currentAudio = null;
    }
    currentUtterance = null;
    if (synth) synth.cancel();
    if (window.BGM) window.BGM.unduck();
    status('음성을 멈췄어요. 다시 듣기를 누르면 처음부터 들을 수 있어요.');
    status('음성을 멈췄어요. 다시 듣기를 누르면 처음부터 들을 수 있어요.', 'album-voice-status');
  }

  async function playClip(filename, desc = '독이가 이야기하고 있어요. 아래 글을 함께 읽어 봐요.', statusId = 'npc-voice-status') {
    stop();
    const id = ++serial;
    const audio = currentAudio = new Audio(AUDIO_BASE + filename);
    const finish = (message) => {
      if (id !== serial) return;
      if (window.BGM) window.BGM.unduck();
      status(message, statusId);
    };
    audio.onended = () => finish('이야기를 다 들었어요.');
    audio.onerror = () => finish('음성을 불러오지 못했어요. 다시 듣기를 누르거나 아래 글을 읽어 주세요.');
    audio.onpause = () => finish('음성을 멈췄어요.');
    status('독이의 음성을 준비하고 있어요…', statusId);
    if (window.BGM) window.BGM.duck();
    try {
      await audio.play();
      if (id === serial) status(desc, statusId);
    } catch (e) {
      finish('듣기 버튼을 다시 눌러 주세요. 소리가 나지 않으면 기기 음량과 연결 상태를 확인해 주세요.');
    }
  }

  function voiceTone(title) {
    const profiles = [
      [/독이|괭이갈매기/, 1.25, 1.05],
      [/등대\s*아저씨/, 0.95, 0.95],
      [/바다\s*박사/, 1.05, 1.0],
      [/안용복/, 0.88, 0.95],
      [/이사부/, 0.8, 0.9],
      [/강치\s*강이/, 1.1, 0.95],
      [/수호\s*대원|삽사리/, 1.0, 1.05]
    ];
    const match = profiles.find(([pattern]) => pattern.test(title));
    return { pitch: match ? match[1] : 1, rate: match ? match[2] : 1 };
  }

  function narrationText(body) {
    // Clone the rendered body: attributes (including CSS classes) never become speech.
    const copy = body.cloneNode(true);
    copy.querySelectorAll('.npc-role,.note').forEach(el => {
      if (el.matches('.npc-role') || /탐험\s*수첩.*기록|지금까지 완료/.test(el.textContent)) el.remove();
    });
    copy.querySelectorAll('script,style,template,noscript,svg,canvas,button,input,select,textarea,[hidden],[aria-hidden="true"],.npc-voice-controls,.step,.actions,.rewards,.question-number,.door-symbol,[data-voice-skip]').forEach(el => el.remove());
    copy.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
    copy.querySelectorAll('p,div,li,h2,h3,h4,section,article').forEach(el => el.append('\n'));
    return (copy.textContent || '')
      .replace(/모덕초등학교\s*독도\s*탐험대|탐험\s*수첩\s*기록/g, '')
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
      .replace(/\s+/g, ' ').trim();
  }

  function playSpeech(title, text) {
    stop();
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
      status('이 브라우저는 음성 읽기를 지원하지 않아요. 아래 글을 읽어 주세요.');
      return;
    }
    if (!text) { status('읽을 안내 문장이 없어요.'); return; }
    const id = ++serial;
    const utterance = currentUtterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    Object.assign(utterance, voiceTone(title));
    // Query on every replay too, as browsers may populate voices asynchronously.
    const voices = synth.getVoices();
    // Prioritize Microsoft Edge Neural / Natural voices (e.g. SunHi, InJoon, Natural, Online)
    const voice = voices.find(v => /^ko/i.test(v.lang) && /(?:natural|online|neural|sunhi|injoon|hyunsu)/i.test(v.name))
               || voices.find(v => /^ko[-_]KR$/i.test(v.lang))
               || voices.find(v => /^ko(?:[-_]|$)/i.test(v.lang));
    if (voice) utterance.voice = voice;
    const finish = message => {
      if (id !== serial || currentUtterance !== utterance) return;
      currentUtterance = null;
      if (window.BGM) window.BGM.unduck();
      status(message);
    };
    utterance.onstart = () => {
      if (id !== serial || currentUtterance !== utterance) return;
      if (window.BGM) window.BGM.duck();
      status('안내를 읽고 있어요. 아래 글을 함께 읽어 봐요.');
    };
    utterance.onend = () => finish('이야기를 다 들었어요.');
    utterance.onerror = () => finish('음성 재생이 중단되었어요. 다시 듣기를 누르거나 아래 글을 읽어 주세요.');
    status('안내 음성을 준비하고 있어요…');
    try { synth.speak(utterance); }
    catch (error) { finish('음성을 시작하지 못했어요. 다시 듣기를 눌러 주세요.'); }
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

  // 모달 래핑: 팝업이 열릴 때 알맞은 음성 안내 컨트롤 삽입 및 자동 재생
  const previousModal = modal;
  modal = function(title, body, actions = []) {
    stop();
    previousModal(title, body, actions);

    // 단순 조작/기능 UI 모달은 불필요한 음성 바와 기계음 발화를 제외
    if (/가방에서|전체 탐험 지도|출항 준비|새 탐험 시작/i.test(title)) return;

    const clip = resolveClip(title);
    const targetBody = activity.querySelector('.activity-body');
    if (!targetBody) return;
    const text = narrationText(targetBody);
    if (!clip && !text) return;
    const replay = () => clip ? playClip(clip.file, clip.desc) : playSpeech(title, text);

    const controls = document.createElement('div');
    controls.className = 'npc-voice-controls';
    controls.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="npc-voice-play">${clip ? clip.label : '🔊 안내 다시 듣기'}</button><button type="button" id="npc-voice-stop">음성 멈추기</button></div><p id="npc-voice-status" role="status" style="font-size:12px;margin:6px 0 0"></p>`;

    if (targetBody) {
      targetBody.prepend(controls);
      const playBtn = document.getElementById('npc-voice-play');
      const stopBtn = document.getElementById('npc-voice-stop');
      if (playBtn) playBtn.onclick = replay;
      if (stopBtn) stopBtn.onclick = stop;

      // Microsoft Edge Neural 음성 클립이 준비된 경우에만 자동 재생
      if (clip) {
        replay();
      } else {
        status('🔊 안내 다시 듣기 버튼을 누르면 설명을 들을 수 있어요.');
      }
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
      if (playBtn) playBtn.onclick = () => playClip('room1-panorama.mp3', '독이가 독도 전경 사진을 설명하고 있어요.', 'album-voice-status');
      if (stopBtn) stopBtn.onclick = stop;

      playClip('room1-panorama.mp3', '독이가 독도 전경 사진을 설명하고 있어요.', 'album-voice-status');
    };
  }

  // 창 닫힘 및 페이지 전환 시 정지 처리
  activity.addEventListener('close', stop);
  const photoAlbumEl = document.getElementById('photo-album');
  if (photoAlbumEl) photoAlbumEl.addEventListener('close', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
})();
