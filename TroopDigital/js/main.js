/* Troop Digital – homepage interactions
   No dependencies. Everything here is progressive enhancement: the page is fully
   readable without it, and motion is skipped for prefers-reduced-motion. */
(() => {
  'use strict';

  const doc = document.documentElement;
  const motion = doc.classList.contains('motion');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = t => t * t * (3 - 2 * t);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  const nav = $('[data-nav]');
  const hero = $('[data-hero]');
  const cta = $('[data-cta]');

  /* ---------------------------------------------------------------------
     1. Headings → word-by-word mask reveal
     --------------------------------------------------------------------- */
  if (motion) {
    $$('[data-split]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'w';
        inner.className = 'wi';
        inner.style.setProperty('--wi', i);
        inner.textContent = word;
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });
  }

  /* ---------------------------------------------------------------------
     2. Entrance on load + reveal on scroll
     --------------------------------------------------------------------- */
  const start = () => {
    doc.classList.add('is-loaded');
    $$('[data-split-load]').forEach(el => el.classList.add('is-in'));
  };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 800))]).then(() => requestAnimationFrame(start));

  const revealTargets = $$('[data-reveal], [data-split]:not([data-split-load])');
  if (motion && 'IntersectionObserver' in window) {
    // The dial is a 0 × 0 point off the left page edge, which the observer never sees intersect: it is
    // revealed when its stage comes into view instead
    const watched = new Map(revealTargets.map(el => [el.classList.contains('dial') ? el.parentElement : el, el]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        watched.get(entry.target).classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    watched.forEach((el, target) => io.observe(target));
  } else {
    revealTargets.forEach(el => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------------------
     3. Scroll-linked state (one rAF-throttled handler)
        · hero: full-bleed → 16 px inset + rounded lower corners
        · CTA portraits rise into place
        · nav gets a hairline once the page moves
     --------------------------------------------------------------------- */
  const HERO_DISTANCE = 420;   // px of scroll for the hero to reach its final inset
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    nav.classList.toggle('is-scrolled', y > 4);

    if (hero) hero.style.setProperty('--p', smoothstep(clamp(y / HERO_DISTANCE, 0, 1)).toFixed(4));

    if (cta && motion) {
      const vh = window.innerHeight;
      const top = cta.getBoundingClientRect().top;
      cta.style.setProperty('--rise', clamp((top - vh * 0.3) / (vh * 0.7), 0, 1).toFixed(4));
    }
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  update();

  /* ---------------------------------------------------------------------
     3b. De ingrediënten: the stage pins and the dial turns through the steps
         · .ing is a tall track, .ing__stage sticks inside it; scroll distance → s (0…count-1)
         · s is eased toward the scroll position (the dial has weight) and then passed through detents:
           it rests on a step for most of each stretch and turns in the middle, so it never parks halfway
         · writes --s on .ing, and --d / --o / --a on each step and dial number (see the CSS)
         Only pins when the stage fits the viewport; otherwise the CSS fallback stacks the steps.
     --------------------------------------------------------------------- */
  const ing = $('[data-ing]');
  if (ing && motion) {
    const stage = $('.ing__stage', ing);
    const inner = $('.ing__inner', ing);
    const items = $$('.ing__step, .dial__no, .tick--no', ing).map(el => ({ el, n: Number(el.style.getPropertyValue('--n')) }));
    const count = $$('.ing__step', ing).length;
    const EASE_MS = 110;       // time constant of the follow: bigger = heavier dial
    const TURN = [0.25, 0.75]; // share of each stretch in which the dial actually turns

    let pinned = false;
    let run = 1;               // px of scroll per step
    let navH = 0;
    let target = 0;
    let shown = 0;
    let raf = 0;
    let lastT = 0;
    let lastW = 0;
    let lastH = 0;

    const detent = s => {
      const i = Math.min(Math.floor(s), count - 2);
      return i + smoothstep(clamp((s - i - TURN[0]) / (TURN[1] - TURN[0]), 0, 1));
    };

    const paint = s => {
      const step = detent(s);
      ing.style.setProperty('--s', step.toFixed(4));
      items.forEach(({ el, n }) => {
        const d = step - n;
        el.style.setProperty('--d', clamp(d, -1, 1).toFixed(4));
        el.style.setProperty('--o', (1 - smoothstep(clamp((Math.abs(d) - 0.12) / 0.38, 0, 1))).toFixed(4));
        el.style.setProperty('--a', (1 - Math.min(Math.abs(d), 1)).toFixed(4));   // dial numbers and their ticks: size / opacity, pill → triangle
      });
    };

    const readTarget = () => {
      target = clamp((navH - ing.getBoundingClientRect().top) / run, 0, count - 1);
    };

    const tick = now => {
      raf = 0;
      const dt = lastT ? Math.min(now - lastT, 64) : 16;
      lastT = now;
      shown += (target - shown) * (1 - Math.exp(-dt / EASE_MS));
      if (Math.abs(target - shown) < 0.0008) shown = target;
      paint(shown);
      if (shown !== target) raf = requestAnimationFrame(tick);
      else lastT = 0;
    };
    const follow = () => {
      if (!pinned) return;
      readTarget();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Pin if the stage's content fits the stage and the stage fits under the nav; measured with the
    // pinned layout switched on, then switched back off if it doesn't.
    const layout = () => {
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      navH = nav.offsetHeight;
      ing.classList.add('is-pinned');
      const need = inner.offsetTop + inner.offsetHeight + parseFloat(getComputedStyle(stage).paddingBottom);
      pinned = need <= stage.clientHeight + 1 && stage.clientHeight <= lastH - navH + 1;
      ing.classList.toggle('is-pinned', pinned);
      cancelAnimationFrame(raf);
      raf = 0;
      lastT = 0;
      if (!pinned) {
        ['--s', '--d', '--o', '--a'].forEach(p => { ing.style.removeProperty(p); items.forEach(({ el }) => el.style.removeProperty(p)); });
        return;
      }
      run = (ing.offsetHeight - stage.offsetHeight) / (count - 1);
      readTarget();
      shown = target;                                      // snap: no easing on load or resize
      paint(shown);
    };

    layout();
    fontsReady.then(layout);                               // the headline wraps differently once Brockmann is in
    window.addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', () => {              // phone toolbars resize the height a little on scroll: ignore that
      if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 120) layout();
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     4. Pointer-follow grid highlight (hero + CTA) and CTA portrait parallax
     --------------------------------------------------------------------- */
  const followPointer = (host, layer, { parallax = false } = {}) => {
    if (!host || !layer) return;
    let raf = 0;
    let last = null;

    const apply = () => {
      raf = 0;
      const r = layer.getBoundingClientRect();
      layer.style.setProperty('--mx', `${last.x - r.left}px`);
      layer.style.setProperty('--my', `${last.y - r.top}px`);
      if (parallax) {
        layer.style.setProperty('--nx', clamp(((last.x - r.left) / r.width) * 2 - 1, -1, 1).toFixed(3));
        layer.style.setProperty('--ny', clamp(((last.y - r.top) / r.height) * 2 - 1, -1, 1).toFixed(3));
      }
    };

    host.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      last = { x: e.clientX, y: e.clientY };
      layer.classList.add('snap');           // jump to the cursor without sweeping in from 0,0
      apply();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        layer.classList.remove('snap');
        host.classList.add('is-pointer');
      }));
    });
    host.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      last = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    });
    host.addEventListener('pointerleave', () => {
      host.classList.remove('is-pointer');
      if (parallax) {
        layer.style.setProperty('--nx', 0);
        layer.style.setProperty('--ny', 0);
      }
    });
  };

  if (motion && finePointer.matches) {
    followPointer(hero, $('.hero__bg', hero));
    const band = cta && $('.cta__band', cta);
    if (band) followPointer(band, band, { parallax: true });
  }

  /* ---------------------------------------------------------------------
     5. Menu: sliding hover indicator
     --------------------------------------------------------------------- */
  const menu = $('[data-menu]');
  if (menu) {
    const ind = $('.menu__ind', menu);
    let current = null;

    // The pill is a clip-path on a full-width layer: --l / --r are its left/right insets.
    // "Collapsed" = zero width at the link's centre, so it grows out of / shrinks into the link.
    const setPill = (link, collapsed = false) => {
      const m = menu.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      if (collapsed) {
        const c = r.left + r.width / 2 - m.left;
        ind.style.setProperty('--l', `${c}px`);
        ind.style.setProperty('--r', `${m.width - c}px`);
      } else {
        ind.style.setProperty('--l', `${r.left - m.left}px`);
        ind.style.setProperty('--r', `${m.right - r.right}px`);
      }
    };
    const rest = () => {                                   // idle: zero-width pill at the menu's centre
      const w = menu.getBoundingClientRect().width;
      if (!w) return;                                      // menu is display:none (mobile): keep the last values
      ind.style.setProperty('--l', `${w / 2}px`);
      ind.style.setProperty('--r', `${w / 2}px`);
    };
    const show = link => {
      current = link;
      setPill(link);
    };
    const hide = () => {
      if (!current) return;
      setPill(current, true);
      current = null;
    };
    rest();
    fontsReady.then(() => { if (!current) rest(); });      // menu width changes once Brockmann loads
    window.addEventListener('resize', () => { if (!current) rest(); }, { passive: true });

    $$('.menu__link', menu).forEach(link => {
      link.addEventListener('pointerenter', () => show(link));
      link.addEventListener('focus', () => show(link));
    });
    menu.addEventListener('pointerleave', hide);
    menu.addEventListener('focusout', e => {
      if (!menu.contains(e.relatedTarget)) hide();
    });
  }

  /* ---------------------------------------------------------------------
     5b. FAQ accordion – each row toggles independently
     --------------------------------------------------------------------- */
  const faq = $('[data-faq]');
  if (faq) {
    faq.addEventListener('click', e => {
      const btn = e.target.closest('.faq__btn');
      if (!btn) return;
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.faq__item').classList.toggle('is-open', open);
    });
  }

  /* ---------------------------------------------------------------------
     6. Mobile menu
     --------------------------------------------------------------------- */
  const toggle = $('[data-nav-toggle]');
  const panel = $('[data-nav-panel]');
  if (toggle && panel) {
    let closeTimer = 0;
    const setOpen = open => {
      clearTimeout(closeTimer);
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(() => panel.classList.add('is-open'));
      } else {
        panel.classList.remove('is-open');
        closeTimer = setTimeout(() => { panel.hidden = true; }, 350);
      }
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  /* ---------------------------------------------------------------------
     7. Anchors: smooth "back to top", and ignore links to sections that
        don't exist yet (Werk, Kennisbank, legal pages …)
     --------------------------------------------------------------------- */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (id === 'top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    } else if (id && !document.getElementById(id)) {
      e.preventDefault();
    }
  });
})();
