/* NOIR LASH: opener (dot -> line -> logo -> photo strip) that settles into the big-name hero */
(() => {
  const html = document.documentElement;
  const $ = (s, e) => (e || document).querySelector(s);
  const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
  const hasG = !!window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- content you can swap ---------- */
  const WORDMARK = 'NOIR';
  const POOL = ['ref-1', 'work-2', 'nat-1', 'work-4', 'ref-3', 'nat-2', 'work-5', 'ref-2', 'nat-3', 'work-1', 'nat-4', 'work-3', 'nat-5', 'work-6'];
  // enough whole photos to run edge to edge across the screen (always an odd number, with 'girl' in the middle: she is the one that drops to the bottom)
  const NUM = Math.min(Math.max(2 * Math.round(innerWidth / Math.min(Math.max(innerWidth * 0.115, 90), 200) / 2) + 1, 5), 15);
  const CENTER = (NUM - 1) / 2;
  const STRIP = Array.from({ length: NUM }, (_, i) => i === CENTER ? 'girl' : POOL[(i < CENTER ? i : i - 1) % POOL.length]);

  /* ---------- logo: an eye with lashes, wordmark underneath ---------- */
  function logoHTML() {
    const P0 = [6, 36], P1 = [60, -8], P2 = [114, 36], N = 13;
    let lashes = '';
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N, u = 1 - t;
      const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0];
      const y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
      let dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
      let dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
      const m = Math.hypot(dx, dy); dx /= m; dy /= m;
      let nx = dy, ny = -dx; if (ny > 0) { nx = -nx; ny = -ny; }
      const fan = (t - 0.5) * 1.1;                       // lashes fan outward toward the corners
      const vx = nx + dx * fan, vy = ny + dy * fan, vm = Math.hypot(vx, vy);
      const L = 7 + 9 * Math.sin(Math.PI * t) + (i % 2 ? 2 : 0);
      lashes += `<line class="lash" data-o="${x.toFixed(1)} ${y.toFixed(1)}" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + vx / vm * L).toFixed(1)}" y2="${(y + vy / vm * L).toFixed(1)}"/>`;
    }
    return `<div class="logo"><svg viewBox="-2 -12 124 62" aria-hidden="true">`
      + `<path class="lid lid-lo" pathLength="1" d="M6 36Q60 56 114 36"/>`
      + `<path class="lid lid-up" pathLength="1" d="M6 36Q60 -8 114 36"/>`
      + `<circle class="iris" cx="60" cy="30" r="10"/><circle class="pupil" cx="60" cy="30" r="4"/>${lashes}</svg>`
      + `<div class="wm">${[...WORDMARK].map(c => `<span>${c}</span>`).join('')}</div></div>`;
  }
  const logoWrap = $('#logoWrap'), logoSlot = $('#logoSlot'), strip = $('#strip'), title = $('#title'), hero = $('.hero');
  logoWrap.innerHTML = logoHTML();
  logoSlot.innerHTML = logoHTML();

  /* ---------- big name: letters in masks so they can rise ---------- */
  const words = title.textContent.trim().split(/\s+/);
  title.setAttribute('aria-label', title.textContent.trim());
  title.innerHTML = words.map(w => `<span class="wd" aria-hidden="true">${[...w].map(c => `<span class="ln"><span class="ch">${c}</span></span>`).join('')}</span>`).join(' ');
  const chars = $$('.ch', title);

  // make the name span the full width of the screen (each word on its own line on phones)
  function fitTitle() {
    const pad = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
    const avail = innerWidth - pad * 2;
    const narrow = innerWidth < 700;
    title.classList.toggle('stack', narrow);
    title.style.fontSize = '100px';
    const w = narrow ? Math.max(...$$('.wd', title).map(e => e.getBoundingClientRect().width))
                     : title.getBoundingClientRect().width;
    title.style.fontSize = (100 * avail / w * 0.998).toFixed(2) + 'px';
  }

  /* ---------- photo strip ---------- */
  const GAP = Math.round(Math.max(innerWidth * 0.006, 4));
  const SW = (innerWidth - (NUM - 1) * GAP) / (NUM + 0.15);                    // photo width: the row spans the whole screen
  const SH = Math.round(SW * 1.25);                                            // 4:5 frames, so each photo shows almost in full
  strip.style.setProperty('--gap', GAP + 'px');
  strip.innerHTML = STRIP.map(n => `<div class="sp${n === 'girl' ? ' ctr' : ''}" style="background-image:url(images/${n}.jpg)"></div>`).join('');
  const sps = $$('.sp', strip), ctr = sps[CENTER];

  /* ---------- end state (used after the animation, and when motion is reduced) ---------- */
  function showFinal() {
    window.__noirReady = true;
    html.classList.add('ready');
    if (hasG) {
      gsap.set(chars, { yPercent: 0 });
      gsap.set(hero, { clearProps: 'clipPath' });
      gsap.set($$('.info > *, .cap'), { autoAlpha: 1, y: 0 });
    }
    $('#portrait').style.opacity = 1;
    logoSlot.style.opacity = 1;
    $('#opener').style.display = 'none';
    document.dispatchEvent(new Event('noir:final'));
  }

  /* ---------- the glitch used on the logo ---------- */
  function glitch(tl, target, at, steps = 8) {
    for (let i = 0; i < steps; i++) {
      tl.set(target, { x: gsap.utils.random(-10, 10), skewX: gsap.utils.random(-30, 30), scaleY: gsap.utils.random(0.5, 1.3), opacity: gsap.utils.random(0.5, 1) }, at + i * 0.05);
    }
    tl.set(target, { x: 0, skewX: 0, scaleY: 1, opacity: 1 }, at + steps * 0.05);
  }

  function run() {
    fitTitle();
    html.classList.add('ready');
    window.__noirReady = true;

    // starting states
    gsap.set(chars, { yPercent: 112 });
    gsap.set(hero, { clipPath: 'inset(100% 0% 0% 0%)' });   // the page is wiped upward later
    gsap.set($$('.info > *, .cap'), { autoAlpha: 0, y: 14 });
    $('#portrait').style.opacity = 0;
    logoSlot.style.opacity = 0;
    gsap.set(logoWrap, { xPercent: -50, yPercent: -50 });
    gsap.set(strip, { xPercent: -50, yPercent: -50 });
    // every photo starts above the screen, off to its own side and tilted, ready to swoop down into place
    const drop = -(innerHeight / 2 + SH * 2);
    gsap.set(sps, {
      width: (i, el) => el === ctr ? SW * 1.15 : SW, height: (i, el) => el === ctr ? SH * 1.15 : SH, opacity: 0,
      x: i => Math.sign(i - CENTER) * (SW * 2.2 + Math.abs(i - CENTER) * SW * 1.4),
      y: drop,
      rotation: i => Math.sign(i - CENTER) * (14 + Math.abs(i - CENTER) * 5)
    });
    const lids = $$('.lid', logoWrap), lashes = $$('.lash', logoWrap), iris = $$('.iris, .pupil', logoWrap), wm = $$('.wm span', logoWrap);
    gsap.set(lids, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(lashes, { scale: 0, svgOrigin: (i, el) => el.dataset.o });
    gsap.set(iris, { scale: 0, svgOrigin: '60 30' });
    gsap.set(wm, { yPercent: 130 });

    const T = gsap.timeline({ delay: 0.25 });

    // 1. a dot, which stretches into a line
    T.fromTo('.dot', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(3)' })
     .to('.dot', { opacity: 0, duration: 0.08 }, '+=0.15')
     .fromTo('.line', { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, '<')

    // 2. the line becomes an eye, lashes sprout, the wordmark drops in
     .set(logoWrap, { autoAlpha: 1 }, '+=0.05')
     .to('.line', { opacity: 0, duration: 0.3 }, '<')
     .to(lids, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.1 }, '<')
     .to(iris, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.05 }, '>-0.3')
     .to(lashes, { scale: 1, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.04 }, '>-0.25')
     .to(wm, { yPercent: 0, duration: 0.55, ease: 'power3.out', stagger: 0.07 }, '>-0.3');

    // 3. glitch
    glitch(T, logoWrap, T.duration() + 0.1);

    // 4. logo lifts, strip of work photos opens up beneath it
    const lift = -(SH * 0.62 + 64);
    T.to(strip, { opacity: 1, duration: 0.05 }, '+=0.2')
     .to(logoWrap, { y: lift, duration: 0.9, ease: 'power3.inOut' }, '<')
     .to(sps, { opacity: 1, duration: 0.2, stagger: { each: 0.05, from: 'center' } }, '<0.2')
     // the swoop: a fast drop (y) that curves in from the side (x) while the tilt unwinds
     .to(sps, { y: 0, duration: 1.15, ease: 'power3.out', stagger: { each: 0.05, from: 'center' } }, '<')
     .to(sps, { x: 0, rotation: 0, duration: 1.25, ease: 'power2.inOut', stagger: { each: 0.05, from: 'center' } }, '<')
     .to({}, { duration: 0.35 });

    // 5. the girl drops to the bottom (the logo goes with her), the other photos swoop down after her and
    //    pour into her, then the whole page wipes upward to reveal the name and the info
    T.addLabel('out');
    const others = sps.filter(el => el !== ctr);
    const dir = el => (sps.indexOf(el) < CENTER ? -1 : 1);
    const st = { each: 0.035, from: 'edges' };

    T.add(() => {
      const pr = $('#portrait').getBoundingClientRect(), lr = logoSlot.getBoundingClientRect();
      // a copy of the centre photo flies to the bottom (the original stays put so nothing reflows)
      const r = ctr.getBoundingClientRect();
      const fly = document.createElement('div');
      fly.className = 'sp';
      fly.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;opacity:1;background-image:${ctr.style.backgroundImage};background-position:50% 50%`;
      $('#opener').appendChild(fly);
      ctr.style.visibility = 'hidden';
      gsap.to(fly, { left: pr.left, top: pr.top, width: pr.width, height: pr.height, backgroundPosition: '50% 38%', duration: 1.25, ease: 'power4.inOut' });
      // the logo follows, with the wordmark sized to match the final one so nothing pops at the end
      const cur = logoWrap.getBoundingClientRect();
      const s = lr.width / cur.width;
      const wmF = $('.wm', logoSlot);
      if (wmF) wmF.style.fontSize = (parseFloat(getComputedStyle($('.wm', logoWrap)).fontSize) * lr.width / logoWrap.offsetWidth) + 'px';
      gsap.to(logoWrap, {
        x: gsap.getProperty(logoWrap, 'x') + (lr.left + lr.width / 2) - (cur.left + cur.width / 2),
        y: gsap.getProperty(logoWrap, 'y') + (lr.top + lr.height / 2) - (cur.top + cur.height / 2),
        scale: gsap.getProperty(logoWrap, 'scale') * s, duration: 1.25, ease: 'power4.inOut'
      });
    }, 'out');

    // everyone else follows her down: sideways first, then diving into her spot, shrinking and fading as they land
    const toHer = (el, axis) => {
      const a = el.getBoundingClientRect(), b = $('#portrait').getBoundingClientRect();
      return axis === 'x' ? (b.left + b.width / 2) - (a.left + a.width / 2) : (b.top + b.height / 2) - (a.top + a.height / 2);
    };
    // she goes first; the rest follow one after another, nearest first, with the same swoop they came in with:
    // a fast drop (y) that curves in from the side (x) while they tilt, ending inside her
    const follow = { each: 0.06, from: 'center' };
    T.to(others, { y: (i, el) => toHer(el, 'y'), duration: 1.15, ease: 'power3.out', stagger: follow }, 'out+=0.35')
     .to(others, { x: (i, el) => toHer(el, 'x'), rotation: (i, el) => dir(el) * -14, scale: 0.4, duration: 1.25, ease: 'power2.inOut', stagger: follow }, 'out+=0.35')
     .to(others, { opacity: 0, duration: 0.25, stagger: follow }, 'out+=1.45')
     .addLabel('wipe', 'out+=2.05');

    // the screen swipes up
    T.to(hero, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 'wipe')
     .to(chars, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 'wipe+=0.35')
     .to($$('.info > *, .cap'), { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 'wipe+=0.8')
     .add(showFinal, '+=0.35');

    window.__noirT = T;   // handy for stepping through the animation: __noirT.pause().seek(5)
    // keep the name fitted if the window changes
    addEventListener('resize', fitTitle);
  }

  /* ---------- go ---------- */
  logoSlot.addEventListener('click', e => { e.preventDefault(); location.reload(); });

  if (!hasG || reduce) {
    fitTitle(); showFinal(); addEventListener('resize', fitTitle);
    return;
  }

  // wait for fonts and photos so the opener doesn't stutter
  const imgs = STRIP.map(n => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = `images/${n}.jpg`; }));
  const ready = Promise.all([document.fonts ? document.fonts.ready : 0, ...imgs]);
  Promise.race([ready, new Promise(r => setTimeout(r, 3000))]).then(run);
})();
