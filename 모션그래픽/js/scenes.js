// 장면별 그리기. 각 함수: (ctx, scene, t[영상 전체 시각], lt[장면 안 시각], vs[음성 상태], tl[타임라인])
(function () {
  const { W, H, C } = E;
  const S = (window.SCENES = {});
  const clamp = E.clamp, prog = E.prog;

  // 캐릭터 배치 ------------------------------------------------------------
  function charsWide(ctx, t, vs, enterAt = 0.2, lt = 99) {
    const pN = E.easeBack(prog(lt, enterAt, 0.8)), pS = E.easeBack(prog(lt, enterAt + 0.2, 0.8));
    E.drawChar(ctx, 'nari', E.lerp(-300, 330, pN), 1075, 720, { ...vs.N, t });
    E.drawChar(ctx, 'sani', E.lerp(W + 300, W - 330, pS), 1075, 720, { ...vs.S, t });
  }
  function charsSide(ctx, t, vs, lt) {
    const p = E.easeOut(prog(lt, 0.0, 0.7));
    const off = (1 - p) * 500;
    const hN = vs.N.speaking ? 600 : 570, hS = vs.S.speaking ? 600 : 570;
    E.drawChar(ctx, 'nari', 1500 + off, 1080, hN, { ...vs.N, t });
    E.drawChar(ctx, 'sani', 1765 + off, 1085, hS, { ...vs.S, t });
  }
  S.layoutChars = { wide: charsWide, side: charsSide };

  // 타이틀 ----------------------------------------------------------------
  S.title = (ctx, sc, t, lt, vs, tl) => {
    E.skySea(ctx, t, { horizon: 660, island: true, islandScale: E.lerp(0.55, 0.62, E.easeOut(prog(lt, 0, 3))) });
    const p = E.easeElastic(prog(lt, 0.4, 1.4));
    ctx.save(); ctx.translate(W / 2, 210); ctx.scale(p, p);
    E.text(ctx, tl.title, 0, 0, { font: E.FONT_TITLE, size: 150, color: '#fff', stroke: C.navy, strokeW: 26 });
    ctx.restore();
    const ps = E.easeBack(prog(lt, 1.3, 0.7));
    if (ps > 0) {
      ctx.save(); ctx.globalAlpha = clamp(ps); ctx.translate(0, (1 - ps) * 40);
      E.pill(ctx, W / 2, 315, tl.subtitle, { size: 50, bg: C.nari, align: 'center' });
      ctx.restore();
    }
    const pa = E.easeOut(prog(lt, 1.8, 0.6));
    if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; E.pill(ctx, W / 2, 430, tl.audience + ' 영상', { size: 34, bg: 'rgba(22,58,107,0.85)', align: 'center' }); ctx.restore(); }
    charsWide(ctx, t, vs, 0.9, lt);
  };

  // 장 구분 카드 ------------------------------------------------------------
  S.chapter = (ctx, sc, t, lt, vs) => {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1767ad'); g.addColorStop(1, '#0d3b72');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.18; E.sea(ctx, t, 820); ctx.restore();
    const p = E.easeBack(prog(lt, 0.2, 0.7));
    ctx.save(); ctx.translate(W / 2 - 160, 470); ctx.scale(p, p);
    ctx.beginPath(); ctx.arc(0, 0, 150, 0, 7); ctx.fillStyle = C.yellow; ctx.fill();
    E.text(ctx, String(sc.num).padStart(2, '0'), 0, 8, { font: E.FONT_TITLE, size: 150, color: C.navy });
    ctx.restore();
    const p2 = E.easeOut(prog(lt, 0.45, 0.7));
    ctx.save(); ctx.globalAlpha = p2; ctx.beginPath(); ctx.rect(W / 2 + 20, 300, 1000, 340); ctx.clip();
    E.text(ctx, `${sc.num}장`, W / 2 + 30 - (1 - p2) * 300, 400, { size: 60, color: '#9fd8fb', align: 'left' });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = p2;
    ctx.font = `110px ${E.FONT_TITLE}`;
    const words = E.wrap(ctx, sc.heading, 980);
    words.forEach((w, i) => E.text(ctx, w, W / 2 + 30 - (1 - p2) * 300, 510 + i * 120, { font: E.FONT_TITLE, size: 110, color: '#fff', align: 'left' }));
    ctx.restore();
    // 말하는 캐릭터가 아래에서 쏙
    const who = sc.lines[0].who, key = who === 'N' ? 'nari' : 'sani';
    const pc = E.easeBack(prog(lt, 0.3, 0.7));
    E.drawChar(ctx, key, 260, 1080 + (1 - pc) * 600, 640, { ...vs[who], t });
  };

  // 지도 ------------------------------------------------------------------
  const PLACES = { dokdo: [131.8695, 37.2414], ulleung: [130.866, 37.497], oki: [133.19, 36.30], okiLbl: [133.25, 36.12] };
  const VIEWS = {
    korea: [124.2, 32.6, 136.6, 41.0], ulleung: [127.2, 34.4, 134.6, 39.6], dokdo: [128.6, 35.4, 134.0, 39.0],
    see: [129.5, 36.1, 132.9, 38.7], dist1: [129.9, 36.5, 132.7, 38.2], dist2: [129.5, 35.6, 134.4, 38.3],
  };
  function mapProj(view, box) {
    const [lo0, la0, lo1, la1] = view; const k = Math.cos(37.5 * Math.PI / 180);
    const vw = (lo1 - lo0) * k, vh = la1 - la0;
    const s = Math.min(box.w / vw, box.h / vh);
    const cx = (lo0 + lo1) / 2, cy = (la0 + la1) / 2;
    return (lon, lat) => [box.x + box.w / 2 + (lon - cx) * k * s, box.y + box.h / 2 - (lat - cy) * s];
  }
  function lerpView(a, b, p) { return a.map((v, i) => E.lerp(v, b[i], p)); }
  function drawLand(ctx, P, opts = {}) {
    ctx.beginPath();
    for (const poly of window.MAPDATA) {
      poly.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.closePath();
    }
    ctx.fillStyle = opts.land || '#f4e8bf'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = opts.coast || '#b49a62'; ctx.stroke();
  }
  function mapLabel(ctx, x, y, txt, size, color = C.navy, stroke = '#fff') {
    E.text(ctx, txt, x, y, { size, color, stroke, strokeW: 10 });
  }
  function dashLine(ctx, a, b, p, t, color, label, size = 50, labelOff = [0, -50]) {
    if (p <= 0) return;
    const x = E.lerp(a[0], b[0], p), y = E.lerp(a[1], b[1], p);
    ctx.save(); ctx.setLineDash([22, 16]); ctx.lineDashOffset = -t * 40; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(x, y); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.stroke(); ctx.restore();
    if (p > 0.6 && label) {
      const q = E.easeBack(prog(p, 0.6, 0.4));
      const mx = (a[0] + b[0]) / 2 + labelOff[0], my = (a[1] + b[1]) / 2 + labelOff[1];
      ctx.save(); ctx.translate(mx, my); ctx.scale(q, q);
      E.pill(ctx, 0, -size * 0.85, label, { size, bg: color, align: 'center' });
      ctx.restore();
    }
  }
  function marker(ctx, x, y, t, color = C.red, r = 16) {
    const pulse = (t * 1.2) % 1;
    ctx.beginPath(); ctx.arc(x, y, r + pulse * 50, 0, 7); ctx.strokeStyle = color; ctx.globalAlpha = 1 - pulse; ctx.lineWidth = 5; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
  S.map = (ctx, sc, t, lt, vs, tl) => {
    E.softBg(ctx, t);
    const box = { x: 70, y: 150, w: 1290, h: 760 };
    const steps = ['korea', 'ulleung', 'dokdo', 'see', 'dist1', 'dist2'];
    const cur = E.latest(sc, t, 'step', 'korea', 0.2);
    const order = sc.lines.map((l) => l.step);
    const ci = order.indexOf(cur.v), prevStep = ci > 0 ? order[ci - 1] : 'korea';
    const pv = E.easeInOut(prog(t, cur.at, 1.4));
    let view = lerpView(VIEWS[prevStep], VIEWS[cur.v], pv);
    if (sc.detail && (cur.v === 'see')) view = lerpView(VIEWS.dist2, VIEWS.see, pv);
    const P = mapProj(view, box);
    const reached = (s) => { const i = order.indexOf(s); return i >= 0 && i <= ci; };
    const atOf = (s) => { const L = sc.lines.find((l) => l.step === s); return L ? L.start - 0.2 : 1e9; };
    // 패널
    ctx.save();
    E.shadow(ctx, 40, 14, 0.3); E.rrect(ctx, box.x, box.y, box.w, box.h, 36); ctx.fillStyle = '#9ed3f5'; ctx.fill(); E.noShadow(ctx);
    E.rrect(ctx, box.x, box.y, box.w, box.h, 36); ctx.clip();
    const sg = ctx.createLinearGradient(0, box.y, 0, box.y + box.h); sg.addColorStop(0, '#a8daf7'); sg.addColorStop(1, '#6cb8ea'); ctx.fillStyle = sg; ctx.fillRect(box.x, box.y, box.w, box.h);
    // 위경도 격자
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let lo = 120; lo <= 140; lo++) { const [x1, y1] = P(lo, 30), [x2, y2] = P(lo, 45); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
    for (let la = 30; la <= 45; la++) { const [x1, y1] = P(120, la), [x2, y2] = P(140, la); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
    drawLand(ctx, P);
    const zoom = (P(1, 0)[0] - P(0, 0)[0]);
    // 라벨
    const [kx, ky] = P(128.2, 36.6); mapLabel(ctx, kx, ky, '대한민국', clamp(zoom * 0.42, 34, 70), C.navy);
    const [jx, jy] = P(135.3, 35.3); mapLabel(ctx, jx, jy, '일본', clamp(zoom * 0.36, 30, 60), '#6b5b3e');
    const [ex, ey] = P(131.4, 39.3);
    ctx.save(); ctx.globalAlpha = 0.9; E.text(ctx, '동 해', ex, ey, { font: E.FONT_TITLE, size: clamp(zoom * 0.7, 60, 120), color: '#1e74c8', stroke: 'rgba(255,255,255,0.8)', strokeW: 12 }); ctx.restore();
    // 울릉도
    const U = P(...PLACES.ulleung), D = P(...PLACES.dokdo), O = P(...PLACES.oki);
    if (reached('ulleung') || reached('dokdo') || sc.detail) {
      const pu = E.easeBack(prog(t, Math.min(atOf('ulleung'), atOf('dokdo')) + 0.6, 0.6));
      if (pu > 0) { ctx.save(); ctx.globalAlpha = clamp(pu); marker(ctx, U[0], U[1], t, '#2e7d32', 12); mapLabel(ctx, U[0] - 10, U[1] - 52 * pu, '울릉도', 44, '#1b5e20'); ctx.restore(); }
    }
    if (sc.detail || reached('dist2')) {
      const po = E.easeBack(prog(t, sc.detail ? atOf('dist2') : 0, 0.6));
      if (po > 0) { ctx.save(); ctx.globalAlpha = clamp(po); mapLabel(ctx, ...P(...PLACES.okiLbl).map((v, i) => v + (i ? 50 : 0)), '오키섬', 40, '#6b5b3e'); ctx.restore(); }
    }
    // 거리선
    if (reached('dist1')) dashLine(ctx, U, D, E.easeInOut(prog(t, atOf('dist1') + 0.3, 1.4)), t, C.sani, '87.4km', 46, [0, 110]);
    if (reached('dist2')) dashLine(ctx, O, D, E.easeInOut(prog(t, atOf('dist2') + 0.3, 1.6)), t, '#8d6e63', '157.5km', 46, [110, 40]);
    // 보이는 독도
    if (cur.v === 'see') {
      const ps = E.easeOut(prog(t, cur.at + 0.8, 1.2));
      ctx.save(); ctx.globalAlpha = ps;
      ctx.setLineDash([4, 18]); ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(U[0], U[1]); ctx.lineTo(E.lerp(U[0], D[0], ps), E.lerp(U[1], D[1], ps)); ctx.stroke(); ctx.setLineDash([]);
      // 눈 아이콘
      ctx.translate(U[0], U[1] - 120); ctx.scale(ps, ps);
      ctx.beginPath(); ctx.ellipse(0, 0, 60, 34, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.navy; ctx.stroke();
      ctx.beginPath(); ctx.arc(10, 0, 20, 0, 7); ctx.fillStyle = C.navy; ctx.fill();
      ctx.restore();
      const pl = E.easeBack(prog(t, cur.at + 1.6, 0.6));
      if (pl > 0) { ctx.save(); ctx.translate((U[0] + D[0]) / 2, Math.max(U[1], D[1]) + 200); ctx.scale(pl, pl); E.pill(ctx, 0, 0, '맑은 날엔 맨눈으로 보여요!', { size: 42, bg: C.nari, align: 'center' }); ctx.restore(); }
    }
    // 독도
    const pd = E.easeElastic(prog(t, Math.min(atOf('dokdo'), sc.detail ? atOf('korea') + 1 : 1e9) + 0.5, 1.0));
    if (pd > 0) {
      marker(ctx, D[0], D[1], t, C.red, 16 * pd);
      ctx.save(); ctx.translate(D[0] + 10, D[1] - 70); ctx.scale(pd, pd); E.pill(ctx, 0, -30, '독도', { size: 52, bg: C.red, align: 'center' }); ctx.restore();
    }
    ctx.restore();
    // 안내 카드
    const card = (label, lines, at, color) => {
      const p = E.easeBack(prog(t, at, 0.6)); if (p <= 0) return;
      ctx.save(); ctx.translate(box.x + 40, box.y + box.h - 40); ctx.scale(p, p);
      ctx.font = `44px ${E.FONT_FUN}`;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 80, h = 70 + lines.length * 62;
      E.shadow(ctx, 20, 8, 0.25); E.rrect(ctx, 0, -h, w, h, 24); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
      E.rrect(ctx, 0, -h, w, 54, 24); ctx.fillStyle = color; ctx.fill(); ctx.fillRect(0, -h + 30, w, 24);
      E.text(ctx, label, 30, -h + 29, { size: 32, color: '#fff', align: 'left' });
      lines.forEach((l, i) => E.text(ctx, l, 40, -h + 100 + i * 62, { size: 44, color: C.ink, align: 'left' }));
      ctx.restore();
    };
    if (sc.detail) {
      if (cur.v === 'korea') card('주소', ['경상북도 울릉군', '울릉읍 독도리'], atOf('korea') + 0.6, C.blue);
      if (cur.v === 'dokdo') card('위치', ['북위 37° 14′', '동경 131° 52′'], atOf('dokdo') + 0.6, C.red);
    }
    E.heading(ctx, sc.heading, lt);
    charsSide(ctx, t, vs, lt);
  };

  // 사진 ------------------------------------------------------------------
  const PHOTO = { x: 70, y: 150, w: 1290, h: 760 };
  function photoAt(sc, t) {
    const list = [];
    sc.lines.forEach((L) => { if (L.photo && (!list.length || list[list.length - 1].photo !== L.photo || list[list.length - 1].caption !== L.caption)) list.push({ ...L, at: L.start - 0.25 }); });
    let i = 0; list.forEach((p, k) => { if (t >= p.at) i = k; });
    return { list, i };
  }
  function drawPhotoFrame(ctx, ph, t, alpha, kb) {
    const im = E.img('assets/photos/' + ph.photo); const b = PHOTO;
    ctx.save(); ctx.globalAlpha = alpha;
    E.rrect(ctx, b.x, b.y, b.w, b.h, 30); ctx.clip();
    ctx.fillStyle = '#123'; ctx.fillRect(b.x, b.y, b.w, b.h);
    if (im) {
      const portrait = im.height > im.width;
      if (portrait) { // 세로 사진: 흐린 배경 + 가운데 원본
        ctx.filter = 'blur(30px) brightness(0.7)'; E.drawImageFit(ctx, im, b.x - 40, b.y - 40, b.w + 80, b.h + 80, 'cover'); ctx.filter = 'none';
        E.drawImageFit(ctx, im, b.x, b.y, b.w, b.h, 'contain', 1 + kb * 0.05);
      } else {
        const dir = (ph.photo.length % 2 ? 1 : -1);
        E.drawImageFit(ctx, im, b.x, b.y, b.w, b.h, 'cover', 1.04 + kb * 0.1, dir * (kb * 2 - 1) * 0.8, -0.2 + kb * 0.3);
      }
    }
    ctx.restore();
  }
  S.photo = (ctx, sc, t, lt, vs, tl) => {
    E.softBg(ctx, t);
    const { list, i } = photoAt(sc, t);
    const b = PHOTO;
    const pIn = E.easeBack(prog(lt, 0.05, 0.7));
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(0.85 + 0.15 * pIn, 0.85 + 0.15 * pIn); ctx.rotate((1 - pIn) * -0.05); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    ctx.globalAlpha = clamp(pIn * 2);
    E.shadow(ctx, 40, 16, 0.35); E.rrect(ctx, b.x - 14, b.y - 14, b.w + 28, b.h + 28, 40); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
    const kbOf = (k) => { const s = list[k].at, e = k + 1 < list.length ? list[k + 1].at + 0.6 : sc.end; return clamp((t - s) / Math.max(1, e - s)); };
    if (i > 0) drawPhotoFrame(ctx, list[i - 1], t, 1, kbOf(i - 1));
    const fade = i > 0 ? E.easeInOut(prog(t, list[i].at, 0.6)) : 1;
    drawPhotoFrame(ctx, list[i], t, fade, kbOf(i));
    const ph = list[i];
    // 캡션
    if (ph.caption) {
      const pc = E.easeOut(prog(t, Math.max(ph.at, sc.start + 0.4) + 0.2, 0.5));
      ctx.save(); ctx.globalAlpha = pc; E.pill(ctx, b.x + 30 - (1 - pc) * 40, b.y + b.h - 110, ph.caption, { size: 44, bg: 'rgba(22,58,107,0.88)' }); ctx.restore();
    }
    // 출처
    const cr = (window.PHOTO_CREDITS || {})[ph.photo];
    if (cr) {
      ctx.font = `22px ${E.FONT_BODY}`; const cw = ctx.measureText('사진: ' + cr).width + 30;
      E.rrect(ctx, b.x + b.w - cw - 16, b.y + b.h - 50, cw, 36, 18); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      E.text(ctx, '사진: ' + cr, b.x + b.w - 16 - cw / 2, b.y + b.h - 31, { font: E.FONT_BODY, size: 22, color: '#fff' });
    }
    ctx.restore();
    // 장식 효과
    if (ph.badge) E.burst(ctx, b.x + b.w - 120, b.y + 110, 120, ph.badge, prog(t, ph.at + 0.6, 0.5), C.yellow, ph.badge.length > 4 ? 36 : 46);
    if (ph.volcano) volcanoInset(ctx, t, prog(t, ph.at + 0.4, 0.5), t - ph.at);
    if (ph.sea) fishSwim(ctx, t, t - ph.at);
    if (ph.address) addressCard(ctx, prog(t, ph.at + 0.5, 0.6));
    if (ph.stamp) stamp(ctx, ph.stamp, prog(t, list.find((x) => x.stamp).at + 0.8, 0.45));
    E.heading(ctx, sc.heading, lt);
    charsSide(ctx, t, vs, lt);
  };

  function volcanoInset(ctx, t, p, age) {
    if (p <= 0) return;
    const x = 960, y = 180, w = 380, h = 280;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(E.easeBack(p), E.easeBack(p)); ctx.translate(-w / 2, -h / 2);
    E.shadow(ctx, 20, 8, 0.3); E.rrect(ctx, 0, 0, w, h, 24); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
    E.rrect(ctx, 10, 10, w - 20, h - 20, 18); ctx.save(); ctx.clip();
    ctx.fillStyle = '#cdeeff'; ctx.fillRect(0, 0, w, 110);
    const sg = ctx.createLinearGradient(0, 100, 0, h); sg.addColorStop(0, '#3aa3e3'); sg.addColorStop(1, '#0e3f7a'); ctx.fillStyle = sg; ctx.fillRect(0, 100, w, h);
    const grow = E.easeOut(clamp(age / 3.5));
    const top = E.lerp(h - 10, 70, grow);
    ctx.beginPath(); ctx.moveTo(30, h); ctx.lineTo(w / 2 - 30, top); ctx.lineTo(w / 2 + 30, top); ctx.lineTo(w - 30, h); ctx.closePath();
    ctx.fillStyle = '#6d5a4a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(w / 2 - 12, top); ctx.lineTo(w / 2 + 12, top); ctx.lineTo(w / 2 + 6, h); ctx.lineTo(w / 2 - 6, h); ctx.fillStyle = '#ff7a1a'; ctx.fill();
    for (let i = 0; i < 14; i++) {
      const ph = (age * 0.9 + E.rand(i)) % 1;
      ctx.beginPath(); ctx.arc(w / 2 + (E.rand(i + 3) - 0.5) * 120 * ph, top - ph * 70, 8 * (1 - ph), 0, 7);
      ctx.fillStyle = i % 2 ? '#ffb300' : '#ff5722'; ctx.fill();
    }
    ctx.restore();
    E.text(ctx, '바다 밑 화산 → 화산섬', w / 2, h - 30, { size: 30, color: '#fff', stroke: C.navy, strokeW: 8 });
    ctx.restore();
  }
  function fishSwim(ctx, t, age) {
    const b = PHOTO;
    ctx.save(); E.rrect(ctx, b.x, b.y, b.w, b.h, 30); ctx.clip();
    for (let i = 0; i < 9; i++) {
      const sp = 120 + E.rand(i) * 120, dir = i % 2 ? 1 : -1;
      const x = dir > 0 ? b.x - 100 + ((age * sp + E.rand(i + 1) * 900) % (b.w + 200)) : b.x + b.w + 100 - ((age * sp + E.rand(i + 1) * 900) % (b.w + 200));
      const y = b.y + 420 + E.rand(i + 2) * 280 + Math.sin(age * 2 + i) * 12;
      const s = 0.8 + E.rand(i + 5) * 0.6, col = ['#ffb74d', '#ff8a65', '#fff176', '#81d4fa'][i % 4];
      ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 18, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#33414f'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-54, -16 + Math.sin(age * 12 + i) * 4); ctx.lineTo(-54, 16 + Math.sin(age * 12 + i) * 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, -4, 4, 0, 7); ctx.fillStyle = '#222'; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function addressCard(ctx, p) {
    if (p <= 0) return;
    const b = PHOTO;
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + 140); ctx.scale(E.easeBack(p), E.easeBack(p)); ctx.rotate(-0.03);
    const w = 900, h = 170;
    E.shadow(ctx, 30, 12, 0.35); ctx.fillStyle = '#fffaf0'; ctx.fillRect(-w / 2, -h / 2, w, h); E.noShadow(ctx);
    ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.setLineDash([30, 14]); ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); ctx.setLineDash([]);
    E.text(ctx, '주소', -w / 2 + 90, -10, { size: 40, color: C.red });
    E.text(ctx, '경상북도 울릉군 울릉읍 독도리', 60, 0, { size: 54, color: C.ink });
    ctx.restore();
  }
  function stamp(ctx, label, p) {
    if (p <= 0) return;
    const b = PHOTO;
    const s = E.lerp(2.4, 1, E.easeOut(p));
    ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(b.x + b.w / 2, b.y + b.h / 2 - 40); ctx.scale(s, s); ctx.rotate(-0.12);
    ctx.font = `86px ${E.FONT_TITLE}`; const w = ctx.measureText(label).width + 90;
    ctx.fillStyle = 'rgba(255,255,255,0.82)'; E.rrect(ctx, -w / 2, -80, w, 160, 26); ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = C.red; E.rrect(ctx, -w / 2, -80, w, 160, 26); ctx.stroke();
    E.text(ctx, label, 0, 6, { font: E.FONT_TITLE, size: 86, color: C.red });
    ctx.restore();
  }

  // 숫자 카드 ----------------------------------------------------------------
  S.facts = (ctx, sc, t, lt, vs) => {
    E.softBg(ctx, t);
    const cards = sc.cards, n = cards.length, cw = 400, gap = 40, x0 = 70, y0 = 230, ch = 560;
    const cur = E.latest(sc, t, 'card', -1, 0.1).v;
    cards.forEach((c, i) => {
      const L = sc.lines.find((l) => l.card === i); const at = L ? L.start - 0.1 : 0;
      const p = E.easeBack(prog(t, at, 0.7)); if (p <= 0) return;
      const x = x0 + i * (cw + gap), active = i === cur;
      ctx.save(); ctx.translate(x + cw / 2, y0 + ch / 2 + (1 - p) * 200); ctx.scale(active ? 1.04 : 0.97, active ? 1.04 : 0.97); ctx.globalAlpha = clamp(p);
      E.shadow(ctx, active ? 40 : 20, 12, active ? 0.35 : 0.2);
      E.rrect(ctx, -cw / 2, -ch / 2, cw, ch, 36); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
      const col = [C.blue, C.sani, C.nari][i % 3];
      E.rrect(ctx, -cw / 2, -ch / 2, cw, 120, 36); ctx.fillStyle = col; ctx.fill(); ctx.fillRect(-cw / 2, -ch / 2 + 80, cw, 40);
      E.text(ctx, c.label, 0, -ch / 2 + 62, { size: 52, color: '#fff' });
      // 아이콘
      ctx.save(); ctx.translate(0, -60);
      if (i === 0) { E.dokdoIcon(ctx, 0, 20, 2.4, col); for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(-110 + k * 36, 64 + (k % 2) * 10, 8 + (k % 3) * 3, 0, 7); ctx.fillStyle = col; ctx.fill(); } }
      if (i === 1) { ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.strokeRect(-120, -40, 240, 130); ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 90); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 25, 30, 0, 7); ctx.stroke(); }
      if (i === 2) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-120, 90); ctx.lineTo(-30, -60); ctx.lineTo(10, 10); ctx.lineTo(50, -20); ctx.lineTo(120, 90); ctx.fill(); }
      ctx.restore();
      const cp = E.easeOut(prog(t, at + 0.3, 1.6));
      const v = c.value * cp;
      const str = (c.decimals ? v.toFixed(c.decimals) : Math.round(v).toLocaleString('ko-KR'));
      E.text(ctx, str + c.suffix, 0, 120, { font: E.FONT_TITLE, size: str.length > 6 ? 76 : 96, color: C.ink });
      E.text(ctx, c.sub, 0, 215, { size: 36, color: '#5b6b7b' });
      ctx.restore();
    });
    E.heading(ctx, sc.heading, lt);
    charsSide(ctx, t, vs, lt);
  };

  // 연표 ------------------------------------------------------------------
  S.timeline = (ctx, sc, t, lt, vs) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff6e3'); g.addColorStop(1, '#f3e2bd');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25; E.sea(ctx, t, 1000); ctx.globalAlpha = 1;
    const ev = sc.events, n = ev.length;
    const curR = E.latest(sc, t, 'event', -1, 0.15); const cur = curR.v;
    const x0 = 150, x1 = 1330, y = 210;
    const pl = E.easeOut(prog(lt, 0.2, 0.9));
    ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#c9a66b';
    ctx.beginPath(); ctx.moveTo(x0 - 40, y); ctx.lineTo(E.lerp(x0 - 40, x1 + 40, pl), y); ctx.stroke();
    ev.forEach((e, i) => {
      const x = n === 1 ? (x0 + x1) / 2 : E.lerp(x0, x1, i / (n - 1));
      const p = E.easeBack(prog(lt, 0.4 + i * 0.12, 0.5)); if (p <= 0) return;
      const done = i <= cur, active = i === cur;
      ctx.save(); ctx.translate(x, y); ctx.scale(p * (active ? 1.25 : 1), p * (active ? 1.25 : 1));
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fillStyle = e.warn ? (done ? C.red : '#e8c9c9') : (done ? C.blue : '#cfd8e3'); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.restore();
      E.text(ctx, e.year, x, y - 62, { font: E.FONT_TITLE, size: active ? 48 : 38, color: done ? (e.warn ? C.red : C.navy) : '#9aa8b8' });
    });
    // 카드
    if (cur >= 0) {
      const e = ev[cur], ap = E.easeBack(prog(t, curR.at, 0.6));
      const bx = 70, by = 310, bw = 1290, bh = 590;
      ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(0.9 + 0.1 * ap, 0.9 + 0.1 * ap); ctx.globalAlpha = clamp(ap * 1.5); ctx.translate(-bx - bw / 2, -by - bh / 2);
      E.shadow(ctx, 40, 14, 0.25); E.rrect(ctx, bx, by, bw, bh, 34); ctx.fillStyle = '#fffdf6'; ctx.fill(); E.noShadow(ctx);
      ctx.lineWidth = 5; ctx.strokeStyle = e.warn ? C.red : '#d8bd85'; E.rrect(ctx, bx, by, bw, bh, 34); ctx.stroke();
      const ix = bx + 30, iy = by + 30, iw = 470, ih = bh - 60;
      if (e.img) {
        ctx.save(); E.rrect(ctx, ix, iy, iw, ih, 20); ctx.clip(); ctx.fillStyle = '#e9dcc0'; ctx.fillRect(ix, iy, iw, ih);
        const kb = clamp((t - curR.at) / 8);
        E.drawImageFit(ctx, E.img('assets/photos/' + e.img), ix, iy, iw, ih, e.img === 'scapin677.jpg' ? 'contain' : 'cover', 1 + kb * 0.08, 0, -1 + kb * 0.6);
        ctx.restore();
        const cr = (window.PHOTO_CREDITS || {})[e.img];
        if (cr) { E.text(ctx, cr, ix + iw / 2, iy + ih - 20, { font: E.FONT_BODY, size: 20, color: '#fff', stroke: 'rgba(0,0,0,0.6)', strokeW: 6 }); }
      } else {
        // 옛 문서 느낌 인용
        ctx.save(); E.rrect(ctx, ix, iy, iw, ih, 20); ctx.fillStyle = e.warn ? '#fbe9e7' : '#f1e3c2'; ctx.fill();
        ctx.strokeStyle = e.warn ? C.red : '#b8975a'; ctx.lineWidth = 4; E.rrect(ctx, ix + 14, iy + 14, iw - 28, ih - 28, 12); ctx.stroke();
        const qs = e.quote.split('\n');
        qs.forEach((q, k) => E.text(ctx, q, ix + iw / 2, iy + ih / 2 + (k - (qs.length - 1) / 2) * 70, { font: E.FONT_BODY, size: 46, color: e.warn ? '#b71c1c' : '#5d4320', weight: 'bold' }));
        E.text(ctx, '“', ix + 50, iy + 70, { font: E.FONT_TITLE, size: 110, color: 'rgba(120,90,40,0.35)' });
        ctx.restore();
      }
      const tx = ix + iw + 50;
      E.text(ctx, e.year + (e.year.endsWith('년') ? '' : '년'), tx, by + 120, { font: E.FONT_TITLE, size: 110, color: e.warn ? C.red : C.navy, align: 'left' });
      ctx.font = `62px ${E.FONT_FUN}`;
      E.wrap(ctx, e.label, bw - iw - 120).forEach((l, k) => E.text(ctx, l, tx, by + 250 + k * 76, { size: 62, color: C.ink, align: 'left' }));
      if (e.note) {
        ctx.font = `40px ${E.FONT_FUN}`;
        E.wrap(ctx, e.note, bw - iw - 140).forEach((l, k) => E.pill(ctx, tx, by + 400 + k * 80, l, { size: 38, bg: e.warn ? C.red : '#b8975a' }));
      }
      ctx.restore();
    } else {
      const p = E.easeBack(prog(lt, 0.6, 0.6));
      ctx.save(); ctx.translate(715, 600); ctx.scale(p, p);
      E.text(ctx, '옛 기록 속 독도', 0, 0, { font: E.FONT_TITLE, size: 110, color: C.navy, stroke: '#fff', strokeW: 16 });
      ctx.restore();
    }
    E.heading(ctx, sc.heading, lt, 70, 44);
    charsSide(ctx, t, vs, lt);
  };

  // 해류 ------------------------------------------------------------------
  S.currents = (ctx, sc, t, lt, vs) => {
    E.softBg(ctx, t);
    const box = { x: 70, y: 150, w: 1290, h: 760 };
    const step = E.latest(sc, t, 'step', 0, 0.1);
    ctx.save();
    E.shadow(ctx, 40, 14, 0.3); E.rrect(ctx, box.x, box.y, box.w, box.h, 36); ctx.fillStyle = '#9ed3f5'; ctx.fill(); E.noShadow(ctx);
    E.rrect(ctx, box.x, box.y, box.w, box.h, 36); ctx.clip();
    ctx.fillStyle = '#86c7ef'; ctx.fillRect(box.x, box.y, box.w, box.h);
    const P = mapProj([126.5, 34.4, 136.5, 41.6], box);
    drawLand(ctx, P);
    const path = (pts) => pts.map((p) => P(...p));
    const cold = path([[131.2, 42.2], [130.4, 41.2], [129.9, 40.2], [129.7, 39.2], [129.75, 38.3], [129.95, 37.6]]);
    const warm = path([[128.9, 34.6], [129.4, 35.3], [129.7, 36.2], [129.9, 37.0], [130.5, 37.55], [131.5, 37.75], [132.8, 37.85], [134.2, 38.2]]);
    const flow = (pts, col, p, lbl, lpos) => {
      if (p <= 0) return;
      ctx.save();
      const total = pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash([total * p, total]);
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
      ctx.lineWidth = 46; ctx.strokeStyle = col + '88'; ctx.stroke();
      ctx.setLineDash([26, 30]); ctx.lineDashOffset = -t * 90; ctx.lineWidth = 12; ctx.strokeStyle = '#fff';
      if (p >= 1) ctx.stroke();
      ctx.restore();
      if (p >= 1) { // 화살촉
        const a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.save(); ctx.translate(...b); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(-20, -42); ctx.lineTo(-20, 42); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
        const q = E.easeBack(prog(p, 1, 0.01));
        E.pill(ctx, lpos[0], lpos[1], lbl, { size: 40, bg: col, align: 'center' });
      }
    };
    const s1 = sc.lines[0].start;
    flow(cold, '#1565c0', E.easeInOut(prog(t, s1 + 0.2, 1.8)), '북한 한류 (차가움)', [P(131.6, 40.3)[0], P(131.6, 40.3)[1]]);
    flow(warm, '#e64a19', E.easeInOut(prog(t, s1 + 1.4, 2.0)), '동한 난류 (따뜻함)', [P(132.6, 36.6)[0], P(132.6, 36.6)[1]]);
    const D = P(...PLACES.dokdo), U = P(...PLACES.ulleung);
    if (step.v >= 2) {
      const pz = E.easeOut(prog(t, step.at, 1));
      const r = 150 + Math.sin(t * 2) * 10;
      const rg = ctx.createRadialGradient(D[0] - 60, D[1], 10, D[0] - 60, D[1], r * 1.4);
      rg.addColorStop(0, `rgba(255,235,59,${0.55 * pz})`); rg.addColorStop(1, 'rgba(255,235,59,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(D[0] - 60, D[1], r * 1.4, 0, 7); ctx.fill();
      ctx.save(); ctx.globalAlpha = pz; E.pill(ctx, D[0] - 60, D[1] + 70, '조경 수역', { size: 46, bg: '#f9a825', align: 'center' }); ctx.restore();
      // 물고기
      for (let i = 0; i < 8; i++) {
        const a = t * (0.6 + E.rand(i) * 0.5) + i * 0.8, rr = 90 + E.rand(i + 2) * 70;
        const fx = D[0] - 60 + Math.cos(a) * rr * 1.4, fy = D[1] + Math.sin(a) * rr * 0.6;
        ctx.save(); ctx.globalAlpha = pz; ctx.translate(fx, fy); ctx.rotate(a + Math.PI / 2); ctx.scale(0.8, 0.8);
        ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, 7); ctx.fillStyle = ['#ffb74d', '#fff176', '#90caf9'][i % 3]; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-40, -12); ctx.lineTo(-40, 12); ctx.fill(); ctx.restore();
      }
    }
    marker(ctx, D[0], D[1], t, C.red, 14); E.text(ctx, '독도', D[0] + 70, D[1] - 30, { size: 44, color: C.red, stroke: '#fff', strokeW: 10 });
    E.text(ctx, '울릉도', U[0] - 10, U[1] - 40, { size: 38, color: '#1b5e20', stroke: '#fff', strokeW: 10 });
    ctx.restore();
    // 메탄 하이드레이트 인셋
    if (step.v >= 3) {
      const p = E.easeBack(prog(t, step.at + 0.3, 0.6));
      const x = 900, y = 520, w = 430, h = 360;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(p, p); ctx.translate(-w / 2, -h / 2);
      E.shadow(ctx, 30, 10, 0.35); E.rrect(ctx, 0, 0, w, h, 26); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
      E.rrect(ctx, 12, 12, w - 24, h - 24, 18); ctx.save(); ctx.clip();
      const g2 = ctx.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, '#1767ad'); g2.addColorStop(0.6, '#0b2f5a'); g2.addColorStop(0.61, '#6d5a4a'); g2.addColorStop(1, '#4e3f33');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        const cx = 50 + (i % 5) * 80 + (i > 4 ? 40 : 0), cy = 255 + (i > 4 ? 45 : 0);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.785);
        ctx.fillStyle = 'rgba(220,245,255,0.9)'; ctx.fillRect(-18, -18, 36, 36); ctx.restore();
      }
      const fl = 0.8 + Math.sin(t * 10) * 0.15;
      ctx.save(); ctx.translate(w / 2, 160); ctx.scale(fl, fl);
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.quadraticCurveTo(40, -10, 26, 30); ctx.quadraticCurveTo(0, 50, -26, 30); ctx.quadraticCurveTo(-40, -10, 0, -60); ctx.fillStyle = '#ff9800'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(18, 10, 10, 28); ctx.quadraticCurveTo(0, 36, -10, 28); ctx.quadraticCurveTo(-18, 10, 0, -20); ctx.fillStyle = '#ffeb3b'; ctx.fill();
      ctx.restore();
      ctx.restore();
      E.text(ctx, '메탄 하이드레이트', w / 2, 56, { size: 40, color: '#fff', stroke: C.navy, strokeW: 8 });
      E.text(ctx, '“불타는 얼음”', w / 2, 100, { size: 30, color: '#bbdefb' });
      ctx.restore();
    }
    E.heading(ctx, sc.heading, lt);
    charsSide(ctx, t, vs, lt);
  };

  // 할 일 목록 ---------------------------------------------------------------
  function icon(ctx, kind, col) {
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 'book') {
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(-24, -40, -46, -32); ctx.lineTo(-46, 30); ctx.quadraticCurveTo(-24, 22, 0, 34); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(24, -40, 46, -32); ctx.lineTo(46, 30); ctx.quadraticCurveTo(24, 22, 0, 34); ctx.closePath(); ctx.globalAlpha = 0.75; ctx.fill();
    } else if (kind === 'pen') {
      ctx.rotate(-0.7); ctx.fillRect(-12, -46, 24, 70); ctx.beginPath(); ctx.moveTo(-12, 24); ctx.lineTo(12, 24); ctx.lineTo(0, 48); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-60, 0, -40, -46, 0, -20); ctx.bezierCurveTo(40, -46, 60, 0, 0, 40); ctx.fill();
    }
    ctx.restore();
  }
  S.list = (ctx, sc, t, lt, vs) => {
    E.softBg(ctx, t, '#fff7e6', '#ffe9c7');
    const cur = E.latest(sc, t, 'item', -1, 0.1).v;
    sc.items.forEach((it, i) => {
      const L = sc.lines.find((l) => l.item === i); const at = L ? L.start - 0.1 : 1e9;
      const p = E.easeBack(prog(t, at, 0.6));
      const y = 230 + i * 220, x = 90, w = 1260, h = 180;
      ctx.save(); ctx.globalAlpha = p > 0 ? clamp(p * 1.4) : 0.35;
      const off = p > 0 ? (1 - p) * -300 : 0;
      ctx.translate(off, 0);
      const col = [C.blue, C.sani, C.nari][i];
      E.shadow(ctx, i === cur ? 36 : 16, 10, i === cur ? 0.3 : 0.15);
      E.rrect(ctx, x, y, w, h, 40); ctx.fillStyle = p > 0 ? '#fff' : 'rgba(255,255,255,0.6)'; ctx.fill(); E.noShadow(ctx);
      if (i === cur) { ctx.lineWidth = 8; ctx.strokeStyle = col; E.rrect(ctx, x, y, w, h, 40); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x + 100, y + h / 2, 64, 0, 7); ctx.fillStyle = col; ctx.fill();
      ctx.save(); ctx.translate(x + 100, y + h / 2); icon(ctx, it.icon, '#fff'); ctx.restore();
      E.text(ctx, `${i + 1}`, x + 220, y + h / 2 + 4, { font: E.FONT_TITLE, size: 80, color: col });
      E.text(ctx, p > 0 ? it.text : '?', x + 290, y + h / 2 + 4, { size: it.text.length > 14 ? 56 : 64, color: C.ink, align: 'left' });
      ctx.restore();
    });
    E.heading(ctx, sc.heading, lt);
    charsSide(ctx, t, vs, lt);
  };

  // 퀴즈 ------------------------------------------------------------------
  S.quiz = (ctx, sc, t, lt, vs) => {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#8e6cf0'); g.addColorStop(1, '#4f7cf0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 20; i++) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; const r = 20 + E.rand(i) * 60; ctx.beginPath(); ctx.arc(E.rand(i + 1) * W, (E.rand(i + 2) * H + t * 30) % H, r, 0, 7); ctx.fill(); }
    // 현재 문제
    let qi = 0, phase = 'ask', at = sc.start, askLine = null, ansLine = null;
    sc.lines.forEach((L) => { if (t >= L.start - 0.2) { qi = L.q; phase = L.phase; at = L.start; } });
    askLine = sc.lines.find((l) => l.q === qi && l.phase === 'ask'); ansLine = sc.lines.find((l) => l.q === qi && l.phase === 'answer');
    const Q = sc.questions[qi];
    const qp = E.easeBack(prog(t, askLine.start - 0.4, 0.6));
    const bx = 80, by = 170, bw = 1270, bh = 300;
    ctx.save(); ctx.translate(0, (1 - qp) * -300);
    E.shadow(ctx, 40, 14, 0.35); E.rrect(ctx, bx, by, bw, bh, 40); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
    E.pill(ctx, bx + 40, by - 40, `Q${qi + 1}`, { size: 50, bg: C.yellow, color: C.navy });
    ctx.font = `62px ${E.FONT_FUN}`;
    const ql = E.wrap(ctx, Q.q, bw - 120);
    ql.forEach((l, k) => E.text(ctx, l, bx + bw / 2, by + bh / 2 + (k - (ql.length - 1) / 2) * 80, { size: 62, color: C.ink }));
    ctx.restore();
    const reveal = phase === 'answer' ? E.easeOut(prog(t, ansLine.start - 0.2, 0.5)) : 0;
    const opts = Q.kind === 'ox' ? ['O', 'X'] : Q.choices;
    const ansIdx = Q.kind === 'ox' ? (Q.answer === 'O' ? 0 : 1) : Q.answer;
    const n = opts.length, ow = Q.kind === 'ox' ? 380 : n === 2 ? 520 : 380, gap = 50;
    const tot = n * ow + (n - 1) * gap, ox0 = bx + (bw - tot) / 2, oy = 540, oh = Q.kind === 'ox' ? 330 : 220;
    opts.forEach((o, k) => {
      const p = E.easeBack(prog(t, askLine.start + 0.2 + k * 0.15, 0.5)); if (p <= 0) return;
      const x = ox0 + k * (ow + gap), correct = k === ansIdx;
      const sc2 = correct ? 1 + reveal * 0.08 + Math.sin(t * 8) * 0.015 * reveal : 1 - reveal * 0.08;
      ctx.save(); ctx.translate(x + ow / 2, oy + oh / 2); ctx.scale(p * sc2, p * sc2); ctx.globalAlpha = correct ? 1 : 1 - reveal * 0.55;
      E.shadow(ctx, 30, 10, 0.3);
      E.rrect(ctx, -ow / 2, -oh / 2, ow, oh, 36); ctx.fillStyle = correct && reveal > 0 ? '#e8f5e9' : '#fff'; ctx.fill(); E.noShadow(ctx);
      if (correct && reveal > 0) { ctx.lineWidth = 12; ctx.strokeStyle = '#43a047'; E.rrect(ctx, -ow / 2, -oh / 2, ow, oh, 36); ctx.stroke(); }
      if (Q.kind === 'ox') {
        ctx.lineWidth = 34; ctx.lineCap = 'round';
        if (o === 'O') { ctx.beginPath(); ctx.arc(0, 0, 100, 0, 7); ctx.strokeStyle = '#1e88e5'; ctx.stroke(); }
        else { ctx.strokeStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-90, -90); ctx.lineTo(90, 90); ctx.moveTo(90, -90); ctx.lineTo(-90, 90); ctx.stroke(); }
      } else {
        E.text(ctx, o, 0, 6, { size: o.length > 4 ? 64 : 76, color: C.ink });
      }
      ctx.restore();
    });
    // 카운트다운
    if (phase === 'ask') {
      const endAsk = askLine.start + askLine.dur, rem = (askLine.pauseAfter || 0) - (t - endAsk);
      if (t > endAsk && rem > 0) {
        const tot2 = askLine.pauseAfter, fr = rem / tot2;
        const cx = W - 280, cy = 330;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 120, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fr); ctx.lineWidth = 22; ctx.strokeStyle = C.yellow; ctx.lineCap = 'round'; ctx.stroke();
        const num = Math.ceil(rem), pop = 1 + (num - rem) * 0.25;
        ctx.translate(cx, cy + 6); ctx.scale(pop, pop); E.text(ctx, String(num), 0, 0, { font: E.FONT_TITLE, size: 110, color: C.navy });
        ctx.restore();
        E.text(ctx, '생각해 보세요!', cx, cy + 170, { size: 46, color: '#fff' });
      }
    }
    if (phase === 'answer') E.confetti(ctx, ansLine.start - 0.2, t, ox0 + ansIdx * (ow + gap) + ow / 2, oy, 80);
    E.heading(ctx, sc.heading, lt);
    if (!(phase === 'ask' && t > askLine.start + askLine.dur)) charsSide(ctx, t, vs, lt);
    else charsSide(ctx, t, vs, lt);
  };

  // 독도의 날 ---------------------------------------------------------------
  S.dokdoday = (ctx, sc, t, lt, vs) => {
    E.skySea(ctx, t, { horizon: 720, gulls: true });
    const p = E.easeElastic(prog(lt, 0.4, 1.3));
    ctx.save(); ctx.translate(W / 2, 400); ctx.scale(p, p); ctx.rotate(Math.sin(t * 1.5) * 0.02);
    E.shadow(ctx, 40, 16, 0.35);
    E.rrect(ctx, -330, -250, 660, 500, 40); ctx.fillStyle = '#fff'; ctx.fill(); E.noShadow(ctx);
    E.rrect(ctx, -330, -250, 660, 150, 40); ctx.fillStyle = C.red; ctx.fill(); ctx.fillRect(-330, -150, 660, 50);
    for (const rx of [-200, 200]) { ctx.beginPath(); ctx.arc(rx, -250, 22, 0, 7); ctx.fillStyle = '#555'; ctx.fill(); }
    E.text(ctx, '10월', 0, -170, { font: E.FONT_TITLE, size: 90, color: '#fff' });
    E.text(ctx, '25', 0, 40, { font: E.FONT_TITLE, size: 250, color: C.navy });
    E.text(ctx, '독도의 날', 0, 190, { size: 70, color: C.red });
    ctx.restore();
    E.confetti(ctx, sc.start + 1.0, t, W / 2, 300, 90);
    charsWide(ctx, t, vs, 0.1, lt);
  };

  // 엔딩 ------------------------------------------------------------------
  S.ending = (ctx, sc, t, lt, vs, tl) => {
    const last = sc.lines[sc.lines.length - 1], creditsAt = last.start + last.dur + 1.2;
    if (t < creditsAt + 0.6) {
      E.skySea(ctx, t, { horizon: 660, island: true, islandScale: 0.62 });
      const p = E.easeElastic(prog(lt, 0.4, 1.4));
      ctx.save(); ctx.translate(W / 2, 200); ctx.scale(p, p);
      E.text(ctx, '독도는 우리 땅!', 0, 0, { font: E.FONT_TITLE, size: 140, color: '#fff', stroke: C.red, strokeW: 26 });
      ctx.restore();
      charsWide(ctx, t, vs, 0.2, lt);
    }
    if (t >= creditsAt) {
      const a = E.easeInOut(prog(t, creditsAt, 0.6));
      ctx.save(); ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d3b72'); g.addColorStop(1, '#1767ad'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      E.text(ctx, '만든 사람과 자료 출처', W / 2, 90, { font: E.FONT_TITLE, size: 64, color: '#fff' });
      const used = new Set();
      tl.scenes.forEach((s) => { s.lines.forEach((l) => l.photo && used.add(l.photo)); (s.events || []).forEach((e) => e.img && used.add(e.img)); });
      const rows = [...used].map((f) => `${(window.PHOTO_CREDITS || {})[f] || f}`);
      const uniq = [...new Set(rows)];
      const left = [
        '기획·제작: 모덕초등학교',
        `캐릭터: 나리 · 산이 (모덕초 캐릭터)`,
        `목소리: Typecast AI 음성 (나리 ${tl.voices.N.voice}, 산이 ${tl.voices.S.voice})`,
        `배경음악: ${tl.bgm.startsWith('room') ? 'Kevin MacLeod (incompetech.com), CC BY' : 'Pixabay Content License'}`,
        '지도 자료: Natural Earth (퍼블릭 도메인)',
        '글꼴: 주아, 블랙한산스, 고운돋움 (SIL OFL)',
        '참고: 외교부 독도 누리집, 동북아역사재단 독도연구소',
      ];
      left.forEach((l, i) => E.text(ctx, l, 120, 210 + i * 62, { font: E.FONT_BODY, size: 34, color: '#e3f2fd', align: 'left' }));
      E.text(ctx, '사진·사료 출처', 980, 190, { size: 40, color: C.yellow, align: 'left' });
      uniq.forEach((l, i) => E.text(ctx, '· ' + l, 980, 250 + i * 50, { font: E.FONT_BODY, size: 27, color: '#fff', align: 'left' }));
      E.text(ctx, 'CC BY-SA 사진은 원 저작자 표시 조건에 따라 사용했습니다.', W / 2, H - 70, { font: E.FONT_BODY, size: 28, color: '#9fd8fb' });
      ctx.restore();
    }
  };
})();
