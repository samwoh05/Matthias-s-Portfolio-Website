/* ==========================================================
   Sheet 05 · Ideas — three concept animations on one board
   Ported from Matthias's concept explainers (Foot-handle door,
   Flex-wing vacuum head, Dynamic divider), re-inked in the
   portfolio palette. Each player only runs while its tab is open
   and on screen.
   ========================================================== */
(() => {
  'use strict';

  const board = document.querySelector('.board');
  if (!board) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = Math.PI / 180, PI = Math.PI;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, x) => a + (b - a) * x;

  // type in the drawings: handwritten labels, serif read-outs, mono view titles
  const HAND = (px) => `600 ${Math.round(px * 1.32)}px Caveat, "Segoe Print", cursive`;
  const SERIF = (px, w = 400) => `${w} ${px}px Fraunces, Georgia, serif`;
  const MONO = (px) => `500 ${px}px "IBM Plex Mono", ui-monospace, monospace`;

  function colors(el) {
    const s = getComputedStyle(el);
    const g = (n) => s.getPropertyValue(n).trim();
    return { ink: g('--i-ink'), mid: g('--i-mid'), door: g('--i-door'), cut: g('--i-cut'), acc: g('--i-acc'),
      shoe: g('--i-shoe'), shoeln: g('--i-shoeln'), wall: g('--i-wall'), metal: g('--i-metal') };
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function line(c, x1, y1, x2, y2, col, w, cap) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap || 'butt'; c.stroke(); }
  function box(c, x, y, w, h, fill, C) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(x, y, w, h); }

  /* ---------------- C-01 · Foot-handle door ---------------- */
  const door = (() => {
    const T = 9.6, MAXTH = 64 * D, PW = 400, PH = 440;
    let stacked = false;
    const dot = (c, x, y, r, C) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = C.shoe; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.stroke(); };
    const ln = (c, x1, y1, x2, y2, col, w) => line(c, x1, y1, x2, y2, col, w, 'round');
    function state(t) {
      const ap = ease(seg(t, 0.3, 1.5)), rr = ease(seg(t, 4.0, 4.9)),
        p = ease(seg(t, 1.5, 2.3)) * (1 - ease(seg(t, 4.2, 4.9))),
        th = MAXTH * out(seg(t, 2.1, 3.8)) * (1 - ease(seg(t, 6.0, 7.5)));
      return { ap, rr, p, th, g: 70 * (1 - ap) + 80 * rr, fa: ap * (1 - rr) };
    }
    function caption(t) {
      if (t < 1.5) return 'Step up to the door. The lever sits at ankle height.';
      if (t < 2.15) return 'Press the lever down. A rod inside the door pulls the latch bolt back.';
      if (t < 4.0) return 'The latch is free, so the same leg motion kicks the door open.';
      if (t < 6.0) return 'Lift your foot. The lever springs back up.';
      return 'The door closes itself and the bolt springs out to lock it.';
    }
    function front(c, S, C, ox, oy) {
      c.save(); c.translate(ox, oy);
      c.font = MONO(11); c.fillStyle = C.mid; c.fillText('FRONT VIEW', 20, 28);
      ln(c, 30, 400, 340, 400, C.ink, 2);
      c.fillStyle = C.wall; c.strokeStyle = C.ink; c.lineWidth = 1.5;
      [[56, 28, 14, 372], [270, 28, 16, 372], [56, 28, 230, 12]].forEach((r) => { c.fillRect(r[0], r[1], r[2], r[3]); c.strokeRect(r[0], r[1], r[2], r[3]); });
      c.fillStyle = C.cut; c.fillRect(270, 157, 10, 14);
      const sx = Math.cos(S.th);
      c.save(); c.translate(70, 40); c.scale(sx, 1);
      c.fillStyle = C.door; c.fillRect(0, 0, 200, 360);
      c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(0, 0, 200, 360);
      c.globalAlpha = 0.3; c.lineWidth = 1; c.strokeRect(14, 14, 172, 332); c.globalAlpha = 1;
      c.fillStyle = C.cut; c.fillRect(96, 96, 102, 256);
      c.setLineDash([5, 4]); c.strokeStyle = C.ink; c.lineWidth = 1.2; c.strokeRect(96, 96, 102, 256); c.setLineDash([]);
      const phi = lerp(20, -8, S.p) * D,
        A0y = 335 + 30 * Math.sin(20 * D), Ay = 335 + 30 * Math.sin(phi), Ax = 160 + 30 * Math.cos(phi),
        dl = A0y - Ay, rodTop = 150 - dl, al = Math.atan2(dl, 20), pinX = 170 - 26 * Math.sin(al);
      c.fillStyle = C.mid; c.fillRect(186, 111, 14, 5); c.fillRect(186, 132, 14, 5);
      c.fillStyle = C.metal; c.fillRect(pinX, 117, 40, 14); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(pinX, 117, 40, 14);
      ln(c, Ax, Ay, 190, rodTop, C.acc, 4);
      ln(c, 170, 150, 190, rodTop, C.acc, 5);
      ln(c, 170, 150, pinX, 124, C.acc, 5);
      dot(c, 190, rodTop, 4, C); dot(c, 170, 150, 5, C); dot(c, pinX, 124, 4, C); dot(c, Ax, Ay, 4, C);
      c.save(); c.translate(160, 335); c.rotate(phi);
      c.fillStyle = C.acc; rrect(c, -56, -6, 86, 12, 5); c.fill(); rrect(c, -62, -9, 24, 18, 5); c.fill();
      c.restore(); dot(c, 160, 335, 5, C);
      const tx = 160 - 56 * Math.cos(phi), ty = 335 - 56 * Math.sin(phi), f = (1 - S.ap) + S.rr,
        cx = tx + 14 - 30 * f, sy = ty - 9 - 70 * f;
      c.globalAlpha = S.fa * 0.92; c.fillStyle = C.shoe; c.strokeStyle = C.shoeln; c.lineWidth = 2;
      c.fillRect(cx - 10, sy - 80, 20, 60); c.strokeRect(cx - 10, sy - 80, 20, 60);
      rrect(c, cx - 28, sy - 30, 56, 30, 11); c.fill(); c.stroke();
      ln(c, cx - 26, sy - 8, cx + 26, sy - 8, C.shoeln, 1.5);
      c.globalAlpha = 1;
      c.restore();
      const a = 1 - clamp(S.th / 0.25);
      if (a > 0) {
        c.globalAlpha = a; c.font = HAND(13); c.fillStyle = C.ink;
        [['latch bolt', 164, 264], ['link rod', 290, 264], ['foot lever', 378, 212]].forEach((l) => {
          ln(c, 292, l[1], l[2] + 6, l[1], C.mid, 1); c.fillText(l[0], 298, l[1] + 5);
        });
        c.globalAlpha = 1;
      }
      c.restore();
    }
    function plan(c, S, C, ox, oy) {
      c.save(); c.translate(ox, oy);
      c.font = MONO(11); c.fillStyle = C.mid; c.fillText('TOP VIEW', 20, 28);
      c.fillStyle = C.wall; c.strokeStyle = C.ink; c.lineWidth = 1.5;
      c.fillRect(20, 183, 90, 14); c.strokeRect(20, 183, 90, 14);
      c.fillRect(290, 183, 90, 14); c.strokeRect(290, 183, 90, 14);
      c.setLineDash([4, 5]); c.strokeStyle = C.mid; c.lineWidth = 1;
      c.beginPath(); c.arc(110, 190, 180, -MAXTH, 0); c.stroke(); c.setLineDash([]);
      c.save(); c.translate(110, 190); c.rotate(-S.th);
      c.fillStyle = C.ink; c.fillRect(0, -3, 180, 6);
      c.fillStyle = S.p > 0.5 ? C.acc : C.mid; rrect(c, 142, 3, 16, 6, 2); c.fill();
      c.translate(150, 9 + S.g);
      c.globalAlpha = S.fa; c.fillStyle = C.shoe; c.strokeStyle = C.shoeln; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-11, 70); c.lineTo(-14, 30); c.bezierCurveTo(-15, 10, -8, 0, 0, 0); c.bezierCurveTo(8, 0, 15, 10, 14, 30); c.lineTo(11, 70); c.quadraticCurveTo(0, 76, -11, 70); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(0, 60, 8, 0, 7); c.stroke();
      c.restore();
      dot(c, 110, 190, 5, C);
      c.restore();
    }
    return {
      T, still: 2.7, caption,
      size(w) { stacked = w > 0 && w < 640; return stacked ? [PW, PH * 2] : [PW * 2, PH]; },
      draw(c, t, C) { const S = state(t); front(c, S, C, 0, 0); plan(c, S, C, stacked ? 0 : PW, stacked ? PH : 0); },
    };
  })();

  /* ---------------- C-02 · Flex-wing vacuum head ---------------- */
  const vacuum = (() => {
    const T = 13.4, XL = 60, XR = 740, FY = 250, CUM = [30, 55, 70, 80, 86, 90];
    const ext = (b) => { let s = 0; CUM.forEach((a) => { s += Math.cos(a * b * D); }); return s * 10; };
    const hgt = (b) => { let s = 0; CUM.forEach((a) => { s += Math.sin(a * b * D); }); return s * 10; };
    function contactB(need) {
      if (need >= 60) return 0; if (need <= ext(1)) return 1;
      let lo = 0, hi = 1; for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (ext(m) > need) lo = m; else hi = m; } return (lo + hi) / 2;
    }
    const KEYS = [[0, 400], [0.7, 310], [1.5, 490], [2, 400], [3.6, 592], [4.4, 592], [5.8, 208], [6.6, 208], [7.4, 400]];
    function kf(t) {
      if (t <= 0) return KEYS[0][1];
      for (let i = 1; i < KEYS.length; i++) { if (t <= KEYS[i][0]) { const a = KEYS[i - 1], b = KEYS[i]; return lerp(a[1], b[1], ease((t - a[0]) / (b[0] - a[0]))); } }
      return 400;
    }
    function state(t) {
      const hx = kf(t),
        e = 70 - 70 * ease(seg(t, 7.4, 8.4)) + 70 * ease(seg(t, 12.4, 13.2)),
        Fo = ease(seg(t, 8.4, 9.2)) * (1 - ease(seg(t, 11.8, 12.4))),
        yT = 515 - 110 * ease(seg(t, 9.2, 10.6)) + 110 * ease(seg(t, 11, 11.8)),
        hR = hx + 50 + e, hL = hx - 50 - e, nR = XR - 7 - hR, nL = hL - XL - 7;
      return { hx, e, hR, hL, yT, cR: nR < 59, cL: nL < 59, bR: Math.max(Fo, contactB(nR)), bL: Math.max(Fo, contactB(nL)) };
    }
    // dust: floor specks get sucked at the intake; wall specks need a bent wing
    const dust = [285, 320, 480, 515, 560, 610, 200, 230].map((x) => ({ x, y: FY - 4, k: 'f', ct: 1e9 }));
    [4, 22, 38].forEach((h) => { dust.push({ x: 737, y: FY - h, k: 'R', h, ct: 1e9 }); dust.push({ x: 63, y: FY - h, k: 'L', h, ct: 1e9 }); });
    for (let ts = 0; ts <= T; ts += 0.02) {
      const S = state(ts);
      dust.forEach((d) => {
        if (d.ct < 1e8) return;
        if (d.k === 'f' && Math.abs(S.hx - d.x) <= 40) d.ct = ts;
        if (d.k === 'R' && S.cR && hgt(S.bR) >= d.h) d.ct = ts;
        if (d.k === 'L' && S.cL && hgt(S.bL) >= d.h) d.ct = ts;
      });
    }
    function caption(t) {
      if (t < 2) return 'Wide and flat: the head sweeps open floor with both wings level.';
      if (t < 4.4) return 'At a wall, the wing is pushed up and flexes 90° along it, so the corner gets cleaned too.';
      if (t < 7) return 'The other wing does the same on the left. No need to tilt the wand or swap heads.';
      if (t < 8.4) return 'Now shorten it: the sliding arms retract into the centre body.';
      if (t < 9.4) return 'Both wings fold up 90° and the head becomes a slim crevice nozzle.';
      if (t < 11.8) return 'Slim enough to slip between two legs, where the wide head would not fit.';
      return 'Slide the arms out and flatten the wings. Same head, ready for the floor again.';
    }
    function front(c, S, C, t) {
      c.font = MONO(11); c.fillStyle = C.mid; c.fillText('FRONT VIEW', 76, 28);
      box(c, 0, 40, XL, 210, C.wall, C); box(c, XR, 40, 60, 210, C.wall, C); box(c, 0, FY, 800, 8, C.wall, C);
      line(c, 0, FY, 800, FY, C.ink, 2);
      dust.forEach((d) => {
        const q = (t - d.ct) / 0.4; if (q >= 1) return;
        let x = d.x, y = d.y, a = 1;
        if (q > 0) { x = lerp(d.x, S.hx, q); y = lerp(d.y, 238, q); a = 1 - q; }
        c.globalAlpha = a; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fillStyle = C.ink; c.fill(); c.globalAlpha = 1;
      });
      const hx = S.hx, e = S.e;
      box(c, hx - 9, 40, 18, 188, C.door, C);
      [-1, 1].forEach((s) => {
        const x0 = s > 0 ? hx + 50 : hx - 50 - e;
        if (e > 1) {
          box(c, x0, 230, e, 16, C.shoe, C);
          for (let i = 1; i < 5; i++) { const tx = s > 0 ? hx + 50 + e * i / 5 : hx - 50 - e * i / 5; line(c, tx, 234, tx, 242, C.mid, 1.5); }
        }
      });
      c.strokeStyle = C.ink; c.lineWidth = 2; rrect(c, hx - 50, 222, 100, 28, 7); c.fillStyle = C.metal; c.fill(); c.stroke();
      c.fillStyle = C.cut; c.fillRect(hx - 38, 244, 76, 6);
      c.beginPath(); c.arc(hx, 222, 9, 0, 7); c.fillStyle = C.shoe; c.fill(); c.stroke();
      [-1, 1].forEach((s) => {
        const b = s > 0 ? S.bR : S.bL;
        let x = hx + s * (50 + e), y = 243;
        for (let i = 0; i < 6; i++) {
          const a = b * CUM[i] * D, ux = s * Math.cos(a), uy = -Math.sin(a);
          line(c, x + ux * 0.5, y + uy * 0.5, x + ux * 9.5, y + uy * 9.5, C.acc, 14);
          x += ux * 10; y += uy * 10;
        }
        c.beginPath(); c.arc(hx + s * (50 + e), 243, 4, 0, 7); c.fillStyle = C.shoe; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.stroke();
      });
      c.font = HAND(14); c.fillStyle = C.ink; c.textAlign = 'center';
      const lx = Math.max(90, Math.min(710, hx - 50 - e - 30));
      line(c, lx, FY + 10, lx, FY + 22, C.mid, 1); c.fillText('flexible wing', lx, FY + 42);
      if (e > 18) { const ax = hx + 50 + e / 2; c.globalAlpha = clamp((e - 18) / 20); line(c, ax, FY + 10, ax, FY + 22, C.mid, 1); c.fillText('sliding arm', ax, FY + 42); c.globalAlpha = 1; }
      c.textAlign = 'left';
    }
    function topv(c, S, C) {
      const oy = 322;
      c.font = MONO(11); c.fillStyle = C.mid; c.fillText('TOP VIEW', 76, 340);
      box(c, 0, oy, XL, 248, C.wall, C); box(c, XR, oy, 60, 248, C.wall, C);
      box(c, 195, 360, 120, 90, C.wall, C); box(c, 485, 360, 120, 90, C.wall, C);
      const hx = S.hx, y = S.yT, e = S.e, eL = ext(S.bL), eR = ext(S.bR);
      box(c, hx - 7, y, 14, 80, C.door, C);
      box(c, hx - 50 - e, y - 18, e + 2, 36, C.shoe, C); box(c, hx + 48, y - 18, e + 2, 36, C.shoe, C);
      box(c, hx - 50 - e - eL, y - 30, eL, 60, C.acc, C); box(c, hx + 50 + e, y - 30, eR, 60, C.acc, C);
      c.strokeStyle = C.ink; c.lineWidth = 2; rrect(c, hx - 50, y - 30, 100, 60, 8); c.fillStyle = C.metal; c.fill(); c.stroke();
      c.fillStyle = C.cut; c.fillRect(hx - 38, y - 26, 76, 6);
      c.beginPath(); c.arc(hx, y, 9, 0, 7); c.fillStyle = C.shoe; c.fill(); c.stroke();
    }
    return {
      T, still: 3.9, caption,
      size() { return [800, 570]; },
      draw(c, t, C) { const S = state(t); front(c, S, C, t); line(c, 0, 312, 800, 312, C.mid, 1); topv(c, S, C); },
    };
  })();

  /* ---------------- C-03 · Dynamic divider ---------------- */
  const divider = (() => {
    const T = 11.6;
    function off(t) {
      if (t < 1.6) return lerp(90, 18, ease(t / 1.6));
      if (t < 3) return 18;
      if (t < 4.8) return lerp(18, 4, ease(seg(t, 3, 4.8)));
      if (t < 8.2) return 4;
      if (t < 9) return lerp(4, 18, ease(seg(t, 8.2, 9)));
      if (t < 11) return lerp(18, 90, ease(seg(t, 9, 11)));
      return 90;
    }
    const pres = (t) => 1 - 0.8 * ease(seg(t, 2.8, 4.6)) + 0.8 * ease(seg(t, 7.6, 8.8));
    const btn = (t) => ease(seg(t, 2.6, 4.4)) * (1 - ease(seg(t, 4.4, 4.9))) + ease(seg(t, 7.4, 8.8)) * (1 - ease(seg(t, 8.8, 9.3)));
    const mode = (t) => ease(seg(t, 7.2, 7.6)) * (1 - ease(seg(t, 10.8, 11.4)));
    function caption(t) {
      if (t < 1.6) return 'Slide the divider toward a corner of the box. The two cups face the walls.';
      if (t < 2.8) return 'The cup rims touch both walls and trap a pocket of air.';
      if (t < 4.8) return 'Press the button: the pump pulls air out of both cups and sends it out through the vent.';
      if (t < 7.4) return 'Locked. Low pressure inside the cups lets the air outside press the divider onto the walls.';
      if (t < 9) return 'Press the same button again: air is pushed back into the cups and the seal breaks.';
      return 'The divider lifts free and can be moved anywhere.';
    }
    function arrow(c, x1, y1, x2, y2, col) {
      const a = Math.atan2(y2 - y1, x2 - x1); line(c, x1, y1, x2, y2, col, 3);
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - 11 * Math.cos(a - 0.45), y2 - 11 * Math.sin(a - 0.45)); c.lineTo(x2 - 11 * Math.cos(a + 0.45), y2 - 11 * Math.sin(a + 0.45)); c.closePath(); c.fillStyle = col; c.fill();
    }
    // dotted trail with moving open arrowheads along a polyline
    function flow(c, pts, rev, al, t, C) {
      if (al < 0.02) return;
      if (rev) pts = pts.slice().reverse();
      const sg = []; let len = 0;
      for (let i = 1; i < pts.length; i++) { const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dy); sg.push([pts[i - 1], dx / l, dy / l, l, len]); len += l; }
      c.save(); c.globalAlpha = al; c.strokeStyle = C.shoe; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 3;
      c.setLineDash([0.1, 8]); c.lineDashOffset = -t * 40;
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
      c.setLineDash([]);
      const n = Math.max(1, Math.floor(len / 85));
      for (let k = 0; k < n; k++) {
        const s = ((k / n) + t * 0.22) % 1 * len;
        for (let j = 0; j < sg.length; j++) {
          const g = sg[j];
          if (s <= g[4] + g[3] || j === sg.length - 1) {
            const u = s - g[4], x = g[0][0] + g[1] * u, y = g[0][1] + g[2] * u;
            c.beginPath(); c.moveTo(x - g[1] * 9 - g[2] * 6, y - g[2] * 9 + g[1] * 6); c.lineTo(x, y); c.lineTo(x - g[1] * 9 + g[2] * 6, y - g[2] * 9 - g[1] * 6); c.stroke(); break;
          }
        }
      }
      c.restore();
    }
    // suction cup in its own frame: stem at origin, wall at x=-d, rim spans y=-90..90
    function cup(c, d, p, C) {
      c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(-d * 0.9, -40, -d, -90); c.lineTo(-d, 90); c.quadraticCurveTo(-d * 0.9, 40, 0, 14); c.closePath();
      c.fillStyle = C.cut; c.fill();
      c.strokeStyle = C.acc; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(-d * 0.9, -40, -d, -90); c.stroke();
      c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(-d * 0.9, 40, -d, 90); c.stroke();
      c.fillStyle = C.shoe;
      const n = Math.round(p * 24);
      for (let i = 0; i < n; i++) {
        const u = (i * 0.618034) % 1, y = (((i * 0.381966 + 0.3) % 1) * 2 - 1) * 78, w0 = Math.max(0, (Math.abs(y) - 14) / 76) + 0.08, w = w0 + u * (0.92 - w0);
        c.beginPath(); c.arc(-d * w, y, 1.8, 0, 7); c.fill();
      }
    }
    function draw(c, t, C) {
      const o = off(t), p = pres(t), d = Math.min(o, 18), bd = btn(t), m = mode(t);
      box(c, 30, 40, 40, 460, C.wall, C); box(c, 70, 460, 690, 40, C.wall, C);
      c.font = HAND(14); c.fillStyle = C.mid; c.fillText('storage box wall', 90, 488);
      const bx = 70 + o, by = 160 - o;
      const al = clamp((0.9 - p) / 0.4);
      if (al > 0) {
        c.save(); c.globalAlpha = al;
        [70, 230].forEach((x) => arrow(c, bx + x, by - 64, bx + x, by - 12, C.acc));
        [190, 260].forEach((y) => arrow(c, bx + 364, by + y, bx + 312, by + y, C.acc));
        c.restore();
      }
      c.save(); c.translate(bx, by);
      rrect(c, 0, 0, 300, 300, 14); c.fillStyle = C.door; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; c.stroke();
      c.fillStyle = C.cut; c.fillRect(298, 96, 36, 16); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(298, 96, 36, 16);
      c.fillStyle = C.cut; c.fillRect(108, 45, 84, 75);
      [[0, 150, 150, 150], [150, 300, 150, 150], [150, 150, 150, 104], [150, 104, 300, 104], [150, 0, 150, 45]].forEach((l) => line(c, l[0], l[1], l[2], l[3], C.cut, l[0] === 150 && l[1] === 0 ? 16 : 14));
      c.save(); c.translate(0, 150); cup(c, d, p, C); c.restore();
      c.save(); c.translate(150, 300); c.rotate(-PI / 2); cup(c, d, p, C); c.restore();
      const cy = -16 + bd * 14;
      c.fillStyle = C.metal; c.strokeStyle = C.ink; c.lineWidth = 1.5;
      c.fillRect(146, cy + 16, 8, 48 + bd * 14 - (cy + 16));
      c.fillRect(112, 48 + bd * 14, 76, 12); c.strokeRect(112, 48 + bd * 14, 76, 12);
      rrect(c, 126, cy, 48, 16, 5); c.fillStyle = C.acc; c.fill(); c.strokeStyle = C.ink; c.stroke();
      c.beginPath(); c.arc(150, 150, 13, 0, 7); c.fillStyle = C.shoe; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.stroke();
      c.save(); c.translate(150, 150); c.rotate(-PI / 4 + PI * m); arrow(c, 0, 8, 0, -8, C.cut); c.restore();
      const a1 = ease(seg(t, 2.8, 3.1)) * (1 - ease(seg(t, 4.3, 4.6))), a2 = ease(seg(t, 7.6, 7.9)) * (1 - ease(seg(t, 8.7, 9)));
      const pl = [[-d * 0.5, 150], [0, 150], [150, 150], [150, 104], [300, 104], [330, 104]],
        pb = [[150, 300 + d * 0.5], [150, 300], [150, 150], [150, 104], [300, 104], [330, 104]];
      flow(c, pl, false, a1, t, C); flow(c, pb, false, a1, t + 1.7, C);
      flow(c, pl, true, a2, t, C); flow(c, pb, true, a2, t + 1.7, C);
      c.font = HAND(14); c.fillStyle = C.ink; c.textAlign = 'center';
      c.fillText('button', 150, -26);
      c.textAlign = 'left'; c.fillText('cup', 14, 68); c.fillText('cup', 196, 288); c.fillText('pump', 200, 74); c.fillText('valve', 170, 178); c.fillText('vent', 340, 110);
      c.restore();
      const locked = p < 0.55;
      c.font = SERIF(40); c.fillStyle = locked ? C.acc : C.ink; c.fillText(locked ? 'Locked' : 'Free', 560, 100);
      c.font = SERIF(15); c.fillStyle = C.ink; c.fillText('Air pressure in the cups', 560, 168);
      c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(560, 180, 200, 16); c.fillStyle = C.acc; c.fillRect(560, 180, 200 * p, 16);
      c.font = MONO(10.5); c.fillStyle = C.mid; c.fillText('LOW', 560, 216); c.textAlign = 'right'; c.fillText('SAME AS OUTSIDE', 760, 216); c.textAlign = 'left';
      c.save(); c.strokeStyle = C.ink; c.lineCap = 'round'; c.lineWidth = 3; c.setLineDash([0.1, 8]);
      c.beginPath(); c.moveTo(560, 290); c.lineTo(612, 290); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(603, 284); c.lineTo(613, 290); c.lineTo(603, 296); c.stroke(); c.restore();
      c.font = SERIF(15); c.fillStyle = C.ink; c.fillText('air moving', 632, 295);
      arrow(c, 560, 330, 612, 330, C.acc); c.fillText('outside air pushing', 632, 335);
    }
    return { T, still: 5.5, caption, size() { return [800, 540]; }, draw };
  })();

  /* ---------------- shared player ---------------- */
  function makePlayer(panel, mod) {
    const cv = panel.querySelector('canvas'), ctx = cv.getContext('2d');
    const cap = panel.querySelector('.idea-cap'), pp = panel.querySelector('[data-pp]'), rp = panel.querySelector('[data-rp]'), sc = panel.querySelector('input[type="range"]');
    sc.max = String(Math.round(mod.T * 1000));
    let t = reduce ? mod.still : 0, playing = !reduce, last = null, raf = 0, visible = false, active = false, W = 800, H = 540, C = null;
    function layout() {
      const r = mod.size(cv.parentElement.clientWidth || 800);
      W = r[0]; H = r[1];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.aspectRatio = `${W} / ${H}`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw() {
      if (!C) C = colors(cv.parentElement);   // palette lives on .idea-stage
      ctx.clearRect(0, 0, W, H);
      mod.draw(ctx, t, C, W, H);
      const txt = mod.caption(t);
      if (cap.textContent !== txt) cap.textContent = txt;
      sc.value = String(Math.round(t * 1000));
    }
    function frame(ts) {
      if (last === null) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.1); last = ts;
      if (playing) { t += dt; if (t >= mod.T) t = 0; }
      draw();
      raf = visible && active && playing ? requestAnimationFrame(frame) : 0;
    }
    function run() { if (!raf && visible && active && playing) { last = null; raf = requestAnimationFrame(frame); } }
    function setPlay(v) {
      playing = v;
      pp.textContent = v ? 'Pause' : 'Play';
      pp.setAttribute('aria-pressed', String(!v));
      if (v) run();
    }
    pp.addEventListener('click', () => setPlay(!playing));
    rp.addEventListener('click', () => { t = 0; draw(); setPlay(true); });
    sc.addEventListener('input', () => { setPlay(false); t = Number(sc.value) / 1000; draw(); });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }, { threshold: 0.15 }).observe(cv);
    setPlay(playing);
    return {
      activate(on) { active = on; if (on) { layout(); draw(); run(); } },
      refresh() { if (active) { layout(); draw(); } },
    };
  }

  /* ---------------- tabs ---------------- */
  const tabs = Array.from(board.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tb) => document.getElementById(tb.getAttribute('aria-controls')));
  const mods = { door, vacuum, divider };
  const players = panels.map((p) => makePlayer(p, mods[p.dataset.idea]));
  function select(i, focus) {
    tabs.forEach((tb, j) => {
      const on = i === j;
      tb.setAttribute('aria-selected', String(on));
      tb.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
      players[j].activate(on);
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((tb, i) => {
    tb.addEventListener('click', () => select(i));
    tb.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const k = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      select(k, true);
    });
  });
  select(0);
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => players.forEach((p) => p.refresh())); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => players.forEach((p) => p.refresh()));
})();
