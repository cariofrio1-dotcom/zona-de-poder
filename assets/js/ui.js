(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function staggerChildren() {
    const groups = document.querySelectorAll('.summary-grid, .form-grid, .content-grid, .modules-grid, .result-metrics, .macro-targets, .meal-grid, .exercise-grid, .progress-list, .food-list, .meal-list, .habit-days, .program-level-list, .chart-controls');
    groups.forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        child.classList.add('reveal-child');
        child.style.setProperty('--stagger', `${Math.min(i * 45, 280)}ms`);
      });
    });
  }

  function markReveal() {
    const targets = document.querySelectorAll('main > section, .hero, .panel, .card, .module-card, .metric, .metric-card, .exercise-card, .program-level-card, .habit-plan, .assessment-result');
    targets.forEach((el, i) => {
      if (el.closest('.mobile-nav') || el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min((i % 10) * 40, 160)}ms`;
    });
    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    targets.forEach(el => io.observe(el));
  }

  function enhanceButtons() {
    const selector = '.button, .primary-button, .secondary-button, .member-button, .button-secondary, .tab, .day-tab';
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest(selector);
      if (!btn || prefersReduced) return;
      btn.dataset.pressed = '1';
      btn.style.transform = 'scale(.97)';
    }, { passive: true });
    const release = () => {
      document.querySelectorAll('[data-pressed="1"]').forEach(b => { b.style.transform = ''; delete b.dataset.pressed; });
    };
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });

    // ripple on click (lightweight)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.button, .primary-button, .member-button');
      if (!btn || prefersReduced) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;background:rgba(255,255,255,.28);border-radius:50%;transform:scale(0);opacity:.6;pointer-events:none;`;
      btn.appendChild(ripple);
      ripple.animate([{ transform: 'scale(0)', opacity: .55 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => ripple.remove();
    });
  }

  function ensureMemberEditorInteractive() {
    if (!document.body.classList.contains('local-coach-mode')) return;
    document.querySelectorAll('.member-editor').forEach(editor => {
      editor.inert = false;
      editor.removeAttribute('aria-disabled');
      editor.style.pointerEvents = 'auto';
      editor.querySelectorAll('input, select, textarea, button').forEach(control => {
        control.disabled = false;
        if ('readOnly' in control) control.readOnly = false;
        control.style.pointerEvents = 'auto';
      });
    });
  }

  window.addEventListener('zp:local-mode', ensureMemberEditorInteractive);

  function smoothInternalLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      // The inline view controller owns explicit route links; ordinary clicks
      // inside a tool view must never be treated as view navigation.
      if (!a || a.hasAttribute('data-zp-view') || a.closest('.zp-view-section')) return;
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', id);
    });
  }

  function injectMobileNav() {
    if (document.querySelector('.mobile-nav')) return;
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const links = [
      { href: 'index.html', icon: '⚡', label: 'Inicio', match: ['index.html'] },
      { href: 'calculadoradecalorias.html', icon: '🥗', label: 'Nutrición', match: ['calculadoradecalorias.html', 'macros.html'] },
      { href: 'interfazdeaplicacion.html', icon: '🏋️', label: 'Rutinas', match: ['interfazdeaplicacion.html'] },
      { href: '#', icon: '↑', label: 'Arriba', top: true }
    ];
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Navegación rápida');
    nav.innerHTML = links.map(l => {
      const active = l.match && l.match.includes(path) ? 'active' : '';
      if (l.top) return `<a href="#" data-scroll-top="1"><span class="icon">${l.icon}</span>${l.label}</a>`;
      return `<a href="${l.href}" class="${active}"><span class="icon">${l.icon}</span>${l.label}</a>`;
    }).join('');
    nav.addEventListener('click', (e) => {
      const top = e.target.closest('[data-scroll-top]');
      if (top) { e.preventDefault(); window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); }
    });
    document.body.appendChild(nav);
  }

  function animateProgressOnView() {
    if (prefersReduced) return;

    const prepare = (root) => {
      root.querySelectorAll('.fill, .progress-fill').forEach(el => {
        if (el.dataset.animReady) return;
        const w = el.style.width;
        if (w && w !== '0px' && w !== '0%') { el.dataset.targetWidth = w; el.style.width = '0%'; }
        el.dataset.animReady = '1';
      });
    };

    prepare(document);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.fill, .progress-fill').forEach(el => {
          if (el.dataset.targetWidth && !el.dataset.animated) {
            el.style.width = el.dataset.targetWidth;
            el.dataset.animated = '1';
          }
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.progress-list, .calorie-summary, .summary-grid, .dashboard, .main-grid').forEach(el => io.observe(el));

    // Animate bars that appear/update after user actions (calculations, adding foods, etc.)
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.querySelectorAll('.dashboard.visible .fill, .dashboard.visible .progress-fill, .results.visible .fill, .results.visible .progress-fill').forEach(el => {
          const w = el.style.width;
          if (!w || w === '0px' || w === '0%' || el.dataset.animating) return;
          if (el.dataset.animated === w) return;
          el.dataset.animating = '1';
          el.style.width = '0%';
          requestAnimationFrame(() => {
            el.style.width = w;
            el.dataset.animated = w;
            setTimeout(() => { delete el.dataset.animating; }, 950);
          });
        });
      });
    };

    const targets = [document.querySelector('#dashboard'), document.querySelector('#results')].filter(Boolean);
    if (targets.length) {
      const mo = new MutationObserver(schedule);
      targets.forEach(t => mo.observe(t, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }));
    } else {
      const mo = new MutationObserver(schedule);
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  function observeDynamicContent() {
    let pending = false;
    const rerun = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        staggerChildren();
        markReveal();
      });
    };
    const mo = new MutationObserver((mutations) => {
      if (mutations.some(m => m.addedNodes && m.addedNodes.length)) rerun();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    document.body.classList.add('page-ready');
    staggerChildren();
    markReveal();
    ensureMemberEditorInteractive();
    enhanceButtons();
    smoothInternalLinks();
    injectMobileNav();
    setTimeout(animateProgressOnView, 250);
    setTimeout(observeDynamicContent, 700);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
