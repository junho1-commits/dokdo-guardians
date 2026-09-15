/* Background music manager with smooth audio ducking when NPC speaks */
(()=>{
  const BGM_SRC = 'assets/bgm/the_mountain-kids-522483.mp3';
  const NORMAL_VOL = 0.35;
  const DUCK_VOL = 0.07;
  
  const audio = new Audio(BGM_SRC);
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

  async function play() {
    enabled = true;
    updateUI();
    try {
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
