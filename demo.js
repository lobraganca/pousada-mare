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
  // Central de dúvidas: mesmas perguntas iniciais do banco (db/dados-iniciais.sql)
  var FAQ_INI = [{"tema":"Reserva e pagamento","pergunta":"Como faço uma reserva?","resposta":"Toque em Montar reserva, escolha as datas, quantas pessoas vêm e as suítes. O site mostra o valor e você envia o pedido pelo WhatsApp. A recepção confirma a disponibilidade e manda os dados para pagamento.","palavras":"reservar vaga disponibilidade agendar marcar datas","traducoes":{"es":{"t":"Reserva y pago","p":"¿Cómo hago una reserva?","r":"Toca en Reservar, elige las fechas, cuántas personas vienen y las suites. El sitio muestra el precio y envías el pedido por WhatsApp. La recepción confirma la disponibilidad y te envía los datos para el pago."},"en":{"t":"Booking and payment","p":"How do I book?","r":"Tap Book your stay, choose your dates, how many people are coming and the suites. The website shows the price and you send the request on WhatsApp. The front desk confirms availability and sends you the payment details."}},"ordem":10,"id":1,"ativo":true},{"tema":"Reserva e pagamento","pergunta":"Como funciona o pagamento e o cancelamento?","resposta":"{condicoes}","palavras":"pagar pagamento pix sinal entrada deposito saldo cancelar cancelamento desistir remarcar reembolso devolucao","traducoes":{"es":{"t":"Reserva y pago","p":"¿Cómo funcionan el pago y la cancelación?","r":"Para confirmar la reserva pedimos una seña del 50% por PIX. El saldo se paga en el check-in. Si cancelas con hasta 30 días de anticipación, devolvemos la seña; después de eso, la seña queda como crédito para cambiar la fecha dentro de 6 meses."},"en":{"t":"Booking and payment","p":"How do payment and cancellation work?","r":"To confirm the booking we ask for a 50% deposit via PIX. The balance is paid at check-in. If you cancel up to 30 days before, we refund the deposit; after that, the deposit becomes credit to rebook within 6 months."}},"ordem":20,"id":2,"ativo":true},{"tema":"Reserva e pagamento","pergunta":"Quanto custa a diária?","resposta":"O valor depende da suíte, do número de pessoas e da época. Toque em Montar reserva e escolha as datas: o site mostra na hora o valor total da estadia.","palavras":"preco valor diaria quanto custa tarifa orcamento","traducoes":{"es":{"t":"Reserva y pago","p":"¿Cuánto cuesta la noche?","r":"El precio depende de la suite, del número de personas y de la época. Toca en Reservar y elige las fechas: el sitio muestra al instante el valor total de la estadía."},"en":{"t":"Booking and payment","p":"How much is a night?","r":"The price depends on the suite, the number of guests and the season. Tap Book your stay and choose your dates: the website shows the total for your stay right away."}},"ordem":30,"id":3,"ativo":true},{"tema":"Chegada e horários","pergunta":"Como chego do aeroporto?","resposta":"Os aeroportos mais próximos são o de Teixeira de Freitas (110 km, cerca de 2 h) e o de Porto Seguro (230 km, cerca de 4 h). O centro de Prado fica a 32 km e a vila de Cumuruxatiba, a 2,5 km. O trecho final, de cerca de 30 km, é de estrada de terra.","palavras":"aeroporto voo aviao porto seguro teixeira de freitas distancia estrada terra rota caminho chegar","traducoes":{"es":{"t":"Llegada y horarios","p":"¿Cómo llego desde el aeropuerto?","r":"Los aeropuertos más cercanos son el de Teixeira de Freitas (110 km, unas 2 h) y el de Porto Seguro (230 km, unas 4 h). El centro de Prado está a 32 km y el pueblo de Cumuruxatiba, a 2,5 km. El tramo final, de unos 30 km, es de camino de tierra."},"en":{"t":"Arrival and times","p":"How do I get here from the airport?","r":"The nearest airports are Teixeira de Freitas (110 km, about 2 h) and Porto Seguro (230 km, about 4 h). Prado town centre is 32 km away and Cumuruxatiba village is 2.5 km away. The last stretch, about 30 km, is a dirt road."}},"ordem":40,"id":4,"ativo":true},{"tema":"Chegada e horários","pergunta":"Qual o horário de check-in e check-out?","resposta":"Check-in a partir das {checkin} e check-out até as {checkout}. A portaria funciona das 7h às 19h; se for chegar mais tarde, avise pelo WhatsApp.","palavras":"horario hora entrada saida checkin checkout portaria chegar tarde noite","traducoes":{"es":{"t":"Llegada y horarios","p":"¿A qué hora son el check-in y el check-out?","r":"Check-in desde las 14h y check-out hasta las 12h. La portería funciona de 7h a 19h; si vas a llegar más tarde, avísanos por WhatsApp."},"en":{"t":"Arrival and times","p":"What are the check-in and check-out times?","r":"Check-in from 2 pm and check-out by 12 noon. The front gate is staffed from 7 am to 7 pm; if you're arriving later, let us know on WhatsApp."}},"ordem":50,"id":5,"ativo":true},{"tema":"Chegada e horários","pergunta":"Onde fica a pousada?","resposta":"Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (BA). A pousada é pé na areia, na praia do Rio do Peixe Grande, onde o rio encontra o mar.","palavras":"endereco localizacao mapa rua google maps praia","traducoes":{"es":{"t":"Llegada y horarios","p":"¿Dónde queda la posada?","r":"Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (Bahía). La posada está frente a la playa de Rio do Peixe Grande, donde el río se encuentra con el mar."},"en":{"t":"Arrival and times","p":"Where is the inn?","r":"Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (Bahia). The inn sits right on Rio do Peixe Grande beach, where the river meets the sea."}},"ordem":60,"id":6,"ativo":true},{"tema":"Suítes","pergunta":"Quais suítes vocês têm?","resposta":"Suítes duplas com vista para o mar e varanda com rede, suítes quádruplas conjugadas para famílias (até 5 pessoas), uma suíte acessível no térreo e suítes econômicas sem varanda (até 4 pessoas). Todas têm ar-condicionado e frigobar.","palavras":"quarto quartos suite acomodacao vista mar varanda rede ar condicionado frigobar casal","traducoes":{"es":{"t":"Suites","p":"¿Qué suites tienen?","r":"Suites dobles con vista al mar y galería con hamaca, suites cuádruples conectadas para familias (hasta 5 personas), una suite accesible en planta baja y suites económicas sin galería (hasta 4 personas). Todas tienen aire acondicionado y frigobar."},"en":{"t":"Suites","p":"What suites do you have?","r":"Double suites with sea view and a veranda with a hammock, connecting quadruple suites for families (up to 5 people), an accessible ground-floor suite and economy suites without a veranda (up to 4 people). All have air conditioning and a minibar."}},"ordem":70,"id":7,"ativo":true},{"tema":"Suítes","pergunta":"A pousada é acessível para cadeirantes?","resposta":"Sim. A Suíte de Varanda Reservada fica no térreo e tem banheiro adaptado, com barras de apoio, pia rebaixada e box amplo. Se precisar de algo a mais, conte no pedido de reserva.","palavras":"acessivel acessibilidade cadeirante cadeira rodas pcd deficiente mobilidade rampa idoso","traducoes":{"es":{"t":"Suites","p":"¿La posada es accesible en silla de ruedas?","r":"Sí. La Suite de Galería Reservada está en planta baja y tiene baño adaptado, con barras de apoyo, lavabo bajo y ducha amplia. Si necesitas algo más, cuéntalo en el pedido de reserva."},"en":{"t":"Suites","p":"Is the inn wheelchair accessible?","r":"Yes. The Private Veranda Suite is on the ground floor with an adapted bathroom: grab bars, a lowered sink and a wide shower. If you need anything else, mention it in your booking request."}},"ordem":80,"id":8,"ativo":true},{"tema":"Família e pets","pergunta":"Posso levar crianças?","resposta":"Pode, sim. Na reserva, contam como crianças as que têm até 12 anos. Para famílias, a Suíte Quádrupla Conjugada tem quartos reversíveis para até 5 pessoas. Precisa de berço? Escreva no campo de pedidos especiais da reserva.","palavras":"crianca criancas filho filhos bebe berco familia idade","traducoes":{"es":{"t":"Familia y mascotas","p":"¿Puedo ir con niños?","r":"¡Claro! En la reserva, cuentan como niños los de hasta 12 años. Para familias, la Suite Cuádruple Conectada tiene habitaciones reversibles para hasta 5 personas. ¿Necesitas cuna? Escríbelo en el campo de pedidos especiales de la reserva."},"en":{"t":"Family and pets","p":"Can I bring children?","r":"Of course. In the booking, children are those up to 12 years old. For families, the Connecting Quadruple Suite has flexible rooms for up to 5 people. Need a cot? Write it in the special requests field of your booking."}},"ordem":90,"id":9,"ativo":true},{"tema":"Família e pets","pergunta":"Aceita pet?","resposta":"{pets}","palavras":"pet pets cachorro cao gato animal animais bicho","traducoes":{"es":{"t":"Familia y mascotas","p":"¿Aceptan mascotas?","r":"Las mascotas son bienvenidas con aviso previo. Pedimos que estén siempre acompañadas, fuera de las camas y de las áreas de la piscina y del restaurante. Consulta con la recepción."},"en":{"t":"Family and pets","p":"Are pets allowed?","r":"Pets are welcome with advance notice. We ask that they're always accompanied and kept off the beds and away from the pool and restaurant areas. Please check with the front desk."}},"ordem":100,"id":10,"ativo":true},{"tema":"Estrutura","pergunta":"O que tem na pousada?","resposta":"Piscina ampla com sauna, bar na praia, restaurante e café da manhã de frente para o mar, tudo entre jardins e amendoeiras.","palavras":"piscina sauna bar estrutura lazer jardim cafe da manha","traducoes":{"es":{"t":"Instalaciones","p":"¿Qué hay en la posada?","r":"Piscina amplia con sauna, bar en la playa, restaurante y desayuno frente al mar, entre jardines y almendros."},"en":{"t":"Facilities","p":"What does the inn offer?","r":"A large pool with a sauna, a beach bar, a restaurant and breakfast facing the sea, among gardens and almond trees."}},"ordem":110,"id":11,"ativo":true},{"tema":"Estrutura","pergunta":"Tem internet e sinal de celular?","resposta":"A internet é limitada na região. Na praia, só a operadora Vivo tem sinal. A rede elétrica é 220 V.","palavras":"internet wifi wi fi sinal celular operadora vivo tim claro tomada voltagem 220 110","traducoes":{"es":{"t":"Instalaciones","p":"¿Hay internet y señal de celular?","r":"La internet es limitada en la zona. En la playa, solo la operadora Vivo tiene señal. La red eléctrica es de 220 V."},"en":{"t":"Facilities","p":"Is there internet and phone signal?","r":"Internet is limited in the area. On the beach, only the Vivo network has signal. Power outlets are 220 V."}},"ordem":120,"id":12,"ativo":true},{"tema":"Restaurante","pergunta":"O restaurante abre para quem não está hospedado?","resposta":"Abre, sim. Almoço das 12h às 15h, petiscos até as 17h e jantar com pedido das 15h às 19h. Para reservar mesa, chame o restaurante pelo WhatsApp.","palavras":"restaurante almoco jantar comida cardapio petisco mesa horario","traducoes":{"es":{"t":"Restaurante","p":"¿El restaurante está abierto para quien no se hospeda?","r":"Sí. Almuerzo de 12h a 15h, picadas hasta las 17h y cena con pedido de 15h a 19h. Para reservar mesa, escríbele al restaurante por WhatsApp."},"en":{"t":"Restaurant","p":"Is the restaurant open to non-guests?","r":"Yes. Lunch from 12 to 3 pm, snacks until 5 pm and dinner ordered between 3 and 7 pm. To book a table, message the restaurant on WhatsApp."}},"ordem":130,"id":13,"ativo":true}];
  function seedFaq(db) {
    var H = hoje(), ag = Date.now(), n = 0;
    db.faq = clone(FAQ_INI); db.seq.faq = db.faq.length; db.faq_termos = {};
    db.faq_buscas = [];
    [["Tem estacionamento?", 0, 0, 5, 1], ["estacionamento", 0, 0, 2, 1], ["transfer do aeroporto", 0, 0, 3, 1], ["Aceita cartão?", 1, 2, 3, 2], ["passeio de barco", 0, 0, 2, 0], ["baleias", 0, 0, 2, 1], ["aceita cachorro grande", 1, 10, 2, 0], ["como chego de porto seguro", 1, 4, 4, 0], ["horario do check in", 1, 5, 3, 0], ["wifi", 1, 12, 2, 0]]
      .forEach(function (x) { for (var i = 0; i < x[3]; i++) db.faq_buscas.push({ id: "demo" + (++n) + "xxxx", termo: x[0], termo_norm: chave(x[0]), idioma: "pt", achou: !!x[1], faq_id: x[2] || null, perguntou: i < x[4], atualizado_em: new Date(ag - (n * 7 + i) * 3600e3).toISOString() }); });
  }
  var VAZIAS = " a o os as um uma uns umas de da do das dos e em no na nos nas para pra pro por com sem que se tem ter tenho voces voce vcs vc eu meu minha qual quais como onde quando posso pode podem ha ao aos la el los las es un una y con hay puedo the an is are do does can i you to of in for it there ";
  function chave(s) { var n = String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); var k = n.split(" ").filter(function (w) { return w && VAZIAS.indexOf(" " + w + " ") < 0; }).join(" "); return (k || n).slice(0, 120); }
  function load() { if (DB) return DB; try { DB = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!DB || !DB.quartos) { DB = seed(); save(); } if (!DB.faq) { seedFaq(DB); save(); } return DB; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
  function audit(db, u, acao, tabela, id, depois) { db.auditoria.unshift({ id: ++db.seq.auditoria, em: new Date().toISOString(), por: u ? u.nome : "Site", acao: acao, tabela: tabela, registro_id: String(id || ""), depois: depois || null }); if (db.auditoria.length > 400) db.auditoria.length = 400; }

  var ATIVOS = ["pre", "confirmada", "hospedada", "finalizada"];
  function cat(db, id) { return byId(db.categorias, id); }
  function quarto(db, id) { return byId(db.quartos, id); }
  function temporadaEm(db, d) { for (var i = 0; i < db.temporadas.length; i++) { var t = db.temporadas[i]; if (d >= t.ini && d <= t.fim) return t; } return null; }
  function precoNoite(db, c, p, d) {
    var ts = db.tarifas.filter(function (t) { return t.categoria_id === c; }).sort(function (a, b) { return a.pessoas - b.pessoas; });
    if (!ts.length) return 0; var t = ts.filter(function (x) { return x.pessoas >= Math.max(p, 1); })[0] || ts[ts.length - 1];
    var man = (db.precos_dia || {})[c + "|" + d];
    if (man) { var ref = refTarifa(db, c); if (ref && ref.valor > 0) return Math.round(man * t.valor / ref.valor * 100) / 100; }
    var s = temporadaEm(db, d); return Math.round(t.valor * (1 + (s ? s.ajuste_pct : 0) / 100) * 100) / 100;
  }
  // tarifa de referência do Calendário de preços: a de 2 pessoas (ou a mais próxima)
  function refTarifa(db, c) { var ts = db.tarifas.filter(function (t) { return t.categoria_id === c; }).sort(function (a, b) { return a.pessoas - b.pessoas; }); return ts.filter(function (t) { return t.pessoas >= 2; })[0] || ts[ts.length - 1]; }
  function demoAcomp(l) { var cpfOk = function (v) { var d = String(v || "").replace(/\D/g, ""); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false; for (var n = 9; n <= 10; n++) { var s = 0; for (var i = 0; i < n; i++) s += +d[i] * (n + 1 - i); if ((s * 10 % 11) % 10 !== +d[n]) return false; } return true; };
    return l.slice(0, 12).map(function (p, i) { var nome = String(p.nome || "").trim(); if (!nome) return null; if (p.doc && (p.doc_tipo || "cpf") === "cpf" && !cpfOk(p.doc)) erro("Hóspede " + (i + 1) + " (" + nome + "): o CPF não confere."); var vin = VINC[p.vinculo] ? p.vinculo : ""; var o = { nome: nome, doc_tipo: p.doc_tipo || "cpf", doc: String(p.doc || "").trim(), nascimento: p.nascimento || "", vinculo: vin, parentesco: vin ? VINC[vin] : String(p.parentesco || "").trim() }; if (vin === "parente" || vin === "sem") { o.autorizacao = p.autorizacao === true || p.autorizacao === "1"; o.autorizacao_por = String(p.autorizacao_por || "").trim(); } return o; }).filter(Boolean); }
  var VINC = { filho_titular: "Filho(a) do titular", filho_hospede: "Filho(a) de outro hóspede", tutela: "Sob guarda/tutela do titular", parente: "Outro parente (avô, tio…)", sem: "Sem parentesco" };
  function idadeD(n, ref) { var a = new Date(n + "T12:00:00Z"), b = new Date(String(ref).slice(0, 10) + "T12:00:00Z"), i = b.getUTCFullYear() - a.getUTCFullYear(); if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) i--; return i; }
  function pendencias(r) {
    var out = [], t = (r.ficha && r.ficha.titular) || null, ref = r.checkin || hoje();
    if (!t || !t.doc || !t.nascimento || !t.nacionalidade) out.push("Ficha do titular: documento, data de nascimento e nacionalidade.");
    var ac = (r.acompanhantes_dados || []).filter(function (p) { return p && p.nome; }), total = (r.adultos || 0) + (r.criancas || 0);
    if (1 + ac.length < total) out.push("Cadastrar " + (total - 1 - ac.length) + " hóspede(s): a reserva é para " + total + " pessoas e há " + (1 + ac.length) + " na ficha.");
    ac.forEach(function (p) { var f = []; if (!p.doc) f.push("documento"); if (!p.nascimento) f.push("data de nascimento"); if (f.length) { out.push(p.nome + ": falta " + f.join(" e ") + "."); return; }
      var id = idadeD(p.nascimento, ref); if (id < 18) { if (!p.vinculo && !p.parentesco) out.push(p.nome + " (" + id + " anos): informe o vínculo com quem está na reserva."); else if ((p.vinculo === "parente" || p.vinculo === "sem") && !p.autorizacao) out.push(p.nome + " (" + id + " anos): confira a autorização escrita dos pais, com firma reconhecida (ECA, art. 82)."); } });
    return out;
  }
  function exigeFicha(r) { var p = pendencias(r); if (p.length) erro("Antes do check-in, complete a ficha: " + p.join(" ")); }
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
      return { usuario: Object.assign({}, u, { areas: areasDe(u) }), hoje: hoje(), quartos: db.quartos.map(function (q) { return Object.assign({}, q, { capacidade: cat(db, q.categoria_id).capacidade }); }).sort(function (a, b) { return a.ordem - b.ordem; }), categorias: db.categorias, produtos: db.produtos, usuarios: db.usuarios.filter(function (x) { return x.ativo; }), config: db.config };
    },
    hoje: function (b, u, db) {
      var d = b.data || hoje(), din = areasDe(u).indexOf("pagamentos") >= 0;
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
      if (!r.checkin_token) { r.checkin_token = "demo" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); save(); }
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
      if (b.status === "hospedada") { var at = b.id ? byId(db.reservas, b.id) : null; if (!at) erro("Para fazer check-in, salve a reserva como confirmada, preencha a ficha dos hóspedes e depois toque em Check-in."); if (at.status !== "hospedada") exigeFicha(at); }
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
      if (Array.isArray(b.acompanhantes_dados)) { r.acompanhantes_dados = demoAcomp(b.acompanhantes_dados); r.acompanhantes = r.acompanhantes_dados.map(function (x) { return x.nome; }).join("\n"); }
      ["desconto", "sinal_previsto"].forEach(function (k) { if (b[k] !== undefined && b[k] !== "") r[k] = +b[k] || 0; });
      if (b.lead_id) { r.lead_id = b.lead_id; var l = db.leads.filter(function (x) { return x.id === b.lead_id; })[0]; if (l) { l.status = "convertido"; l.reserva_id = r.id; } }
      novas.forEach(function (o) { o.reserva_id = r.id; });
      recalc(db, r.id); audit(db, u, b.id ? "update" : "insert", "reservas", r.id, { reserva_id: r.id, codigo: r.codigo, status: r.status });
      return { id: r.id, codigo: r.codigo };
    },
    reserva_status: function (b, u, db) {
      var r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada.");
      if (b.status === "hospedada" && r.status !== "hospedada") exigeFicha(r);
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
    acompanhantes: function (b, u, db) { var r = byId(db.reservas, b.id); if (Array.isArray(b.acompanhantes_dados)) { var d = demoAcomp(b.acompanhantes_dados); if (r) { r.acompanhantes_dados = d; r.acompanhantes = d.map(function (x) { return x.nome; }).join("\n"); } return { ok: true, acompanhantes: r ? r.acompanhantes : "", acompanhantes_dados: d }; } var l = String(b.acompanhantes || "").split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12).join("\n"); if (r) r.acompanhantes = l; return { ok: true, acompanhantes: l }; },
    lead_status: function (b, u, db) { db.leads.forEach(function (l) { if (l.id === b.id) { l.status = b.status; if (b.obs) l.obs = b.obs; } }); return { ok: true }; },
    lead_del: function (b, u, db) { db.leads = db.leads.filter(function (l) { return l.id !== b.id; }); return { ok: true }; },
    hospedados: function (b, u, db) { return { itens: A.hoje({ data: b.data }, { papel: "dono" }, db).hospedados.map(function (h) { return { reserva_id: h.id, codigo: h.codigo, nome: h.nome, acompanhantes: (byId(db.reservas, h.id) || {}).acompanhantes || "", quarto_id: h.quarto_id, quarto: h.quarto }; }) }; },
    lancar: function (b, u, db) {
      var r = byId(db.reservas, b.reserva_id); if (!r || ["confirmada", "hospedada", "finalizada"].indexOf(r.status) < 0) erro("Só dá para lançar consumo em reserva confirmada ou hospedada.");
      (b.itens || []).forEach(function (it) { var p = it.produto_id ? byId(db.produtos, it.produto_id) : null; var vu = p && (it.valor_unit === undefined || it.valor_unit === "" || areasDe(u).indexOf("pagamentos") < 0) ? p.preco : +it.valor_unit; var l = { id: ++db.seq.lancamentos, reserva_id: r.id, quarto_id: it.quarto_id ? +it.quarto_id : null, produto_id: p ? p.id : null, tipo: p ? p.tipo : (it.tipo || "extra"), descricao: it.descricao || (p && p.nome), qtd: +it.qtd || 1, valor_unit: vu, total: Math.round((+it.qtd || 1) * vu * 100) / 100, cancelado: false, criado_em: new Date().toISOString(), por: u.nome, pessoa: it.pessoa || "" }; db.lancamentos.push(l); audit(db, u, "insert", "lancamentos", l.id, l); });
      return { ok: true };
    },
    lancamento_cancelar: function (b, u, db) { var l = byId(db.lancamentos, b.id); if (l) { l.cancelado = true; audit(db, u, "update", "lancamentos", l.id, l); } return { ok: true }; },
    consumo: function (b, u, db) { return { itens: db.lancamentos.filter(function (l) { var d = l.criado_em.slice(0, 10); return d >= b.ini && d <= b.fim; }).map(function (l) { var r = byId(db.reservas, l.reserva_id); return Object.assign({}, l, { hospede: byId(db.hospedes, r.hospede_id).nome, codigo: r.codigo, quarto: l.quarto_id ? quarto(db, l.quarto_id).nome : "" }); }).reverse() }; },
    produto_salvar: function (b, u, db) { if (!b.nome) erro("Informe o nome."); var p = b.id ? byId(db.produtos, b.id) : null; if (!p) { p = { id: ++db.seq.produtos }; db.produtos.push(p); } Object.assign(p, { tipo: b.tipo, grupo: b.grupo || "", nome: b.nome, descricao: b.descricao || "", preco: +b.preco || 0, no_cardapio: !!b.no_cardapio, ativo: b.ativo !== false, ordem: +b.ordem || 0 }); audit(db, u, b.id ? "update" : "insert", "produtos", p.id, p); return { ok: true }; },
    tarefas: function (b, u, db) {
      var st = b.status || "aberta", lst = { quadro: ["aberta", "andamento", "feita"], pendentes: ["aberta", "andamento"] }[st] || [st];
      return { itens: db.tarefas.filter(function (t) { return lst.indexOf(t.status) >= 0 && (areasDe(u).indexOf("tarefas_gerir") >= 0 || !t.responsavel_id || t.responsavel_id === u.id); }).map(function (t) { var q = t.quarto_id ? quarto(db, t.quarto_id) : null, r = t.responsavel_id ? byId(db.usuarios, t.responsavel_id) : null; return Object.assign({}, t, { quarto: q ? q.nome : null, responsavel: r ? r.nome : null }); }).sort(function (a, b) { return st === "aberta" ? (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0) : (a.feita_em < b.feita_em ? 1 : -1); }) };
    },
    tarefa_salvar: function (b, u, db) { if (!b.titulo || b.titulo.length < 2) erro("Dê um título para a tarefa."); var t = b.id ? byId(db.tarefas, b.id) : null; if (!t) { t = { id: ++db.seq.tarefas, status: "aberta", origem: "manual", criado_por: u.id, criado_em: new Date().toISOString() }; db.tarefas.push(t); } Object.assign(t, { titulo: b.titulo, descricao: b.descricao || "", quarto_id: b.quarto_id ? +b.quarto_id : null, responsavel_id: b.responsavel_id ? +b.responsavel_id : null, prazo: b.prazo || hoje(), prioridade: b.prioridade || "normal" }); return { ok: true }; },
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
    ficha_balcao: function (b, u, db) {
      var r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada."); var x = b.titular || {};
      var nome = String(x.nome || "").trim().replace(/\s+/g, " "); if (nome.length < 3 || nome.indexOf(" ") < 0) erro("Titular: escreva o nome completo.");
      var dt = x.doc_tipo || "cpf", doc = String(x.doc || "").trim();
      if (dt === "cpf") { var d = doc.replace(/\D/g, ""); var ok = d.length === 11 && !/^(\d)\1{10}$/.test(d); if (ok) for (var n = 9; n <= 10; n++) { var sm = 0; for (var i = 0; i < n; i++) sm += +d[i] * (n + 1 - i); if ((sm * 10 % 11) % 10 !== +d[n]) ok = false; } if (!ok) erro("Titular: o CPF não confere. Confira os números."); doc = d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); }
      else if (doc.replace(/\W/g, "").length < 4) erro("Titular: informe o número do documento.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(x.nascimento || "") || x.nascimento > hoje()) erro("Titular: informe a data de nascimento.");
      if (idadeD(x.nascimento, r.checkin || hoje()) < 18) erro("O titular da reserva precisa ser maior de idade.");
      var t = { nome: nome, doc_tipo: dt, doc: doc, nascimento: x.nascimento, nacionalidade: String(x.nacionalidade || "").trim() || (dt === "cpf" ? "Brasileira" : ""), email: String(x.email || "").trim(), cidade: String(x.cidade || "").trim(), uf: String(x.uf || "").trim(), pais: String(x.pais || "").trim() || "Brasil", sexo: String(x.sexo || ""), profissao: String(x.profissao || "").trim() };
      if (!t.nacionalidade) erro("Titular: informe a nacionalidade.");
      var f = Object.assign({}, r.ficha || {}, { titular: Object.assign({}, (r.ficha && r.ficha.titular) || {}, t), placa: String(b.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), carro: b.carro || "", motivo: b.motivo || "", transporte: b.transporte || "", procedencia: b.procedencia || "", destino: b.destino || "", origem: (r.ficha && r.ficha.origem) || "balcao" });
      if (!f.acompanhantes) f.acompanhantes = [];
      r.ficha = f; r.ficha_em = r.ficha_em || new Date().toISOString(); r.ficha_conferida_em = new Date().toISOString();
      var hh = byId(db.hospedes, r.hospede_id); if (hh) { hh.nome = nome; hh.documento = (dt === "cpf" ? "CPF " : dt.toUpperCase() + " ") + doc; if (t.email) hh.email = t.email; if (t.cidade) hh.cidade = [t.cidade, t.uf].filter(Boolean).join(" / "); }
      audit(db, u, "update", "reservas", r.id, null); return { ok: true };
    },
    fnrh_marcar: function (b, u, db) { var r = byId(db.reservas, b.id); if (!r) erro("Reserva não encontrada."); if (!r.ficha) erro("Preencha a ficha do titular antes de marcar o registro na FNRH."); if (b.ok === false) delete r.ficha.fnrh; else r.ficha.fnrh = { em: new Date().toISOString(), por: u.nome, protocolo: String(b.protocolo || "").trim() }; audit(db, u, "update", "reservas", r.id, null); return { ok: true }; },
    ficha_conferir: function (b, u, db) { var r = byId(db.reservas, b.id); if (r && r.ficha) r.ficha_conferida_em = b.ok === false ? null : new Date().toISOString(); return { ok: true }; },
    msg_marcar: function (b, u, db) { var r = byId(db.reservas, b.id); if (r) { r.mensagens = r.mensagens || {}; r.mensagens[b.tipo] = new Date().toISOString(); } return { ok: true }; },
    config_salvar: function (b, u, db) { if (b.empresa_cnpj) { var cn = String(b.empresa_cnpj).replace(/\D/g, ""); if (cn.length !== 14) erro("O CNPJ precisa ter 14 números."); b.empresa_cnpj = cn.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"); } if (b.fnrh_link && !/^https:\/\/\S+$/.test(b.fnrh_link)) erro("O link da FNRH precisa começar com https://"); if (b.link_avaliacao && !/^https:\/\/\S+$/.test(b.link_avaliacao)) erro("O link de avaliação precisa começar com https://"); ["whatsapp", "whatsapp_restaurante", "condicoes", "checkin_hora", "checkout_hora", "politica_pets", "pix_chave", "pix_nome", "pix_banco", "link_avaliacao", "msg_modelos", "empresa_razao", "empresa_cnpj", "empresa_endereco", "empresa_cadastur", "fnrh_link"].forEach(function (k) { if (b[k] !== undefined) db.config[k] = b[k]; }); ["vendas_ate", "site_pausado", "sinal_pct", "channex_precos", "channex_markup"].forEach(function (k) { if (b[k] !== undefined) db.config[k] = [b[k]]; }); audit(db, u, "update", "config", "", null); return { ok: true }; },
    quarto_salvar: function (b, u, db) { if (!b.nome || b.nome.length < 2) erro("Dê um nome ao quarto."); if (db.quartos.some(function (q) { return q.nome === b.nome && q.id !== +b.id; })) erro("Já existe um quarto com esse nome."); var q = b.id ? byId(db.quartos, b.id) : null; if (!q) { q = { id: ++db.seq.quartos }; db.quartos.push(q); } Object.assign(q, { nome: b.nome, categoria_id: +b.categoria_id, ordem: +b.ordem || 0, ativo: b.ativo !== false, obs: b.obs || "" }); return { ok: true }; },
    categoria_salvar: function (b, u, db) { var c = byId(db.categorias, b.id); Object.assign(c, { nome: b.nome, resumo: b.resumo, descricao: b.descricao, capacidade: +b.capacidade, no_site: b.no_site !== false, fotos: b.fotos || c.fotos, caracteristicas: b.caracteristicas || c.caracteristicas }); return { ok: true }; },
    video_salvar: function (b, u, db) { if (!/^https:\/\//.test(b.url || "")) erro("Link do vídeo inválido."); var v = b.id ? byId(db.videos, b.id) : null; if (!v) { v = { id: ++db.seq.videos }; db.videos.push(v); } Object.assign(v, { titulo: b.titulo || "", url: b.url, capa: b.capa || "", ordem: +b.ordem || 0, ativo: b.ativo !== false }); return { ok: true }; },
    video_del: function (b, u, db) { db.videos = db.videos.filter(function (v) { return v.id !== +b.id; }); return { ok: true }; },
    channex_info: function (b, u, db) { return { configurado: false, webhook: false, teste: false, categorias: db.categorias.map(function (c) { return { id: c.id, nome: c.nome, channex_room_type: c.channex_room_type || "", channex_rate_plan: c.channex_rate_plan || "" }; }), log: [], reservas: [], precos: !!(db.config.channex_precos && db.config.channex_precos[0]), markup: +((db.config.channex_markup || [0])[0]) || 0 }; },
    channex_mapa_salvar: function (b, u, db) { (b.categorias || []).forEach(function (x) { var c = byId(db.categorias, x.id); if (c) { c.channex_room_type = x.room_type || ""; c.channex_rate_plan = x.rate_plan || ""; } }); return { ok: true, envio: null }; },
    channex_enviar: function () { erro("No modo demonstração não há conexão com o Channex."); },
    channex_puxar: function () { erro("No modo demonstração não há conexão com o Channex."); },
    channex_listas: function () { erro("No modo demonstração não há conexão com o Channex."); },
    precos_mes: function (b, u, db) {
      var c = +b.categoria_id, ref = refTarifa(db, c), rp = ref ? ref.pessoas : 2, qs = db.quartos.filter(function (q) { return q.ativo && q.categoria_id === c; }), out = [];
      for (var i = 0; i < (+b.dias || 42); i++) { var d = add(b.ini, i), s = temporadaEm(db, d);
        out.push({ dia: d, valor: precoNoite(db, c, rp, d), padrao: ref ? Math.round(ref.valor * (1 + (s ? s.ajuste_pct : 0) / 100) * 100) / 100 : 0, manual: !!(db.precos_dia || {})[c + "|" + d], temporada: s ? s.nome : null,
          livres: qs.filter(function (q) { return !db.ocupacoes.some(function (o) { return o.ativo && o.quarto_id === q.id && o.checkin <= d && o.checkout > d; }); }).length }); }
      return { itens: out, total: qs.length, ref_pessoas: rp };
    },
    precos_salvar: function (b, u, db) {
      db.precos_dia = db.precos_dia || {}; var cs = b.categorias || [], ds = b.dias || []; if (!cs.length || !ds.length) erro("Escolha a suíte e os dias.");
      if (b.modo === "valor" && !(+b.valor >= 1)) erro("Número inválido.");
      cs.forEach(function (c) { ds.forEach(function (d) { var k = c + "|" + d; if (b.modo === "padrao") delete db.precos_dia[k]; else if (b.modo === "valor") db.precos_dia[k] = +b.valor; else { var ref = refTarifa(db, +c); var v = precoNoite(db, +c, ref ? ref.pessoas : 2, d); if (v > 0) db.precos_dia[k] = Math.round(v * (1 + (+b.valor) / 100)); } }); });
      audit(db, u, "update", "precos_dia", "", { dias: ds.length, modo: b.modo }); return { ok: true };
    },
    faq_painel: function (b, u, db) {
      var dias = +b.dias || 30, desde = new Date(Date.now() - dias * 864e5).toISOString(), bs = db.faq_buscas.filter(function (x) { return x.atualizado_em > desde; });
      var g = {};
      bs.forEach(function (x) { if (x.achou && !x.perguntou) return; var t = db.faq_termos[x.termo_norm]; if (t && x.atualizado_em <= t.em) return;
        var k = g[x.termo_norm] = g[x.termo_norm] || { termo_norm: x.termo_norm, termo: x.termo, n: 0, sem_resposta: 0, perguntaram: 0, ultima: "", idiomas: "pt" };
        k.n++; if (!x.achou) k.sem_resposta++; if (x.perguntou) k.perguntaram++; if (x.atualizado_em > k.ultima) { k.ultima = x.atualizado_em; k.termo = x.termo; } });
      var vistas = {}; bs.forEach(function (x) { if (x.faq_id) vistas[x.faq_id] = (vistas[x.faq_id] || 0) + 1; });
      return { dias: dias, itens: db.faq.slice().sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; }), vistas: vistas,
        resumo: { buscas: bs.length, acharam: bs.filter(function (x) { return x.achou; }).length, abriram: bs.filter(function (x) { return x.faq_id; }).length, perguntaram: bs.filter(function (x) { return x.perguntou; }).length },
        falta: Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.n - a.n || (a.ultima < b.ultima ? 1 : -1); }) };
    },
    faq_salvar: function (b, u, db) {
      if (!b.pergunta || b.pergunta.trim().length < 3) erro("Escreva a pergunta."); if (!b.resposta || b.resposta.trim().length < 2) erro("Escreva a resposta.");
      var f = b.id ? byId(db.faq, b.id) : null; if (!f) { f = { id: ++db.seq.faq }; db.faq.push(f); }
      var tr = {}; ["es", "en"].forEach(function (l) { var x = (b.traducoes || {})[l] || {}; if (x.p && x.r) tr[l] = { t: x.t || "", p: x.p, r: x.r }; });
      Object.assign(f, { tema: b.tema || "Geral", pergunta: b.pergunta.trim(), resposta: b.resposta.trim(), palavras: b.palavras || "", traducoes: tr, ordem: +b.ordem || 0, ativo: b.ativo !== false, atualizado_em: new Date().toISOString() });
      (b.termos || []).forEach(function (x) { db.faq_termos[chave(x)] = { como: "respondido", faq_id: f.id, em: new Date().toISOString() }; });
      audit(db, u, b.id ? "update" : "insert", "faq", f.id, f); return { ok: true, id: f.id };
    },
    faq_del: function (b, u, db) { db.faq = db.faq.filter(function (f) { return f.id !== +b.id; }); audit(db, u, "delete", "faq", b.id); return { ok: true }; },
    faq_termo: function (b, u, db) { var k = chave(b.termo); if (b.voltar) delete db.faq_termos[k]; else db.faq_termos[k] = { como: "ignorado", em: new Date().toISOString() }; return { ok: true }; },
    usuario_salvar: function (b, u, db) { if (!/^[a-z0-9._-]{3,40}$/.test(b.login || "")) erro("Login: use 3 a 40 letras minúsculas, números, ponto ou traço."); var x = b.id ? byId(db.usuarios, b.id) : null; if (!x) { if (!b.senha) erro("Defina uma senha inicial."); x = { id: ++db.seq.usuarios }; db.usuarios.push(x); } if (b.senha) x.senha_demo = String(b.senha); Object.assign(x, { nome: b.nome, login: b.login, papel: b.papel, ativo: b.ativo !== false, areas: b.papel === "dono" ? null : (Array.isArray(b.areas) ? b.areas.filter(function (a) { return AREAS.indexOf(a) >= 0; }) : x.areas || null) }); return { ok: true }; }
  };

  var AREAS = ["mapa", "reservas", "leads", "consumo", "pagamentos", "tarefas", "tarefas_gerir", "relatorios", "ajustes", "duvidas"];
  var AREAS_PADRAO = { recepcao: ["mapa", "reservas", "leads", "consumo", "pagamentos", "tarefas", "tarefas_gerir"], equipe: ["consumo", "tarefas"] };
  var SO_DONO = ["usuario_salvar", "pagamento_del", "lead_del"];
  var AREA_DE = { mapa: ["mapa"], mover: ["mapa"], bloqueio_criar: ["mapa"], bloqueio_remover: ["mapa"], reserva_salvar: ["reservas", "mapa"], reserva_status: ["reservas", "mapa"], msg_marcar: ["reservas", "mapa"], ficha_conferir: ["reservas", "mapa"], ficha_balcao: ["reservas", "mapa"], fnrh_marcar: ["reservas", "mapa"], reservas_busca: ["reservas"], hospede_busca: ["reservas", "mapa", "leads"], acompanhantes: ["reservas", "mapa"], disponiveis: ["reservas", "mapa", "leads"], preco: ["reservas", "mapa", "leads"], reserva_get: ["reservas", "mapa", "leads", "pagamentos"], leads: ["leads"], lead_status: ["leads"], lancar: ["consumo"], consumo: ["pagamentos"], lancamento_cancelar: ["pagamentos"], pagamento_add: ["pagamentos"], tarefas: ["tarefas", "tarefas_gerir"], tarefa_status: ["tarefas", "tarefas_gerir"], tarefa_salvar: ["tarefas_gerir"], tarefa_del: ["tarefas_gerir"], relatorios: ["relatorios"], auditoria: ["relatorios"], ajustes: ["ajustes"], tarifas_salvar: ["ajustes"], temporada_salvar: ["ajustes"], temporada_del: ["ajustes"], fechamento_salvar: ["ajustes"], fechamento_del: ["ajustes"], config_salvar: ["ajustes"], quarto_salvar: ["ajustes"], categoria_salvar: ["ajustes"], video_salvar: ["ajustes"], video_del: ["ajustes"], produto_salvar: ["ajustes"], precos_mes: ["ajustes"], precos_salvar: ["ajustes"], channex_info: ["ajustes"], channex_listas: ["ajustes"], channex_mapa_salvar: ["ajustes"], channex_enviar: ["ajustes"], channex_puxar: ["ajustes"], faq_painel: ["duvidas"], faq_salvar: ["duvidas"], faq_del: ["duvidas"], faq_termo: ["duvidas"] };
  function areasDe(u) { if (u.papel === "dono") return AREAS.slice(); var x = (load().usuarios.filter(function (y) { return y.id === u.id; })[0] || u).areas; return x && x.length ? x : (AREAS_PADRAO[u.papel] || []); }
  function podeAcao(n, u) { if (u.papel === "dono") return true; if (SO_DONO.indexOf(n) >= 0) return false; var a = areasDe(u); if (AREA_DE[n]) return AREA_DE[n].some(function (x) { return a.indexOf(x) >= 0; }); return ["boot", "hoje", "hospedados"].indexOf(n) >= 0 || u.papel === "recepcao"; }
  var USER = null;
  try { USER = JSON.parse(sessionStorage.getItem("mare_demo_user")); } catch (e) { }

  window.MareDemo = {
    ativo: true,
    reset: function () { localStorage.removeItem(KEY); DB = null; load(); },
    auth: function (b) {
      var db = load();
      if (!b) { if (!USER) erro("sessao", 401); return { usuario: USER }; }
      if (b.acao === "logout") { USER = null; sessionStorage.removeItem("mare_demo_user"); return { ok: true }; }
      if (b.acao === "login") { var x = db.usuarios.filter(function (y) { return y.login === String(b.login || "").toLowerCase() && y.ativo; })[0]; if (!x) erro("No modo demonstração, entre como: dono, brenda (recepção) ou jaci (equipe). Qualquer senha.", 401); if (String(b.senha || "") !== (x.senha_demo || "mare2026")) erro("Senha incorreta.", 401); USER = { id: x.id, nome: x.nome, login: x.login, papel: x.papel }; sessionStorage.setItem("mare_demo_user", JSON.stringify(USER)); return { usuario: USER }; }
      if (b.acao === "senha") return { ok: true };
      erro("ação");
    },
    g: function (b) {
      var db = load(); if (!USER) erro("sessao", 401);
      var f = A[b.a]; if (!f || b.a.charAt(0) === "_") erro("Ação desconhecida.");
      if (!podeAcao(b.a, USER)) erro("Seu usuário não tem permissão para isso.", 403);
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
    ficha: function (t) {
      var db = load(), r = db.reservas.filter(function (x) { return x.checkin_token && x.checkin_token === t; })[0];
      if (!r || ["pre", "confirmada", "hospedada"].indexOf(r.status) < 0 || r.checkout < hoje()) erro("link", 404);
      var h = byId(db.hospedes, r.hospede_id), cs = [];
      db.ocupacoes.forEach(function (o) { if (o.reserva_id === r.id && o.ativo) { var c = cat(db, quarto(db, o.quarto_id).categoria_id).nome; if (cs.indexOf(c) < 0) cs.push(c); } });
      return { nome: h.nome, codigo: r.codigo, checkin: r.checkin, checkout: r.checkout, adultos: r.adultos, criancas: r.criancas, suites: cs, ficha: r.ficha || null, ficha_em: r.ficha_em || null, fechada: r.status === "hospedada", config: db.config };
    },
    fichaSalvar: function (t, f) {
      var db = load(), r = db.reservas.filter(function (x) { return x.checkin_token && x.checkin_token === t; })[0]; if (!r) erro("link", 404);
      if (r.status === "hospedada") erro("O check-in desta reserva já foi feito na recepção.", 409);
      var cpf = function (v) { var d = String(v || "").replace(/\D/g, ""); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false; for (var n = 9; n <= 10; n++) { var s = 0; for (var i = 0; i < n; i++) s += +d[i] * (n + 1 - i); if ((s * 10 % 11) % 10 !== +d[n]) return false; } return true; };
      var idade = function (n) { return (Date.parse(r.checkin) - Date.parse(n)) / 31557600000; };
      var p = function (x, q, tit) { if (!x || String(x.nome || "").trim().split(/\s+/).length < 2) erro(q + ": escreva o nome completo."); if (x.doc_tipo === "cpf" && !cpf(x.doc)) erro(q + ": o CPF não confere. Confira os números."); if (!x.doc) erro(q + ": informe o número do documento."); if (!x.nascimento) erro(q + ": informe a data de nascimento."); if (tit && idade(x.nascimento) < 18) erro("O titular da reserva precisa ser maior de idade."); if (!tit && idade(x.nascimento) < 18) { if (VINC[x.vinculo]) x.parentesco = VINC[x.vinculo]; else x.vinculo = ""; if (!x.parentesco) erro(q + ": é menor de idade. Informe o vínculo com quem está na reserva."); } return x; };
      p(f.titular, "Titular", true); (f.acompanhantes || []).forEach(function (a, i) { p(a, "Acompanhante " + (i + 1), false); });
      var pl = String(f.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (pl && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(pl)) erro("A placa do carro parece errada (ex.: ABC1D23).");
      if (f.aceite !== true) erro("Para enviar, marque que leu a Política de Privacidade.");
      f.placa = pl; f.aceite_em = new Date().toISOString(); delete f.aceite;
      r.ficha = f; r.ficha_em = new Date().toISOString(); r.ficha_conferida_em = null;
      if ((f.acompanhantes || []).length) { r.acompanhantes = f.acompanhantes.map(function (a) { return a.nome; }).join("\n"); r.acompanhantes_dados = f.acompanhantes.map(function (a) { return { nome: a.nome, doc_tipo: a.doc_tipo, doc: a.doc, nascimento: a.nascimento, vinculo: a.vinculo || "", parentesco: a.parentesco || "" }; }); }
      save(); return { ok: true };
    },
    faq: function () { var db = load(); return { itens: db.faq.filter(function (f) { return f.ativo; }).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; }), config: db.config }; },
    busca: function (b) {
      var db = load(); if (!b || !b.id || String(b.termo || "").trim().length < 2) return;
      var x = db.faq_buscas.filter(function (y) { return y.id === b.id; })[0];
      if (!x) { x = { id: b.id, perguntou: false }; db.faq_buscas.unshift(x); if (db.faq_buscas.length > 2000) db.faq_buscas.length = 2000; }
      Object.assign(x, { termo: String(b.termo).slice(0, 120), termo_norm: chave(b.termo), idioma: b.idioma || "pt", achou: !!b.achou, faq_id: b.faq_id || x.faq_id || null, perguntou: x.perguntou || !!b.perguntou, atualizado_em: new Date().toISOString() });
      save();
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
