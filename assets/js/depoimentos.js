/* ==========================================================================
   DEPOIMENTOS — lista os aprovados e envia novos para a planilha Google.
   A URL do Google fica no atributo data-api da <section id="depoimentos">.
   ========================================================================== */
(function () {
  "use strict";

  var section = document.getElementById("depoimentos");
  if (!section) return;

  var API = (section.getAttribute("data-api") || "").trim();
  var configured = /^https:\/\/script\.google\.com\//.test(API);

  var grid = document.getElementById("dep-grid");
  var empty = document.getElementById("dep-empty");
  var dialog = document.getElementById("feedback-dialog");
  var form = document.getElementById("feedback-form");
  var msg = document.getElementById("fb-msg");
  var count = document.getElementById("fb-count");
  var formHTML = form ? form.innerHTML : "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  /* ---------- render list (carrossel) ---------- */
  function render(list) {
    if (!list || !list.length) return;
    grid.innerHTML = list.map(function (d) {
      return '<figure class="dep">' +
        '<blockquote class="dep-text">' + esc(d.texto) + "</blockquote>" +
        '<button type="button" class="dep-more-btn" hidden>Ler mais</button>' +
        '<figcaption class="dep-who"><b>' + esc(d.nome) + "</b><span>" + esc(d.tipo) + (d.cidade ? " &middot; " + esc(d.cidade) : (d.data ? " &middot; " + esc(d.data) : "")) + "</span></figcaption>" +
        "</figure>";
    }).join("");
    var wrap = document.getElementById("dep-carousel");
    if (wrap) wrap.hidden = false;
    if (empty) empty.classList.add("hide");
    setupCarousel();
    // depoimento mais recente vira prova social no topo do site
    var hq = document.getElementById("hero-quote");
    if (hq && list[0]) {
      var t = String(list[0].texto).replace(/\s+/g, " ").trim();
      if (t.length > 120) t = t.slice(0, 117).replace(/\s+\S*$/, "") + "...";
      hq.className = "fact fact-quote";
      hq.innerHTML = "<i>&ldquo;</i>" + esc(t) + "<small>" + esc(list[0].nome) + " &middot; " + esc(list[0].tipo) + "</small>";
    }
  }

  /* ---------- carrossel: setas, contador, barra, "ler mais" ---------- */
  function setupCarousel() {
    var cards = grid.querySelectorAll(".dep");
    var prev = document.getElementById("dep-prev"), next = document.getElementById("dep-next");
    var count = document.getElementById("dep-count"), bar = document.getElementById("dep-bar");
    var nav = grid.parentNode.querySelector(".dep-nav");
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };

    function perView() {
      var w = cards[0] ? cards[0].getBoundingClientRect().width : 1;
      return Math.max(1, Math.round((grid.clientWidth + 10) / (w + 10)));
    }
    function update() {
      var total = cards.length, pv = Math.min(perView(), total);
      var step = cards[0].getBoundingClientRect().width + 10;
      var first = Math.round(grid.scrollLeft / step);
      var max = Math.max(0, total - pv);
      first = Math.min(first, max);
      var last = Math.min(total, first + pv);
      if (count) count.textContent = (pv > 1 ? pad(first + 1) + "–" + pad(last) : pad(first + 1)) + " / " + pad(total);
      if (bar) { bar.style.width = (pv / total * 100) + "%"; bar.style.left = (first / total * 100) + "%"; }
      if (prev) prev.disabled = first <= 0;
      if (next) next.disabled = first >= max;
      if (nav) nav.classList.toggle("single", total <= pv);
    }
    function go(dir) {
      var step = cards[0].getBoundingClientRect().width + 10;
      grid.scrollBy({ left: dir * step * Math.max(1, perView() - (perView() > 1 ? 1 : 0)), behavior: "smooth" });
    }
    if (prev) prev.onclick = function () { go(-1); };
    if (next) next.onclick = function () { go(1); };
    grid.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    var t;
    grid.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    window.addEventListener("resize", function () { checkClamp(); update(); });

    // "Ler mais" só aparece quando o texto foi cortado
    function checkClamp() {
      cards.forEach(function (c) {
        var txt = c.querySelector(".dep-text"), btn = c.querySelector(".dep-more-btn");
        if (c.classList.contains("open")) return;
        btn.hidden = txt.scrollHeight <= txt.clientHeight + 2;
      });
    }
    cards.forEach(function (c) {
      var btn = c.querySelector(".dep-more-btn");
      btn.addEventListener("click", function () {
        var open = c.classList.toggle("open");
        btn.textContent = open ? "Ler menos" : "Ler mais";
      });
    });
    checkClamp();
    update();
  }

  if (configured) {
    fetch(API, { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (data) { if (data && data.ok) render(data.depoimentos); })
      .catch(function () { /* mantém o convite pra deixar depoimento */ });
  }

  /* ---------- dialog ---------- */
  function openDialog() {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    var first = dialog.querySelector("input[name=nome]");
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  document.querySelectorAll("[data-open-feedback]").forEach(function (b) {
    b.addEventListener("click", openDialog);
  });
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.closest("[data-close-feedback]")) closeDialog();
    });
  }
  if (location.hash === "#deixar-depoimento") setTimeout(openDialog, 400);

  /* ---------- form ---------- */
  /* ---------- telefone: só números, formato (34) 99999-9999 ---------- */
  function maskPhone(v) {
    var d = String(v).replace(/\D/g, "").slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return "(" + d;
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /* ---------- cidades do IBGE por estado ---------- */
  var cityCache = {};
  function norm(t) { return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
  function loadCities(uf) {
    var dl = document.getElementById("fb-cidades");
    var st = document.getElementById("fb-city-status");
    if (!dl || !uf) return;
    if (cityCache[uf]) { fill(cityCache[uf]); return; }
    if (st) st.textContent = "carregando...";
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/" + uf + "/municipios?orderBy=nome")
      .then(function (r) { return r.json(); })
      .then(function (list) {
        cityCache[uf] = list.map(function (m) { return m.nome; });
        fill(cityCache[uf]);
      })
      .catch(function () { if (st) st.textContent = ""; });
    function fill(names) {
      dl.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join("");
      if (st) st.textContent = names.length + " cidades";
    }
  }
  function matchCity(uf, typed) {
    var list = cityCache[uf];
    if (!list) return typed.trim();             // lista não carregou: aceita o que foi digitado
    var t = norm(typed);
    for (var i = 0; i < list.length; i++) if (norm(list[i]) === t) return list[i];
    return null;
  }

  function bindForm() {
    msg = document.getElementById("fb-msg");
    count = document.getElementById("fb-count");
    var tel = form.querySelector("input[name=telefone]");
    if (tel) {
      tel.addEventListener("input", function () { tel.value = maskPhone(tel.value); });
      tel.addEventListener("keypress", function (e) { if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault(); });
    }
    var uf = form.querySelector("select[name=uf]");
    var city = form.querySelector("input[name=cidade]");
    if (uf) {
      uf.addEventListener("change", function () { if (city) city.value = ""; loadCities(uf.value); });
      loadCities(uf.value);
    }
    var ta = form.querySelector("textarea[name=depoimento]");
    if (ta && count) {
      ta.addEventListener("input", function () { count.textContent = ta.value.length + "/600"; });
    }
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () { el.classList.remove("invalid"); });
    });
  }
  if (form) bindForm();

  function setMsg(text, type) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "fb-msg" + (type ? " " + type : "");
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var bad = [];
    if (f.nome.value.trim().length < 2) bad.push(f.nome);
    if (f.telefone.value.replace(/\D/g, "").length < 10) bad.push(f.telefone);
    if (!f.tipo_festa.value) bad.push(f.tipo_festa);
    var cidadeOk = f.cidade.value.trim() ? matchCity(f.uf.value, f.cidade.value) : null;
    if (!cidadeOk) bad.push(f.cidade);
    if (f.depoimento.value.trim().length < 10) bad.push(f.depoimento);
    bad.forEach(function (el) { el.classList.add("invalid"); });

    if (bad.length) {
      setMsg(bad[0] === f.cidade && f.cidade.value.trim()
        ? "Escolha a cidade na lista do estado selecionado."
        : "Preencha nome, telefone com DDD, tipo de festa, cidade e o depoimento.", "err");
      bad[0].focus(); return;
    }
    f.cidade.value = cidadeOk;
    if (!f.consentimento.checked) { setMsg("Marque a autorização para publicarmos seu depoimento.", "err"); return; }
    if (!configured) { setMsg("O envio de depoimentos ainda está sendo configurado. Tente novamente em breve.", "err"); return; }

    var btn = form.querySelector(".fb-submit");
    btn.disabled = true;
    btn.textContent = "Enviando...";
    setMsg("");

    var body = new URLSearchParams(new FormData(form));
    if (!f.consentimento.checked) body.delete("consentimento");

    fetch(API, { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok) return done();
        throw new Error((data && data.erro) || "Não foi possível enviar.");
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = "Enviar depoimento";
        setMsg((err && err.message && err.message !== "Failed to fetch") ? err.message : "Não foi possível enviar agora. Verifique sua internet e tente de novo.", "err");
      });
  });

  function done() {
    form.innerHTML =
      '<button type="button" class="fb-close" aria-label="Fechar" data-close-feedback>&times;</button>' +
      '<div class="fb-done"><p class="label" style="justify-content:center">Recebido</p>' +
      '<h3 class="fb-title">Valeu pelo depoimento!</h3>' +
      "<p>Ele vai aparecer no site assim que for aprovado.</p>" +
      '<button type="button" class="btn btn-accent btn-lg" data-close-feedback>Fechar</button></div>';
    dialog.addEventListener("close", function reset() {
      form.innerHTML = formHTML;
      bindForm();
      dialog.removeEventListener("close", reset);
    });
  }
})();
