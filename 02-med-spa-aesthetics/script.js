/* Kilnwood Aesthetics Clinic — fictional demo template (ThinkFirst Studios).
   Vanilla JS. No analytics, no tracking, no third-party requests, no count-up on any figure.
   Every component renders in its final, readable state without this file. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js-ready');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* (c) year, scripted (B15) */
  var y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });

  /* hero photograph: 1.04 -> 1.00 once on load */
  window.addEventListener('load', function () { root.classList.add('is-loaded'); });

  /* condensing header: 88px -> 62px past 150px of scroll */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-condensed', window.scrollY > 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* reveals (12px rise + fade, 80ms stagger) and the downtime-scale wipe, once each */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var scales = Array.prototype.slice.call(document.querySelectorAll('.dts'));
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll(':scope > .rv'), function (el, i) {
      el.style.setProperty('--d', (i * 80) + 'ms');
    });
  });
  function showAll() {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    scales.forEach(function (el) { el.classList.add('is-in'); });
  }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    reveals.concat(scales).forEach(function (el) { io.observe(el); });
    window.addEventListener('beforeprint', showAll);
  }

  /* mobile menu overlay */
  var menuBtn = document.querySelector('.menu-btn');
  var overlay = document.getElementById('site-menu');
  var closeBtn = overlay ? overlay.querySelector('.close') : null;
  function setMenu(open) {
    if (!overlay || !menuBtn) return;
    overlay.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { (closeBtn || overlay).focus(); } else { menuBtn.focus(); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if ((e.keyCode === 27) && overlay && overlay.classList.contains('is-open')) setMenu(false);
  });

  /* sticky mobile bar: slides up once the hero (or page head) leaves the viewport */
  var bar = document.querySelector('.sticky-bar');
  var lead = document.querySelector('.hero, .page-head');
  if (bar && lead && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { bar.classList.toggle('is-up', !e.isIntersecting); });
    }).observe(lead);
  } else if (bar) {
    bar.classList.add('is-up');
  }

  /* consultation grid: echo the chosen slot into the summary panel */
  var out = document.getElementById('slot-summary');
  if (out) {
    document.querySelectorAll('input[name="slot"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) out.textContent = r.getAttribute('data-summary');
      });
    });
  }

  /* demo forms: nothing is sent anywhere */
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = f.querySelector('.form-status');
      if (s) s.textContent = 'Demo only: nothing was sent. The booking route and intake platform are still to be confirmed.';
    });
  });
})();
