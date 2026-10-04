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
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(el => io.observe(el));
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
