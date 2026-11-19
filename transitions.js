/* ==========================================================
   Transitions
   1. Intro: a cover sheet where the MLA mark inks itself in and a
      ruler fills as the page loads, then the sheet lifts away.
      Plays once per visit (session).
   2. Sheet flip: in-page links swap to the target section behind
      a title sheet — like turning to the next drawing in a set.
   Loaded before script.js; exposes window.__mlaIntro (a promise
   that resolves when the hero may start its own entrance).
   ========================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- 1 · Intro cover sheet ---------------- */
  const intro = document.getElementById('intro');
  let releaseHero;
  window.__mlaIntro = new Promise((r) => { releaseHero = r; });

  if (!intro || !root.classList.contains('intro-on')) {
    if (intro) intro.remove();
    releaseHero();
  } else {
    window.__mlaIntroRunning = true;
    try { sessionStorage.setItem('mla-intro', '1'); } catch (e) { /* private mode: plays each visit */ }
    const pct = document.getElementById('intro-pct');
    const bar = intro.querySelector('.intro-bar');
    const t0 = performance.now();
    const MIN = 1900;                       // long enough for the mark to ink itself in
    let shown = 0, ready = false;

    const loaded = new Promise((r) => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([loaded, fonts]), wait(4500)]).then(() => { ready = true; });

    // counter eases toward 92% while loading, then runs to 100% once everything is in
    const tick = (now) => {
      const el = now - t0;
      const target = ready && el > MIN ? 100 : Math.min(92, 92 * (1 - Math.exp(-el / 900)));
      shown += (target - shown) * (ready && el > MIN ? 0.2 : 0.08);
      if (target === 100 && shown > 99.4) shown = 100;
      pct.textContent = String(Math.round(shown)).padStart(3, '0');
      bar.style.transform = `scaleX(${(shown / 100).toFixed(4)})`;
      if (shown < 100) { requestAnimationFrame(tick); return; }
      intro.classList.add('is-done');
      setTimeout(lift, 260);
    };
    requestAnimationFrame(tick);

    function lift() {
      intro.classList.add('is-lifting');
      root.classList.remove('intro-on');
      setTimeout(releaseHero, 320);         // hero starts drawing as the sheet clears
      setTimeout(() => { intro.remove(); window.__mlaIntroRunning = false; }, 1100);
    }
  }

  /* ---------------- 2 · Sheet flip between sections ---------------- */
  const flip = document.getElementById('flip');
  if (!flip || reduce || !flip.animate) return;
  const sheet = flip.querySelector('.flip-sheet');
  const fNo = flip.querySelector('.flip-no'), fName = flip.querySelector('.flip-name'), fSub = flip.querySelector('.flip-sub');
  let busy = false;

  function info(target) {
    if (target.id === 'top') return { no: 'Sheet 01 / 07', name: 'The idea', sub: 'Matthias Luc Ang' };
    const k = target.querySelector('.kicker');
    const [no, name] = (k ? k.textContent : '').split(' — ');
    const h = target.querySelector('h2');
    return { no: (no || '').trim(), name: (name || '').trim(), sub: h ? h.textContent.trim() : '' };
  }

  async function turnTo(target, hash) {
    busy = true;
    const dir = target.getBoundingClientRect().top > 0 ? 1 : -1;   // later sheet comes in from the right
    const i = info(target);
    fNo.textContent = i.no; fName.textContent = i.name; fSub.textContent = i.sub;
    flip.classList.add('is-on');
    const inn = sheet.animate([
      { transform: `translateX(${dir * 104}%) rotate(${dir * 2.5}deg)` },
      { transform: 'translateX(0) rotate(0deg)' },
    ], { duration: 460, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
    await inn.finished;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (hash) history.pushState(null, '', hash);
    await wait(260);
    const outA = sheet.animate([
      { transform: 'translateX(0) rotate(0deg)' },
      { transform: `translateX(${-dir * 104}%) rotate(${-dir * 2.5}deg)` },
    ], { duration: 520, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
    await outA.finished;
    inn.cancel(); outA.cancel();
    flip.classList.remove('is-on');
    // keyboard and screen-reader users land on the section heading
    const h = target.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    busy = false;
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip') || window.__mlaIntroRunning) return;
    const hash = a.getAttribute('href');
    const target = hash.length > 1 && document.getElementById(hash.slice(1));
    if (!target || !target.matches('section, main')) return;
    e.preventDefault();
    if (busy) return;
    if (Math.abs(target.getBoundingClientRect().top - 66) < 40) return;   // already there
    turnTo(target, hash);
  });
})();
