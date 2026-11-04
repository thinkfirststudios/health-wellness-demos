/* Haverlock Therapy Group — fictional demo template (ThinkFirst Studios).
   Progressive enhancement only. Every page is complete and readable without this file.
   No scroll reveals or fades: all content is visible from first paint.
   Nothing here stores, sends or reports anything. No analytics, no cookies, no storage. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* Footer year */
  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) { years[y].textContent = String(new Date().getFullYear()); }

  /* Mobile menu overlay. "If you need help now" is the first item in it. */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  var closeBtn = nav ? nav.querySelector('.menu-close') : null;
  function setMenu(open) {
    root.classList.toggle('nav-open', open);
    if (toggle) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    if (open && nav) {
      var first = nav.querySelector('a');
      if (closeBtn) { closeBtn.focus(); } else if (first) { first.focus(); }
    } else if (toggle) { toggle.focus(); }
  }
  if (toggle && nav) {
    toggle.hidden = false;
    if (closeBtn) { closeBtn.hidden = false; closeBtn.addEventListener('click', function () { setMenu(false); }); }
    toggle.addEventListener('click', function () { setMenu(!root.classList.contains('nav-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) { setMenu(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && root.classList.contains('nav-open')) { root.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* THE FIT — filters a published list of clinicians.
     Within a group, any selected value matches. Across groups, every group with a selection must match.
     Items are hidden, never reordered. No transition on list changes. No score, no ranking.
     It reads nothing about the visitor except which buttons are pressed, and it keeps nothing. */
  var params = new URLSearchParams(window.location.search);
  var fits = document.querySelectorAll('[data-fit]');
  for (var f = 0; f < fits.length; f++) { initFit(fits[f], f === 0); }

  function initFit(fit, readParams) {
    var chips = fit.querySelectorAll('.chip');
    var items = fit.querySelectorAll('[data-clinician]');
    var count = fit.querySelector('.fit-count');
    var empty = fit.querySelector('.fit-empty');
    var list = fit.querySelector('.fit-list');
    var total = items.length;

    function apply() {
      var wanted = {};
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute('aria-pressed') === 'true') {
          var g = chips[i].getAttribute('data-group');
          (wanted[g] = wanted[g] || []).push(chips[i].getAttribute('data-value'));
        }
      }
      var shown = 0;
      for (var j = 0; j < items.length; j++) {
        var ok = true;
        for (var group in wanted) {
          if (!Object.prototype.hasOwnProperty.call(wanted, group)) { continue; }
          var have = (items[j].getAttribute('data-' + group) || '').split(' ');
          var any = false;
          for (var k = 0; k < wanted[group].length; k++) { if (have.indexOf(wanted[group][k]) !== -1) { any = true; break; } }
          if (!any) { ok = false; break; }
        }
        items[j].hidden = !ok;
        if (ok) { shown++; }
      }
      if (count) { count.textContent = shown + ' of ' + total + (total === 1 ? ' therapist' : ' therapists') + ' shown.'; }
      if (empty) { empty.hidden = shown !== 0; }
      if (list) { list.hidden = shown === 0; }
    }

    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        var on = this.getAttribute('aria-pressed') === 'true';
        this.setAttribute('aria-pressed', on ? 'false' : 'true');
        apply();
      });
      if (readParams) {
        var g = chips[c].getAttribute('data-group');
        if (params.getAll(g).indexOf(chips[c].getAttribute('data-value')) !== -1) { chips[c].setAttribute('aria-pressed', 'true'); }
      }
    }
    var clears = fit.querySelectorAll('.fit-clear');
    for (var q = 0; q < clears.length; q++) {
      clears[q].addEventListener('click', function () {
        for (var i = 0; i < chips.length; i++) { chips[i].setAttribute('aria-pressed', 'false'); }
        apply();
      });
    }
    apply();
  }

  /* Request form — demo only. Nothing is sent anywhere. */
  var forms = document.querySelectorAll('[data-request-form]');
  for (var r = 0; r < forms.length; r++) { initForm(forms[r]); }
  function initForm(form) {
    var select = form.querySelector('select[name="clinician"]');
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.form-status');
    function label() {
      if (!select || !button) { return; }
      var opt = select.options[select.selectedIndex];
      button.textContent = select.value ? 'Request an appointment with ' + opt.text.split(',')[0] : 'Request an appointment';
    }
    if (select) {
      var pre = params.get('clinician');
      if (pre) { for (var i = 0; i < select.options.length; i++) { if (select.options[i].value === pre) { select.selectedIndex = i; } } }
      select.addEventListener('change', label);
      label();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) { status.textContent = 'This is a demonstration page. Nothing was sent, and nothing you chose has been kept.'; }
    });
  }

})();
