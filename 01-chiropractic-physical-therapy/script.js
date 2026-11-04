/* Cornerpost Spine & Movement — fictional demo (ThinkFirst Studios).
   No analytics, no third-party requests, no storage, no reveal animations.
   Every page is complete without this file; it only adds conveniences. */
(function () {
  'use strict';

  /* Copyright year */
  var y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });

  /* Mobile navigation toggle */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Close' : 'Menu';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
  }

  /* Highlight today's opening hours (rows/items carry data-day, 0 = Sunday) */
  var today = new Date().getDay();
  document.querySelectorAll('[data-day]').forEach(function (row) {
    var days = row.getAttribute('data-day').split(',').map(Number);
    if (days.indexOf(today) !== -1) {
      row.classList.add('is-today');
      var label = row.querySelector('th, dt');
      if (label) {
        var s = document.createElement('span');
        s.className = 'visually-hidden';
        s.textContent = ' (today)';
        label.appendChild(s);
      }
    }
  });

  /* Demo forms: nothing is sent anywhere */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (status) {
        status.textContent = form.getAttribute('data-demo') ||
          'Thanks — this is a demo, so nothing was sent. A live site would confirm by phone or email.';
      }
      form.reset();
    });
  });
})();
