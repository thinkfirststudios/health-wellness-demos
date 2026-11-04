/* Cornerpost Spine & Movement — fictional demo (ThinkFirst Studios).
   No analytics, no pixels, no chat, no third-party requests, no storage.
   Everything here is an enhancement: every page is complete without it. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Copyright year — scripted, never hardcoded */
  var y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });

  /* Condensing header past 140px */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      doc.classList.toggle('is-condensed', window.scrollY > 140);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile navigation overlay */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  var closeBtn = document.querySelector('.nav-close');
  function setNav(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { (closeBtn || nav.querySelector('a')).focus(); } else { toggle.focus(); }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setNav(false);
    });
  }

  /* Hours panel: today's row gets the 3px rule and nothing else (no open/closed state) */
  var today = new Date().getDay(); // 0 = Sunday
  document.querySelectorAll('tr[data-day]').forEach(function (row) {
    if (Number(row.getAttribute('data-day')) === today) {
      row.classList.add('is-today');
      var th = row.querySelector('th');
      if (th && !th.querySelector('.visually-hidden')) {
        var s = document.createElement('span');
        s.className = 'visually-hidden';
        s.textContent = ' (today)';
        th.appendChild(s);
      }
    }
  });

  /* Scroll reveals: 10px rise + fade, once, never re-fired */
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Sticky mobile bar slides up once the hero leaves the viewport */
  var bar = document.querySelector('.mobile-bar');
  var hero = document.querySelector('.hero, .page-head');
  if (bar) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-shown', !entries[0].isIntersecting);
      }).observe(hero);
    } else {
      bar.classList.add('is-shown');
    }
  }

  /* Booking grid: echo the chosen slot into the summary panel */
  var out = document.getElementById('slot-summary');
  if (out) {
    document.querySelectorAll('input[name="slot"]').forEach(function (r) {
      r.addEventListener('change', function () {
        out.textContent = r.getAttribute('data-summary') || 'Slot selected';
      });
    });
  }

  /* Demo forms: nothing is sent anywhere */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      if (status) {
        status.textContent = 'Demo only: nothing was sent. The live form waits on the intake platform decision.';
      }
    });
  });
})();
