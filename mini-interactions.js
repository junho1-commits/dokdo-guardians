/* Interactive Learning Mini-Tools Logic
   1번 방 360° 방위각 나침반, 5번 방 해안 정화 분류기.
   두 도구 모두 `render*(targetEl, onComplete, options)` 형태이며 완료 시 onComplete를 한 번만 호출한다.
   마우스·터치(포인터 이벤트)·키보드를 모두 지원해 크롬북/태블릿에서도 동작한다. */
(function(root) {
  const DokdoInteractions = {};

  // 울릉도 → 독도 방위각(동남쪽, 약 87.4 km). 108°~122° 를 정답 범위로 본다.
  const DOKDO_BEARING = 114;
  const DOKDO_TOLERANCE = 8;
  DokdoInteractions.DOKDO_BEARING = DOKDO_BEARING;
  DokdoInteractions.DOKDO_TOLERANCE = DOKDO_TOLERANCE;

  function normalize(angle) {
    angle = Math.round(angle) % 360;
    return angle < 0 ? angle + 360 : angle;
  }
  // -180 ~ 180 사이의 부호 있는 차이. 양수면 시계 방향으로 더 돌려야 한다.
  function signedDiff(target, angle) {
    return ((target - angle + 540) % 360) - 180;
  }
  // 8방위 표준 구간(각 45°, 정방위 ±22.5°). 114°는 동남(SE) 구간에 들어간다.
  function dirName(angle) {
    const names = ['북(N)', '북동(NE)', '동(E)', '동남(SE)', '남(S)', '남서(SW)', '서(W)', '북서(NW)'];
    return names[Math.round(normalize(angle) / 45) % 8];
  }
  DokdoInteractions.isDokdoBearing = function(angle, target = DOKDO_BEARING, tolerance = DOKDO_TOLERANCE) {
    return Math.abs(signedDiff(target, normalize(angle))) <= tolerance;
  };
  function once(fn) {
    let fired = false;
    return function() {
      if (fired || typeof fn !== 'function') return;
      fired = true;
      fn.apply(null, arguments);
    };
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 1. 360° 독도 방위각 나침반 -------------------------------------------------
  // options: { target, tolerance, initialAngle, lockOnMatch }
  DokdoInteractions.renderCompass = function(targetEl, onComplete, options = {}) {
    const target = normalize(options.target ?? DOKDO_BEARING);
    const tolerance = options.tolerance ?? DOKDO_TOLERANCE;
    const lockOnMatch = options.lockOnMatch !== false;
    const complete = once(onComplete);

    const ticks = [];
    for (let deg = 0; deg < 360; deg += 15) {
      ticks.push(`<i class="compass-tick${deg % 90 === 0 ? ' major' : deg % 45 === 0 ? ' mid' : ''}" style="transform:rotate(${deg}deg)"></i>`);
    }

    targetEl.innerHTML = `
      <div class="interactive-tool-box compass-tool">
        <div class="interactive-tool-header">
          <div class="interactive-tool-title">🧭 독도 출항 방위각 맞추기</div>
          <small>울릉도에서 독도가 있는 방향(동남쪽)으로 바늘을 돌린 뒤 손을 떼 봐!</small>
        </div>
        <div class="compass-container">
          <div class="compass-dial" role="slider" tabindex="0" aria-label="방위각 나침반" aria-valuemin="0" aria-valuemax="359" aria-valuenow="0">
            ${ticks.join('')}
            <span class="compass-mark n">북 N</span>
            <span class="compass-mark e">동 E</span>
            <span class="compass-mark s">남 S</span>
            <span class="compass-mark w">서 W</span>
            <div class="compass-needle">
              <div class="needle-north"></div>
              <div class="needle-south"></div>
              <div class="needle-pin"></div>
            </div>
          </div>
          <div class="compass-info">
            <div class="compass-angle-badge" aria-live="polite">0° 북(N)</div>
            <div class="compass-status" role="status">나침반을 손가락이나 마우스로 돌려 봐. 화살표 키로도 돌릴 수 있어.</div>
            <div class="compass-nudge" aria-label="미세 조정">
              <button type="button" data-nudge="-10">−10°</button>
              <button type="button" data-nudge="-1">−1°</button>
              <button type="button" data-nudge="1">+1°</button>
              <button type="button" data-nudge="10">+10°</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const box = targetEl.querySelector('.compass-tool');
    const dial = box.querySelector('.compass-dial');
    const needle = box.querySelector('.compass-needle');
    const angleBadge = box.querySelector('.compass-angle-badge');
    const statusEl = box.querySelector('.compass-status');
    const nudges = box.querySelectorAll('[data-nudge]');

    let currentAngle = normalize(options.initialAngle ?? 0);
    let matched = false;
    let dragging = false;

    function angleFromPointer(e) {
      const rect = dial.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      return normalize(Math.atan2(dy, dx) * 180 / Math.PI + 90);
    }

    function paint() {
      needle.style.transform = `rotate(${currentAngle}deg)`;
      angleBadge.textContent = `${currentAngle}° ${dirName(currentAngle)}`;
      dial.setAttribute('aria-valuenow', currentAngle);
      dial.setAttribute('aria-valuetext', `${currentAngle}도 ${dirName(currentAngle)}`);
    }

    function hint() {
      if (matched) return;
      const diff = signedDiff(target, currentAngle);
      const gap = Math.abs(diff);
      statusEl.className = 'compass-status' + (gap <= tolerance ? ' near' : '');
      if (gap <= tolerance) statusEl.textContent = '🔥 바로 이 방향이야! 손을 떼면 항로가 확정돼.';
      else if (gap <= 30) statusEl.textContent = `거의 다 왔어. ${diff > 0 ? '시계 방향으로' : '반시계 방향으로'} 조금만 더 돌려 봐.`;
      else statusEl.textContent = '울릉도에서 독도는 동남쪽(약 114°, 87.4 km)에 있어.';
    }

    function setAngle(angle) {
      if (matched) return;
      currentAngle = normalize(angle);
      paint();
      hint();
    }

    // 정답 범위 판정은 손을 뗀 순간(또는 버튼·키보드 조작 직후)에만 한다.
    function evaluate() {
      if (matched || !DokdoInteractions.isDokdoBearing(currentAngle, target, tolerance)) return;
      matched = true;
      box.classList.add('matched');
      statusEl.className = 'compass-status matched';
      statusEl.innerHTML = '🎉 <b>동남쪽 87.4 km 독도 항로 일치! 출항 준비 완료!</b>';
      if (lockOnMatch) {
        dial.classList.add('locked');
        dial.setAttribute('aria-disabled', 'true');
        nudges.forEach(b => b.disabled = true);
      }
      complete(currentAngle);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      e.preventDefault();
      setAngle(angleFromPointer(e));
    }
    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      dial.classList.remove('dragging');
      try { dial.releasePointerCapture(e.pointerId); } catch (err) { /* 이미 해제된 경우 */ }
      evaluate();
    }
    dial.addEventListener('pointerdown', e => {
      if (matched) return;
      e.preventDefault();
      dragging = true;
      dial.classList.add('dragging');
      dial.focus({ preventScroll: true });
      try { dial.setPointerCapture(e.pointerId); } catch (err) { /* 일부 브라우저는 capture 미지원 */ }
      setAngle(angleFromPointer(e));
    });
    dial.addEventListener('pointermove', onPointerMove);
    dial.addEventListener('pointerup', onPointerUp);
    dial.addEventListener('pointercancel', onPointerUp);
    dial.addEventListener('lostpointercapture', onPointerUp);

    // 키보드: 좌우 화살표 1°, Shift 와 함께 10°, Enter/Space 로 확정.
    dial.addEventListener('keydown', e => {
      if (matched) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setAngle(currentAngle + step); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setAngle(currentAngle - step); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); evaluate(); }
    });
    nudges.forEach(b => b.addEventListener('click', () => {
      setAngle(currentAngle + Number(b.dataset.nudge));
      evaluate();
    }));

    paint();
    hint();
    if (options.initialAngle != null) evaluate();

    return {
      getAngle: () => currentAngle,
      setAngle: angle => { setAngle(angle); evaluate(); },
      isMatched: () => matched,
      destroy: () => { targetEl.innerHTML = ''; }
    };
  };

  // 2. 독도 환경 지킴이 분류기 (드래그 앤 드롭 + 탭 선택 방식) ----------------------
  const ECO_ITEMS = [
    { id: 'wrapper', name: '과자 포장지', type: 'trash', icon: '🍬', why: '사람이 버린 쓰레기예요. 배낭에 담아 되가져가야 해요!' },
    { id: 'can', name: '음료수 캔', type: 'trash', icon: '🥫', why: '사람이 버린 쓰레기예요. 배낭에 담아 되가져가야 해요!' },
    { id: 'rock', name: '독도 몽돌(자연석)', type: 'nature', icon: '🪨', why: '독도의 소중한 자연물이에요. 가져가면 안 되고 제자리에 두어야 해요!' },
    { id: 'feather', name: '괭이갈매기 깃털', type: 'nature', icon: '🪶', why: '독도 생물의 흔적이에요. 관찰만 하고 제자리에 두어야 해요!' }
  ];
  DokdoInteractions.ECO_ITEMS = ECO_ITEMS;

  // options: { items, shuffle }
  DokdoInteractions.renderEcoSort = function(targetEl, onComplete, options = {}) {
    const items = (options.items || ECO_ITEMS).map(i => ({ ...i }));
    if (options.shuffle !== false) {
      for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    }
    const complete = once(onComplete);
    const total = items.length;
    let placed = 0;
    let selectedCard = null;

    targetEl.innerHTML = `
      <div class="interactive-tool-box eco-tool">
        <div class="interactive-tool-header">
          <div class="interactive-tool-title">🧤 독도 환경 정화 실천</div>
          <small>물건을 끌어다 놓거나, 물건을 한 번 누른 뒤 상자를 눌러 옮겨 줘.</small>
        </div>
        <div class="eco-sort-area">
          <div class="eco-progress" aria-live="polite"><span class="eco-progress-count">0</span> / ${total} 정리 완료</div>
          <div class="eco-items-pool" aria-label="정리할 물건">
            ${items.map(item => `
              <button type="button" class="eco-card" draggable="true" data-id="${item.id}" data-type="${item.type}" aria-label="${escapeHtml(item.name)} 선택">
                <span class="eco-icon" aria-hidden="true">${item.icon}</span><span class="eco-name">${escapeHtml(item.name)}</span>
              </button>
            `).join('')}
          </div>
          <div class="eco-dropzones">
            <div class="eco-zone" data-accept="trash" role="button" tabindex="0" aria-label="수거 배낭에 넣기">
              <h4>🎒 수거 배낭</h4>
              <p>사람이 버린 쓰레기 되가져오기</p>
              <div class="eco-zone-items"></div>
            </div>
            <div class="eco-zone" data-accept="nature" role="button" tabindex="0" aria-label="자연의 자리에 두기">
              <h4>🪨 자연의 자리</h4>
              <p>자연석과 생물의 흔적 그대로 두기</p>
              <div class="eco-zone-items"></div>
            </div>
          </div>
          <div class="eco-feedback" role="status">물건을 알맞은 상자로 옮겨 봐.</div>
        </div>
      </div>
    `;

    const box = targetEl.querySelector('.eco-tool');
    const feedback = box.querySelector('.eco-feedback');
    const counter = box.querySelector('.eco-progress-count');
    const zones = box.querySelectorAll('.eco-zone');
    const cards = box.querySelectorAll('.eco-card');
    const itemById = Object.fromEntries(items.map(i => [i.id, i]));

    function say(text, kind) {
      feedback.className = 'eco-feedback' + (kind ? ' ' + kind : '');
      feedback.innerHTML = text;
    }
    function select(card) {
      if (selectedCard === card) { deselect(); return; }
      deselect();
      selectedCard = card;
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      zones.forEach(z => z.classList.add('awaiting'));
      say(`👉 [${escapeHtml(itemById[card.dataset.id].name)}] 을(를) 골랐어. 이제 알맞은 상자를 눌러 줘.`);
    }
    function deselect() {
      if (!selectedCard) return;
      selectedCard.classList.remove('selected');
      selectedCard.setAttribute('aria-pressed', 'false');
      selectedCard = null;
      zones.forEach(z => z.classList.remove('awaiting'));
    }
    function shake(el) {
      el.classList.remove('shake');
      void el.offsetWidth; // 애니메이션 재시작
      el.classList.add('shake');
    }
    function place(card, zone) {
      if (!card || card.classList.contains('dropped')) return false;
      const item = itemById[card.dataset.id];
      deselect();
      if (zone.dataset.accept !== item.type) {
        shake(card); shake(zone);
        zone.classList.add('wrong');
        setTimeout(() => zone.classList.remove('wrong'), 500);
        say(`❌ [${escapeHtml(item.name)}]은(는) ${item.why}`, 'wrong');
        return false;
      }
      card.classList.add('dropped');
      card.setAttribute('draggable', 'false');
      card.disabled = true;
      zone.querySelector('.eco-zone-items').appendChild(card);
      zone.classList.add('filled');
      placed++;
      counter.textContent = placed;
      say(`✔ [${escapeHtml(item.name)}] 알맞은 선택이야!`, 'right');
      if (placed === total) {
        box.classList.add('done');
        say('🌟 <b>완벽해! 쓰레기는 되가져오고, 자연물은 제자리에 두었어요!</b>', 'right');
        complete();
      }
      return true;
    }

    cards.forEach(card => {
      card.setAttribute('aria-pressed', 'false');
      // 탭 방식: 물건 선택 → 상자 선택
      card.addEventListener('click', () => { if (!card.disabled) select(card); });
      // 드래그 방식(마우스). 모바일 브라우저는 HTML5 DnD 를 지원하지 않아도 탭 방식으로 진행할 수 있다.
      card.addEventListener('dragstart', e => {
        if (card.disabled) { e.preventDefault(); return; }
        deselect();
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        zones.forEach(z => z.classList.remove('drag-over'));
      });
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        place(box.querySelector(`.eco-card[data-id="${id}"]`), zone);
      });
      zone.addEventListener('click', e => {
        if (e.target.closest('.eco-card')) return; // 이미 넣은 카드 클릭은 무시
        if (selectedCard) place(selectedCard, zone);
        else say('먼저 옮길 물건을 눌러서 골라 줘.');
      });
      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zone.click(); }
      });
    });

    return {
      remaining: () => total - placed,
      isComplete: () => placed === total,
      destroy: () => { targetEl.innerHTML = ''; }
    };
  };

  root.DokdoInteractions = DokdoInteractions;
  if (typeof module !== 'undefined' && module.exports) module.exports = DokdoInteractions;
})(typeof window !== 'undefined' ? window : globalThis);
