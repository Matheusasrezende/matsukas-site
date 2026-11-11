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

  /* convidados: só números (1 a 99999) */
  var conv = form.elements.convidados;
  conv.addEventListener("input", function () { conv.value = conv.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5); });

  /* estado + cidades do IBGE */
  var cache = {};
  var uf = form.elements.uf, cidade = form.elements.cidade;
  var dl = document.getElementById("q-cidades"), st = document.getElementById("q-city-status");
  function norm(t) { return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
  function loadCities(u) {
    if (cache[u]) return fill(cache[u]);
    if (st) st.textContent = "carregando...";
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/" + u + "/municipios?orderBy=nome")
      .then(function (r) { return r.json(); })
      .then(function (l) { cache[u] = l.map(function (m) { return m.nome; }); fill(cache[u]); })
      .catch(function () { if (st) st.textContent = ""; });
  }
  function fill(names) {
    dl.innerHTML = names.map(function (n) { return '<option value="' + n.replace(/"/g, "&quot;") + '">'; }).join("");
    if (st) st.textContent = "";
  }
  function matchCity(u, typed) {
    var list = cache[u];
    if (!list) return typed.trim();                   // lista não carregou: aceita o digitado
    var t = norm(typed);
    for (var i = 0; i < list.length; i++) if (norm(list[i]) === t) return list[i];
    return null;
  }
  uf.addEventListener("change", function () { cidade.value = ""; loadCities(uf.value); });
  cidade.addEventListener("focus", function () { if (!cache[uf.value]) loadCities(uf.value); }, { once: true });

  form.querySelectorAll("input, select").forEach(function (el) {
    el.addEventListener("input", function () { el.classList.remove("invalid"); if (msg) msg.textContent = ""; });
    el.addEventListener("change", function () { el.classList.remove("invalid"); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, bad = [];
    if (!f.tipo.value) bad.push(f.tipo);
    var dataPassada = f.data.value && f.data.value < f.data.min;
    if (!f.data.value || dataPassada) bad.push(f.data);
    var cidadeOk = null;
    if (cidade.value.trim()) {
      cidadeOk = matchCity(uf.value, cidade.value);
      if (!cidadeOk) bad.push(cidade);
    }
    if (bad.length) {
      bad.forEach(function (el) { el.classList.add("invalid"); });
      if (msg) msg.textContent = bad[0] === cidade
        ? "Escolha a cidade na lista do estado selecionado."
        : (bad[0] === f.data && dataPassada ? "Escolha uma data a partir de hoje." : "Escolha o tipo de evento e a data.");
      bad[0].focus();
      return;
    }
    if (cidadeOk) cidade.value = cidadeOk;
    var p = f.data.value.split("-");
    var dataBR = p[2] + "/" + p[1] + "/" + p[0];
    var linhas = [
      "Olá, Matsukas! Vim pelo site e quero um orçamento.",
      "",
      "Tipo de evento: " + f.tipo.value,
      "Data: " + dataBR
    ];
    if (cidadeOk) linhas.push("Cidade: " + cidadeOk + "/" + uf.value);
    if (conv.value) linhas.push("Convidados: " + Number(conv.value).toLocaleString("pt-BR"));
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
