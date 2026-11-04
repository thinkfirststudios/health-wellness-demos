/* Kilnwood Aesthetics Clinic — fictional demo. Vanilla JS, no external requests.
   Everything on the page is visible without this file; it only adds the menu toggle,
   the testimonial slider controls and front-end form messages. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function () { setOpen(false); });
  }

  /* ---- Testimonial slider ---- */
  var slider = document.querySelector("[data-slider]");
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var ctrl = slider.querySelector(".slider-ctrl");
    var dotsWrap = slider.querySelector(".dots");
    var pauseBtn = slider.querySelector(".pause");
    var live = slider.querySelector(".slides");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var index = 0, timer = null, paused = reduce.matches, hovering = false;
    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show review " + (i + 1) + " of " + slides.length);
      b.addEventListener("click", function () { show(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });
    function show(i, fromUser) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.hidden = n !== index; });
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === index ? "true" : "false"); });
      live.setAttribute("aria-live", fromUser ? "polite" : "off");
    }
    function tick() { if (!paused && !hovering) show(index + 1, false); }
    function start() { stop(); if (!paused) timer = window.setInterval(tick, 7000); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function setPaused(p) {
      paused = p;
      pauseBtn.textContent = p ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-label", p ? "Start rotating reviews" : "Stop rotating reviews");
      start();
    }
    slider.querySelector(".prev").addEventListener("click", function () { show(index - 1, true); });
    slider.querySelector(".next").addEventListener("click", function () { show(index + 1, true); });
    pauseBtn.addEventListener("click", function () { setPaused(!paused); });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(index - 1, true); e.preventDefault(); }
      if (e.key === "ArrowRight") { show(index + 1, true); e.preventDefault(); }
    });
    slider.addEventListener("mouseenter", function () { hovering = true; });
    slider.addEventListener("mouseleave", function () { hovering = false; });
    slider.addEventListener("focusin", function () { hovering = true; });
    slider.addEventListener("focusout", function () { hovering = false; });
    reduce.addEventListener("change", function () { if (reduce.matches) setPaused(true); });
    ctrl.classList.remove("no-js-hide");
    show(0, false);
    setPaused(paused);
  }

  /* ---- Front-end-only forms ---- */
  Array.prototype.forEach.call(document.querySelectorAll("form[data-demo-form]"), function (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      status.textContent = "Thank you. This is a demo site, so nothing was sent — on the live site the clinic would reply within one working day.";
      form.reset();
    });
  });

  /* ---- Footer year ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
