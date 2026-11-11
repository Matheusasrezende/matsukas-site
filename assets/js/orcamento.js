/* ==========================================================================
   ORÇAMENTO RÁPIDO (topo do site) — monta a mensagem e abre o WhatsApp
   ========================================================================== */
(function () {
  "use strict";
  var form = document.getElementById("orcamento-rapido");
  if (!form) return;
  var WHATS = "5534999838861";
  var msg = document.getElementById("q-msg");
  var data = form.elements.data;

  // não deixa escolher data no passado
  var hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  if (data) data.min = hoje.toISOString().slice(0, 10);

  form.querySelectorAll("input, select").forEach(function (el) {
    el.addEventListener("input", function () { el.classList.remove("invalid"); if (msg) msg.textContent = ""; });
    el.addEventListener("change", function () { el.classList.remove("invalid"); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, bad = [];
    if (!f.tipo.value) bad.push(f.tipo);
    if (!f.data.value) bad.push(f.data);
    if (bad.length) {
      bad.forEach(function (el) { el.classList.add("invalid"); });
      if (msg) msg.textContent = "Escolha o tipo de evento e a data.";
      bad[0].focus();
      return;
    }
    var p = f.data.value.split("-");
    var dataBR = p[2] + "/" + p[1] + "/" + p[0];
    var linhas = [
      "Olá, Matsukas! Vim pelo site e quero um orçamento.",
      "",
      "Tipo de evento: " + f.tipo.value,
      "Data: " + dataBR
    ];
    if (f.cidade.value.trim()) linhas.push("Cidade: " + f.cidade.value.trim());
    if (f.convidados.value) linhas.push("Convidados: " + f.convidados.value);
    window.open("https://wa.me/" + WHATS + "?text=" + encodeURIComponent(linhas.join("\n")), "_blank", "noopener");
  });

  // no topo já tem o card de orçamento: esconde o botão flutuante do WhatsApp enquanto ele aparece
  var wa = document.querySelector(".wa-float");
  var hero = document.getElementById("home");
  if (wa && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { wa.classList.toggle("hide-hero", en[0].isIntersecting); }, { threshold: 0.15 }).observe(hero);
  }

  // botão "Peça seu orçamento" do topo: rola até o card e foca o primeiro campo
  document.querySelectorAll('a[href="#orcamento-rapido"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { form.elements.tipo.focus({ preventScroll: true }); }, 450);
    });
  });
})();
