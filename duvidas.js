/* =====================================================================
   POUSADA MARÉ — CENTRAL DE DÚVIDAS DO SITE
   • A pessoa digita a dúvida e a resposta aparece na hora (aceita erros de
     digitação, sem acento, outras palavras e os 3 idiomas do site).
   • Não achou? Um botão abre o WhatsApp da recepção com a pergunta já escrita.
   • O que foi procurado vai para a Gestão (Dúvidas do site), sem nome nem
     telefone: assim o dono vê o que falta responder.
   As perguntas e respostas são cadastradas na Gestão › Dúvidas do site.
   ===================================================================== */
(function () {
  "use strict";
  var L = window.mareLang || "pt";
  var TXT = {
    pt: { et: "Central de dúvidas", h: "Pergunte o que quiser", sub: "Digite sua dúvida e a resposta aparece na hora.", ph: "Ex.: aceita pet?", rot: "Sua dúvida",
      todas: "Todas", limpar: "Limpar", um: "1 resposta", varias: " respostas", nada: "Ainda não temos essa resposta aqui.", nadaSub: "A recepção responde rapidinho pelo WhatsApp. A sua pergunta já vai escrita:",
      naoEra: "Não era isso?", perguntar: "Perguntar no WhatsApp", outra: "Ficou alguma dúvida? Fale com a recepção.", msg: "Olá! Vim pelo site da Pousada Maré e tenho uma dúvida: ", msg0: "Olá! Vim pelo site da Pousada Maré e tenho uma dúvida." },
    es: { et: "Preguntas frecuentes", h: "Pregunta lo que quieras", sub: "Escribe tu duda y la respuesta aparece al instante.", ph: "Ej.: ¿aceptan mascotas?", rot: "Tu duda",
      todas: "Todas", limpar: "Borrar", um: "1 respuesta", varias: " respuestas", nada: "Todavía no tenemos esa respuesta aquí.", nadaSub: "La recepción responde rápido por WhatsApp. Tu pregunta ya va escrita:",
      naoEra: "¿No era eso?", perguntar: "Preguntar por WhatsApp", outra: "¿Te quedó alguna duda? Habla con la recepción.", msg: "¡Hola! Vengo del sitio web de Pousada Maré y tengo una duda: ", msg0: "¡Hola! Vengo del sitio web de Pousada Maré y tengo una duda." },
    en: { et: "Questions", h: "Ask us anything", sub: "Type your question and the answer shows up right away.", ph: "E.g. are pets allowed?", rot: "Your question",
      todas: "All", limpar: "Clear", um: "1 answer", varias: " answers", nada: "We don't have that answer here yet.", nadaSub: "The front desk replies quickly on WhatsApp. Your question is already written:",
      naoEra: "Not what you were looking for?", perguntar: "Ask on WhatsApp", outra: "Still have a question? Talk to the front desk.", msg: "Hi! I found you on the Pousada Maré website and I have a question: ", msg0: "Hi! I found you on the Pousada Maré website and I have a question." }
  }[L] || null;
  if (!TXT) return;

  /* ---------------- Busca: normalização, sinônimos e tolerância a erros ---------------- */
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); };
  var VAZIAS = {};
  ("a o os as um uma uns umas de da do das dos e em no na nos nas para pra pro por com sem que se tem ter tenho voces voce vcs vc eu meu minha " +
   "qual quais como posso pode podem ha ao aos sim nao ai aceita aceitam aceito levar leva trazer existe la el los las es un una y con hay puedo puede " +
   "aceptan acepta llevar traer mi tu the an is are do does can i you we to of in for it there my your be have has any allowed allow accept bring").split(" ").forEach(function (w) { VAZIAS[w] = 1; });
  var GRUPOS = [
    "pet pets cachorro cachorra cachorros cao caes cadela gato gata gatos animal animais bicho bichos perro perros mascota mascotas dog dogs cat cats",
    "estacionamento estacionar garagem carro carros parking park aparcamiento estacionamiento coche car",
    "aeroporto aeroportos voo voos aviao airport aeropuerto vuelo flight",
    "chegar chego chegada chegando llegar llego llegada arrive arrival rota caminho estrada road",
    "internet wifi wi fi celular operadora 4g senal signal phone",
    "cafe manha desayuno breakfast",
    "crianca criancas filho filhos filha filhas bebe bebes berco nino ninos nina ninas kids kid child children baby cot crib familia family",
    "pagamento pagar pago pix cartao credito debito deposito parcelar parcela tarjeta payment pay card deposit",
    "cancelar cancelamento desistir remarcar reembolso devolucao cancelacion cancel cancellation refund",
    "horario horarios hora horas checkin checkout entrada saida time times",
    "acessivel acessibilidade cadeirante cadeira rodas pcd deficiente deficiencia rampa accesible accesibilidad wheelchair accessible accessibility",
    "piscina pool",
    "restaurante almoco jantar comida comer cardapio menu almuerzo cena restaurant lunch dinner food",
    "preco precos valor valores diaria diarias custa custo tarifa precio price prices cost rate",
    "endereco localizacao fica direccion ubicacion address location where",
    "suite suites quarto quartos habitacion habitaciones room rooms"
  ];
  var CANON = {};
  GRUPOS.forEach(function (g, i) { g.split(" ").forEach(function (w) { CANON[w] = "#" + i; }); });
  var toks = function (s) { return norm(s).split(" ").filter(function (w) { return w.length >= 2 && !VAZIAS[w]; }); };
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var c = [i], m = i; for (j = 1; j <= b.length; j++) { c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (c[j] < m) m = c[j]; } if (m > max) return max + 1; p = c; }
    return p[b.length];
  }
  function parecido(q, w) {
    if (q === w) return 1;
    if (CANON[q] && CANON[q] === CANON[w]) return 1;
    // a pessoa ainda está digitando ("estac" → estacionamento)
    if (q.length >= 3 && w.indexOf(q) === 0) return 0.8;
    // plural, gênero ("piscinas" → piscina)
    if (w.length >= 5 && q.indexOf(w) === 0 && q.length - w.length <= 3) return 0.7;
    // erro de digitação ("pisina", "chekin")
    var m = Math.min(q.length, w.length);
    if (m >= 5) { var lim = m >= 8 ? 2 : 1; if (lev(q, w, lim) <= lim) return 0.65; }
    return 0;
  }
  function indexa(f) {
    var t = traduz(f);
    return [[toks(t.p + " " + (t.p !== f.pergunta ? f.pergunta : "")), 3], [toks(f.palavras || ""), 2.5], [toks(t.t + " " + f.tema), 1], [toks(t.r), 1]];
  }
  function busca(q) {
    var qt = toks(q); if (!qt.length) return [];
    var out = [];
    FAQ.forEach(function (f) {
      var score = 0, achou = 0;
      qt.forEach(function (w) {
        var best = 0;
        f._ix.forEach(function (campo) { campo[0].forEach(function (d) { var s = parecido(w, d) * campo[1]; if (s > best) best = s; }); });
        if (best > 0) { achou++; score += best; }
      });
      var cob = achou / qt.length;
      if (achou && cob >= 0.5) out.push({ f: f, s: score * cob });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    if (out.length > 1 && out[0].s >= 1.5) out = out.filter(function (x) { return x.s > out[0].s * 0.45; });
    return out.slice(0, 5).map(function (x) { return x.f; });
  }

  /* ---------------- Dados ---------------- */
  var FAQ = [], CFG = {}, MODO = "api";
  var cfg = function (k, d) { var v = CFG[k]; if (Array.isArray(v)) v = v[0]; return v == null || v === "" ? d : v; };
  function preenche(s) {
    return String(s || "").replace(/\{(condicoes|pets|checkin|checkout)\}/g, function (_, k) {
      return k === "condicoes" ? cfg("condicoes", "Consulte a recepção.") : k === "pets" ? cfg("politica_pets", "Fale com a recepção antes de trazer seu pet.") : k === "checkin" ? cfg("checkin_hora", "14h") : cfg("checkout_hora", "12h");
    });
  }
  function traduz(f) {
    var x = L !== "pt" && f.traducoes && f.traducoes[L];
    return { t: (x && x.t) || f.tema, p: (x && x.p) || f.pergunta, r: preenche((x && x.r) || f.resposta) };
  }
  function demo() { return new Promise(function (ok) { if (window.MareDemo) return ok(); var s = document.createElement("script"); s.src = "demo.js"; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }); }
  function carrega() {
    return fetch("/api/public?a=faq").then(function (r) { if (!r.ok || (r.headers.get("content-type") || "").indexOf("json") < 0) throw 0; return r.json(); })
      .catch(function () { return demo().then(function () { if (window.MareDemo && MareDemo.faq) { MODO = "demo"; return MareDemo.faq(); } MODO = "offline"; return { itens: [], config: {} }; }); });
  }

  /* ---------------- Registro das buscas (sem dados pessoais) ---------------- */
  var B = null, tB = 0;
  var novoId = function () { var a = new Uint8Array(9); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); };
  function envia(fecha) {
    clearTimeout(tB);
    if (!B || norm(B.termo).length < 3 || MODO === "offline") { if (fecha) B = null; return; }
    var b = { id: B.id, termo: B.termo, achou: B.achou, faq_id: B.faq_id || null, perguntou: !!B.perguntou, idioma: L };
    if (B.ultimo !== JSON.stringify(b)) {
      B.ultimo = JSON.stringify(b);
      if (MODO === "demo") { try { MareDemo.busca(b); } catch (e) { } }
      else {
        var body = JSON.stringify(b);
        try { if (navigator.sendBeacon && navigator.sendBeacon("/api/public?a=busca", new Blob([body], { type: "application/json" }))) body = null; } catch (e) { }
        if (body) fetch("/api/public?a=busca", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () { });
      }
    }
    if (fecha) B = null;
  }
  function registra(termo, achou) {
    if (!termo.trim()) { envia(true); return; }
    if (!B) B = { id: novoId() };
    B.termo = termo.trim().slice(0, 120); B.achou = achou;
    clearTimeout(tB); tB = setTimeout(function () { envia(false); }, 2500);
  }

  /* ---------------- Tela ---------------- */
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var paras = function (s) { return esc(s).split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join(""); };
  var zapHref = function (m) { var n = String(cfg("whatsapp", "5573998456129")).replace(/\D/g, ""); if (L === "pt" && window.mareZap) m = mareZap(m); return "https://wa.me/" + n + "?text=" + encodeURIComponent(m); };
  var ZAP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>';
  var LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';

  var CSS = "#duvidas [hidden]{display:none!important}#duvidas .dv-busca{position:relative;max-width:760px;margin:0 0 18px}" +
    "#duvidas .dv-busca svg{position:absolute;left:20px;top:50%;width:22px;height:22px;transform:translateY(-50%);color:var(--turq);pointer-events:none}" +
    "#duvidas .dv-busca input{width:100%;min-height:62px;border:0;border-radius:999px;background:var(--branco);box-shadow:inset 0 0 0 1.5px rgba(11,59,69,.16),0 14px 34px -22px rgba(11,59,69,.45);padding:0 112px 0 56px;font:600 17px var(--sans);color:var(--tx);outline:none;transition:box-shadow .2s;-webkit-appearance:none;appearance:none}" +
    "#duvidas .dv-busca input::-webkit-search-cancel-button{display:none}" +
    "#duvidas .dv-busca input:focus{box-shadow:inset 0 0 0 2px var(--turq),0 14px 34px -20px rgba(10,151,180,.55)}" +
    "#duvidas .dv-busca input::placeholder{color:var(--muted);font-weight:500}" +
    "#duvidas .dv-limpa{position:absolute;right:10px;top:50%;transform:translateY(-50%);border:0;background:var(--agua);color:var(--oceano);font:700 13px var(--sans);border-radius:999px;padding:9px 14px;cursor:pointer}" +
    "#duvidas .dv-temas{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px}" +
    "#duvidas .dv-temas button{border:0;border-radius:999px;padding:9px 16px;font:700 14px var(--sans);background:var(--branco);color:var(--oceano);box-shadow:inset 0 0 0 1.5px rgba(11,59,69,.15);cursor:pointer}" +
    "#duvidas .dv-temas button.on{background:var(--oceano);color:#fff;box-shadow:none}" +
    "#duvidas .dv-info{font-size:14px;color:var(--muted);margin:0 0 10px;min-height:1em}" +
    "#duvidas .dv-lista{display:grid;gap:10px;max-width:860px}" +
    "#duvidas .dv-item{border-radius:18px;background:var(--branco);box-shadow:inset 0 0 0 1px rgba(11,59,69,.1);overflow:hidden}" +
    "#duvidas .dv-item>button{width:100%;display:flex;align-items:center;gap:14px;text-align:left;border:0;background:none;padding:18px 20px;font:700 17px var(--sans);color:var(--oceano);cursor:pointer}" +
    "#duvidas .dv-item>button span{flex:1}" +
    "#duvidas .dv-item>button small{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--turq);margin-bottom:3px}" +
    "#duvidas .dv-item>button i{flex:none;width:30px;height:30px;border-radius:50%;background:var(--agua);position:relative;transition:transform .3s}" +
    "#duvidas .dv-item>button i::before,#duvidas .dv-item>button i::after{content:'';position:absolute;left:50%;top:50%;width:12px;height:2px;margin:-1px 0 0 -6px;background:var(--oceano);border-radius:2px}" +
    "#duvidas .dv-item>button i::after{transform:rotate(90deg);transition:transform .3s}" +
    "#duvidas .dv-item.on>button i::after{transform:rotate(0)}" +
    "#duvidas .dv-r{display:none;padding:0 20px 18px;color:var(--tx2);font-size:16px;line-height:1.6}" +
    "#duvidas .dv-r p{margin:0 0 8px}" +
    "#duvidas .dv-item.on .dv-r{display:block}" +
    "#duvidas .dv-nada{max-width:760px;border-radius:22px;background:var(--agua);padding:24px}" +
    "#duvidas .dv-nada h3{font-size:22px;color:var(--oceano);margin:0 0 6px}" +
    "#duvidas .dv-nada p{margin:0 0 14px;color:var(--tx2)}" +
    "#duvidas .dv-nada blockquote{margin:0 0 16px;padding:12px 16px;border-radius:14px;background:var(--branco);font-weight:600;color:var(--tx)}" +
    "#duvidas .dv-zap{display:inline-flex;align-items:center;gap:10px;min-height:50px;padding:0 22px;border-radius:999px;background:#1FAF5C;color:#fff;font:700 15.5px var(--sans);text-decoration:none;box-shadow:0 10px 24px -12px rgba(31,175,92,.8)}" +
    "#duvidas .dv-zap:hover{background:#178A48}" +
    "#duvidas .dv-zap svg{width:20px;height:20px}" +
    "#duvidas .dv-pe{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:18px;color:var(--tx2);font-size:15px}" +
    "#duvidas mark{background:rgba(22,180,138,.22);color:inherit;border-radius:4px;padding:0 2px}" +
    "@media (max-width:640px){#duvidas .dv-busca input{min-height:56px;font-size:16px;padding-right:96px}#duvidas .dv-temas{flex-wrap:nowrap;overflow-x:auto;margin-right:calc(-1*var(--gut));padding-right:var(--gut);scrollbar-width:none}#duvidas .dv-temas button{flex:none}#duvidas .dv-item>button{padding:16px;font-size:16px}#duvidas .dv-r{padding:0 16px 16px}}";

  var sec, el = {}, tema = "", q = "";
  function monta() {
    sec = document.getElementById("duvidas");
    if (!sec) {
      var ap = document.getElementById("chegar"); if (!ap) return false;
      ap.insertAdjacentHTML("afterend", '<section class="sec c-branco" id="duvidas"></section>'); sec = document.getElementById("duvidas");
    }
    sec.setAttribute("data-sem-trad", "");
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    sec.innerHTML = '<div class="wrap"><div class="topo-sec"><div><p class="etiqueta">' + esc(TXT.et) + '</p><h2>' + esc(TXT.h) + '</h2><p style="margin:10px 0 0;color:var(--tx2)">' + esc(TXT.sub) + '</p></div></div>' +
      '<form class="dv-busca" role="search" onsubmit="return false"><label for="dv-q" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">' + esc(TXT.rot) + '</label>' + LUPA +
      '<input id="dv-q" type="search" autocomplete="off" enterkeyhint="search" maxlength="120" placeholder="' + esc(TXT.ph) + '"><button type="button" class="dv-limpa" id="dv-x" hidden>' + esc(TXT.limpar) + '</button></form>' +
      '<div class="dv-temas" id="dv-t" role="group"></div><p class="dv-info" id="dv-i" aria-live="polite"></p><div id="dv-l"></div></div>';
    el.q = sec.querySelector("#dv-q"); el.x = sec.querySelector("#dv-x"); el.t = sec.querySelector("#dv-t"); el.i = sec.querySelector("#dv-i"); el.l = sec.querySelector("#dv-l");
    return true;
  }
  function marca(txt, termos) {
    var h = esc(txt); if (!termos.length) return h;
    return h.replace(/[\wÀ-ÿ]+/g, function (w) { var n = norm(w); return n.length >= 3 && termos.some(function (t) { return parecido(t, n) >= 0.8; }) ? "<mark>" + w + "</mark>" : w; });
  }
  function itemHtml(f, aberto, termos) {
    var t = traduz(f);
    return '<div class="dv-item' + (aberto ? " on" : "") + '" data-id="' + f.id + '"><button type="button" aria-expanded="' + !!aberto + '"><span>' + (q ? "" : "") + marca(t.p, termos) + '</span><i aria-hidden="true"></i></button><div class="dv-r">' + paras(t.r) + '</div></div>';
  }
  function desenha() {
    var temas = []; FAQ.forEach(function (f) { var t = traduz(f).t; if (temas.indexOf(t) < 0) temas.push(t); });
    el.t.hidden = !!q || temas.length < 2;
    el.t.innerHTML = [["", TXT.todas]].concat(temas.map(function (t) { return [t, t]; })).map(function (t) { return '<button type="button" data-tema="' + esc(t[0]) + '" class="' + (t[0] === tema ? "on" : "") + '" aria-pressed="' + (t[0] === tema) + '">' + esc(t[1]) + '</button>'; }).join("");
    el.x.hidden = !q;
    var termo = q.trim();
    if (!termo) {
      el.i.textContent = "";
      var lista = FAQ.filter(function (f) { return !tema || traduz(f).t === tema; });
      el.l.innerHTML = '<div class="dv-lista">' + lista.map(function (f) { return itemHtml(f, false, []); }).join("") + '</div>' +
        '<div class="dv-pe"><span>' + esc(TXT.outra) + '</span><a class="dv-zap" data-zap href="' + esc(zapHref(TXT.msg0)) + '" target="_blank" rel="noopener">' + ZAP + esc(TXT.perguntar) + '</a></div>';
      return;
    }
    var res = busca(termo), termos = toks(termo);
    registra(termo, res.length > 0);
    if (B && res.length) B.faq_id = res[0].id; // a primeira resposta já aparece aberta
    var link = zapHref(TXT.msg + termo);
    if (!res.length) {
      el.i.textContent = "";
      el.l.innerHTML = '<div class="dv-nada"><h3>' + esc(TXT.nada) + '</h3><p>' + esc(TXT.nadaSub) + '</p><blockquote>“' + esc(termo) + '”</blockquote><a class="dv-zap" data-zap href="' + esc(link) + '" target="_blank" rel="noopener">' + ZAP + esc(TXT.perguntar) + '</a></div>';
      return;
    }
    el.i.textContent = res.length === 1 ? TXT.um : res.length + TXT.varias;
    el.l.innerHTML = '<div class="dv-lista">' + res.map(function (f, i) { return itemHtml(f, i === 0, termos); }).join("") + '</div>' +
      '<div class="dv-pe"><span>' + esc(TXT.naoEra) + '</span><a class="dv-zap" data-zap href="' + esc(link) + '" target="_blank" rel="noopener">' + ZAP + esc(TXT.perguntar) + '</a></div>';
  }
  function liga() {
    el.q.addEventListener("input", function () { q = el.q.value; desenha(); });
    el.q.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); envia(false); el.q.blur(); } if (e.key === "Escape") { el.q.value = q = ""; desenha(); } });
    el.q.addEventListener("blur", function () { envia(false); });
    el.x.addEventListener("click", function () { el.q.value = q = ""; envia(true); desenha(); el.q.focus(); });
    el.t.addEventListener("click", function (e) { var b = e.target.closest("[data-tema]"); if (!b) return; tema = b.dataset.tema; desenha(); });
    el.l.addEventListener("click", function (e) {
      var z = e.target.closest("[data-zap]");
      if (z) { if (B) { B.perguntou = true; envia(true); } return; }
      var b = e.target.closest(".dv-item>button"); if (!b) return;
      var it = b.parentNode, on = !it.classList.contains("on");
      it.classList.toggle("on", on); b.setAttribute("aria-expanded", on);
      if (on && B) { B.faq_id = +it.dataset.id; envia(false); }
    });
    addEventListener("pagehide", function () { envia(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") envia(false); });
  }
  function inicia() {
    if (!monta()) return;
    carrega().then(function (d) {
      FAQ = (d && d.itens) || []; CFG = (d && d.config) || {};
      FAQ.forEach(function (f) { f._ix = indexa(f); });
      liga(); desenha();
    });
  }
  // Exposto para teste e para a Gestão mostrar a mesma busca que o site usa
  window.MareDuvidas = { busca: function (termo, itens) { var bk = FAQ; if (itens) { FAQ = itens; FAQ.forEach(function (f) { f._ix = indexa(f); }); } var r = busca(termo); FAQ = bk; return r; }, norm: norm };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicia); else inicia();
})();
