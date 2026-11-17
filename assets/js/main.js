(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // Theme toggle (dark / light), remembered in the browser
  var toggle = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  function applyLabel() {
    var t = root.getAttribute("data-theme");
    if (toggle) {
      toggle.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      toggle.setAttribute("aria-pressed", t === "light" ? "true" : "false");
    }
    if (meta) meta.setAttribute("content", t === "dark" ? "#0c0720" : "#ffffff");
  }
  applyLabel();
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("abinorix-theme", next); } catch (e) {}
      applyLabel();
    });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header style after scrolling
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 12); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    function closeNav() { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { closeNav(); btn.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
  }

  // Skill modules: glow and ring follow the cursor
  document.querySelectorAll(".module").forEach(function (m) {
    m.addEventListener("pointermove", function (e) {
      var r = m.getBoundingClientRect();
      m.style.setProperty("--mx", e.clientX - r.left + "px");
      m.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // Carousel: arrows and dots
  document.querySelectorAll("[data-carousel]").forEach(function (c) {
    var track = c.querySelector(".track");
    var prev = c.querySelector(".car-prev");
    var next = c.querySelector(".car-next");
    var dots = c.querySelector(".dots");
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    function step() {
      var card = track.firstElementChild;
      return card ? card.getBoundingClientRect().width + 20 : 300;
    }
    if (dots) {
      cards.forEach(function () { dots.appendChild(document.createElement("span")); });
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
      if (dots) {
        var i = Math.round(track.scrollLeft / step());
        if (track.scrollLeft > max - 4) i = cards.length - 1;
        Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === i); });
      }
    }
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step() }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step() }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  if (reduce || !("IntersectionObserver" in window)) return;

  // Scroll reveal, staggered by position in the group
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add("in");
      if (el.hasAttribute("data-count")) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll("[data-r]").forEach(function (el) {
    var i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(i, 6) * 90 + "ms";
    el.classList.add("reveal");
    io.observe(el);
  });
  document.querySelectorAll("[data-count]").forEach(function (el) {
    el.textContent = "0" + (el.getAttribute("data-suffix") || "");
    io.observe(el);
  });

  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / 1200, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
