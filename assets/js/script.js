(function () {
  "use strict";

  /* ---------- header scroll state + progress bar ---------- */
  var header = document.getElementById("site-header");
  var progressBar = document.getElementById("progress-bar");
  var mobileNavEl = document.getElementById("mobile-nav");
  var lastY = 0;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) {
      header.classList.toggle("scrolled", y > 40);
      var menuOpen = mobileNavEl && mobileNavEl.classList.contains("open");
      header.classList.toggle("hidden", !menuOpen && y > 400 && y > lastY);
    }
    lastY = y;

    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav toggle ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");
    if (header) header.classList.remove("menu-open");
    document.body.style.overflow = "";
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      mobileNav.classList.toggle("open", isOpen);
      if (header) header.classList.toggle("menu-open", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileNav);
    });
  }

  /* ---------- scroll-spy active nav link ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));

  function linksFor(id) {
    return navLinks.filter(function (a) {
      return a.getAttribute("href") === "#" + id;
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) { a.classList.remove("active"); });
            linksFor(entry.target.id).forEach(function (a) { a.classList.add("active"); });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && revealEls.length) {
    var reveal = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 80 + "ms";
      reveal.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- YouTube facade (lazy-load iframe on click) ---------- */
  var ytFacade = document.getElementById("yt-facade");
  if (ytFacade) {
    ytFacade.addEventListener("click", function loadVideo() {
      var videoId = ytFacade.getAttribute("data-yt");
      var start = ytFacade.getAttribute("data-start") || "0";
      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube.com/embed/" + videoId +
        "?autoplay=1&start=" + start + "&rel=0";
      iframe.title = "RESENHA DO TSUKAS #01";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      ytFacade.innerHTML = "";
      ytFacade.appendChild(iframe);
      ytFacade.removeEventListener("click", loadVideo);
    });
  }

  /* ---------- instagram cards (lazy-load local video on click) ---------- */
  var instaFrames = Array.prototype.slice.call(document.querySelectorAll(".insta-video-frame"));
  instaFrames.forEach(function (frame) {
    frame.addEventListener("click", function loadInstaVideo() {
      var src = frame.getAttribute("data-video");
      var poster = frame.querySelector("img");
      var posterSrc = poster ? poster.getAttribute("src") : "";
      var video = document.createElement("video");
      video.src = src;
      if (posterSrc) video.poster = posterSrc;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      frame.innerHTML = "";
      frame.appendChild(video);
      frame.removeEventListener("click", loadInstaVideo);

      var cta = frame.parentElement ? frame.parentElement.querySelector(".insta-cta") : null;
      video.addEventListener("ended", function () {
        if (cta) cta.classList.add("pulse");
      });
    });
  });

  /* ---------- gallery lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxClose = document.querySelector(".lightbox-close");
  var galleryImgs = Array.prototype.slice.call(document.querySelectorAll(".gal-grid img"));

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  galleryImgs.forEach(function (img) {
    img.addEventListener("click", function () {
      openLightbox(img.src, img.alt);
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* ---------- keyboard: Enter/Space on video facades ---------- */
  document.querySelectorAll("#yt-facade, .insta-video-frame").forEach(function (el) {
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
    });
  });

  /* ---------- hide floating WhatsApp over the contact section ---------- */
  var waFloat = document.querySelector(".wa-float");
  var contato = document.getElementById("contato");
  if (waFloat && contato && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      waFloat.classList.toggle("hide", entries[0].isIntersecting);
    }, { threshold: 0.25 }).observe(contato);
  }

  /* ---------- smooth scroll offset for fixed header ---------- */
  var headerEl = document.getElementById("site-header");
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = (headerEl ? headerEl.offsetHeight : 0) + 8;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });
})();

/* Carrossel do Instagram */
(function(){
  var grid=document.getElementById("insta-grid"); if(!grid) return;
  var btns=document.querySelectorAll(".insta-arrow");
  function step(){ var c=grid.querySelector(".insta-card"); return c ? c.getBoundingClientRect().width + 10 : grid.clientWidth; }
  function update(){
    var max=grid.scrollWidth - grid.clientWidth - 2;
    btns.forEach(function(b){ b.disabled = b.getAttribute("data-dir")==="-1" ? grid.scrollLeft<=2 : grid.scrollLeft>=max; });
  }
  btns.forEach(function(b){ b.addEventListener("click", function(){
    var cards=grid.querySelectorAll(".insta-card"); if(!cards.length) return;
    var per = window.innerWidth > 800 ? 3 : 1;
    var pos = function(i){ return cards[i].offsetLeft - cards[0].offsetLeft; };
    var cur = 0;
    for (var i=0;i<cards.length;i++){ if (pos(i) <= grid.scrollLeft + 5) cur = i; }
    var next = Math.max(0, Math.min(cards.length-1, cur + per*parseInt(b.getAttribute("data-dir"),10)));
    grid.scrollTo({ left: pos(next), behavior:"smooth" });
  }); });
  grid.addEventListener("scroll", function(){ window.requestAnimationFrame(update); }, { passive:true });
  window.addEventListener("resize", update);
  update();
})();
/* Só um vídeo do Instagram tocando por vez */
document.addEventListener("play", function(e){
  if (!e.target.closest || !e.target.closest(".insta-video-frame")) return;
  document.querySelectorAll(".insta-video-frame video").forEach(function(v){ if (v !== e.target) v.pause(); });
}, true);
