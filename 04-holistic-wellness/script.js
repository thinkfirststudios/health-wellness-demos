/* Parson Street Wellness Rooms. No trackers, no third-party requests, nothing stored. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* WebGL is optional. Without it the real photographs stay and the sections stay short. */
  var hasGL = false;
  try { hasGL = !!document.createElement("canvas").getContext("webgl"); } catch (e) { hasGL = false; }
  root.classList.toggle("gl", hasGL && !reduce.matches);

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Phone and tablet menu */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      header.classList.toggle("menu-open", open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        header.classList.remove("menu-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }

  /* Header turns solid past 140px. Depth layers move with scroll, and only then. */
  var header = document.querySelector(".site-header");
  var depth = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var ticking = false;
  function paint() {
    ticking = false;
    if (header) header.classList.toggle("is-condensed", window.scrollY > 140);
    if (reduce.matches) return;
    var vh = window.innerHeight;
    depth.forEach(function (el) {
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -80 || box.top > vh + 80) return;
      var k = parseFloat(el.getAttribute("data-depth"));
      el.style.translate = "0 " + (-box.top * k).toFixed(1) + "px";
    });
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(paint); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paint();

  /* Phone bar appears once the opening scene has left the screen */
  var bar = document.querySelector(".mobile-bar");
  var first = document.querySelector(".hero, .page-head");
  if (bar && first && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-shown", !entries[0].isIntersecting);
    }).observe(first);
  } else if (bar) {
    bar.classList.add("is-shown");
  }

  /* Breathing pacer. The markup is a still diagram with the counts written out. Script only
     adds the control when motion is allowed. It never starts by itself and records nothing. */
  var pacer = document.querySelector("[data-pacer]");
  if (pacer) {
    var control = pacer.querySelector(".pacer-control");
    var button = pacer.querySelector("[data-pacer-button]");
    var word = pacer.querySelector(".pacer-word");
    var status = pacer.querySelector("[data-pacer-status]");
    var scene = document.querySelector(".pacer-scene");
    var form = scene.querySelector(".pacer-form");
    var steps = [["in", 4000, "Breathe in"], ["hold", 2000, "Hold"], ["out", 6000, "Breathe out"]];
    var timer = null, running = false;

    var step = function (i) {
      var s = steps[i];
      form.style.transitionDuration = s[1] + "ms";
      scene.dataset.phase = s[0];
      word.textContent = s[2];
      timer = window.setTimeout(function () { step((i + 1) % steps.length); }, s[1]);
    };
    var start = function () {
      running = true;
      button.textContent = "Stop the breathing pacer";
      button.setAttribute("aria-pressed", "true");
      status.textContent = "The pacer is running.";
      step(0);
    };
    var stop = function () {
      running = false;
      window.clearTimeout(timer);
      form.style.transitionDuration = "2400ms";
      delete scene.dataset.phase;
      word.textContent = "";
      button.textContent = "Start the breathing pacer";
      button.setAttribute("aria-pressed", "false");
      status.textContent = "The pacer has stopped.";
    };
    var sync = function () {
      if (running) stop();
      scene.classList.toggle("is-live", !reduce.matches);
      control.hidden = reduce.matches;
    };
    button.addEventListener("click", function () { if (running) { stop(); } else { start(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden && running) stop(); });
    reduce.addEventListener("change", sync);
    sync();
  }

  /* The two WebGL scenes load only as the visitor nears them. Reduced motion never loads them. */
  function lazy(sel, files) {
    var el = document.querySelector(sel);
    if (!el || !hasGL || reduce.matches || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var next = function (i) {
        if (i >= files.length || reduce.matches) return;
        var s = document.createElement("script");
        s.src = files[i];
        s.onload = function () { next(i + 1); };
        document.body.appendChild(s);
      };
      next(0);
    }, { rootMargin: "900px 0px" });
    io.observe(el);
  }
  lazy("[data-stones]", ["assets/js/stones.js"]);
  lazy("[data-water]", ["assets/js/water-texture.js", "assets/js/water.js"]);

  reduce.addEventListener("change", function () {
    root.classList.toggle("gl", hasGL && !reduce.matches);
    if (reduce.matches) depth.forEach(function (el) { el.style.translate = ""; });
  });

  /* Reveals. Nothing is hidden until the visitor first scrolls, and then only an element
     still below the fold. A capture, a print or a page left unscrolled stays complete. */
  function initReveals() {
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    var items = document.querySelectorAll("[data-reveal]");
    items.forEach(function (el) {
      var i = 0, s = el;
      while ((s = s.previousElementSibling)) { if (s.hasAttribute("data-reveal")) i++; }
      el.style.setProperty("--d", Math.min(i, 5));
    });
    var show = function (el) { el.classList.remove("pre"); };
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); watch.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    var arm = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        arm.unobserve(e.target);
        if (e.target.getBoundingClientRect().top < window.innerHeight) return; /* already on screen */
        e.target.classList.add("pre");
        watch.observe(e.target);
        window.setTimeout(function () { show(e.target); }, 5000); /* timed fallback: never stays hidden */
      });
    }, { rootMargin: "0px 0px 45% 0px" });
    window.addEventListener("scroll", function () {
      if (reduce.matches) return;
      items.forEach(function (el) { arm.observe(el); });
    }, { once: true, passive: true });
  }
  initReveals();

  /* Booking form: carries the chosen modality through from the button that led here */
  var bookForm = document.querySelector("[data-book-form]");
  if (bookForm) {
    var select = bookForm.querySelector("#modality");
    var chosen = document.querySelector("[data-chosen]");
    var names = { "acupuncture": "Acupuncture", "massage": "Massage", "consultation": "Herbal and dietary consultation", "breathwork": "Breathwork" };
    var setChosen = function () { if (chosen) chosen.textContent = names[select.value] || "Not chosen yet"; };
    var want = new URLSearchParams(window.location.search).get("modality");
    if (want && names[want]) select.value = want;
    setChosen();
    select.addEventListener("change", setChosen);
    bookForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var done = document.querySelector("[data-form-done]");
      bookForm.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }
})();
