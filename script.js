/* ==========================================================
   Matthias Luc Ang · portfolio — behaviour
   ========================================================== */
(() => {
  'use strict';

  window.__mlaReady = true;

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mk = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const f2 = (n) => n.toFixed(2);

  /* ----------------------------------------------------------
     Mat print ticks (protractor marks printed on the mat)
     ---------------------------------------------------------- */
  $$('[data-ticks]').forEach((g) => {
    const cx = +g.dataset.cx, cy = +g.dataset.cy, r = +g.dataset.r;
    let d = '';
    for (let deg = 0; deg < 360; deg += 5) {
      const a = (deg * Math.PI) / 180;
      const len = deg % 30 === 0 ? 22 : deg % 15 === 0 ? 14 : 7;
      d += `M${f2(cx + r * Math.cos(a))} ${f2(cy + r * Math.sin(a))}L${f2(cx + (r - len) * Math.cos(a))} ${f2(cy + (r - len) * Math.sin(a))}`;
      if (deg % 30 === 0) {
        const t = mk('text', { x: f2(cx + (r - 38) * Math.cos(a)), y: f2(cy + (r - 38) * Math.sin(a) + 3), 'text-anchor': 'middle' }, g);
        t.textContent = `${(360 - deg) % 360}°`;
      }
    }
    mk('path', { d }, g);
  });

  /* ----------------------------------------------------------
     Draw-on system (stroke-dashoffset), fail-safe
     ---------------------------------------------------------- */
  function screenLength(p) {
    const ctm = p.getScreenCTM();
    const total = p.getTotalLength();
    if (!ctm) return total;
    let len = 0, prev = null;
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const pt = p.getPointAtLength((total * i) / N);
      const x = ctm.a * pt.x + ctm.c * pt.y, y = ctm.b * pt.x + ctm.d * pt.y;
      if (prev) len += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
    }
    return len;
  }

  function prepDraw(scope) {
    if (scope.dataset.prepped) return;
    scope.dataset.prepped = '1';
    if (reduce) return;
    const base = parseFloat(scope.dataset.base || 0);
    const step = parseFloat(scope.dataset.step || 0.08);
    const dur = parseFloat(scope.dataset.dur || 1.1);
    const paths = $$('[data-draw]', scope);
    let maxEnd = 0;
    paths.forEach((p, i) => {
      let len;
      try {
        len = p.getAttribute('vector-effect') === 'non-scaling-stroke' ? screenLength(p) : p.getTotalLength();
      } catch (e) { return; }
      if (!len || !isFinite(len)) return;
      len = Math.ceil(len) + 2;
      const delay = base + (p.dataset.delay !== undefined ? parseFloat(p.dataset.delay) : i * step);
      const d = parseFloat(p.dataset.dur || dur);
      p.style.transition = 'none';
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
      p.style.setProperty('--delay', `${delay}s`);
      p.style.setProperty('--d', `${d}s`);
      maxEnd = Math.max(maxEnd, delay + d);
    });
    $$('.fade-in', scope).forEach((f) => {
      const delay = base + parseFloat(f.dataset.delay || 0.6);
      f.style.setProperty('--delay', `${delay}s`);
      // handwritten labels stay hidden until the pen writes them (see writeSvgText)
      if (f.classList.contains('svg-hand')) f.style.clipPath = 'inset(-60% 100% -70% -10%)';
      maxEnd = Math.max(maxEnd, delay + 0.7);
    });
    scope.dataset.end = String(maxEnd);
    scope.getBoundingClientRect();
    paths.forEach((p) => { p.style.transition = ''; });
  }

  function drawNow(scope) {
    if (!scope || scope.classList.contains('is-drawn')) return;
    prepDraw(scope);
    const paths = $$('[data-draw]', scope);
    if (!reduce) {
      scope.getBoundingClientRect();
      paths.forEach((p) => { p.style.strokeDashoffset = '0'; });
    }
    scope.classList.add('is-drawn');
    if (!reduce) {
      $$('.svg-hand.fade-in', scope)
        .map((t) => ({ t, at: parseFloat(t.style.getPropertyValue('--delay')) || 0 }))
        .sort((a, b) => a.at - b.at)
        .forEach(({ t, at }) => writeSvgText(t, at));
    }
    const end = parseFloat(scope.dataset.end || 0) * 1000 + 250;
    setTimeout(() => {
      paths.forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = 'none'; });
    }, end);
  }

  /* ----------------------------------------------------------
     Cycloid helpers (shared by the card and the race)
     ---------------------------------------------------------- */
  function solveCycloid(X, Y) {
    // find θB with (θ - sinθ)/(1 - cosθ) = X/Y, monotonic on (0, 2π)
    const target = X / Y;
    let lo = 1e-6, hi = 2 * Math.PI - 1e-6;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const f = (mid - Math.sin(mid)) / (1 - Math.cos(mid));
      if (f < target) lo = mid; else hi = mid;
    }
    const thB = (lo + hi) / 2;
    return { thB, r: Y / (1 - Math.cos(thB)) };
  }
  function cycloidPts(A, B, n = 240) {
    const { thB, r } = solveCycloid(B.x - A.x, B.y - A.y);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = (thB * i) / n;
      pts.push({ x: A.x + r * (th - Math.sin(th)), y: A.y + r * (1 - Math.cos(th)) });
    }
    return pts;
  }
  const toD = (pts) => 'M' + pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join('L');

  $$('[data-cycloid]').forEach((p) => {
    const [ax, ay, bx, by] = p.dataset.cycloid.split(',').map(Number);
    p.setAttribute('d', toD(cycloidPts({ x: ax, y: ay }, { x: bx, y: by }, 80)));
  });

  /* ----------------------------------------------------------
     Gear train (the signature)
     ---------------------------------------------------------- */
  const gearSvg = $('#gears');
  let gearsApi = null;

  function initGears() {
    if (!gearSvg) return;
    const m = 6.5;
    const C = { id: 'C', z: 20, x: 350, y: 320 };
    const layout = [
      { id: 'A', z: 32, dir: 205 },
      { id: 'B', z: 26, dir: 30 },
      { id: 'D', z: 12, dir: -55 },
    ];
    const gears = [C];
    layout.forEach((s) => {
      const dist = (m * (C.z + s.z)) / 2;
      const a = (s.dir * Math.PI) / 180;
      gears.push({ id: s.id, z: s.z, x: C.x + dist * Math.cos(a), y: C.y + dist * Math.sin(a), phi: a });
    });
    const pC = (2 * Math.PI) / C.z;
    gears.forEach((g) => {
      g.r = (m * g.z) / 2;
      g.p = (2 * Math.PI) / g.z;
      if (g === C) { g.k = 1; g.off = 0; }
      else {
        g.k = -C.z / g.z;
        // tooth of C meets a gap of g along the line of centres
        g.off = g.phi + Math.PI - g.p * (0.5 - g.phi / pC);
      }
    });

    const P = (rad, a) => `${f2(rad * Math.cos(a))} ${f2(rad * Math.sin(a))}`;
    const circ = (R) => `M${f2(R)} 0A${f2(R)} ${f2(R)} 0 1 1 ${f2(-R)} 0A${f2(R)} ${f2(R)} 0 1 1 ${f2(R)} 0Z`;
    const circAt = (cx, cy, R) => `M${f2(cx + R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 1 ${f2(cx - R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 1 ${f2(cx + R)} ${f2(cy)}Z`;
    function toothPath(g) {
      const ra = g.r + m, rf = g.r - 1.25 * m, p = g.p;
      let d = `M${P(rf, -0.3 * p)}`;
      for (let i = 0; i < g.z; i++) {
        const a = i * p;
        d += `L${P(ra, a - 0.14 * p)}A${f2(ra)} ${f2(ra)} 0 0 1 ${P(ra, a + 0.14 * p)}L${P(rf, a + 0.3 * p)}A${f2(rf)} ${f2(rf)} 0 0 1 ${P(rf, a + 0.7 * p)}`;
      }
      return d + 'Z';
    }

    const gCon = $('#g-construct'), gBacks = $('#g-backs'), gFaces = $('#g-faces'), gPitch = $('#g-pitch');
    const order = { A: 0.45, C: 0.6, B: 0.75, D: 0.9 };

    // construction: centre lines + line of centres
    let con = '';
    gears.forEach((g) => {
      const e = g.r + m + 22;
      con += `M${f2(g.x - e)} ${f2(g.y)}H${f2(g.x + e)}M${f2(g.x)} ${f2(g.y - e)}V${f2(g.y + e)}`;
      if (g !== C) con += `M${f2(C.x)} ${f2(C.y)}L${f2(g.x)} ${f2(g.y)}`;
    });
    mk('path', { d: con, class: 'blue', 'stroke-dasharray': '16 4 2 4', opacity: '.5' }, gCon);

    gears.forEach((g) => {
      const tooth = toothPath(g);
      // depth (fixed offset = light from top-left)
      const back = mk('g', { class: 'gear-back fade-in', 'data-delay': String(order[g.id] + 0.7) }, gBacks);
      mk('path', { d: tooth, class: 'tooth' }, back);
      mk('path', { d: tooth, class: 'shade' }, back);

      const face = mk('g', { class: 'gear gear-face', 'data-id': g.id }, gFaces);
      const rr = g.r - 1.25 * m - 0.9 * m;          // rim
      const rh = Math.max(10, g.r * 0.26);            // hub
      const holes = g.z >= 26 ? 6 : g.z >= 18 ? 5 : 0;
      const ringR = (rr + rh) / 2, holeR = (rr - rh) * 0.3;
      let web = circ(rr) + circ(rh);
      const holeDs = [];
      for (let j = 0; j < holes; j++) {
        const a = (j * 2 * Math.PI) / holes + Math.PI / holes;
        const hd = circAt(ringR * Math.cos(a), ringR * Math.sin(a), holeR);
        web += hd;
        holeDs.push(hd);
      }
      mk('path', { d: tooth, class: 'tooth', 'data-draw': '', 'data-delay': String(order[g.id]), 'data-dur': '1.5' }, face);
      mk('path', { d: web, class: 'web fade-in', 'fill-rule': 'evenodd', 'data-delay': String(order[g.id] + 0.9) }, face);
      mk('path', { d: circ(rr), class: 'rim', 'data-draw': '', 'data-delay': String(order[g.id] + 0.35), 'data-dur': '1' }, face);
      holeDs.forEach((hd, j) => mk('path', { d: hd, class: 'hole', 'data-draw': '', 'data-delay': String(order[g.id] + 0.6 + j * 0.05), 'data-dur': '.5' }, face));
      mk('path', { d: circ(rh), class: 'hub', 'data-draw': '', 'data-delay': String(order[g.id] + 0.55), 'data-dur': '.6' }, face);
      mk('path', { d: circ(rh * 0.45), class: 'bore', 'data-draw': '', 'data-delay': String(order[g.id] + 0.7), 'data-dur': '.5' }, face);
      mk('rect', { x: f2(-rh * 0.12), y: f2(-rh * 0.45 - 2.5), width: f2(rh * 0.24), height: '5', class: 'key fade-in', 'data-delay': String(order[g.id] + 1) }, face);
      mk('path', { d: tooth, class: 'tooth-2 fade-in', transform: 'translate(1.1 -.9)', 'data-delay': String(order[g.id] + 1.1) }, face);
      // invisible hit area so dragging works on the whole disc
      mk('circle', { r: f2(g.r + m), fill: 'transparent' }, face);

      // pitch circle (dashed, static)
      mk('circle', { cx: f2(g.x), cy: f2(g.y), r: f2(g.r), class: 'blue-dash' }, gPitch);

      g.face = face;
      g.back = back;
      g.rpmEl = $(`#rpm-${g.id}`);
    });

    // state
    let theta = 0;
    const IDLE = reduce ? 0 : 0.34;               // rad/s for gear C (≈3.2 rpm)
    let omega = IDLE;
    let wEst = 0, prevTheta = 0;
    let drag = null;
    let raf = 0, last = performance.now(), lastRpm = 0, visible = true;

    function apply() {
      for (const g of gears) {
        const a = ((g.k * theta + g.off) * 180) / Math.PI;
        g.face.setAttribute('transform', `translate(${f2(g.x)} ${f2(g.y)}) rotate(${a.toFixed(3)})`);
        g.back.setAttribute('transform', `translate(${f2(g.x + 5)} ${f2(g.y + 6)}) rotate(${a.toFixed(3)})`);
      }
    }
    function rpm(now, force) {
      if (!force && now - lastRpm < 140) return;
      lastRpm = now;
      for (const g of gears) {
        if (!g.rpmEl) continue;
        const w = g.k * wEst;
        const val = Math.abs(w) * 60 / (2 * Math.PI);
        const dir = Math.abs(val) < 0.05 ? '··' : w > 0 ? 'CW' : 'CCW';
        g.rpmEl.textContent = `${dir} ${val.toFixed(1)} RPM`;
      }
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag) {
        omega += (IDLE - omega) * (1 - Math.exp(-dt * 0.8));
        theta += omega * dt;
      }
      if (dt > 0) wEst = lerp(wEst, (theta - prevTheta) / dt, 0.12);
      prevTheta = theta;
      apply();
      rpm(now);
      raf = visible ? requestAnimationFrame(tick) : 0;
    }
    function start() {
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }

    apply();
    rpm(0, true);

    const toSvg = (e) => {
      const pt = gearSvg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(gearSvg.getScreenCTM().inverse());
    };

    gearSvg.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.gear');
      if (!el) return;
      const g = gears.find((x) => x.id === el.dataset.id);
      e.preventDefault();
      gearSvg.setPointerCapture(e.pointerId);
      const pt = toSvg(e);
      drag = { g, id: e.pointerId, last: Math.atan2(pt.y - g.y, pt.x - g.x), t: performance.now(), v: 0 };
      gearSvg.classList.add('is-dragging');
      omega = 0;
      start();
    });
    gearSvg.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const pt = toSvg(e);
      const a = Math.atan2(pt.y - drag.g.y, pt.x - drag.g.x);
      let d = a - drag.last;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      drag.last = a;
      const dTh = d / drag.g.k;
      theta += dTh;
      const now = performance.now();
      const dt = Math.max(0.008, (now - drag.t) / 1000);
      drag.t = now;
      drag.v = lerp(drag.v, dTh / dt, 0.35);
    });
    const end = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const stale = performance.now() - drag.t > 120;
      omega = reduce ? 0 : clamp(stale ? 0 : drag.v, -14, 14);
      drag = null;
      gearSvg.classList.remove('is-dragging');
    };
    gearSvg.addEventListener('pointerup', end);
    gearSvg.addEventListener('pointercancel', end);
    gearSvg.addEventListener('lostpointercapture', end);

    gearSvg.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      if (reduce) { theta += dir * 0.12; apply(); }
      else omega = clamp(omega + dir * 1.4, -14, 14);
      start();
    });

    // scroll turns the train while the hero is on screen
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (visible) theta += (y - lastY) * 0.0032;
      lastY = y;
    }, { passive: true });

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) start();
    });
    io.observe($('.hero'));
    start();

    gearsApi = { gears };
  }

  /* ----------------------------------------------------------
     Handwriting write-on (HTML text set in the hand font)
     ---------------------------------------------------------- */
  function splitWords(el) {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.namespaceURI !== NS) {
          walk(n);
        }
      });
    };
    walk(el);
    return words;
  }
  // A small, repeatable random source per text, so each line has its own rhythm
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    h |= 1;
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  // Pen time for one character: wide letters take longer, thin ones and marks are quick
  const charTime = (ch, rand) => {
    if (/\s/.test(ch)) return 0;
    const k = /[mwMW]/.test(ch) ? 1.4 : /[iljtfr.,'’:;!|·]/.test(ch) ? 0.55 : 1;
    return (0.045 + rand() * 0.03) * k;
  };
  const pauseAfter = (ch) => (/[,;:]/.test(ch) ? 0.16 : /[.!?—–…=+]/.test(ch) ? 0.24 : 0);

  // One hand per sheet: writers in the same card/section wait their turn
  const penQueues = new Map();
  function enqueue(el, at, durMs) {
    const key = el.closest('.card, .hero-sheet, section') || document.body;
    const start = Math.max(at, (penQueues.get(key) || 0) + 160);
    penQueues.set(key, start + durMs);
    return start;
  }

  // Pencil, drawn tip-at-origin and angled up to the right
  const PENCIL = '<g transform="rotate(-52)"><path class="pg" d="M0 0 6.5-2.3V2.3Z"/><path class="pw" d="M6.5-2.3 15-5.2V5.2L6.5 2.3Z"/><path class="pb" d="M15-5.2H46V5.2H15Z"/><path class="pl" d="M15 0H46"/><path class="pf" d="M46-5.2H51V5.2H46Z"/><path class="pe" d="M51-5.2H56Q58-5.2 58-3V3Q58 5.2 56 5.2H51Z"/></g>';

  // Drives the pencil along pos(t) from `start` (ms) for `total` (s), then lifts it away
  function runPen(pen, start, total, fs, pos, place, done) {
    let finished = false;
    const step = (now) => {
      const t = (now - start) / 1000;
      if (t < -0.2) { requestAnimationFrame(step); return; }
      let p, o = 1, lift = 0;
      if (t < 0) { p = pos(0); o = 1 + t / 0.2; lift = -t / 0.2; }
      else if (t <= total) {
        p = pos(t);
        // the small up-and-down of forming letters
        p = { x: p.x + Math.sin(now / 1000 * 2 * Math.PI * 11) * fs * 0.025, y: p.y + Math.sin(now / 1000 * 2 * Math.PI * 7.5) * fs * 0.06 };
      } else {
        if (!finished) { finished = true; if (done) done(); }
        const k = Math.min(1, (t - total) / 0.4);
        p = pos(total); o = 1 - k; lift = k;
        if (k >= 1) { pen.remove(); return; }
      }
      place(p.x + lift * fs * 0.5, p.y - lift * fs * 0.8, o);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Offset of a node inside an ancestor (walks through positioned wrappers like .res)
  function offsetIn(node, ancestor) {
    let x = 0, y = 0, n = node;
    while (n && n !== ancestor) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y };
  }

  function prepHand(el) {
    if (reduce || el.dataset.hw) return;
    el.dataset.hw = '1';
    const rand = seeded(el.textContent);
    splitWords(el).forEach((w) => {
      w.style.setProperty('--wr', `${((rand() - 0.5) * 1.6).toFixed(2)}deg`);
      w.style.setProperty('--wy', `${((rand() - 0.5) * 0.07).toFixed(3)}em`);
    });
    el.classList.add('hw');
  }

  // HTML text: each word inks in at its own pace, with pauses at gaps and punctuation
  function writeHand(el, delayS, done) {
    if (!el || reduce || !el.classList.contains('hw') || el.dataset.written) { if (done) done(); return; }
    el.dataset.written = '1';
    const words = $$('.w', el);
    if (!words.length) { if (done) done(); return; }
    const fs = parseFloat(getComputedStyle(el).fontSize) || 20;
    const rand = seeded(`${el.textContent}·`);
    let t = 0, prevTop = null;
    const sched = words.map((w, i) => {
      const o = offsetIn(w, el);
      if (i > 0) {
        t += 0.07 + rand() * 0.07 + pauseAfter(words[i - 1].textContent.slice(-1));
        if (prevTop !== null && o.y > prevTop + fs * 0.5) t += 0.12;   // pen travels to the next line
      }
      prevTop = o.y;
      let d = 0;
      for (const ch of w.textContent) d += charTime(ch, rand);
      d = Math.max(0.08, d * 1.15);
      const s = { w, t, d, x: o.x, y: o.y, W: w.offsetWidth, H: w.offsetHeight };
      t += d;
      return s;
    });
    let total = t;
    const k = total > 4.6 ? Math.max(0.55, 4.6 / total) : 1;   // long notes write a little faster
    sched.forEach((s) => { s.t *= k; s.d *= k; });
    total *= k;
    const start = enqueue(el, performance.now() + delayS * 1000, total * 1000);
    const lead = (start - performance.now()) / 1000;
    sched.forEach((s) => {
      s.w.style.setProperty('--wd', `${s.d.toFixed(3)}s`);
      s.w.style.setProperty('--wdl', `${(lead + s.t).toFixed(3)}s`);
    });
    el.getBoundingClientRect();
    el.classList.add('hw-go');

    const baseline = (s) => s.y + s.H - fs * 0.5;
    const pos = (time) => {
      let i = 0;
      while (i < sched.length - 1 && time >= sched[i + 1].t) i++;
      const s = sched[i];
      const f = (time - s.t) / s.d;
      if (f <= 1) return { x: s.x + clamp(-0.1 * s.W + 1.2 * s.W * f, 0, s.W), y: baseline(s) };
      const n = sched[i + 1];                                  // between words: glide to the next one
      if (!n) return { x: s.x + s.W, y: baseline(s) };
      const g = clamp((time - s.t - s.d) / Math.max(0.01, n.t - s.t - s.d), 0, 1);
      return { x: lerp(s.x + s.W, n.x, g), y: lerp(baseline(s), baseline(n), g) - Math.sin(g * Math.PI) * fs * 0.18 };
    };
    const pen = document.createElement('span');
    pen.className = `pen${el.closest('.paper') ? ' pen--paper' : ''}`;
    pen.setAttribute('aria-hidden', 'true');
    const sc = fs / 24;
    pen.innerHTML = `<svg width="${(48 * sc).toFixed(1)}" height="${(58 * sc).toFixed(1)}" viewBox="-6 -52 48 58">${PENCIL}</svg>`;
    el.appendChild(pen);
    const place = (x, y, o) => {
      pen.style.opacity = o.toFixed(2);
      pen.style.transform = `translate(${(x - 6 * sc).toFixed(1)}px, ${(y - 52 * sc).toFixed(1)}px)`;
    };
    runPen(pen, start, total, fs, pos, place, done);
  }

  // Handwritten SVG labels in the sketches: revealed letter by letter behind the pencil
  function writeSvgText(txt, delayS) {
    const reveal = () => { txt.style.clipPath = 'none'; };
    let n = 0, bb, xs = [];
    try {
      n = txt.getNumberOfChars();
      bb = txt.getBBox();
      for (let i = 0; i < n; i++) xs.push([txt.getStartPositionOfChar(i), txt.getEndPositionOfChar(i)]);
    } catch (e) { n = 0; }
    if (!n || !bb || !bb.width) { reveal(); return; }
    const fs = parseFloat(txt.getAttribute('font-size')) || 20;
    const rand = seeded(txt.textContent);
    const chars = Array.from(txt.textContent);
    let t = 0;
    const sched = xs.map(([a, b], i) => {
      const ch = chars[i] || '';
      const d = /\s/.test(ch) ? 0.07 + rand() * 0.07 : Math.max(0.025, charTime(ch, rand));
      const s = { x0: a.x, x1: b.x, y: a.y, t, d };
      t += d + pauseAfter(ch) * 0.6;
      return s;
    });
    let total = t;
    const k = total > 2.6 ? 2.6 / total : 1;
    sched.forEach((s) => { s.t *= k; s.d *= k; });
    total *= k;
    const start = enqueue(txt, performance.now() + delayS * 1000, total * 1000);
    const right = bb.x + bb.width;
    const pos = (time) => {
      let i = 0;
      while (i < sched.length - 1 && time >= sched[i + 1].t) i++;
      const s = sched[i];
      const f = clamp((time - s.t) / s.d, 0, 1);
      return { x: lerp(s.x0, s.x1, f), y: s.y - fs * 0.12 };
    };
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `pen-g${txt.closest('.paper') ? ' pen--paper' : ''}`);
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = PENCIL;
    txt.parentNode.appendChild(g);
    const sc = fs / 24;
    let writing = false;
    const place = (x, y, o) => {
      g.style.opacity = o.toFixed(2);
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})`);
      const now = (performance.now() - start) / 1000;
      if (now >= 0 && now <= total) {
        writing = true;
        const front = pos(now).x;
        txt.style.clipPath = `inset(-60% ${Math.max(0, right - front).toFixed(1)}px -70% -10%)`;
      } else if (writing && now > total) {
        reveal();
      }
    };
    runPen(g, start, total, fs, pos, place, reveal);
  }

  const handTargets = $$('.quote-note q, .sec-note, .contact .sign, .given .tag, .therefore .tag, .gpa-note, .next-head .hand, .bench-note, .sheet-hint');
  handTargets.forEach(prepHand);
  const handIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      writeHand(en.target, 0.15);
      handIO.unobserve(en.target);
    });
  }, { threshold: 0.6, rootMargin: '0px 0px -8% 0px' });
  handTargets.forEach((el) => handIO.observe(el));

  /* ----------------------------------------------------------
     Hero entrance
     ---------------------------------------------------------- */
  function boot() {
    initGears();
    if (gearSvg) { gearSvg.dataset.step = '0'; prepDraw(gearSvg); }
    const eq = $('#eq-box');
    if (eq) prepDraw(eq);
    const eqLine = $('.eq');
    if (eqLine) prepHand(eqLine);

    const go = () => {
      root.classList.add('is-loaded');
      // write the equation, then box the answer
      if (eqLine) writeHand(eqLine, 0.6, () => drawNow(eq));
      else drawNow(eq);
      setTimeout(() => drawNow(gearSvg), reduce ? 0 : 250);
    };
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(go));
  }

  /* ----------------------------------------------------------
     Reveal + draw observers
     ---------------------------------------------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    let i = 0;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const t = en.target;
      if (!t.style.getPropertyValue('--rd')) t.style.setProperty('--rd', `${(i++) * 0.09}s`);
      t.classList.add('is-in');
      revealIO.unobserve(t);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  const drawScopes = $$('.draw').filter((s) => s !== gearSvg && s.id !== 'eq-box');
  drawScopes.forEach(prepDraw);
  const drawIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const s = en.target;
      setTimeout(() => drawNow(s), reduce ? 0 : 180);
      drawIO.unobserve(s);
    });
  }, { threshold: 0.3 });
  drawScopes.forEach((s) => drawIO.observe(s));

  /* ----------------------------------------------------------
     Nav: solid on scroll, active section, mobile menu
     ---------------------------------------------------------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  const links = $$('.nav-links a');
  const roS = $('#ro-s');
  const sheetNo = { top: '01', about: '02', work: '03', lab: '04', spec: '05', contact: '06' };
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
      if (roS && sheetNo[id]) roS.textContent = sheetNo[id];
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secIO.observe(s));

  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

  /* ----------------------------------------------------------
     CAD layer: ruler labels, crosshair, X/Y readout in mm
     ---------------------------------------------------------- */
  const ruler = $('.ruler');
  const cadMQ = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
  const PX_MM = 0.2646;
  function buildRuler() {
    if (!ruler || !cadMQ.matches) return;
    // measure the page without the ruler itself, so it can shrink as well as grow
    ruler.style.height = '0px';
    const h = document.documentElement.scrollHeight;
    ruler.style.height = '';
    root.style.setProperty('--doc-h', `${h}px`);
    const want = Math.floor(h / 37.8);
    if (ruler.childElementCount === want) return;
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= want; i++) {
      const s = document.createElement('span');
      s.style.top = `${(i * 37.8).toFixed(1)}px`;
      s.textContent = i;
      frag.appendChild(s);
    }
    ruler.textContent = '';
    ruler.appendChild(frag);
  }
  buildRuler();
  if ('ResizeObserver' in window) new ResizeObserver(() => buildRuler()).observe(document.body);
  window.addEventListener('load', buildRuler);

  if (fine) {
    const xv = $('.xh--v'), xh = $('.xh--h'), mark = $('.ruler-mark'), rx = $('#ro-x'), ry = $('#ro-y');
    let px = 0, py = 0, queued = false;
    const fmt = (v) => v.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const paint = () => {
      queued = false;
      if (!cadMQ.matches) return;
      xv.style.transform = `translateX(${px}px)`;
      xh.style.transform = `translateY(${py}px)`;
      mark.style.transform = `translateY(${py}px)`;
      const rw = parseFloat(getComputedStyle(root).getPropertyValue('--ruler')) || 0;
      rx.textContent = fmt(Math.max(0, px - rw) * PX_MM);
      ry.textContent = fmt((py + window.scrollY) * PX_MM);
    };
    let idle = 0;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      root.classList.add('cad-on');
      clearTimeout(idle);
      idle = setTimeout(() => root.classList.remove('cad-on'), 2200);
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    document.addEventListener('mouseleave', () => root.classList.remove('cad-on'));
  }

  /* ----------------------------------------------------------
     Work: filters (with View Transitions) + CTA tile span
     ---------------------------------------------------------- */
  const grid = $('#work-grid');
  const cards = $$('.card[data-cat]');
  const cta = $('.card--cta');
  cards.forEach((c, i) => { c.style.viewTransitionName = `card-${i}`; });
  if (cta) cta.style.viewTransitionName = 'card-cta';

  function sizeCta() {
    if (!grid || !cta) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    const n = cards.filter((c) => !c.hidden).length;
    const rem = n % cols;
    cta.style.gridColumn = cols === 1 ? '' : `span ${rem === 0 ? cols : cols - rem}`;
  }
  sizeCta();
  window.addEventListener('resize', sizeCta);

  $$('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      const apply = () => {
        cards.forEach((c) => { c.hidden = !(cat === 'all' || c.dataset.cat === cat); });
        $$('.filter').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        sizeCta();
        cards.concat(cta).forEach((c) => {
          if (c.hidden) return;
          c.classList.add('is-in');
          const d = $('.draw', c);
          if (d) drawNow(d);
        });
        setTimeout(buildRuler, 60);
      };
      if (document.startViewTransition && !reduce) document.startViewTransition(apply);
      else apply();
    });
  });

  // Brachistochrone card: ball rolls down the cycloid on hover
  $$('[data-roll]').forEach((card) => {
    const path = $('[data-cycloid]', card);
    const ball = $('.roll-ball', card);
    if (!path || !ball) return;
    let raf = 0, t0 = 0;
    const L = () => path.getTotalLength();
    const place = (s) => {
      const p = path.getPointAtLength(s);
      ball.setAttribute('cx', f2(p.x));
      ball.setAttribute('cy', f2(p.y));
    };
    const loop = (now) => {
      const T = 1500, hold = 500;
      const k = ((now - t0) % (T + hold)) / T;
      const u = Math.min(1, k);
      // arc-length on a cycloid grows like 1 - cos(πu/2·…) — ease-in feels right
      place(L() * (1 - Math.cos((u * Math.PI) / 2)));
      raf = requestAnimationFrame(loop);
    };
    const startRoll = () => { if (reduce || raf) return; t0 = performance.now(); raf = requestAnimationFrame(loop); };
    const stopRoll = () => { cancelAnimationFrame(raf); raf = 0; place(0); };
    card.addEventListener('pointerenter', startRoll);
    card.addEventListener('pointerleave', stopRoll);
    card.addEventListener('focusin', startRoll);
    card.addEventListener('focusout', stopRoll);
  });

  /* ----------------------------------------------------------
     Caliper (tolerance toy)
     ---------------------------------------------------------- */
  (function caliper() {
    const range = $('#cal-range');
    if (!range) return;
    const jaw = $('#cal-jaw'), read = $('#cal-read'), msg = $('#cal-msg'), ticks = $('#cal-ticks');
    const X0 = 60, S = 14, PIN = 12;
    let d = '';
    for (let mm = 0; mm <= 25; mm++) {
      const x = X0 + mm * S;
      const len = mm % 5 === 0 ? 10 : 5;
      d += `M${x} 38V${38 - len}`;
      if (mm % 5 === 0) {
        const t = mk('text', { x, y: 15, 'text-anchor': 'middle', class: 'svg-mono', 'font-size': '8' }, ticks);
        t.textContent = mm;
      }
    }
    mk('path', { d, class: 'tick' }, ticks);

    const upd = () => {
      const v = parseFloat(range.value);
      const shown = Math.max(v, PIN);
      jaw.setAttribute('transform', `translate(${f2(X0 + shown * S)} 0)`);
      read.textContent = `${v.toFixed(2)} mm`;
      if (v < PIN - 1e-9) {
        msg.textContent = `Too tight by ${(PIN - v).toFixed(2)} mm — you'd squash it.`;
        msg.className = 'caliper-msg bad';
      } else if (v - PIN <= 0.02 + 1e-9) {
        msg.textContent = `${v.toFixed(2)} mm. Within ±0.02 — measured twice, spot on.`;
        msg.className = 'caliper-msg ok';
      } else {
        msg.textContent = `${(v - PIN).toFixed(2)} mm gap. Close it up.`;
        msg.className = 'caliper-msg';
      }
    };
    range.addEventListener('input', upd);
    const v0 = parseFloat(range.value);
    jaw.setAttribute('transform', `translate(${f2(X0 + v0 * S)} 0)`);
  })();

  /* ----------------------------------------------------------
     Bench test 01: large-angle pendulum
     ---------------------------------------------------------- */
  (function pendulum() {
    const svg = $('#pend-svg');
    if (!svg) return;
    const g = 9.81, L = 1;
    const w0 = Math.sqrt(g / L);
    const T0 = (2 * Math.PI) / w0;
    const PX = 140, PY = 150, LP = 112;
    const range = $('#pend-angle'), out = $('#pend-angle-out'), btn = $('#pend-play');
    const rod = $('#pend-rod'), bob = $('#pend-bob'), grod = $('#pend-grod'), gbob = $('#pend-gbob');
    const arc = $('#pend-arc'), curve = $('#pend-curve'), dot = $('#pend-dot'), guide = $('#pend-guide');
    const elT0 = $('#pend-t0'), elT = $('#pend-t'), elErr = $('#pend-err');

    const K = (k) => {
      let a = 1, b = Math.sqrt(1 - k * k);
      for (let i = 0; i < 20; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
      return Math.PI / (2 * a);
    };
    const period = (th0) => 4 * Math.sqrt(L / g) * K(Math.sin(th0 / 2));
    const gx = (deg) => 300 + (deg / 170) * 140;
    const gy = (ratio) => 170 - ((ratio - 1) / 1) * 120;   // 1.0 → 170, 2.0 → 50

    let cd = '';
    for (let deg = 0; deg <= 170; deg += 2) {
      const ratio = period((Math.max(deg, 0.5) * Math.PI) / 180) / T0;
      const y = Math.max(gy(ratio), 30);
      cd += `${deg ? 'L' : 'M'}${f2(gx(deg))} ${f2(y)}`;
    }
    curve.setAttribute('d', cd);

    let th0 = (60 * Math.PI) / 180, th = th0, om = 0, t = 0;
    let running = false, raf = 0, last = 0;

    const pos = (a) => ({ x: PX + LP * Math.sin(a), y: PY + LP * Math.cos(a) });
    function draw() {
      const p = pos(th), q = pos(th0 * Math.cos(w0 * t));
      rod.setAttribute('x2', f2(p.x)); rod.setAttribute('y2', f2(p.y));
      bob.setAttribute('cx', f2(p.x)); bob.setAttribute('cy', f2(p.y));
      grod.setAttribute('x2', f2(q.x)); grod.setAttribute('y2', f2(q.y));
      gbob.setAttribute('cx', f2(q.x)); gbob.setAttribute('cy', f2(q.y));
    }
    function setAngle(deg) {
      th0 = (deg * Math.PI) / 180;
      th = th0; om = 0; t = 0;
      out.textContent = `${deg}°`;
      const a = pos(-th0), b = pos(th0);
      arc.setAttribute('d', `M${f2(a.x)} ${f2(a.y)}A${LP} ${LP} 0 ${deg > 90 ? 1 : 0} 0 ${f2(b.x)} ${f2(b.y)}`);
      const T = period(th0);
      const ratio = T / T0;
      elT0.innerHTML = `${T0.toFixed(3)}<small>s</small>`;
      elT.innerHTML = `${T.toFixed(3)}<small>s</small>`;
      elErr.innerHTML = `${((ratio - 1) * 100).toFixed(1)}<small>%</small>`;
      const x = gx(deg), y = Math.max(gy(ratio), 30);
      dot.setAttribute('cx', f2(x)); dot.setAttribute('cy', f2(y));
      guide.setAttribute('d', `M${f2(x)} 170V${f2(y)}H300`);
      draw();
    }
    const acc = (a) => -(g / L) * Math.sin(a);
    function step(h) {
      // RK4 on θ'' = -(g/L) sin θ
      const k1t = om, k1o = acc(th);
      const k2t = om + (h / 2) * k1o, k2o = acc(th + (h / 2) * k1t);
      const k3t = om + (h / 2) * k2o, k3o = acc(th + (h / 2) * k2t);
      const k4t = om + h * k3o, k4o = acc(th + h * k3t);
      th += (h / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
      om += (h / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
      t += h;
    }
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const n = Math.max(1, Math.ceil(dt / (1 / 480)));
      for (let i = 0; i < n; i++) step(dt / n);
      draw();
      raf = running ? requestAnimationFrame(loop) : 0;
    }
    function play(on) {
      running = on;
      btn.textContent = on ? 'Pause' : 'Release';
      btn.setAttribute('aria-pressed', String(on));
      if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }
    let userPaused = reduce;   // reduced motion: only runs when the visitor presses Release
    range.addEventListener('input', () => setAngle(+range.value));
    btn.addEventListener('click', () => { play(!running); userPaused = !running; });
    setAngle(+range.value);

    // run while on screen (unless the visitor paused it); stop off-screen to save battery
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!userPaused) play(true); }
      else if (running) { running = false; cancelAnimationFrame(raf); raf = 0; btn.textContent = 'Release'; btn.setAttribute('aria-pressed', 'false'); }
    }, { threshold: 0.35 }).observe(svg);
  })();

  /* ----------------------------------------------------------
     Bench test 02: brachistochrone race
     ---------------------------------------------------------- */
  (function race() {
    const svg = $('#race-svg');
    if (!svg) return;
    const g = 9.81, S = 0.5 / 75;           // 75 px = 0.5 m
    const A = { x: 40, y: 36 };
    const B0 = { x: 404, y: 270 };
    let B = { ...B0 };
    const tracks = {
      cyc: { path: $('#trk-cyc'), bead: $('#bead-cyc'), out: $('#t-cyc') },
      line: { path: $('#trk-line'), bead: $('#bead-line'), out: $('#t-line') },
      dive: { path: $('#trk-dive'), bead: $('#bead-dive'), out: $('#t-dive') },
    };
    const handle = $('#race-b');
    let raf = 0, t0 = 0, racing = false;

    function clampB(x, y) {
      x = clamp(x, A.x + 120, 440);
      y = clamp(y, A.y + 90, 280);
      if ((x - A.x) / (y - A.y) > 1.55) y = A.y + (x - A.x) / 1.55;
      if (y > 280) { y = 280; x = A.x + 1.55 * (y - A.y); }
      if ((x - A.x) / (y - A.y) < 0.4) x = A.x + 0.4 * (y - A.y);
      return { x, y };
    }
    function timed(pts) {
      let t = 0;
      const out = [{ x: pts[0].x, y: pts[0].y, t: 0 }];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const ds = Math.hypot(b.x - a.x, b.y - a.y) * S;
        const v0 = Math.sqrt(2 * g * Math.max(0, (a.y - A.y) * S));
        const v1 = Math.sqrt(2 * g * Math.max(0, (b.y - A.y) * S));
        const dt = i === 1 ? (2 * ds) / Math.max(v1, 1e-6) : ds / Math.max((v0 + v1) / 2, 1e-6);
        t += dt;
        out.push({ x: b.x, y: b.y, t });
      }
      return out;
    }
    function build() {
      const n = 240;
      const X = B.x - A.x, Y = B.y - A.y;
      const line = [], dive = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        line.push({ x: A.x + X * u, y: A.y + Y * u });
        // cubic Bézier: drop almost straight down, then run flat into B
        const p1 = { x: A.x, y: A.y + 0.95 * Y }, p2 = { x: A.x + 0.12 * X, y: B.y };
        const mu = 1 - u;
        dive.push({
          x: mu * mu * mu * A.x + 3 * mu * mu * u * p1.x + 3 * mu * u * u * p2.x + u * u * u * B.x,
          y: mu * mu * mu * A.y + 3 * mu * mu * u * p1.y + 3 * mu * u * u * p2.y + u * u * u * B.y,
        });
      }
      const cyc = cycloidPts(A, B, n);
      tracks.cyc.pts = timed(cyc);
      tracks.line.pts = timed(line);
      tracks.dive.pts = timed(dive);
      for (const k in tracks) tracks[k].path.setAttribute('d', toD(tracks[k].pts));
      handle.setAttribute('transform', `translate(${f2(B.x)} ${f2(B.y)})`);
      handle.setAttribute('aria-valuetext', `B is ${((B.x - A.x) * S).toFixed(2)} m across and ${((B.y - A.y) * S).toFixed(2)} m down from A`);
    }
    function placeAll(tPhys) {
      let done = true;
      for (const k in tracks) {
        const tr = tracks[k], pts = tr.pts, total = pts[pts.length - 1].t;
        let p;
        if (tPhys >= total) { p = pts[pts.length - 1]; if (racing && !tr.finished) { tr.finished = true; tr.out.textContent = `${total.toFixed(3)} s`; } }
        else {
          done = false;
          let lo = 0, hi = pts.length - 1;
          while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid].t <= tPhys) lo = mid; else hi = mid; }
          const a = pts[lo], b = pts[hi];
          const f = (tPhys - a.t) / Math.max(b.t - a.t, 1e-9);
          p = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
        }
        tr.bead.setAttribute('cx', f2(p.x));
        tr.bead.setAttribute('cy', f2(p.y));
      }
      return done;
    }
    function rank() {
      const order = Object.keys(tracks).sort((a, b) => tracks[a].pts.at(-1).t - tracks[b].pts.at(-1).t);
      const labels = ['1st', '2nd', '3rd'];
      order.forEach((k, i) => {
        const tr = tracks[k];
        tr.out.innerHTML = `${tr.pts.at(-1).t.toFixed(3)} s<span class="race-rank">${labels[i]}</span>`;
      });
    }
    function reset() {
      cancelAnimationFrame(raf); raf = 0; racing = false;
      for (const k in tracks) { tracks[k].finished = false; tracks[k].out.textContent = '—'; }
      placeAll(0);
    }
    function go() {
      reset();
      if (reduce) { racing = true; placeAll(1e9); rank(); racing = false; return; }
      racing = true;
      t0 = performance.now();
      const loop = (now) => {
        const tPhys = ((now - t0) / 1000) * 0.5;
        const done = placeAll(tPhys);
        if (done) { rank(); racing = false; raf = 0; return; }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    // drag B
    const toSvg = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    let dragId = null;
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragId = e.pointerId;
      handle.setPointerCapture(e.pointerId);
      reset();
    });
    handle.addEventListener('pointermove', (e) => {
      if (e.pointerId !== dragId) return;
      const p = toSvg(e);
      B = clampB(p.x, p.y);
      build();
      placeAll(0);
    });
    const up = (e) => { if (e.pointerId === dragId) dragId = null; };
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] };
      const d = map[e.key];
      if (!d) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } return; }
      e.preventDefault();
      reset();
      B = clampB(B.x + d[0], B.y + d[1]);
      build();
      placeAll(0);
    });
    $('#race-go').addEventListener('click', go);
    $('#race-reset').addEventListener('click', () => { B = { ...B0 }; build(); reset(); });

    build();
    reset();
    if (!reduce) {
      new IntersectionObserver(([en], obs) => {
        if (en.isIntersecting) { setTimeout(go, 700); obs.disconnect(); }
      }, { threshold: 0.5 }).observe(svg);
    }
  })();

  /* ----------------------------------------------------------
     Copy buttons
     ---------------------------------------------------------- */
  $$('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      b.textContent = ok ? 'Copied' : 'Press ⌘C';
      b.classList.add('done');
      setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600);
    });
  });

  boot();
})();
