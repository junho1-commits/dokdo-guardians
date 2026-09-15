/* Dokdo Live Cam PIP (Picture-in-Picture) Controller */
(function() {
  const STREAMS = [
    {
      name: 'KBS 독도 파노라마 라이브',
      url: 'https://www.youtube-nocookie.com/embed/yKu20ueZpl4?autoplay=1&mute=1&playsinline=1&rel=0',
      desc: 'KBS 24시간 실시간 독도 파노라마 생중계'
    },
    {
      name: 'KBS 이 시각 독도 라이브',
      url: 'https://www.youtube-nocookie.com/embed/OLDNHQaZFnQ?autoplay=1&mute=1&playsinline=1&rel=0',
      desc: 'KBS 실시간 독도 생중계 및 기상 상황'
    },
    {
      name: '독도 해상 관측 라이브',
      url: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UC8Wj8G8H6J1E6qH8j8cW20Q&autoplay=1&mute=1&playsinline=1&rel=0',
      desc: '해양수산부 및 방송사 실시간 중계'
    }
  ];

  let currentStreamIndex = 0;
  let isOpen = false;
  let isMinimized = false;
  let windowSize = 1; // 0: Small(320px), 1: Normal(420px), 2: Large(560px)
  const SIZES = [320, 420, 560];

  function createPipUI() {
    // 1. Floating Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'pip-launcher';
    launcher.setAttribute('aria-label', '실시간 독도 라이브캠 켜기 (단축키 L)');
    launcher.innerHTML = `
      <span class="live-dot" aria-hidden="true"></span>
      <span>독도 LIVE</span>
    `;
    launcher.onclick = togglePipWindow;
    document.body.appendChild(launcher);

    // 2. Floating Window
    const win = document.createElement('div');
    win.id = 'pip-window';
    win.className = 'pip-hidden';
    win.innerHTML = `
      <div class="pip-header" id="pip-drag-handle">
        <div class="pip-title">
          <span class="live-dot" aria-hidden="true"></span>
          <span id="pip-stream-title">${STREAMS[0].name}</span>
        </div>
        <div class="pip-controls">
          <a class="pip-btn" href="https://www.dokdo.re.kr/home/cms/cmsCont.do?cntnts_sn=60" target="_blank" rel="noopener" title="독도종합정보시스템 공식 라이브 새 창 열기" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;line-height:1;">↗</a>
          <button class="pip-btn" id="pip-switch-btn" title="스트림 채널 변경">🔄</button>
          <button class="pip-btn" id="pip-size-btn" title="창 크기 변경">⤢</button>
          <button class="pip-btn" id="pip-min-btn" title="최소화/복원">_</button>
          <button class="pip-btn" id="pip-close-btn" title="닫기 (L)">×</button>
        </div>
      </div>
      <div class="pip-body">
        <iframe id="pip-iframe" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <div class="pip-overlay">📍 동도 전망대 실시간</div>
      </div>
      <div class="pip-footer">
        <div class="pip-source">
          <span id="pip-stream-desc">${STREAMS[0].desc}</span>
        </div>
        <div class="pip-clock" id="pip-clock">--:--:-- KST</div>
      </div>
    `;
    document.body.appendChild(win);

    // Wire events
    document.getElementById('pip-close-btn').onclick = () => setPipOpen(false);
    document.getElementById('pip-min-btn').onclick = toggleMinimize;
    document.getElementById('pip-size-btn').onclick = cycleSize;
    document.getElementById('pip-switch-btn').onclick = switchStream;

    setupDrag(win, document.getElementById('pip-drag-handle'));
    startClock();
    setupKeyboardShortcut();
  }

  function setPipOpen(open) {
    isOpen = open;
    const win = document.getElementById('pip-window');
    const iframe = document.getElementById('pip-iframe');
    if (!win) return;

    if (isOpen) {
      win.classList.remove('pip-hidden');
      if (!iframe.src || iframe.src === 'about:blank') {
        iframe.src = STREAMS[currentStreamIndex].url;
      }
    } else {
      win.classList.add('pip-hidden');
      // Pause/unload iframe to save bandwidth when closed
      iframe.src = '';
    }
  }

  function togglePipWindow() {
    setPipOpen(!isOpen);
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    const win = document.getElementById('pip-window');
    const minBtn = document.getElementById('pip-min-btn');
    if (isMinimized) {
      win.classList.add('pip-minimized');
      minBtn.textContent = '□';
      minBtn.title = '창 복원';
    } else {
      win.classList.remove('pip-minimized');
      minBtn.textContent = '_';
      minBtn.title = '최소화';
    }
  }

  function cycleSize() {
    if (isMinimized) toggleMinimize();
    windowSize = (windowSize + 1) % SIZES.length;
    const win = document.getElementById('pip-window');
    win.style.width = SIZES[windowSize] + 'px';
  }

  function switchStream() {
    currentStreamIndex = (currentStreamIndex + 1) % STREAMS.length;
    const stream = STREAMS[currentStreamIndex];
    document.getElementById('pip-stream-title').textContent = stream.name;
    document.getElementById('pip-stream-desc').textContent = stream.desc;
    const iframe = document.getElementById('pip-iframe');
    iframe.src = stream.url;
  }

  function startClock() {
    const clockEl = document.getElementById('pip-clock');
    function update() {
      if (!clockEl) return;
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}:${s} KST`;
    }
    update();
    setInterval(update, 1000);
  }

  function setupDrag(el, handle) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('.pip-btn')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Switch to absolute positioning via left/top
      el.style.bottom = 'auto';
      el.style.right = 'auto';
      el.style.left = initialLeft + 'px';
      el.style.top = initialTop + 'px';

      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, initialTop + dy));

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    });

    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      handle.addEventListener(ev, () => {
        isDragging = false;
      });
    }
  }

  function setupKeyboardShortcut() {
    window.addEventListener('keydown', e => {
      // Toggle PIP on 'L' key if not typing in an input/modal
      if (e.key.toLowerCase() === 'l' && !e.repeat) {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;
        togglePipWindow();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPipUI);
  } else {
    createPipUI();
  }
})();
