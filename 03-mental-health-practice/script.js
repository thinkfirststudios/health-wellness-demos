/* Haverlock Therapy Group. Everything here is an enhancement: every page is complete without it.
   Nothing the visitor selects is stored or sent anywhere. */
(function () {
  'use strict';

  var year = document.querySelectorAll('[data-year]');
  for (var y = 0; y < year.length; y++) { year[y].textContent = new Date().getFullYear(); }

  /* Menu on narrow screens */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.hidden = false;
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) { setMenu(false); } });
  }

  /* THE FIT: narrows a published list. Items are hidden, never reordered, and nothing is scored. */
  var fit = document.querySelector('[data-fit]');
  if (fit) {
    var chips = fit.querySelectorAll('.chip');
    var entries = fit.querySelectorAll('.entry');
    var count = fit.querySelector('.fit-count');
    var empty = fit.querySelector('.empty');
    var clear = fit.querySelector('.clear');
    var total = entries.length;

    var apply = function () {
      var chosen = {};
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute('aria-pressed') === 'true') {
          var g = chips[i].getAttribute('data-group');
          (chosen[g] = chosen[g] || []).push(chips[i].getAttribute('data-value'));
        }
      }
      var shown = 0;
      for (var e = 0; e < entries.length; e++) {
        var ok = true;
        for (var group in chosen) {
          var have = (entries[e].getAttribute('data-' + group) || '').split(' ');
          var any = chosen[group].some(function (v) { return have.indexOf(v) !== -1; });
          if (!any) { ok = false; break; }
        }
        entries[e].hidden = !ok;
        if (ok) { shown++; }
      }
      count.textContent = shown + ' of ' + total + ' clinicians match.';
      empty.hidden = shown !== 0;
    };

    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        var on = this.getAttribute('aria-pressed') === 'true';
        this.setAttribute('aria-pressed', on ? 'false' : 'true');
        apply();
      });
    }
    var clearAll = function () {
      for (var i = 0; i < chips.length; i++) { chips[i].setAttribute('aria-pressed', 'false'); }
      apply();
    };
    clear.addEventListener('click', clearAll);
    var again = fit.querySelector('.clear-again');
    if (again) { again.addEventListener('click', function () { clearAll(); clear.focus(); }); }

    /* A link from the services page can preselect one chip. It uses the URL fragment, which never leaves the browser. */
    var m = /^#with=([a-z]+)$/.exec(window.location.hash);
    if (m) {
      var pre = fit.querySelector('.chip[data-group="with"][data-value="' + m[1] + '"]');
      if (pre) { pre.setAttribute('aria-pressed', 'true'); apply(); }
    }
  }

  /* Request forms: carry the room over from a link, and hold nothing after submit. */
  var forms = document.querySelectorAll('form[data-request]');
  var r = /^#room=([1-8])$/.exec(window.location.hash);
  for (var f = 0; f < forms.length; f++) {
    (function (form) {
      var who = form.querySelector('select[name="clinician"]');
      if (r && who) { who.value = 'room-' + r[1]; }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = form.querySelector('.form-msg');
        var tel = form.querySelector('input[type="tel"]');
        var mail = form.querySelector('input[type="email"]');
        if (!tel.value && !mail.value) {
          msg.textContent = 'Please give a phone number or an email address so that intake can reply.';
          tel.focus();
          return;
        }
        form.reset();
        msg.textContent = 'Thank you. The intake coordinator will reply within one working day.';
      });
    })(forms[f]);
  }

  /* One 180ms fade per section, once. Below the fold only, and never on the crisis links. */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var secs = document.querySelectorAll('main .sec');
    var pending = [];
    var show = function (el) { el.classList.remove('reveal-start'); };
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { show(it.target); io.unobserve(it.target); }
      });
    }, { rootMargin: '0px 0px -5% 0px' });
    for (var s = 0; s < secs.length; s++) {
      if (secs[s].getBoundingClientRect().top > window.innerHeight) {
        secs[s].classList.add('reveal', 'reveal-start');
        pending.push(secs[s]);
        io.observe(secs[s]);
      }
    }
    window.setTimeout(function () { pending.forEach(show); }, 1400);
  }
})();
