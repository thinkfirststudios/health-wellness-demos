(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Copyright year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Condensing header
  var head = document.querySelector('.head');
  var hero = document.querySelector('.hero, .page-head');
  var sticky = document.querySelector('.sticky');
  function onScroll() {
    var y = window.scrollY;
    if (head) head.classList.toggle('is-small', y > 150);
    if (sticky && hero) sticky.classList.toggle('is-on', hero.getBoundingClientRect().bottom < 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Full-screen menu
  var menu = document.getElementById('menu');
  var openBtn = document.querySelector('[data-menu-open]');
  var closeBtn = document.querySelector('[data-menu-close]');
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    openBtn.setAttribute('aria-expanded', String(open));
    (open ? closeBtn : openBtn).focus();
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (!menu || menu.hidden) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      var items = menu.querySelectorAll('a,button');
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Reveals and the scale wipe. Nothing is hidden unless this code runs,
  // and a timer shows anything the observer has not reached.
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    var tracks = Array.prototype.slice.call(document.querySelectorAll('.track'));
    var fold = window.innerHeight;
    var later = targets.filter(function (el) { return el.getBoundingClientRect().top > fold; });
    var laterTracks = tracks.filter(function (el) { return el.getBoundingClientRect().top > fold * .6; });
    later.forEach(function (el) {
      var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', Math.min(sibs, 4) * 80 + 'ms');
      el.classList.add('pre-reveal');
    });
    laterTracks.forEach(function (el) { el.classList.add('pre'); });
    function show(el) {
      if (el.classList.contains('track')) { el.classList.remove('pre'); return; }
      el.classList.add('reveal-in');
      el.classList.remove('pre-reveal');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: .15 });
    later.concat(laterTracks).forEach(function (el) { io.observe(el); });
    window.setTimeout(function () { later.concat(laterTracks).forEach(show); }, 2600);
  }

  // Consultation slots: real dates for the coming open days, echoed to the panel
  var dayEls = document.querySelectorAll('[data-weekday]');
  if (dayEls.length) {
    var now = new Date();
    dayEls.forEach(function (el) {
      var want = Number(el.getAttribute('data-weekday'));
      var d = new Date(now);
      d.setDate(now.getDate() + (((want - now.getDay() + 7) % 7) || 7));
      var label = el.querySelector('[data-date]');
      if (label) label.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      el.setAttribute('data-long', el.getAttribute('data-name') + ', ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
      el.setAttribute('data-time', d.getTime());
    });
    // Soonest day first
    var box = dayEls[0].parentNode;
    Array.prototype.slice.call(dayEls).sort(function (x, y) {
      return x.getAttribute('data-time') - y.getAttribute('data-time');
    }).forEach(function (el) { box.appendChild(el); });
  }
  var picked = document.querySelector('[data-picked]');
  document.querySelectorAll('input[name="slot"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var day = input.closest('[data-weekday]');
      if (picked) picked.textContent = day.getAttribute('data-long') + ' at ' + input.value;
    });
  });

  // Forms stay on the page: nothing is transmitted from this site
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var name = form.querySelector('[name="name"]');
      var how = form.querySelector('[name="method"]');
      status.textContent = 'Thank you, ' + name.value.trim() + '. We will reply by ' + how.value.toLowerCase() + ' within one working day.';
      form.reset();
      if (picked) picked.textContent = 'No time chosen yet';
    });
  });
})();
