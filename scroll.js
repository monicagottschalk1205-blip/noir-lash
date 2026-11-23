/* Noir Lash: scroll story.
   After the opener, scrolling grows the bottom photo (and the logo) until it fills the screen,
   then it turns into "The Work": a wall of photos that drifts upward as you keep scrolling. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out3 = t => 1 - Math.pow(1 - t, 3);

  const WORK = ['more-4', 'work-5', 'more-13', 'more-1', 'nat-1', 'more-14', 'more-7', 'work-2', 'more-15', 'more-2',
                'ref-3', 'more-16', 'more-10', 'work-4', 'more-17', 'more-3', 'nat-4', 'more-18', 'more-6', 'work-1',
                'more-19', 'more-12', 'nat-2', 'more-20', 'more-5', 'ref-2', 'more-21', 'more-8', 'work-6', 'more-22',
                'more-11', 'nat-3', 'more-9', 'work-3', 'nat-5', 'ref-1'];

  let started = false;
  document.addEventListener('noir:final', () => { if (!started) { started = true; setup(); } });

  function setup() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);

    const hero = $('.hero'), portrait = $('#portrait'), logoSlot = $('#logoSlot');
    if (!hero || !portrait || !logoSlot) return;

    /* ---- layers ---- */
    const grow = document.createElement('div');
    grow.className = 'grow';
    grow.innerHTML = '<img src="images/girl.jpg" alt="">';
    const growLogo = document.createElement('div');
    growLogo.className = 'grow-logo logo-slot';
    growLogo.innerHTML = logoSlot.innerHTML;
    const wall = document.createElement('section');
    wall.className = 'wall';
    wall.id = 'work';
    wall.setAttribute('aria-label', 'The work');
    wall.innerHTML =
      '<h2 class="wall-title"><i aria-hidden="true"></i>The Work</h2>' +
      '<div class="wall-inner"><div class="wall-cols"></div></div>';
    const spacer = document.createElement('div');
    spacer.className = 'scroll-space';
    document.body.append(spacer, grow, growLogo, wall);

    const cols = $('.wall-cols', wall), inner = $('.wall-inner', wall), title = $('.wall-title', wall);
    let tiles = [], colEls = [];
    const colCount = () => (innerWidth < 520 ? 2 : innerWidth < 900 ? 3 : 6);

    const sizes = {};
    const loadAll = Promise.all([...new Set(WORK)].map(n => new Promise(res => {
      const i = new Image();
      i.onload = i.onerror = () => { sizes[n] = i.naturalWidth ? i.naturalHeight / i.naturalWidth : 1.2; res(); };
      i.src = `images/${n}.jpg`;
    })));

    async function buildWall() {
      await loadAll;
      const n = colCount();
      cols.innerHTML = '';
      colEls = [];
      tiles = [];
      const offs = [0, 7, 2, 10, 4, 8];
      const heights = [];
      for (let c = 0; c < n; c++) {
        const col = document.createElement('div');
        col.className = 'wall-col';
        const off = offs[c % offs.length] * 1.3;
        col.style.marginTop = off + 'vh';
        cols.appendChild(col);
        colEls.push(col);
        heights.push(off * innerHeight / 100);
      }
      const colW = innerWidth / n;
      WORK.forEach((name, i) => {
        // each photo goes in the shortest column so the wall stays balanced
        let c = 0;
        for (let k = 1; k < n; k++) if (heights[k] < heights[c]) c = k;
        heights[c] += colW * sizes[name] + 30;
        const t = document.createElement('figure');
        t.className = 'tile';
        const img = new Image();
        img.src = `images/${name}.jpg`;
        img.alt = '';
        t.appendChild(img);
        t.dataset.r = sizes[name];
        colEls[c].appendChild(t);
        tiles.push({ el: t, d: (c * 0.09 + Math.floor(i / n) * 0.16) });
      });
      evenEnds(n);
      measure();
    }

    // every column gets the same bottom edge: the photos in a column share the height in proportion
    // to their own shapes (so they are only trimmed a little), which gives a clean, flat ending
    function evenEnds(n) {
      const gap = parseFloat(getComputedStyle(cols).columnGap) || 12;
      const colW = colEls[0].getBoundingClientRect().width;
      const tops = colEls.map(c => c.offsetTop - cols.offsetTop);   // px offset of each column's top
      const nat = colEls.map((c, k) => {
        const ts = [...c.children];
        return tops[k] + ts.reduce((h, t) => h + colW * t.dataset.r, 0) + gap * (ts.length - 1);
      });
      const H = nat.reduce((a, b) => a + b, 0) / nat.length;   // common bottom edge
      colEls.forEach((c, k) => {
        c.style.height = Math.round(H - tops[k]) + 'px';
        [...c.children].forEach(t => { t.style.flex = `${t.dataset.r} 1 0`; });
      });
    }

    /* ---- geometry ---- */
    let vw, vh, A, B, C, rect, logoR, curY = 0;
    function measure() {
      vw = innerWidth; vh = innerHeight;
      // measure the resting layout of the bottom cluster
      hero.classList.add('pinned');
      rect = portrait.getBoundingClientRect();
      logoR = logoSlot.getBoundingClientRect();
      const wallH = inner.scrollHeight;   // all columns end on the same line, so this is the real end
      A = vh * 1.1;
      B = vh * 0.9;
      C = Math.max(0, wallH - vh);
      spacer.style.height = (A + B + C + vh) + 'px';
      const k = Math.min(vw * 0.46, 520) / logoR.width;
      growLogo.style.cssText = `left:${logoR.left}px;top:${logoR.top}px;width:${logoR.width}px;height:${logoR.height}px`;
      growLogo.dataset.k = k;
      render(true);
    }

    /* ---- one frame, as a pure function of the scroll position ---- */
    function render(force) {
      const y = curY;
      const pA = clamp(y / A), eA = inOut(pA);
      const pB = clamp((y - A) / B);
      const started = y > 0.5;

      // the bottom photo grows from its own box to the whole screen
      grow.style.visibility = started ? 'visible' : 'hidden';
      portrait.style.visibility = started ? 'hidden' : 'visible';
      logoSlot.style.visibility = started ? 'hidden' : 'visible';
      growLogo.style.visibility = started ? 'visible' : 'hidden';
      grow.style.left = lerp(rect.left, 0, eA) + 'px';
      grow.style.top = lerp(rect.top, 0, eA) + 'px';
      grow.style.width = lerp(rect.width, vw, eA) + 'px';
      grow.style.height = lerp(rect.height, vh, eA) + 'px';
      grow.firstChild.style.objectPosition = `50% ${lerp(38, 30, eA)}%`;

      // the logo rides along and gets big too, then melts away as the work page arrives
      const k = +growLogo.dataset.k || 1;
      const cx = lerp(logoR.left + logoR.width / 2, vw / 2, eA) - (logoR.left + logoR.width / 2);
      const cy = lerp(logoR.top + logoR.height / 2, vh / 2, eA) - (logoR.top + logoR.height / 2);
      growLogo.style.transform = `translate(${cx}px,${cy}px) scale(${lerp(1, k, eA)})`;
      growLogo.style.opacity = 1 - clamp(pB * 3);

      // the rest of the page recedes
      hero.style.opacity = 1 - clamp(pA * 2);

      // the work wall appears tile by tile
      const wOp = clamp(pB * 2.2);
      wall.style.visibility = pB > 0 ? 'visible' : 'hidden';
      wall.style.setProperty('--wall-a', wOp.toFixed(3));
      if (pB > 0 || force) {
        for (const t of tiles) {
          const p = out3(clamp((pB * 1.6 - t.d) / 0.55));
          t.el.style.opacity = p.toFixed(3);
          t.el.style.transform = `translateY(${((1 - p) * 16).toFixed(2)}vh) scale(${(0.9 + 0.1 * p).toFixed(3)})`;
        }
        const tp = clamp((pB - 0.45) / 0.4);
        title.style.opacity = tp.toFixed(3);
        title.style.transform = `translateY(${((1 - tp) * 14).toFixed(1)}px)`;
      }
      // then the wall drifts up
      const drift = clamp(y - A - B, 0, C);
      inner.style.transform = `translate3d(0,${-drift}px,0)`;
    }

    /* ---- smooth follow of the scroll position ---- */
    let target = scrollY, raf = 0;
    function tick() {
      raf = 0;
      const d = target - curY;
      if (Math.abs(d) < 0.15) { curY = target; render(); return; }
      curY += d * 0.14;
      render();
      raf = requestAnimationFrame(tick);
    }
    addEventListener('scroll', () => { target = scrollY; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    addEventListener('resize', () => { buildWall(); requestAnimationFrame(measure); });

    // click the "The Work" title area or logo to jump back up
    title.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    buildWall();
    measure();
    window.__noirScroll = { jump: y => { target = y; curY = y; render(true); }, get A() { return A; }, get B() { return B; }, get C() { return C; } };
  }
})();
