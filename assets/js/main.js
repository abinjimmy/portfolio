(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header background after scrolling
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Starfield: twinkling stars, mouse parallax, occasional shooting star
  var canvas = document.getElementById("stars");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var root = document.documentElement;
    var TAU = Math.PI * 2;
    var colors = ["255,255,255", "255,255,255", "226,210,255", "255,200,246", "190,210,255"];
    var w = 0, h = 0, stars = [], shot = null, nextShot = 3000;
    var mx = 0, my = 0, cx = 0, cy = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(Math.round((w * h) / 5200), 320);
      stars = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: z,
          r: 0.35 + z * 1.25,
          ph: Math.random() * TAU,
          sp: 0.6 + Math.random() * 1.8,
          c: colors[(Math.random() * colors.length) | 0]
        });
      }
      if (reduce) draw(0, 0);
    }

    var last = 0;
    function draw(t, dt) {
      ctx.clearRect(0, 0, w, h);
      cx += (mx - cx) * 0.05;
      cy += (my - cy) * 0.05;
      if (!reduce) {
        root.style.setProperty("--px", cx.toFixed(3));
        root.style.setProperty("--py", cy.toFixed(3));
      }
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.sp + s.ph);
        var x = (((s.x + cx * s.z * 40) % w) + w) % w;
        var y = (((s.y + cy * s.z * 40) % h) + h) % h;
        var a = tw * (0.35 + 0.65 * s.z);
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgb(" + s.c + ")";
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, TAU);
        ctx.fill();
        if (s.r > 1.1) {
          ctx.globalAlpha = a * 0.22;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 3.2, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduce) {
        nextShot -= dt;
        if (!shot && nextShot <= 0) {
          shot = { x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.4, life: 0 };
          nextShot = 5000 + Math.random() * 5000;
        }
        if (shot) {
          shot.life += dt;
          var p = shot.life / 900;
          var sx = shot.x + p * 360;
          var sy = shot.y + p * 190;
          var g = ctx.createLinearGradient(sx, sy, sx - 110, sy - 58);
          g.addColorStop(0, "rgba(255,255,255," + (1 - p).toFixed(2) + ")");
          g.addColorStop(1, "rgba(211,92,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 110, sy - 58);
          ctx.stroke();
          if (p >= 1) shot = null;
        }
      }
    }

    function loop(t) {
      var dt = Math.min(t - last, 64);
      last = t;
      draw(t, dt);
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    resize();

    if (!reduce) {
      window.addEventListener("pointermove", function (e) {
        mx = e.clientX / w - 0.5;
        my = e.clientY / h - 0.5;
      }, { passive: true });
      requestAnimationFrame(function (t) { last = t; loop(t); });
    }
  }

  if (reduce) return;

  // Scroll reveal, staggered by position in the group
  var targets = Array.prototype.filter.call(
    document.querySelectorAll(".section .card, .section h2, .section .prose, .section .lead, .section .actions, .contact-list, .timeline li"),
    function (el) { return !(el.classList.contains("card") && el.closest(".timeline")); }
  );
  var timelines = document.querySelectorAll(".timeline");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    targets.forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(siblings, 6) * 90 + "ms";
      el.classList.add("reveal");
      io.observe(el);
    });
    timelines.forEach(function (el) {
      el.classList.add("anim");
      io.observe(el);
    });
  }

  // Cursor glow inside cards
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });
})();
