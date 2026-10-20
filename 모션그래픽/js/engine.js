// 독도 모션그래픽 엔진: 공통 그리기 도구, 캐릭터, 자막, 배경, 장면 전환
(function () {
  const W = 1920, H = 1080;
  const E = (window.E = {});
  E.W = W; E.H = H;

  // ---------- 수학 / 이징 ----------
  const clamp = (E.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)));
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.prog = (t, start, dur) => clamp((t - start) / dur);
  E.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  E.easeIn = (t) => t * t * t;
  E.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  E.easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  E.easeElastic = (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1);
  E.rand = (seed) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  // ---------- 색 ----------
  E.C = {
    nari: '#ec5f95', sani: '#3c9a4a', navy: '#163a6b', blue: '#1e74c8', sky1: '#7ccaf5', sky2: '#d9f1ff',
    sea1: '#2b8fd6', sea2: '#1767ad', sea3: '#0f4f8f', sand: '#f6e7b8', ink: '#1f2a37', yellow: '#ffd23f', red: '#e53935',
  };
  E.FONT_TITLE = '"Black Han Sans"';
  E.FONT_FUN = '"Jua"';
  E.FONT_BODY = '"Gowun Dodum"';

  // ---------- 에셋 ----------
  const imgs = {};
  E.img = (name) => imgs[name];
  E.loadImages = (list) => Promise.all(list.map((src) => new Promise((res) => {
    if (imgs[src]) return res();
    const im = new Image();
    im.onload = () => { imgs[src] = im; res(); };
    im.onerror = () => { console.warn('이미지 로드 실패', src); res(); };
    im.src = src;
  })));

  // ---------- 도형 ----------
  E.rrect = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  E.shadow = (ctx, blur = 30, y = 10, a = 0.25) => { ctx.shadowColor = `rgba(10,30,60,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = y; ctx.shadowOffsetX = 0; };
  E.noShadow = (ctx) => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  // 이미지를 (x,y,w,h) 칸에 cover/contain 으로 그림. zoom, panX/panY(-1~1)
  E.drawImageFit = (ctx, im, x, y, w, h, mode = 'cover', zoom = 1, panX = 0, panY = 0) => {
    if (!im) return;
    const ir = im.width / im.height, br = w / h;
    let dw, dh;
    if ((mode === 'cover') === (ir > br)) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
    dw *= zoom; dh *= zoom;
    const dx = x + (w - dw) / 2 + panX * Math.max(0, (dw - w) / 2);
    const dy = y + (h - dh) / 2 + panY * Math.max(0, (dh - h) / 2);
    ctx.drawImage(im, dx, dy, dw, dh);
    return { dx, dy, dw, dh };
  };

  // 줄바꿈 (한글은 글자 단위, 공백 우선)
  E.wrap = (ctx, text, maxW) => {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) { line = test; continue; }
        if (line) out.push(line);
        if (ctx.measureText(w).width <= maxW) { line = w; continue; }
        line = '';
        for (const ch of w) {
          if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch;
        }
      }
      out.push(line);
    }
    return out;
  };

  E.text = (ctx, str, x, y, { font = E.FONT_FUN, size = 48, color = '#fff', align = 'center', base = 'middle', stroke = null, strokeW = 10, weight = '' } = {}) => {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align; ctx.textBaseline = base;
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = strokeW; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  };

  E.pill = (ctx, x, y, label, { size = 40, bg = E.C.blue, color = '#fff', padX = 34, h = null, font = E.FONT_FUN, align = 'left' } = {}) => {
    ctx.font = `${size}px ${font}`;
    const w = ctx.measureText(label).width + padX * 2, hh = h || size * 1.7;
    const px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    E.shadow(ctx, 18, 6, 0.22); E.rrect(ctx, px, y, w, hh, hh / 2); ctx.fillStyle = bg; ctx.fill(); E.noShadow(ctx);
    E.text(ctx, label, px + w / 2, y + hh / 2 + 2, { size, color, font });
    return { x: px, w, h: hh };
  };

  // 제목 리본(장면 머리말)
  E.heading = (ctx, label, t, x = 70, y = 44) => {
    const p = E.easeBack(E.prog(t, 0.15, 0.6));
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(p * 1.5);
    ctx.translate(x - (1 - p) * 120, y);
    ctx.font = `50px ${E.FONT_FUN}`;
    const w = ctx.measureText(label).width + 130;
    E.shadow(ctx, 20, 8, 0.25);
    E.rrect(ctx, 0, 0, w, 88, 44); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
    ctx.beginPath(); ctx.arc(44, 44, 30, 0, Math.PI * 2); ctx.fillStyle = E.C.blue; ctx.fill();
    E.dokdoIcon(ctx, 44, 50, 0.55, '#fff');
    E.text(ctx, label, 88, 47, { size: 50, color: E.C.navy, align: 'left' });
    ctx.restore();
  };

  // 독도 실루엣 아이콘 (동도·서도)
  E.dokdoIcon = (ctx, cx, cy, s, color) => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-46, 14); ctx.lineTo(-34, -6); ctx.lineTo(-24, -30); ctx.lineTo(-16, -22); ctx.lineTo(-8, 0); ctx.lineTo(-2, 14);
    ctx.moveTo(2, 14); ctx.lineTo(10, -2); ctx.lineTo(20, -16); ctx.lineTo(30, -12); ctx.lineTo(40, 2); ctx.lineTo(48, 14);
    ctx.fill(); ctx.restore();
  };

  // ---------- 배경: 하늘 + 구름 + 바다 ----------
  E.skySea = (ctx, t, { horizon = 640, sun = true, island = false, islandScale = 1, gulls = true } = {}) => {
    let g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#6ec3f2'); g.addColorStop(1, '#dff3ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 4);
    if (sun) {
      const sg = ctx.createRadialGradient(1580, 170, 10, 1580, 170, 260);
      sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(0.25, 'rgba(255,240,170,0.8)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = sg; ctx.fillRect(1300, 0, 600, 450);
    }
    for (let i = 0; i < 6; i++) {
      const sp = 14 + i * 5, y = 80 + E.rand(i + 3) * 300, sc = 0.6 + E.rand(i + 7) * 0.8;
      const x = ((E.rand(i) * (W + 600) + t * sp) % (W + 600)) - 300;
      E.cloud(ctx, x, y, sc);
    }
    if (island) E.island(ctx, W / 2, horizon + 6, islandScale, t);
    E.sea(ctx, t, horizon);
    if (gulls) E.gulls(ctx, t);
  };

  E.cloud = (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, 7); ctx.arc(50, -20, 52, 0, 7); ctx.arc(110, 0, 42, 0, 7); ctx.arc(60, 18, 40, 0, 7);
    ctx.fill(); ctx.restore();
  };

  E.sea = (ctx, t, top) => {
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, '#3aa3e3'); g.addColorStop(1, '#0e4f93');
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    const layers = [['rgba(255,255,255,0.35)', 0, 10, 0.9, 260], ['rgba(40,140,215,0.9)', 50, 16, -1.3, 340], ['rgba(25,110,190,0.9)', 130, 20, 1.6, 420], ['rgba(16,85,160,0.95)', 230, 24, -1.1, 520]];
    for (const [col, off, amp, spd, len] of layers) {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) {
        const y = top + off + Math.sin(x / len * Math.PI * 2 + t * spd) * amp + Math.sin(x / (len * 0.47) + t * spd * 1.7) * amp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    // 반짝임
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 26; i++) {
      const x = (E.rand(i * 3.1) * W + t * 20 * (E.rand(i) - 0.5)) % W, y = top + 30 + E.rand(i * 7.7) * (H - top - 40);
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i);
      ctx.globalAlpha = a * 0.7; E.rrect(ctx, x, y, 26 + E.rand(i) * 30, 4, 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // 그림 독도 (동도·서도)
  E.island = (ctx, cx, base, s, t) => {
    ctx.save(); ctx.translate(cx, base); ctx.scale(s, s);
    const rock = (pts, c1, c2) => {
      const g = ctx.createLinearGradient(0, -330, 0, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath();
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#3d4a3a'; ctx.lineJoin = 'round'; ctx.stroke();
    };
    // 서도(왼쪽, 더 높고 뾰족)
    rock([[-520, 20], [-470, -60], [-430, -150], [-380, -250], [-330, -330], [-290, -300], [-250, -210], [-200, -160], [-150, -60], [-110, 20]], '#7fae5f', '#6b6b52');
    // 동도(오른쪽)
    rock([[40, 20], [90, -70], [150, -150], [210, -190], [270, -175], [330, -120], [390, -60], [450, 20]], '#8bbb68', '#73705a');
    // 바위 기둥
    rock([[-60, 20], [-50, -50], [-30, -70], [-15, -40], [-10, 20]], '#8d8a75', '#6d6b58');
    rock([[480, 20], [495, -30], [515, -35], [525, 20]], '#8d8a75', '#6d6b58');
    // 등대 & 태극기 (동도)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3d4a3a'; ctx.lineWidth = 4;
    ctx.fillRect(250, -235, 26, 52); ctx.strokeRect(250, -235, 26, 52);
    ctx.fillStyle = '#e53935'; ctx.fillRect(246, -248, 34, 14);
    ctx.beginPath(); ctx.moveTo(190, -190); ctx.lineTo(190, -290); ctx.stroke();
    const wave = Math.sin(t * 4) * 4;
    ctx.save(); ctx.translate(190, -290);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30, wave, 60, 0); ctx.lineTo(60, 40); ctx.quadraticCurveTo(30, 40 + wave, 0, 40); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(30, 20 + wave / 2, 10, Math.PI, 0); ctx.fillStyle = '#d32f2f'; ctx.fill();
    ctx.beginPath(); ctx.arc(30, 20 + wave / 2, 10, 0, Math.PI); ctx.fillStyle = '#1565c0'; ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  E.gulls = (ctx, t, n = 5) => {
    ctx.strokeStyle = '#33414f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const sp = 60 + E.rand(i + 11) * 50;
      const x = ((E.rand(i + 1) * W + t * sp) % (W + 200)) - 100;
      const y = 140 + E.rand(i + 5) * 260 + Math.sin(t * 1.3 + i) * 20;
      const f = Math.sin(t * 8 + i * 2) * 10, s = 0.7 + E.rand(i + 9) * 0.6;
      ctx.beginPath(); ctx.moveTo(x - 24 * s, y - f * s); ctx.quadraticCurveTo(x - 10 * s, y - 14 * s, x, y);
      ctx.quadraticCurveTo(x + 10 * s, y - 14 * s, x + 24 * s, y - f * s); ctx.stroke();
    }
  };

  // 부드러운 무늬 배경 (내용 장면용)
  E.softBg = (ctx, t, c1 = '#e8f6ff', c2 = '#cfeafc') => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 14; i++) {
      const r = 30 + E.rand(i) * 90, x = (E.rand(i + 2) * W + Math.sin(t * 0.2 + i) * 40), y = (E.rand(i + 4) * H + t * (8 + i)) % (H + 200) - 100;
      ctx.beginPath(); ctx.arc(x, H - y, r, 0, 7); ctx.fill();
    }
    // 아래쪽 물결
    ctx.save(); ctx.globalAlpha = 0.9;
    for (const [off, col, spd] of [[0, '#9fd6f7', 1], [40, '#7cc4f0', -1.3]]) {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H - 120 + off + Math.sin(x / 300 + t * spd) * 14);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  };

  // ---------- 캐릭터 ----------
  // st: {talk:0~1 진폭, speaking:bool, t:초, seed}
  E.drawChar = (ctx, key, x, feetY, height, st) => {
    const meta = window.CHARS[key];
    const im = E.img(`assets/chars/${key}_base.png`);
    if (!im || !meta) return;
    const s = height / meta.h;
    const t = st.t, seed = key === 'nari' ? 0 : 1.7;
    const amp = st.talk || 0;
    const bounce = st.speaking ? Math.abs(Math.sin(t * 9 + seed)) * 10 * (0.3 + amp) : 0;
    const breathe = 1 + Math.sin(t * 2.2 + seed) * 0.008;
    const tilt = st.speaking ? Math.sin(t * 3.1 + seed) * 0.022 : Math.sin(t * 0.9 + seed) * 0.01;
    ctx.save();
    ctx.translate(x, feetY - bounce);
    ctx.rotate(tilt);
    ctx.scale(s * (st.flip ? -1 : 1), s * breathe);
    // 그림자
    ctx.save(); ctx.scale(1, 0.18); ctx.beginPath(); ctx.ellipse(0, 40 / 0.18 * 0, meta.w * 0.36, 120, 0, 0, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill(); ctx.restore();
    ctx.translate(-meta.w / 2, -meta.h);
    ctx.drawImage(im, 0, 0);
    // 눈
    const blinkT = (t + seed * 2.3) % 3.9;
    const blink = blinkT < 0.13 ? 1 - Math.abs(blinkT - 0.065) / 0.065 : 0;
    for (const [ex, ey] of meta.eyes) {
      ctx.save(); ctx.translate(ex, ey);
      if (blink > 0.5) {
        ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, 7, 13, 0);
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1b1b1b'; ctx.stroke();
      } else {
        ctx.scale(1, 1 - blink * 0.8);
        ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 15, 0, 0, 7); ctx.fillStyle = '#1b1b1b'; ctx.fill();
        ctx.beginPath(); ctx.arc(-4, -6, 4, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      }
      ctx.restore();
    }
    // 입
    const [mx, my] = meta.mouth;
    ctx.save(); ctx.translate(mx, my);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 6;
    if (amp < 0.12) {
      ctx.beginPath(); ctx.moveTo(-50, -8); ctx.quadraticCurveTo(0, 30, 50, -8); ctx.stroke();
    } else {
      const open = 10 + amp * 34, half = 40 - amp * 8;
      ctx.beginPath(); ctx.moveTo(-half, -8); ctx.quadraticCurveTo(0, 4, half, -8);
      ctx.quadraticCurveTo(half * 0.8, open + 4, 0, open + 8); ctx.quadraticCurveTo(-half * 0.8, open + 4, -half, -8); ctx.closePath();
      ctx.fillStyle = '#8c2f39'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.ellipse(0, open + 6, half * 0.55, open * 0.42, 0, 0, 7); ctx.fillStyle = '#f07c8a'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-half * 0.6, -6, half * 1.2, 7);
      ctx.restore();
      ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // 장면 안에서 누가 말하는지/입 크기 계산
  E.voiceState = (scene, t) => {
    const st = { N: { talk: 0, speaking: false }, S: { talk: 0, speaking: false }, line: null, lineIdx: -1, shown: null, shownIdx: -1 };
    scene.lines.forEach((L, i) => {
      if (t >= L.start - 0.05) { st.shown = L; st.shownIdx = i; }
      if (t >= L.start && t < L.start + L.dur) {
        st.line = L; st.lineIdx = i;
        const f = (t - L.start) * 30, i0 = Math.floor(f), fr = f - i0;
        const a = (L.env[i0] || 0) * (1 - fr) + (L.env[i0 + 1] || 0) * fr;
        st[L.who].talk = Math.min(1, a * 1.15); st[L.who].speaking = true;
      }
    });
    return st;
  };

  // 장면의 '현재 단계' (줄에 붙은 속성 중 가장 최근 값)
  E.latest = (scene, t, key, def = null, lead = 0) => {
    let v = def, at = scene.start;
    for (const L of scene.lines) if (L[key] !== undefined && t >= L.start - lead) { v = L[key]; at = L.start - lead; }
    return { v, at };
  };

  // 자막
  E.subtitle = (ctx, tl, vs, t) => {
    const L = vs.shown; if (!L) return;
    const size = tl.subtitleSize || 48;
    const age = t - L.start;
    const a = E.easeOut(clamp(age / 0.25));
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `${size}px ${E.FONT_FUN}`;
    const lines = E.wrap(ctx, L.text, 1560);
    const lh = size * 1.3, bh = lines.length * lh + 50, bw = Math.min(1720, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 140);
    const bx = (W - bw) / 2, by = H - bh - 30 + (1 - a) * 20;
    E.shadow(ctx, 24, 8, 0.3);
    E.rrect(ctx, bx, by, bw, bh, 28); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); E.noShadow(ctx);
    const col = L.who === 'N' ? E.C.nari : E.C.sani;
    ctx.lineWidth = 6; ctx.strokeStyle = col; E.rrect(ctx, bx, by, bw, bh, 28); ctx.stroke();
    // 이름표
    const name = tl.voices[L.who].name;
    ctx.font = `${size * 0.72}px ${E.FONT_FUN}`;
    const nw = ctx.measureText(name).width + 50;
    E.rrect(ctx, bx + 36, by - size * 0.62, nw, size * 1.05, size * 0.5); ctx.fillStyle = col; ctx.fill();
    E.text(ctx, name, bx + 36 + nw / 2, by - size * 0.62 + size * 0.55, { size: size * 0.72, color: '#fff' });
    lines.forEach((l, i) => E.text(ctx, l, W / 2, by + 28 + lh * (i + 0.5) + 4, { size, color: E.C.ink }));
    ctx.restore();
  };

  // 장면 전환: 파도 와이프 (p: 0→1 덮기, 1→2 걷기)
  E.wipe = (ctx, p, t) => {
    if (p <= 0 || p >= 2) return;
    const cover = p <= 1 ? E.easeInOut(p) : 1 - E.easeInOut(p - 1);
    const fromLeft = p <= 1;
    const span = W + 400;
    const edge = fromLeft ? -200 + cover * span : W + 200 - cover * span;
    const cols = ['#9fd8fb', '#3aa3e3', '#1767ad'];
    cols.forEach((c, k) => {
      const off = (2 - k) * 90 * (fromLeft ? -1 : 1);
      const ex = edge + off;
      ctx.beginPath();
      if (fromLeft) { ctx.moveTo(-10, 0); ctx.lineTo(ex, 0); } else { ctx.moveTo(W + 10, 0); ctx.lineTo(ex, 0); }
      for (let y = 0; y <= H; y += 20) ctx.lineTo(ex + Math.sin(y / 90 + t * 6 + k) * 40 * (fromLeft ? 1 : -1), y);
      if (fromLeft) ctx.lineTo(-10, H); else ctx.lineTo(W + 10, H);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    });
    if (cover > 0.85) {
      ctx.save(); ctx.globalAlpha = (cover - 0.85) / 0.15;
      E.dokdoIcon(ctx, W / 2, H / 2 + 10, 3, 'rgba(255,255,255,0.9)');
      ctx.restore();
    }
  };

  // 별 모양 배지
  E.burst = (ctx, x, y, r, label, p, color = E.C.yellow, size = 44) => {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(E.easeBack(clamp(p)), E.easeBack(clamp(p))); ctx.rotate(-0.12);
    E.shadow(ctx, 20, 8, 0.3);
    ctx.beginPath();
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, rr = i % 2 ? r : r * 0.86; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); E.noShadow(ctx);
    ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
    E.text(ctx, label, 0, 4, { size, color: E.C.navy });
    ctx.restore();
  };

  // 색종이
  E.confetti = (ctx, t0, t, x = W / 2, y = 300, n = 70) => {
    const dt = t - t0; if (dt < 0 || dt > 3.5) return;
    const cols = ['#ffd23f', '#ec5f95', '#3c9a4a', '#1e74c8', '#ff8a3d', '#8e6cf0'];
    for (let i = 0; i < n; i++) {
      const a = E.rand(i) * Math.PI * 2, sp = 400 + E.rand(i + 1) * 700;
      const px = x + Math.cos(a) * sp * dt * 0.7, py = y + Math.sin(a) * sp * dt * 0.5 + 500 * dt * dt;
      ctx.save(); ctx.globalAlpha = clamp(1 - dt / 3.5); ctx.translate(px, py); ctx.rotate(dt * 6 + i);
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
    }
  };
})();
