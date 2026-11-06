/* Braeburn Family Medicine. No tracking, no cookies, no third-party request. */
(function () {
  "use strict";

  var PROVIDERS = {
    okonjo: { name: "Dr Adaeze Okonjo, MD", short: "Dr Okonjo", state: "Accepting new patients", open: true, next: "Next available: week of the 18th", video: true, cta: "Book with Dr Okonjo" },
    hollis: { name: "Dr Martin Hollis, MD", short: "Dr Hollis", state: "Panel closed — waitlist open", open: false, next: "Waitlist open. We call in the order people join.", video: false, cta: "Join Dr Hollis's waitlist" },
    raman: { name: "Priya Raman, FNP", short: "Priya Raman", state: "Accepting new patients", open: true, next: "Next available: this week", video: true, cta: "Book with Priya Raman" },
    vlcek: { name: "Dr Tomas Vlček, DO", short: "Dr Vlček", state: "Accepting new patients — children only", open: true, next: "Next available: week of the 11th", video: false, cta: "Book with Dr Vlček" }
  };
  var HOURS = ["Closed today", "Today 8:00 am–5:30 pm", "Today 8:00 am–5:30 pm", "Today 8:00 am–5:30 pm", "Today 8:00 am–5:30 pm", "Today 8:00 am–4:00 pm", "Today 9:00 am–12:00 pm"];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Scripted year */
  all("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* Today's hours and today's row: a fact about the day, never an open or closed state */
  var day = new Date().getDay();
  all("[data-hours-today]").forEach(function (el) { el.textContent = HOURS[day]; });
  all("tr[data-day='" + day + "']").forEach(function (row) {
    row.classList.add("is-today");
    var th = row.querySelector("th");
    if (th) {
      var note = document.createElement("span");
      note.className = "sr";
      note.textContent = " (today)";
      th.appendChild(note);
    }
  });

  /* Condensing header */
  var head = document.querySelector(".head");
  if (head) {
    var onScroll = function () { head.classList.toggle("is-small", window.scrollY > 140); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
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

  /* Reveals: once, never re-fired. The hidden state exists only here, with a timed fallback */
  var items = all("[data-reveal]");
  if (!reduced && "IntersectionObserver" in window && items.length) {
    var show = function (el) {
      el.classList.add("in");
      if (el.classList.contains("card")) { el.classList.add("wipe"); }
      el.classList.remove("pre");
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        var step = el.classList.contains("card") ? 70 : 65;
        var index = Number(el.getAttribute("data-reveal")) || 0;
        io.unobserve(el);
        window.setTimeout(function () { show(el); }, index * step);
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.85) { return; }
      el.classList.add("pre");
      io.observe(el);
    });
    window.setTimeout(function () { all(".pre").forEach(show); }, 2600);
  }

  /* Sticky phone bar appears once the hero has left the screen */
  var dock = document.querySelector(".dock");
  var top = document.querySelector(".hero, .pagehead");
  if (dock && top) {
    var onDock = function () { dock.classList.toggle("is-on", top.getBoundingClientRect().bottom < 0); };
    window.addEventListener("scroll", onDock, { passive: true });
    onDock();
  }

  /* Booking form */
  var form = document.getElementById("book-form");
  if (!form) { return; }
  var select = form.elements.provider;
  var submit = form.querySelector("[type=submit]");
  var chosen = document.getElementById("chosen");
  var sent = document.getElementById("sent");
  var valueLabel = document.getElementById("contact-label");
  var valueInput = form.elements.contact;
  var videoInput = document.getElementById("mode-video");
  var videoHint = document.getElementById("mode-hint");

  function paint() {
    var p = PROVIDERS[select.value];
    if (!p) {
      chosen.hidden = true;
      submit.textContent = "Send to the front desk";
      videoInput.disabled = false;
      videoHint.textContent = "Video visits are for patients who are in this state at the time of the appointment.";
      return;
    }
    chosen.hidden = false;
    chosen.querySelector(".status").className = "status " + (p.open ? "status--open" : "status--closed");
    chosen.querySelector(".status").textContent = p.state;
    chosen.querySelector(".chosen-name").textContent = p.name;
    chosen.querySelector("[data-next]").textContent = p.next;
    submit.textContent = p.cta;
    videoInput.disabled = !p.video;
    if (!p.video) {
      videoInput.checked = false;
      document.getElementById("mode-person").checked = true;
      videoHint.textContent = p.short + " sees patients in person only.";
    } else {
      videoHint.textContent = "Video visits are for patients who are in this state at the time of the appointment.";
    }
  }

  function paintContact() {
    var how = form.querySelector("input[name=how]:checked");
    var isEmail = how && how.value === "email";
    valueLabel.textContent = isEmail ? "Your email address" : "Your phone number";
    valueInput.type = isEmail ? "email" : "tel";
    valueInput.autocomplete = isEmail ? "email" : "tel";
  }

  var wanted = new URLSearchParams(window.location.search).get("provider");
  if (wanted && PROVIDERS[wanted]) { select.value = wanted; }
  select.addEventListener("change", paint);
  all("input[name=how]", form).forEach(function (r) { r.addEventListener("change", paintContact); });
  paint();
  paintContact();

  function setErr(id, msg) { document.getElementById(id).textContent = msg; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    setErr("err-name", ""); setErr("err-contact", ""); setErr("err-about", "");
    var first = null;
    if (!form.elements.name.value.trim()) { setErr("err-name", "Please add your name."); first = first || form.elements.name; ok = false; }
    if (!valueInput.value.trim()) { setErr("err-contact", "Please add how we should reach you."); first = first || valueInput; ok = false; }
    if (!form.elements.about.value) { setErr("err-about", "Please choose one."); first = first || form.elements.about; ok = false; }
    if (!ok) { first.focus(); return; }
    var p = PROVIDERS[select.value];
    sent.textContent = (p && !p.open)
      ? "Thank you. We have your request to join " + p.short + "'s waitlist. The front desk will call within one working day to confirm your place."
      : "Thank you. The front desk will contact you within one working day to arrange a time. If you need us sooner, please call.";
    sent.hidden = false;
    form.hidden = true;
    sent.focus();
  });
})();
