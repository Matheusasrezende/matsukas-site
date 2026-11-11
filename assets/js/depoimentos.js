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
  var VISIBLE = 6;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  /* ---------- render list ---------- */
  function render(list) {
    if (!list || !list.length) return;
    grid.innerHTML = list.map(function (d, i) {
      return '<figure class="dep"' + (i >= VISIBLE ? " hidden" : "") + ">" +
        '<blockquote class="dep-text">' + esc(d.texto) + "</blockquote>" +
        '<figcaption class="dep-who"><b>' + esc(d.nome) + "</b><span>" + esc(d.tipo) + (d.data ? " &middot; " + esc(d.data) : "") + "</span></figcaption>" +
        "</figure>";
    }).join("");

    if (list.length > VISIBLE) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "btn btn-line btn-sm dep-more";
      more.textContent = "Ver mais depoimentos";
      more.addEventListener("click", function () {
        grid.querySelectorAll(".dep[hidden]").forEach(function (el) { el.hidden = false; });
        more.remove();
      });
      grid.appendChild(more);
    }
    if (empty) empty.classList.add("hide");
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
  function bindForm() {
    msg = document.getElementById("fb-msg");
    count = document.getElementById("fb-count");
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
    if (f.depoimento.value.trim().length < 10) bad.push(f.depoimento);
    bad.forEach(function (el) { el.classList.add("invalid"); });

    if (bad.length) { setMsg("Preencha nome, telefone com DDD, tipo de festa e o depoimento.", "err"); bad[0].focus(); return; }
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
