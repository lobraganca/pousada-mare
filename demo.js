/* =====================================================================
   POUSADA MARÉ — MODO DEMONSTRAÇÃO
   Simula o servidor no próprio navegador (dados guardados só neste aparelho),
   para mostrar o sistema ao cliente antes de ligar o banco de dados.
   Em produção (Vercel + Neon) este arquivo NÃO é usado.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "mare_demo_v4";
  var hoje = function () { var d = new Date(Date.now() - 3 * 3600e3); return d.toISOString().slice(0, 10); };
  var add = function (s, n) { var d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var dias = function (a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var erro = function (m, s) { var e = new Error(m); e.status = s || 400; throw e; };
  var CDN = "https://cdn.checkinweb.com.br/img/173/";

  function seed() {
    var H = hoje();
    var cats = [
      { id: 1, slug: "dupla-vista-mar", nome: "Suíte Dupla · Vista para o mar", resumo: "Varanda com rede de frente para o mar", descricao: "Suíte com ar-condicionado split, frigobar, varanda com rede e vista privilegiada para o mar. Banheiro privativo e enxoval cuidadoso.", capacidade: 2, area_m2: null, caracteristicas: ["Vista para o mar", "Varanda com rede", "Ar-condicionado", "Frigobar", "Aceita crianças"], fotos: [CDN + "fotos_acomodacao/lg_1769085283-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-48-938825a7.jpg", CDN + "fotos_acomodacao/lg_1549626291-sm-1542657189-quarto-casal-pousada-mare-em-cumuruxatiba4.png"], no_site: true, ordem: 1 },
      { id: 2, slug: "quadrupla-conjugada", nome: "Suíte Quádrupla Conjugada", resumo: "Quartos reversíveis para famílias, até 5 pessoas", descricao: "Quartos conjugados e reversíveis — privacidade para a família toda. Varanda com rede e vista para o mar, ar-condicionado split, frigobar e amenities.", capacidade: 5, area_m2: null, caracteristicas: ["Quartos conjugados", "Varanda com rede", "Vista para o mar", "Frigobar", "Amenities"], fotos: [CDN + "fotos_acomodacao/lg_1764618315-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-50-69db9ec3.jpg", CDN + "fotos_acomodacao/lg_1542727784-quarto-pousada-mare-em-cumuruxatiba-vista-para-o-mar3.png"], no_site: true, ordem: 2 },
      { id: 3, slug: "varanda-acessivel", nome: "Suíte de Varanda Reservada · Acessível", resumo: "Piso térreo, adaptada para PcD, até 5 pessoas", descricao: "Planejada com acessibilidade: piso térreo, banheiro adaptado com barras de apoio, pia rebaixada, box amplo. Varanda reservada, ar-condicionado e frigobar.", capacidade: 5, area_m2: null, caracteristicas: ["Acessível (PcD)", "Piso térreo", "Varanda reservada", "Ar-condicionado", "Frigobar"], fotos: [CDN + "fotos_acomodacao/lg_1680780803-20220708-131137.jpg", CDN + "fotos_acomodacao/lg_1680781143-20220708-131307.jpg"], no_site: true, ordem: 3 },
      { id: 4, slug: "economica", nome: "Suíte Econômica · Sem varanda", resumo: "24 m², cama de casal + bicama, até 4 pessoas", descricao: "Suíte arejada com duas janelas, cama de casal e bicama, ar-condicionado split e frigobar. Ótimo custo-benefício.", capacidade: 4, area_m2: 24, caracteristicas: ["24 m²", "Cama casal + bicama", "Ar-condicionado", "Frigobar", "Aceita crianças"], fotos: [CDN + "fotos_acomodacao/lg_1693659411-imagem-do-whatsapp-de-2023-08-25-a-s-10-08-46.jpg", CDN + "fotos_acomodacao/lg_1769085475-imagem-do-whatsapp-de-2025-08-28-a-s-12-14-22-8c49310f.jpg"], no_site: true, ordem: 4 }
    ];
    var tar = [[1, 2, 680], [2, 2, 680], [2, 3, 870], [2, 4, 1060], [2, 5, 1250], [3, 2, 590], [3, 3, 710], [3, 4, 830], [3, 5, 950], [4, 2, 550], [4, 3, 670], [4, 4, 790]].map(function (t) { return { categoria_id: t[0], pessoas: t[1], valor: t[2] }; });
    var quartos = []; var mapa = [1, 1, 1, 1, 2, 2, 2, 2, 3, 4, 4, 4, 4];
    mapa.forEach(function (c, i) { quartos.push({ id: i + 1, nome: "Suíte " + String(i + 1).padStart(2, "0") + (c === 3 ? " · Acessível" : ""), categoria_id: c, ordem: i + 1, ativo: true, obs: "" }); });
    var prod = [["restaurante", "Pratos da casa", "Paella de frutos do mar", "Receita espanhola do Isidro, para 2 pessoas", 189], ["restaurante", "Pratos da casa", "Moqueca de peixe", "Com pirão, arroz e farofa de dendê, para 2 pessoas", 159], ["restaurante", "Pratos da casa", "Arroz de polvo", "Polvo macio, arroz cremoso e azeite", 149], ["restaurante", "Pratos da casa", "Risoto de camarão", "Camarões frescos da costa", 129], ["restaurante", "Petiscos (até 17h)", "Isca de peixe", "Com molho tártaro", 69], ["restaurante", "Petiscos (até 17h)", "Camarão alho e óleo", "Porção", 89], ["restaurante", "Petiscos (até 17h)", "Batata frita", "Porção", 35], ["bar", "Bebidas", "Água mineral", "500 ml", 6], ["bar", "Bebidas", "Refrigerante lata", "350 ml", 8], ["bar", "Bebidas", "Suco natural", "Frutas da estação", 14], ["bar", "Bebidas", "Água de coco", "Gelada", 10], ["bar", "Cervejas", "Cerveja long neck", "", 14], ["bar", "Cervejas", "Cerveja 600 ml", "", 18], ["bar", "Drinks", "Caipirinha", "Limão, cachaça artesanal", 25], ["bar", "Drinks", "Caipiroska de frutas", "Morango, maracujá ou kiwi", 29], ["produto", "Lojinha", "Protetor solar", "FPS 50", 45], ["produto", "Lojinha", "Canga Pousada Maré", "", 60], ["servico", "Serviços", "Lavanderia (peça)", "", 8], ["servico", "Serviços", "Taxa de rolha", "Vinho ou espumante", 40]]
      .map(function (p, i) { return { id: i + 1, tipo: p[0], grupo: p[1], nome: p[2], descricao: p[3], preco: p[4], no_cardapio: p[0] === "bar" || p[0] === "restaurante", ativo: true, ordem: i }; });
    var db = {
      seq: {}, categorias: cats, tarifas: tar, quartos: quartos, produtos: prod,
      temporadas: [{ id: 1, nome: "Réveillon", ini: add(H, 37), fim: add(H, 43), ajuste_pct: 30, min_noites: 5 }],
      fechamentos: [], videos: [],
      config: { whatsapp: "5573998456129", whatsapp_restaurante: "5573996561413", vendas_ate: [add(H, 220)], site_pausado: [false], sinal_pct: [50], condicoes: "Sinal de 50% para confirmar a reserva via PIX. Saldo no check-in. Cancelamento com até 30 dias: devolução do sinal; depois disso o sinal vira crédito para remarcação em até 6 meses.", checkin_hora: "14h", checkout_hora: "12h", politica_pets: "Pets são bem-vindos com aviso prévio. Pedimos que fiquem sempre acompanhados, fora das camas e da área da piscina e do restaurante. Consulte a recepção." },
      usuarios: [{ id: 1, nome: "Isidro (dono)", login: "dono", papel: "dono", ativo: true }, { id: 2, nome: "Brenda", login: "brenda", papel: "recepcao", ativo: true }, { id: 3, nome: "Jaci", login: "jaci", papel: "equipe", ativo: true }],
      hospedes: [], reservas: [], ocupacoes: [], pagamentos: [], lancamentos: [], leads: [], tarefas: [], auditoria: []
    };
    db.seq = { hospedes: 0, reservas: 0, ocupacoes: 0, pagamentos: 0, lancamentos: 0, tarefas: 0, temporadas: 1, fechamentos: 0, videos: 0, usuarios: 3, produtos: prod.length, quartos: 13, auditoria: 0 };
    var u = { id: 1, nome: "Isidro (dono)", papel: "dono" };
    var ex = [
      ["Elis Ângela", "31991234567", "booking", "hospedada", [[5, -2, 3, 2, 2]], "", 1],
      ["Paulo Henrique", "11987654321", "whatsapp", "hospedada", [[1, -1, 2, 2, 0]], "", 0.5],
      ["Família Ribeiro", "73999887766", "site", "confirmada", [[6, 0, 5, 2, 2], [7, 0, 5, 3, 0]], "Ribeiro", 0.5],
      ["Marina Costa", "21988776655", "whatsapp", "confirmada", [[2, 0, 4, 2, 0]], "", 0.5],
      ["Rafael Nunes", "27998765432", "booking", "confirmada", [[10, 1, 4, 2, 1]], "", 1],
      ["Juliana Prado", "31987651234", "site", "pre", [[3, 3, 7, 2, 0]], "", 0],
      ["Grupo Yoga Sul", "48991112233", "whatsapp", "confirmada", [[11, 5, 9, 2, 0], [12, 5, 9, 2, 0], [13, 5, 9, 2, 0]], "Yoga Sul", 0.5],
      ["Carlos Eduardo", "61999001122", "telefone", "confirmada", [[9, -3, 1, 2, 1]], "", 0.5],
      ["Ana Beatriz", "31977665544", "whatsapp", "finalizada", [[4, -6, -2, 2, 0]], "", 1],
      ["Lucas Martins", "71988223344", "booking", "finalizada", [[8, -10, -5, 4, 0]], "", 1],
      ["Fernanda Alves", "31966554433", "site", "finalizada", [[2, -14, -9, 2, 0]], "", 1],
      ["Thiago Rocha", "11955443322", "whatsapp", "confirmada", [[8, 8, 12, 3, 1]], "", 0.5],
      ["Bruna Lopes", "73944332211", "site", "confirmada", [[1, 10, 14, 2, 0]], "", 0.5]
    ];
    ex.forEach(function (e) {
      var r = A.reserva_salvar.call(db, { hospede: { nome: e[0], telefone: e[1] }, origem: e[2], status: e[3] === "finalizada" || e[3] === "hospedada" ? "confirmada" : e[3], grupo_nome: e[5], condicoes_pagamento: "50% de sinal via PIX, saldo no check-in", quartos: e[4].map(function (q) { return { quarto_id: q[0], checkin: add(H, q[1]), checkout: add(H, q[2]), adultos: q[3], criancas: q[4] }; }) }, u, db);
      var res = byId(db.reservas, r.id); res.status = e[3];
      var tot = res.valor_hospedagem;
      if (e[6] > 0) db.pagamentos.push({ id: ++db.seq.pagamentos, reserva_id: r.id, tipo: e[6] === 1 ? "saldo" : "sinal", valor: Math.round(tot * e[6]), forma: e[2] === "booking" ? "booking" : "pix", data: add(H, -15), obs: "", por: "Brenda" });
    });
    db.lancamentos.push({ id: ++db.seq.lancamentos, reserva_id: 1, quarto_id: 5, produto_id: 14, tipo: "bar", descricao: "Caipirinha", qtd: 2, valor_unit: 25, total: 50, cancelado: false, criado_em: new Date().toISOString(), por: "Jaci" });
    db.lancamentos.push({ id: ++db.seq.lancamentos, reserva_id: 1, quarto_id: 5, produto_id: 1, tipo: "restaurante", descricao: "Paella de frutos do mar", qtd: 1, valor_unit: 189, total: 189, cancelado: false, criado_em: new Date().toISOString(), por: "Jaci" });
    A.bloqueio_criar.call(db, { quarto_id: 3, checkin: add(H, 0), checkout: add(H, 2), motivo: "Manutenção do ar-condicionado" }, u, db);
    db.leads.push({ id: "demoLead01", nome: "Patrícia Gomes", telefone: "31993332211", cidade: "Belo Horizonte", checkin: add(H, 20), checkout: add(H, 25), adultos: 2, criancas: 1, itens: [{ categoria: "Suíte Quádrupla Conjugada", quartos: 1, adultos: 2, criancas: 1 }], valor_estimado: 4350, obs: "", etapa: 3, enviado: false, enviado_em: null, status: "novo", criado_em: new Date(Date.now() - 864e5).toISOString(), atualizado_em: new Date(Date.now() - 864e5).toISOString() });
    db.leads.push({ id: "demoLead02", nome: "Roberto Silva", telefone: "11991110000", cidade: "São Paulo", checkin: add(H, 30), checkout: add(H, 34), adultos: 2, criancas: 0, itens: [{ categoria: "Suíte Dupla · Vista para o mar", quartos: 1, adultos: 2, criancas: 0 }], valor_estimado: 2720, obs: "Aniversário de casamento", etapa: 4, enviado: true, enviado_em: new Date(Date.now() - 3 * 3600e3).toISOString(), status: "novo", criado_em: new Date(Date.now() - 4 * 3600e3).toISOString(), atualizado_em: new Date(Date.now() - 3 * 3600e3).toISOString() });
    [["Arrumar Suíte 04 (saída)", 4, 3, "alta"], ["Repor amenities da Suíte 06", 6, 3, "normal"], ["Conferir cloro da piscina", null, 3, "normal"], ["Lavar redes das varandas", null, null, "baixa"]].forEach(function (t) { db.tarefas.push({ id: ++db.seq.tarefas, titulo: t[0], descricao: "", quarto_id: t[1], responsavel_id: t[2], prazo: H, prioridade: t[3], status: "aberta", origem: "manual", criado_em: new Date().toISOString() }); });
    db.auditoria = [];
    return db;
  }

  function byId(arr, id) { id = +id; for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  var DB = null;
  function load() { if (DB) return DB; try { DB = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!DB || !DB.quartos) { DB = seed(); save(); } return DB; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
  function audit(db, u, acao, tabela, id, depois) { db.auditoria.unshift({ id: ++db.seq.auditoria, em: new Date().toISOString(), por: u ? u.nome : "Site", acao: acao, tabela: tabela, registro_id: String(id || ""), depois: depois || null }); if (db.auditoria.length > 400) db.auditoria.length = 400; }

  var ATIVOS = ["pre", "confirmada", "hospedada", "finalizada"];
  function cat(db, id) { return byId(db.categorias, id); }
  function quarto(db, id) { return byId(db.quartos, id); }
  function temporadaEm(db, d) { for (var i = 0; i < db.temporadas.length; i++) { var t = db.temporadas[i]; if (d >= t.ini && d <= t.fim) return t; } return null; }
  function precoNoite(db, c, p, d) {
    var ts = db.tarifas.filter(function (t) { return t.categoria_id === c; }).sort(function (a, b) { return a.pessoas - b.pessoas; });
    if (!ts.length) return 0; var t = ts.filter(function (x) { return x.pessoas >= Math.max(p, 1); })[0] || ts[ts.length - 1];
    var s = temporadaEm(db, d); return Math.round(t.valor * (1 + (s ? s.ajuste_pct : 0) / 100) * 100) / 100;
  }
  function precoEstadia(db, c, p, i, o) { var s = 0; for (var d = i; d < o; d = add(d, 1)) s += precoNoite(db, c, p, d); return Math.round(s * 100) / 100; }
  var sobrepoe = function (a1, b1, a2, b2) { return a1 < b2 && a2 < b1; };
  function conflito(db, qid, i, o, ignorar) {
    for (var k = 0; k < db.ocupacoes.length; k++) {
      var x = db.ocupacoes[k];
      if (x.ativo && x.quarto_id === +qid && x.id !== ignorar && sobrepoe(x.checkin, x.checkout, i, o)) {
        var q = quarto(db, qid), r = x.reserva_id ? byId(db.reservas, x.reserva_id) : null, h = r ? byId(db.hospedes, r.hospede_id) : null;
        var fmt = function (s) { return s.slice(8, 10) + "/" + s.slice(5, 7); };
        return "O quarto " + q.nome + " já está ocupado entre " + fmt(x.checkin > i ? x.checkin : i) + " e " + fmt(x.checkout < o ? x.checkout : o) + (x.tipo === "bloqueio" ? " (bloqueado: " + (x.motivo || "manutenção") + ")" : " (reserva " + r.codigo + " – " + h.nome + ")");
      }
    }
    return null;
  }
  function recalc(db, rid) {
    var r = byId(db.reservas, rid), os = db.ocupacoes.filter(function (o) { return o.reserva_id === rid && o.ativo; });
    if (!os.length) return;
    r.checkin = os.map(function (o) { return o.checkin; }).sort()[0];
    r.checkout = os.map(function (o) { return o.checkout; }).sort().pop();
    r.adultos = os.reduce(function (s, o) { return s + o.adultos; }, 0); r.criancas = os.reduce(function (s, o) { return s + o.criancas; }, 0);
    r.valor_hospedagem = Math.round(os.reduce(function (s, o) { return s + o.valor_diaria * dias(o.checkin, o.checkout); }, 0) * 100) / 100;
  }
  function fin(db, r) {
    var cons = db.lancamentos.filter(function (l) { return l.reserva_id === r.id && !l.cancelado; }).reduce(function (s, l) { return s + l.total; }, 0);
    var pago = db.pagamentos.filter(function (p) { return p.reserva_id === r.id; }).reduce(function (s, p) { return s + (p.tipo === "reembolso" ? -p.valor : p.valor); }, 0);
    return { total_hospedagem: r.valor_hospedagem - (r.desconto || 0), consumo: cons, pago: pago };
  }
  function quartosDe(db, rid) { return db.ocupacoes.filter(function (o) { return o.reserva_id === rid && o.ativo; }).map(function (o) { return quarto(db, o.quarto_id); }).sort(function (a, b) { return a.ordem - b.ordem; }).map(function (q) { return q.nome; }).join(", "); }
  function resumoReserva(db, r) { var h = byId(db.hospedes, r.hospede_id); return Object.assign({}, r, fin(db, r), { nome: h.nome, telefone: h.telefone, quartos: quartosDe(db, r.id) }); }
  function codigo() { return Math.random().toString(16).slice(2, 8).toUpperCase(); }

  var A = {
    boot: function (b, u, db) {
      return { usuario: u, hoje: hoje(), quartos: db.quartos.map(function (q) { return Object.assign({}, q, { capacidade: cat(db, q.categoria_id).capacidade }); }).sort(function (a, b) { return a.ordem - b.ordem; }), categorias: db.categorias, produtos: db.produtos, usuarios: db.usuarios.filter(function (x) { return x.ativo; }), config: db.config };
    },
    hoje: function (b, u, db) {
      var d = b.data || hoje(), din = u.papel !== "equipe";
      var ativosR = db.reservas;
      var cheg = ativosR.filter(function (r) { return r.checkin === d && ["pre", "confirmada", "hospedada"].indexOf(r.status) >= 0; }).map(function (r) { return resumoReserva(db, r); });
      var sai = ativosR.filter(function (r) { return r.checkout === d && ["confirmada", "hospedada", "finalizada"].indexOf(r.status) >= 0; }).map(function (r) { return resumoReserva(db, r); });
      var hosp = []; db.ocupacoes.forEach(function (o) { if (o.ativo && o.reserva_id && o.checkin <= d && o.checkout > d) { var r = byId(db.reservas, o.reserva_id); if (["confirmada", "hospedada"].indexOf(r.status) >= 0) hosp.push({ id: r.id, codigo: r.codigo, nome: byId(db.hospedes, r.hospede_id).nome, quarto_id: o.quarto_id, quarto: quarto(db, o.quarto_id).nome, adultos: o.adultos, criancas: o.criancas }); } });
      var tar = A.tarefas({ status: "pendentes" }, u, db).itens.filter(function (t) { return t.prazo <= add(d, 1); });
      var leads = { enviados: db.leads.filter(function (l) { return l.status === "novo" && l.enviado; }).length, abandonados: db.leads.filter(function (l) { return l.status === "novo" && !l.enviado && (l.telefone || "").length >= 10; }).length };
      var rec = 0; db.reservas.forEach(function (r) { if (["confirmada", "hospedada"].indexOf(r.status) >= 0 && r.checkin <= add(d, 7)) { var f = fin(db, r); rec += Math.max(f.total_hospedagem + f.consumo - f.pago, 0); } });
      return { data: d, chegadas: cheg, saidas: din ? sai : sai.map(function (s) { return { id: s.id, codigo: s.codigo, nome: s.nome, quartos: s.quartos, status: s.status }; }), hospedados: hosp, cafe: A._cafe(db, d, 7), tarefas: tar, leads: din ? leads : {}, a_receber: din ? rec : null, total_quartos: db.quartos.filter(function (q) { return q.ativo; }).length };
    },
    _cafe: function (db, d0, n) {
      var out = []; for (var i = 0; i < n; i++) { var d = add(d0, i), noite = add(d, -1), ad = 0, cr = 0; db.ocupacoes.forEach(function (o) { if (o.ativo && o.reserva_id && o.checkin <= noite && o.checkout > noite) { var r = byId(db.reservas, o.reserva_id); if (["pre", "confirmada", "hospedada"].indexOf(r.status) >= 0) { ad += o.adultos; cr += o.criancas; } } }); out.push({ dia: d, adultos: ad, criancas: cr }); } return out;
    },
    mapa: function (b, u, db) {
      var fim1 = add(b.fim, 1);
      return { itens: db.ocupacoes.filter(function (o) { return o.ativo && sobrepoe(o.checkin, o.checkout, b.ini, fim1); }).map(function (o) {
        var r = o.reserva_id ? byId(db.reservas, o.reserva_id) : null, h = r ? byId(db.hospedes, r.hospede_id) : null;
        return Object.assign({}, o, r ? Object.assign({ reserva_id: r.id, codigo: r.codigo, status: r.status, origem: r.origem, grupo_nome: r.grupo_nome, hospede: h.nome, telefone: h.telefone, n_quartos: db.ocupacoes.filter(function (x) { return x.reserva_id === r.id && x.ativo; }).length }, fin(db, r)) : {});
      }) };
    },
    mover: function (b, u, db) {
      var o = byId(db.ocupacoes, b.id); if (!o || !o.ativo) erro("Item não encontrado no mapa.");
      if (b.checkout <= b.checkin) erro("A saída precisa ser depois da entrada.");
      var q = quarto(db, b.quarto_id), c = cat(db, q.categoria_id), nova = null;
      if (o.tipo === "reserva") { var r = byId(db.reservas, o.reserva_id); if (["cancelada", "no_show", "finalizada"].indexOf(r.status) >= 0) erro("Reserva encerrada não pode ser movida."); if (o.adultos + o.criancas > c.capacidade) erro("Esse quarto comporta até " + c.capacidade + " pessoas."); }
      var m = conflito(db, q.id, b.checkin, b.checkout, o.id); if (m) erro(m);
      if (o.tipo === "reserva" && quarto(db, o.quarto_id).categoria_id !== c.id) { nova = Math.round(precoEstadia(db, c.id, o.adultos + o.criancas, b.checkin, b.checkout) / dias(b.checkin, b.checkout) * 100) / 100; o.valor_diaria = nova; }
      o.quarto_id = q.id; o.checkin = b.checkin; o.checkout = b.checkout; if (o.reserva_id) recalc(db, o.reserva_id);
      audit(db, u, "update", "ocupacoes", o.id, o); return { ok: true, nova_diaria: nova };
    },
    bloqueio_criar: function (b, u, db) {
      var ids = b.quartos || [b.quarto_id], out = [];
      if (b.checkout <= b.checkin) erro("A data final precisa ser depois da inicial.");
      ids.forEach(function (qid) { var m = conflito(db, qid, b.checkin, b.checkout); if (m) erro(m); });
      ids.forEach(function (qid) { var o = { id: ++db.seq.ocupacoes, quarto_id: +qid, checkin: b.checkin, checkout: b.checkout, tipo: "bloqueio", reserva_id: null, adultos: 0, criancas: 0, valor_diaria: 0, motivo: b.motivo || "Manutenção", ativo: true }; db.ocupacoes.push(o); out.push(o.id); audit(db, u, "insert", "ocupacoes", o.id, o); });
      return { ids: out };
    },
    bloqueio_remover: function (b, u, db) { var o = byId(db.ocupacoes, b.id); if (o && o.tipo === "bloqueio") { o.ativo = false; audit(db, u, "update", "ocupacoes", o.id, o); } return { ok: true }; },
    reserva_get: function (b, u, db) {
      var r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada.", 404);
      var h = byId(db.hospedes, r.hospede_id);
      return { reserva: Object.assign({}, r, fin(db, r), { hospede: h }),
        quartos: db.ocupacoes.filter(function (o) { return o.reserva_id === r.id && o.ativo; }).map(function (o) { return Object.assign({}, o, { quarto: quarto(db, o.quarto_id).nome }); }),
        pagamentos: db.pagamentos.filter(function (p) { return p.reserva_id === r.id; }),
        lancamentos: db.lancamentos.filter(function (l) { return l.reserva_id === r.id; }).map(function (l) { return Object.assign({}, l, { quarto: l.quarto_id ? quarto(db, l.quarto_id).nome : "" }); }),
        historico: db.auditoria.filter(function (a) { return (a.tabela === "reservas" && a.registro_id === String(r.id)) || (a.depois && a.depois.reserva_id === r.id); }).slice(0, 40),
        anteriores: db.reservas.filter(function (x) { return x.hospede_id === r.hospede_id && x.id !== r.id; }) };
    },
    reserva_salvar: function (b, u, db) {
      db = db || load();
      var qs = b.quartos || []; if (!qs.length) erro("Escolha pelo menos um quarto.");
      var h = b.hospede || {}; if (!h.nome || h.nome.length < 2) erro("Informe o nome do hóspede.");
      var tel = String(h.telefone || "").replace(/\D/g, "");
      var hid = h.id ? +h.id : null;
      if (!hid && tel.length >= 10) db.hospedes.forEach(function (x) { if (!hid && x.telefone === tel) hid = x.id; });
      var snapshot = JSON.stringify(db.ocupacoes);
      var r;
      if (b.id) { r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada."); if (["cancelada", "no_show", "finalizada"].indexOf(r.status) >= 0) erro("Esta reserva está encerrada. Reabra antes de editar."); db.ocupacoes.forEach(function (o) { if (o.reserva_id === r.id) o.ativo = false; }); }
      try {
        var novas = qs.map(function (x) {
          var q = quarto(db, x.quarto_id); if (!q) erro("Quarto não encontrado.");
          var c = cat(db, q.categoria_id), ad = +x.adultos || 0, cr = +x.criancas || 0;
          if (!x.checkin || !x.checkout || x.checkout <= x.checkin) erro("Datas inválidas: a saída precisa ser depois da entrada.");
          if (ad + cr > c.capacidade) erro("O quarto " + q.nome + " comporta até " + c.capacidade + " pessoas.");
          var m = conflito(db, q.id, x.checkin, x.checkout); if (m) erro(m);
          var diaria = x.valor_diaria !== undefined && x.valor_diaria !== "" && x.valor_diaria !== null ? +x.valor_diaria : Math.round(precoEstadia(db, c.id, Math.max(ad + cr, 1), x.checkin, x.checkout) / dias(x.checkin, x.checkout) * 100) / 100;
          var o = { id: ++db.seq.ocupacoes, quarto_id: q.id, checkin: x.checkin, checkout: x.checkout, tipo: "reserva", reserva_id: -1, adultos: ad, criancas: cr, valor_diaria: diaria, motivo: "", ativo: true };
          db.ocupacoes.push(o); return o;
        });
      } catch (e) { db.ocupacoes = JSON.parse(snapshot); throw e; }
      if (!hid) { hid = ++db.seq.hospedes; db.hospedes.push({ id: hid, nome: h.nome, telefone: tel, email: h.email || "", documento: h.documento || "", cidade: h.cidade || "", obs: "" }); }
      else { var hh = byId(db.hospedes, hid); hh.nome = h.nome; if (tel) hh.telefone = tel; ["email", "documento", "cidade"].forEach(function (k) { if (h[k]) hh[k] = h[k]; }); }
      if (!r) { r = { id: ++db.seq.reservas, codigo: codigo(), criado_em: new Date().toISOString(), status: b.status || "pre", desconto: 0, sinal_previsto: 0, condicoes_pagamento: "", obs: "", grupo_nome: "", motivo_status: "" }; db.reservas.push(r); }
      r.hospede_id = hid; r.origem = b.origem || r.origem || "whatsapp"; if (b.status) r.status = b.status;
      ["grupo_nome", "condicoes_pagamento", "obs", "acompanhantes"].forEach(function (k) { if (b[k] !== undefined) r[k] = b[k]; });
      ["desconto", "sinal_previsto"].forEach(function (k) { if (b[k] !== undefined && b[k] !== "") r[k] = +b[k] || 0; });
      if (b.lead_id) { r.lead_id = b.lead_id; var l = db.leads.filter(function (x) { return x.id === b.lead_id; })[0]; if (l) { l.status = "convertido"; l.reserva_id = r.id; } }
      novas.forEach(function (o) { o.reserva_id = r.id; });
      recalc(db, r.id); audit(db, u, b.id ? "update" : "insert", "reservas", r.id, { reserva_id: r.id, codigo: r.codigo, status: r.status });
      return { id: r.id, codigo: r.codigo };
    },
    reserva_status: function (b, u, db) {
      var r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada.");
      if (b.status === "cancelada" || b.status === "no_show") db.ocupacoes.forEach(function (o) { if (o.reserva_id === r.id) o.ativo = false; });
      else if (r.status === "cancelada" || r.status === "no_show") {
        var os = db.ocupacoes.filter(function (o) { return o.reserva_id === r.id; }), vistos = {};
        os = os.reverse().filter(function (o) { var k = o.quarto_id + o.checkin + o.checkout; if (vistos[k]) return false; vistos[k] = 1; return true; });
        os.forEach(function (o) { var m = conflito(db, o.quarto_id, o.checkin, o.checkout, o.id); if (m) erro("Não dá para reabrir: " + m); });
        os.forEach(function (o) { o.ativo = true; });
      }
      if (b.status === "finalizada") db.ocupacoes.forEach(function (o) { if (o.reserva_id === r.id && o.ativo) db.tarefas.push({ id: ++db.seq.tarefas, titulo: "Arrumar " + quarto(db, o.quarto_id).nome + " (saída " + r.codigo + ")", descricao: "", quarto_id: o.quarto_id, responsavel_id: null, prazo: hoje(), prioridade: "alta", status: "aberta", origem: "auto_checkout", criado_em: new Date().toISOString() }); });
      r.status = b.status; r.motivo_status = b.motivo || ""; audit(db, u, "update", "reservas", r.id, { reserva_id: r.id, status: r.status, motivo: r.motivo_status });
      return { ok: true };
    },
    reservas_busca: function (b, u, db) {
      var t = (b.q || "").toLowerCase(), dig = t.replace(/\D/g, "");
      return { itens: db.reservas.filter(function (r) {
        var h = byId(db.hospedes, r.hospede_id);
        if (t && !(h.nome.toLowerCase().indexOf(t) >= 0 || (dig.length >= 4 && h.telefone.indexOf(dig) >= 0) || r.codigo === t.toUpperCase() || (r.grupo_nome || "").toLowerCase().indexOf(t) >= 0)) return false;
        if (b.status && r.status !== b.status) return false; if (b.origem && r.origem !== b.origem) return false;
        if (b.ini && r.checkout < b.ini) return false; if (b.fim && r.checkin > b.fim) return false; return true;
      }).map(function (r) { return resumoReserva(db, r); }).sort(function (a, b) { return a.checkin < b.checkin ? 1 : -1; }) };
    },
    hospede_busca: function (b, u, db) {
      var t = (b.q || "").toLowerCase(), dig = t.replace(/\D/g, ""); if (t.length < 2) return { itens: [] };
      return { itens: db.hospedes.filter(function (h) { return h.nome.toLowerCase().indexOf(t) >= 0 || (dig.length >= 4 && h.telefone.indexOf(dig) >= 0); }).slice(0, 15).map(function (h) { var rs = db.reservas.filter(function (r) { return r.hospede_id === h.id && ATIVOS.indexOf(r.status) >= 0; }); return Object.assign({}, h, { estadias: rs.length, ultima: rs.map(function (r) { return r.checkout; }).sort().pop() || null }); }) };
    },
    disponiveis: function (b, u, db) {
      return { itens: db.quartos.filter(function (q) { return q.ativo && !db.ocupacoes.some(function (o) { return o.ativo && o.quarto_id === q.id && sobrepoe(o.checkin, o.checkout, b.checkin, b.checkout) && (!b.reserva_id || o.reserva_id !== +b.reserva_id); }); }).map(function (q) { var c = cat(db, q.categoria_id); return { id: q.id, nome: q.nome, categoria: c.nome, capacidade: c.capacidade, categoria_id: c.id }; }) };
    },
    preco: function (b, u, db) { var q = quarto(db, b.quarto_id); return { total: precoEstadia(db, q.categoria_id, +b.pessoas, b.checkin, b.checkout) }; },
    pagamento_add: function (b, u, db) { if (!(+b.valor > 0)) erro("Valor inválido."); var p = { id: ++db.seq.pagamentos, reserva_id: +b.reserva_id, tipo: b.tipo, valor: +b.valor, forma: b.forma, data: b.data || hoje(), obs: b.obs || "", por: u.nome }; db.pagamentos.push(p); audit(db, u, "insert", "pagamentos", p.id, p); return { id: p.id }; },
    pagamento_del: function (b, u, db) { db.pagamentos = db.pagamentos.filter(function (p) { return p.id !== +b.id; }); audit(db, u, "delete", "pagamentos", b.id); return { ok: true }; },
    leads: function (b, u, db) {
      var f = b.filtro || "abertos";
      return { itens: db.leads.filter(function (l) { var ab = l.status === "novo" || l.status === "contatado"; return (f === "todos" && l.status !== "arquivado") || (f === "arquivados" && l.status === "arquivado") || (f === "abertos" && ab) || (f === "enviados" && ab && l.enviado) || (f === "abandonados" && ab && !l.enviado); }).sort(function (a, b) { return a.atualizado_em < b.atualizado_em ? 1 : -1; }) };
    },
    lead_status: function (b, u, db) { db.leads.forEach(function (l) { if (l.id === b.id) { l.status = b.status; if (b.obs) l.obs = b.obs; } }); return { ok: true }; },
    lead_del: function (b, u, db) { db.leads = db.leads.filter(function (l) { return l.id !== b.id; }); return { ok: true }; },
    hospedados: function (b, u, db) { return { itens: A.hoje({ data: b.data }, { papel: "dono" }, db).hospedados.map(function (h) { return { reserva_id: h.id, codigo: h.codigo, nome: h.nome, acompanhantes: (byId(db.reservas, h.id) || {}).acompanhantes || "", quarto_id: h.quarto_id, quarto: h.quarto }; }) }; },
    lancar: function (b, u, db) {
      var r = byId(db.reservas, b.reserva_id); if (!r || ["confirmada", "hospedada", "finalizada"].indexOf(r.status) < 0) erro("Só dá para lançar consumo em reserva confirmada ou hospedada.");
      (b.itens || []).forEach(function (it) { var p = it.produto_id ? byId(db.produtos, it.produto_id) : null; var vu = p && (it.valor_unit === undefined || it.valor_unit === "" || u.papel === "equipe") ? p.preco : +it.valor_unit; var l = { id: ++db.seq.lancamentos, reserva_id: r.id, quarto_id: it.quarto_id ? +it.quarto_id : null, produto_id: p ? p.id : null, tipo: p ? p.tipo : (it.tipo || "extra"), descricao: it.descricao || (p && p.nome), qtd: +it.qtd || 1, valor_unit: vu, total: Math.round((+it.qtd || 1) * vu * 100) / 100, cancelado: false, criado_em: new Date().toISOString(), por: u.nome, pessoa: it.pessoa || "" }; db.lancamentos.push(l); audit(db, u, "insert", "lancamentos", l.id, l); });
      return { ok: true };
    },
    lancamento_cancelar: function (b, u, db) { var l = byId(db.lancamentos, b.id); if (l) { l.cancelado = true; audit(db, u, "update", "lancamentos", l.id, l); } return { ok: true }; },
    consumo: function (b, u, db) { return { itens: db.lancamentos.filter(function (l) { var d = l.criado_em.slice(0, 10); return d >= b.ini && d <= b.fim; }).map(function (l) { var r = byId(db.reservas, l.reserva_id); return Object.assign({}, l, { hospede: byId(db.hospedes, r.hospede_id).nome, codigo: r.codigo, quarto: l.quarto_id ? quarto(db, l.quarto_id).nome : "" }); }).reverse() }; },
    produto_salvar: function (b, u, db) { if (!b.nome) erro("Informe o nome."); var p = b.id ? byId(db.produtos, b.id) : null; if (!p) { p = { id: ++db.seq.produtos }; db.produtos.push(p); } Object.assign(p, { tipo: b.tipo, grupo: b.grupo || "", nome: b.nome, descricao: b.descricao || "", preco: +b.preco || 0, no_cardapio: !!b.no_cardapio, ativo: b.ativo !== false, ordem: +b.ordem || 0 }); audit(db, u, b.id ? "update" : "insert", "produtos", p.id, p); return { ok: true }; },
    tarefas: function (b, u, db) {
      var st = b.status || "aberta", lst = { quadro: ["aberta", "andamento", "feita"], pendentes: ["aberta", "andamento"] }[st] || [st];
      return { itens: db.tarefas.filter(function (t) { return lst.indexOf(t.status) >= 0 && (u.papel !== "equipe" || !t.responsavel_id || t.responsavel_id === u.id); }).map(function (t) { var q = t.quarto_id ? quarto(db, t.quarto_id) : null, r = t.responsavel_id ? byId(db.usuarios, t.responsavel_id) : null; return Object.assign({}, t, { quarto: q ? q.nome : null, responsavel: r ? r.nome : null }); }).sort(function (a, b) { return st === "aberta" ? (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0) : (a.feita_em < b.feita_em ? 1 : -1); }) };
    },
    tarefa_salvar: function (b, u, db) { if (!b.titulo || b.titulo.length < 2) erro("Dê um título para a tarefa."); var t = b.id ? byId(db.tarefas, b.id) : null; if (!t) { t = { id: ++db.seq.tarefas, status: "aberta", origem: "manual", criado_em: new Date().toISOString() }; db.tarefas.push(t); } Object.assign(t, { titulo: b.titulo, descricao: b.descricao || "", quarto_id: b.quarto_id ? +b.quarto_id : null, responsavel_id: b.responsavel_id ? +b.responsavel_id : null, prazo: b.prazo || hoje(), prioridade: b.prioridade || "normal" }); return { ok: true }; },
    tarefa_status: function (b, u, db) { var t = byId(db.tarefas, b.id); if (!t) erro("Tarefa não encontrada.", 404); if (b.status === "arquivada") { if (t.status !== "feita") erro("Só dá para arquivar tarefa concluída."); t.status = "arquivada"; return { ok: true }; } t.status = b.status; t.feita_em = b.status === "feita" ? new Date().toISOString() : null; t.feita_por_nome = b.status === "feita" ? u.nome : null; return { ok: true }; },
    tarefa_del: function (b, u, db) { db.tarefas = db.tarefas.filter(function (t) { return t.id !== +b.id; }); return { ok: true }; },
    _resumo: function (db, ini, fim) {
      var f1 = add(fim, 1), dv = 0, rec = 0, por = {}, res = [];
      db.ocupacoes.forEach(function (o) { if (!o.ativo || !o.reserva_id) return; var r = byId(db.reservas, o.reserva_id); if (ATIVOS.indexOf(r.status) < 0 || !sobrepoe(o.checkin, o.checkout, ini, f1)) return; var a = o.checkin > ini ? o.checkin : ini, z = o.checkout < f1 ? o.checkout : f1, n = dias(a, z); dv += n; rec += n * o.valor_diaria; });
      db.reservas.forEach(function (r) { if (ATIVOS.indexOf(r.status) >= 0 && r.checkin <= fim && r.checkout > ini) { res.push(r); por[r.origem] = (por[r.origem] || 0) + 1; } });
      var cons = db.lancamentos.filter(function (l) { var d = l.criado_em.slice(0, 10); return !l.cancelado && d >= ini && d <= fim; }).reduce(function (s, l) { return s + l.total; }, 0);
      return { diarias_vendidas: dv, capacidade: db.quartos.filter(function (q) { return q.ativo; }).length * (dias(ini, fim) + 1), receita_hospedagem: Math.round(rec), reservas: res.length, hospedes: res.reduce(function (s, r) { return s + r.adultos + r.criancas; }, 0), permanencia_media: res.length ? Math.round(res.reduce(function (s, r) { return s + dias(r.checkin, r.checkout); }, 0) / res.length * 10) / 10 : 0, consumo: cons, cancelamentos: db.reservas.filter(function (r) { return r.status === "cancelada" && r.checkin >= ini && r.checkin <= fim; }).length, no_shows: db.reservas.filter(function (r) { return r.status === "no_show" && r.checkin >= ini && r.checkin <= fim; }).length, por_origem: por };
    },
    relatorios: function (b, u, db) {
      var diario = [], total = db.quartos.filter(function (q) { return q.ativo; }).length;
      for (var d = b.ini; d <= b.fim; d = add(d, 1)) { var oc = {}, p = 0; db.ocupacoes.forEach(function (o) { if (o.ativo && o.reserva_id && o.checkin <= d && o.checkout > d && ATIVOS.indexOf(byId(db.reservas, o.reserva_id).status) >= 0) { oc[o.quarto_id] = 1; p += o.adultos + o.criancas; } }); diario.push({ dia: d, quartos_ocupados: Object.keys(oc).length, total_quartos: total, pessoas: p, chegadas: db.reservas.filter(function (r) { return r.checkin === d && ATIVOS.indexOf(r.status) >= 0; }).length, saidas: db.reservas.filter(function (r) { return r.checkout === d && ATIVOS.indexOf(r.status) >= 0; }).length }); }
      var top = {}; db.lancamentos.forEach(function (l) { var dd = l.criado_em.slice(0, 10); if (!l.cancelado && dd >= b.ini && dd <= b.fim) { top[l.descricao] = top[l.descricao] || { descricao: l.descricao, qtd: 0, total: 0 }; top[l.descricao].qtd += l.qtd; top[l.descricao].total += l.total; } });
      return { diario: diario, resumo: A._resumo(db, b.ini, b.fim), comparativo: b.ini2 ? A._resumo(db, b.ini2, b.fim2) : null, cafe: A._cafe(db, hoje(), 14), top_consumo: Object.values(top).sort(function (a, b) { return b.total - a.total; }).slice(0, 10) };
    },
    auditoria: function (b, u, db) { return { itens: db.auditoria.slice(0, b.limite || 150) }; },
    ajustes: function (b, u, db) { return { tarifas: db.tarifas, temporadas: db.temporadas, fechamentos: db.fechamentos, videos: db.videos, usuarios: db.usuarios, categorias: db.categorias }; },
    tarifas_salvar: function (b, u, db) { (b.tarifas || []).forEach(function (t) { var x = db.tarifas.filter(function (y) { return y.categoria_id === +t.categoria_id && y.pessoas === +t.pessoas; })[0]; if (x) x.valor = +t.valor; else db.tarifas.push({ categoria_id: +t.categoria_id, pessoas: +t.pessoas, valor: +t.valor }); }); audit(db, u, "update", "tarifas", "", null); return { ok: true }; },
    temporada_salvar: function (b, u, db) { if (b.fim < b.ini) erro("A data final precisa ser depois da inicial."); if (db.temporadas.some(function (t) { return t.id !== +b.id && b.ini <= t.fim && t.ini <= b.fim; })) erro("Essa temporada se sobrepõe a outra. Ajuste as datas.", 409); var t = b.id ? byId(db.temporadas, b.id) : null; if (!t) { t = { id: ++db.seq.temporadas }; db.temporadas.push(t); } Object.assign(t, { nome: b.nome || "Temporada", ini: b.ini, fim: b.fim, ajuste_pct: +b.ajuste_pct || 0, min_noites: +b.min_noites || 1 }); return { ok: true }; },
    temporada_del: function (b, u, db) { db.temporadas = db.temporadas.filter(function (t) { return t.id !== +b.id; }); return { ok: true }; },
    fechamento_salvar: function (b, u, db) { if (b.fim < b.ini) erro("Datas inválidas."); db.fechamentos.push({ id: ++db.seq.fechamentos, ini: b.ini, fim: b.fim, motivo: b.motivo || "" }); return { ok: true }; },
    fechamento_del: function (b, u, db) { db.fechamentos = db.fechamentos.filter(function (t) { return t.id !== +b.id; }); return { ok: true }; },
    config_salvar: function (b, u, db) { ["whatsapp", "whatsapp_restaurante", "condicoes", "checkin_hora", "checkout_hora", "politica_pets"].forEach(function (k) { if (b[k] !== undefined) db.config[k] = b[k]; }); ["vendas_ate", "site_pausado", "sinal_pct"].forEach(function (k) { if (b[k] !== undefined) db.config[k] = [b[k]]; }); audit(db, u, "update", "config", "", null); return { ok: true }; },
    quarto_salvar: function (b, u, db) { if (!b.nome || b.nome.length < 2) erro("Dê um nome ao quarto."); if (db.quartos.some(function (q) { return q.nome === b.nome && q.id !== +b.id; })) erro("Já existe um quarto com esse nome."); var q = b.id ? byId(db.quartos, b.id) : null; if (!q) { q = { id: ++db.seq.quartos }; db.quartos.push(q); } Object.assign(q, { nome: b.nome, categoria_id: +b.categoria_id, ordem: +b.ordem || 0, ativo: b.ativo !== false, obs: b.obs || "" }); return { ok: true }; },
    categoria_salvar: function (b, u, db) { var c = byId(db.categorias, b.id); Object.assign(c, { nome: b.nome, resumo: b.resumo, descricao: b.descricao, capacidade: +b.capacidade, no_site: b.no_site !== false, fotos: b.fotos || c.fotos, caracteristicas: b.caracteristicas || c.caracteristicas }); return { ok: true }; },
    video_salvar: function (b, u, db) { if (!/^https:\/\//.test(b.url || "")) erro("Link do vídeo inválido."); var v = b.id ? byId(db.videos, b.id) : null; if (!v) { v = { id: ++db.seq.videos }; db.videos.push(v); } Object.assign(v, { titulo: b.titulo || "", url: b.url, capa: b.capa || "", ordem: +b.ordem || 0, ativo: b.ativo !== false }); return { ok: true }; },
    video_del: function (b, u, db) { db.videos = db.videos.filter(function (v) { return v.id !== +b.id; }); return { ok: true }; },
    usuario_salvar: function (b, u, db) { if (!/^[a-z0-9._-]{3,40}$/.test(b.login || "")) erro("Login: use 3 a 40 letras minúsculas, números, ponto ou traço."); var x = b.id ? byId(db.usuarios, b.id) : null; if (!x) { if (!b.senha) erro("Defina uma senha inicial."); x = { id: ++db.seq.usuarios }; db.usuarios.push(x); } Object.assign(x, { nome: b.nome, login: b.login, papel: b.papel, ativo: b.ativo !== false }); return { ok: true }; }
  };

  var PERM = { dono: null, recepcao: ["relatorios", "auditoria", "ajustes", "tarifas_salvar", "temporada_salvar", "temporada_del", "fechamento_salvar", "fechamento_del", "config_salvar", "quarto_salvar", "categoria_salvar", "video_salvar", "video_del", "usuario_salvar", "produto_salvar", "pagamento_del", "lead_del"], equipe: "boot hoje hospedados lancar tarefas tarefa_status" };
  var USER = null;
  try { USER = JSON.parse(sessionStorage.getItem("mare_demo_user")); } catch (e) { }

  window.MareDemo = {
    ativo: true,
    reset: function () { localStorage.removeItem(KEY); DB = null; load(); },
    auth: function (b) {
      var db = load();
      if (!b) { if (!USER) erro("sessao", 401); return { usuario: USER }; }
      if (b.acao === "logout") { USER = null; sessionStorage.removeItem("mare_demo_user"); return { ok: true }; }
      if (b.acao === "login") { var x = db.usuarios.filter(function (y) { return y.login === String(b.login || "").toLowerCase() && y.ativo; })[0]; if (!x) erro("No modo demonstração, entre como: dono, brenda (recepção) ou jaci (equipe). Qualquer senha.", 401); USER = { id: x.id, nome: x.nome, login: x.login, papel: x.papel }; sessionStorage.setItem("mare_demo_user", JSON.stringify(USER)); return { usuario: USER }; }
      if (b.acao === "senha") return { ok: true };
      erro("ação");
    },
    g: function (b) {
      var db = load(); if (!USER) erro("sessao", 401);
      var f = A[b.a]; if (!f || b.a.charAt(0) === "_") erro("Ação desconhecida.");
      var p = PERM[USER.papel]; if (p && (typeof p === "string" ? p.split(" ").indexOf(b.a) < 0 : p.indexOf(b.a) >= 0)) erro("Seu usuário não tem permissão para isso.", 403);
      var out = f(clone(b), USER, db); save(); return clone(out);
    },
    site: function () {
      var db = load();
      return { categorias: db.categorias.filter(function (c) { return c.no_site; }).map(function (c) { var t = {}; db.tarifas.forEach(function (x) { if (x.categoria_id === c.id) t[x.pessoas] = x.valor; }); return Object.assign({}, c, { tarifas: t, quartos: db.quartos.filter(function (q) { return q.ativo && q.categoria_id === c.id; }).length }); }),
        cardapio: db.produtos.filter(function (p) { return p.ativo && p.no_cardapio && (p.tipo === "bar" || p.tipo === "restaurante"); }), videos: db.videos.filter(function (v) { return v.ativo; }), temporadas: db.temporadas, config: db.config };
    },
    disp: function (i, o) {
      var db = load(), n = dias(i, o); if (!(n > 0) || n > 60) return { erro: "datas" };
      var ate = db.config.vendas_ate && db.config.vendas_ate[0];
      var fechado = db.fechamentos.some(function (f) { return i <= f.fim && f.ini < o; }) || (ate && o > add(ate, 1)) || !!(db.config.site_pausado && db.config.site_pausado[0]);
      var minN = 1; db.temporadas.forEach(function (t) { if (i <= t.fim && t.ini < o) minN = Math.max(minN, t.min_noites); });
      return { fechado: fechado, min_noites: minN, noites: n, categorias: db.categorias.filter(function (c) { return c.no_site; }).map(function (c) {
        var livres = db.quartos.filter(function (q) { return q.ativo && q.categoria_id === c.id && !db.ocupacoes.some(function (x) { return x.ativo && x.quarto_id === q.id && sobrepoe(x.checkin, x.checkout, i, o); }); }).length, pr = {};
        db.tarifas.forEach(function (t) { if (t.categoria_id === c.id) pr[t.pessoas] = precoEstadia(db, c.id, t.pessoas, i, o); });
        return { id: c.id, slug: c.slug, livres: livres, precos: pr };
      }) };
    },
    lead: function (b) {
      var db = load(); if (!b.id || ((b.nome || "").length < 2 && String(b.telefone || "").replace(/\D/g, "").length < 8)) return;
      var l = db.leads.filter(function (x) { return x.id === b.id; })[0];
      if (l && ["convertido", "perdido"].indexOf(l.status) >= 0) return;
      if (!l) { l = { id: b.id, status: "novo", criado_em: new Date().toISOString(), enviado: false, etapa: 1 }; db.leads.push(l); }
      Object.assign(l, { nome: b.nome || l.nome || "", telefone: String(b.telefone || "").replace(/\D/g, "") || l.telefone || "", cidade: b.cidade || l.cidade || "", checkin: b.checkin || l.checkin, checkout: b.checkout || l.checkout, adultos: +b.adultos || 0, criancas: +b.criancas || 0, itens: b.itens || [], valor_estimado: +b.valor || 0, obs: b.obs || "", etapa: Math.max(l.etapa || 1, +b.etapa || 1), enviado: l.enviado || !!b.enviado, enviado_em: l.enviado_em || (b.enviado ? new Date().toISOString() : null), atualizado_em: new Date().toISOString() });
      save();
    }
  };
})();
