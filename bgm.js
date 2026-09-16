/* Background music manager with smooth audio ducking when NPC speaks */
(()=>{
  const ROOM_TRACKS = [
    'assets/bgm/the_mountain-kids-522483.mp3', // 1번 방: 출항 기지 (The Mountain Kids Adventure)
    'assets/bgm/room2-observation.mp3',        // 2번 방: 동도·서도 지형 관측실 (Windswept)
    'assets/bgm/room3-ecology.mp3',            // 3번 방: 해조숲 생태 연구실 (Silver Blue Light)
    'assets/bgm/room4-history.mp3',            // 4번 방: 봉인된 역사 기록실 (Danse Morialta)
    'assets/bgm/room5-action.mp3',             // 5번 방: 해안 보호 작전실 (Carefree)
    'assets/bgm/room6-telecom.mp3'             // 6번 방: 독도 수호 통신실 (Enchanted Journey)
  ];
  const NORMAL_VOL = 0.35;
  const DUCK_VOL = 0.07;
  
  let currentRoom = 0;
  let switching = false;

  const audio = new Audio(ROOM_TRACKS[0]);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = NORMAL_VOL;

  let enabled = false; // 기본은 브라우저 정책 및 사용자 선택 존중 (상호작용 시 시작)
  let isDucked = false;
  let fadeAnimation = null;
  let userInteracted = false;

  function fadeTo(targetVol, duration = 300) {
    if (fadeAnimation) cancelAnimationFrame(fadeAnimation);
    const startVol = audio.volume;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * progress));
      if (progress < 1) {
        fadeAnimation = requestAnimationFrame(step);
      } else {
        fadeAnimation = null;
      }
    }
    fadeAnimation = requestAnimationFrame(step);
  }

  async function setRoom(roomIndex, smooth = true) {
    const idx = Math.max(0, Math.min(ROOM_TRACKS.length - 1, Number(roomIndex) || 0));
    if (idx === currentRoom && audio.src && !audio.src.endsWith('about:blank')) return;
    currentRoom = idx;
    const targetSrc = new URL(ROOM_TRACKS[idx], document.baseURI).href;
    if (audio.src === targetSrc) return;

    if (!enabled || audio.paused) {
      audio.src = targetSrc;
      return;
    }

    if (switching) return;
    switching = true;

    if (smooth) {
      fadeTo(0, 350);
      setTimeout(async () => {
        audio.src = targetSrc;
        try {
          await audio.play();
          const targetVol = isDucked ? DUCK_VOL : NORMAL_VOL;
          fadeTo(targetVol, 400);
        } catch (e) {
        } finally {
          switching = false;
        }
      }, 370);
    } else {
      audio.src = targetSrc;
      try {
        await audio.play();
      } catch (e) {
      } finally {
        switching = false;
      }
    }
  }

  async function play() {
    enabled = true;
    updateUI();
    try {
      if (!audio.src || audio.src.endsWith('about:blank')) {
        audio.src = new URL(ROOM_TRACKS[currentRoom], document.baseURI).href;
      }
      const target = isDucked ? DUCK_VOL : NORMAL_VOL;
      audio.volume = target;
      await audio.play();
    } catch (e) {
      // 자동 재생 정책 등으로 차단된 경우 대기
    }
  }

  function pause() {
    enabled = false;
    updateUI();
    audio.pause();
  }

  function toggle() {
    if (audio.paused) {
      play();
    } else {
      pause();
    }
  }

  function duck() {
    isDucked = true;
    if (!audio.paused && enabled) {
      fadeTo(DUCK_VOL, 250);
    }
  }

  function unduck() {
    isDucked = false;
    if (!audio.paused && enabled) {
      fadeTo(NORMAL_VOL, 450);
    }
  }

  function updateUI() {
    const isPlaying = !audio.paused && enabled;
    const btnHeader = document.getElementById('bgm-toggle');
    if (btnHeader) {
      btnHeader.textContent = isPlaying ? '🎵 음악 끄기' : '🎵 음악 켜기';
      btnHeader.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    }
    const btnSound = document.getElementById('sound');
    if (btnSound) {
      btnSound.textContent = isPlaying ? '소리 켜짐' : '소리 꺼짐';
      btnSound.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    }
  }

  // 첫 사용자 클릭/키보드 입력 시 사운드 시작 처리 (사용자 경험 개선)
  function autoStartOnFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    window.removeEventListener('pointerdown', autoStartOnFirstInteraction);
    window.removeEventListener('keydown', autoStartOnFirstInteraction);
    // 기본적으로 첫 터치/클릭 시 음악을 켜고 재생
    play();
  }

  window.addEventListener('pointerdown', autoStartOnFirstInteraction, { once: true });
  window.addEventListener('keydown', autoStartOnFirstInteraction, { once: true });

  // 탭 가시성 변경 시 일시정지 / 복원
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else {
      if (enabled) audio.play().catch(() => {});
    }
  });

  // 전역 BGM 컨트롤러 노출
  window.BGM = {
    audio,
    play,
    pause,
    toggle,
    duck,
    unduck,
    setRoom,
    get currentRoom() { return currentRoom; },
    get isPlaying() { return !audio.paused && enabled; },
    get isDucked() { return isDucked; },
    updateUI
  };

  // DOM 로드 후 UI 초기화
  window.addEventListener('DOMContentLoaded', () => {
    updateUI();
    const btnHeader = document.getElementById('bgm-toggle');
    if (btnHeader) {
      btnHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });
    }
  });
})();
