/* Parson Street Wellness Rooms. No trackers, no third-party requests, nothing stored. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Copyright year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Phone and tablet menu */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }

  /* Header condenses past 140px */
  var header = document.querySelector(".site-header");
  var bar = document.querySelector(".mobile-bar");
  var first = document.querySelector(".hero, .page-head");
  function onScroll() {
    if (header) header.classList.toggle("is-condensed", window.scrollY > 140);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Phone bar appears once the opening section has left the screen */
  if (bar && first && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-shown", !entries[0].isIntersecting);
    }).observe(first);
  } else if (bar) {
    bar.classList.add("is-shown");
  }

  /* Breathing pacer.
     The markup is a still diagram with the counts written out. Script only adds the
     control when motion is allowed. It never starts by itself and it records nothing. */
  var pacer = document.querySelector("[data-pacer]");
  if (pacer) {
    var control = pacer.querySelector(".pacer-control");
    var button = pacer.querySelector("[data-pacer-button]");
    var form = pacer.querySelector(".pacer-form");
    var word = pacer.querySelector(".pacer-word");
    var status = pacer.querySelector("[data-pacer-status]");
    var steps = [["in", 4000, "Breathe in"], ["hold", 2000, "Hold"], ["out", 6000, "Breathe out"]];
    var timer = null;
    var running = false;

    var step = function (i) {
      var s = steps[i];
      form.style.transitionDuration = s[1] + "ms";
      pacer.dataset.phase = s[0];
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
      delete pacer.dataset.phase;
      word.textContent = "";
      button.textContent = "Start the breathing pacer";
      button.setAttribute("aria-pressed", "false");
      status.textContent = "The pacer has stopped.";
    };
    var sync = function () {
      if (running) stop();
      pacer.classList.toggle("is-live", !reduce.matches);
      control.hidden = reduce.matches;
    };
    button.addEventListener("click", function () { if (running) { stop(); } else { start(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden && running) stop(); });
    reduce.addEventListener("change", sync);
    sync();
  }

  /* Reveals. Nothing is hidden until the visitor first scrolls, and then only an element
     that is still below the fold. A capture, a print or a page left unscrolled stays complete. */
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
    var setChosen = function () {
      if (chosen) chosen.textContent = names[select.value] || "Not chosen yet";
    };
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
