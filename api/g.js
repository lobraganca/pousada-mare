import { q, q1, corpo, responde, falha, txt, num, int, data, umDe, hoje, isData } from "./_db.js";
import { usuarioDe, origemOk, hashSenha, senhaForte } from "./_auth.js";
import { chaveBusca } from "./public.js";
import { validaAcompanhantes } from "./_ficha.js";
import crypto from "node:crypto";
import { channexOn, listas as cxListas, enviaARI, puxaReservas } from "./_channex.js";

// API da Gestão. Cada ação diz quais papéis podem usá-la:
//   dono = tudo · recepcao = operação do dia a dia · equipe = tarefas e lançamentos do bar
const D = ["dono"], DR = ["dono", "recepcao"], T = ["dono", "recepcao", "equipe"];
// Áreas que o dono libera para cada pessoa (Ajustes › Usuários). Dono vê tudo.
// Sem áreas marcadas, vale o padrão do papel.
const AREAS = ["mapa", "reservas", "leads", "consumo", "pagamentos", "tarefas", "tarefas_gerir", "relatorios", "ajustes", "duvidas"];
const AREAS_PADRAO = { recepcao: ["mapa", "reservas", "leads", "consumo", "pagamentos", "tarefas", "tarefas_gerir"], equipe: ["consumo", "tarefas"] };
const so_dono = ["usuario_salvar", "pagamento_del", "lead_del"];
const AREA_DE = {
  mapa: ["mapa"], mover: ["mapa"], bloqueio_criar: ["mapa"], bloqueio_remover: ["mapa"],
  reserva_salvar: ["reservas", "mapa"], reserva_status: ["reservas", "mapa"], msg_marcar: ["reservas", "mapa"], ficha_conferir: ["reservas", "mapa"], reservas_busca: ["reservas"], hospede_busca: ["reservas", "mapa", "leads"],
  acompanhantes: ["reservas", "mapa"], disponiveis: ["reservas", "mapa", "leads"], preco: ["reservas", "mapa", "leads"],
  reserva_get: ["reservas", "mapa", "leads", "pagamentos"], leads: ["leads"], lead_status: ["leads"],
  lancar: ["consumo"], consumo: ["pagamentos"], lancamento_cancelar: ["pagamentos"], pagamento_add: ["pagamentos"],
  tarefas: ["tarefas", "tarefas_gerir"], tarefa_status: ["tarefas", "tarefas_gerir"], tarefa_salvar: ["tarefas_gerir"], tarefa_del: ["tarefas_gerir"],
  relatorios: ["relatorios"], auditoria: ["relatorios"],
  ajustes: ["ajustes"], tarifas_salvar: ["ajustes"], temporada_salvar: ["ajustes"], temporada_del: ["ajustes"], fechamento_salvar: ["ajustes"], fechamento_del: ["ajustes"],
  config_salvar: ["ajustes"], quarto_salvar: ["ajustes"], categoria_salvar: ["ajustes"], video_salvar: ["ajustes"], video_del: ["ajustes"], produto_salvar: ["ajustes"],
  precos_mes: ["ajustes"], precos_salvar: ["ajustes"],
  channex_info: ["ajustes"], channex_listas: ["ajustes"], channex_mapa_salvar: ["ajustes"], channex_enviar: ["ajustes"], channex_puxar: ["ajustes"],
  faq_painel: ["duvidas"], faq_salvar: ["duvidas"], faq_del: ["duvidas"], faq_termo: ["duvidas"],
};
export const areasDe = (u) => u.papel === "dono" ? AREAS.slice() : (Array.isArray(u.areas) && u.areas.length ? u.areas.filter((x) => AREAS.includes(x)) : (AREAS_PADRAO[u.papel] || []));
const podeAcao = (nome, acao, u) => {
  if (u.papel === "dono") return true;
  if (so_dono.includes(nome)) return false;
  if (AREA_DE[nome]) { const a = areasDe(u); return AREA_DE[nome].some((x) => a.includes(x)); }
  return acao[0].includes(u.papel);
};
// Grava os demais hóspedes (com documento). Se o banco ainda não tiver a coluna, avisa em vez de quebrar.
async function salvaDados(id, dados, uid) {
  try { await q(`update reservas set acompanhantes_dados = $2::jsonb where id = $1`, [id, JSON.stringify(dados)], uid); }
  catch (e) { if (/acompanhantes_dados/.test(String(e.message))) throw Object.assign(new Error("Falta atualizar o banco: rode no Neon a linha de db/atendimento-automatico.sql que cria acompanhantes_dados. Os nomes foram salvos."), { status: 400, amigavel: true }); throw e; }
}
const SYNC_CHANNEX = new Set(["reserva_salvar", "reserva_status", "mover", "bloqueio_criar", "bloqueio_remover", "quarto_salvar", "precos_salvar", "tarifas_salvar", "temporada_salvar", "temporada_del"]);
const MSG_TIPOS = ["pix", "confirmacao", "checkin", "chegar", "vespera", "avaliacao"];
const ORIGENS = ["site", "whatsapp", "booking", "telefone", "balcao", "outro"];
const STATUS = ["pre", "confirmada", "hospedada", "finalizada", "cancelada", "no_show"];
const ATIVOS = "('pre','confirmada','hospedada','finalizada')";

const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const intervalo = (b, max = 400) => {
  const ini = data(b.ini), fim = data(b.fim);
  if (fim < ini || dias(ini, fim) > max) throw Object.assign(new Error("Período inválido."), { status: 400 });
  return [ini, fim];
};

// Totais financeiros de uma reserva (hospedagem − desconto + consumo − pagamentos + reembolsos)
const FIN = `
  r.valor_hospedagem - r.desconto as total_hospedagem,
  coalesce((select sum(total) from lancamentos l where l.reserva_id = r.id and not l.cancelado), 0) as consumo,
  coalesce((select sum(case when p.tipo = 'reembolso' then -p.valor else p.valor end) from pagamentos p where p.reserva_id = r.id), 0) as pago`;

const ACOES = {
  // ---------------- Base ----------------
  boot: [T, async (b, u) => {
    const [quartos, categorias, produtos, usuarios, cfg] = await Promise.all([
      q(`select q.id, q.nome, q.categoria_id, q.ordem, q.ativo, q.obs, c.capacidade from quartos q join categorias c on c.id = q.categoria_id order by q.ordem, q.id`),
      q(`select id, slug, nome, capacidade, no_site, ordem from categorias order by ordem`),
      q(`select id, tipo, grupo, nome, descricao, preco, no_cardapio, ativo, ordem from produtos order by tipo, ordem, nome`),
      q(`select id, nome, papel from usuarios where ativo order by nome`),
      q(`select chave, valor from config`),
    ]);
    return { usuario: Object.assign({}, u, { areas: areasDe(u) }), hoje: hoje(), quartos, categorias, produtos, usuarios, config: Object.fromEntries(cfg.map((r) => [r.chave, r.valor])) };
  }],

  // ---------------- Hoje (painel inicial) ----------------
  hoje: [T, async (b, u) => {
    const d = isData(b.data) ? b.data : hoje();
    const dinheiro = areasDe(u).includes("pagamentos");
    const [chegadas, saidas, hospedados, cafe, tarefas, leads, receber] = await Promise.all([
      q(`select r.id, r.codigo, r.status, r.origem, h.nome, h.telefone, r.adultos, r.criancas, r.checkout,
                (select string_agg(qt.nome, ', ' order by qt.ordem) from ocupacoes o join quartos qt on qt.id = o.quarto_id where o.reserva_id = r.id and o.ativo) quartos
           from reservas r join hospedes h on h.id = r.hospede_id where r.checkin = $1 and r.status in ('pre','confirmada','hospedada') order by h.nome`, [d]),
      q(`select r.id, r.codigo, r.status, h.nome, ${FIN},
                (select string_agg(qt.nome, ', ' order by qt.ordem) from ocupacoes o join quartos qt on qt.id = o.quarto_id where o.reserva_id = r.id and o.ativo) quartos
           from reservas r join hospedes h on h.id = r.hospede_id where r.checkout = $1 and r.status in ('confirmada','hospedada','finalizada') order by h.nome`, [d]),
      q(`select r.id, r.codigo, h.nome, qt.id quarto_id, qt.nome quarto, o.adultos, o.criancas
           from ocupacoes o join reservas r on r.id = o.reserva_id join hospedes h on h.id = r.hospede_id join quartos qt on qt.id = o.quarto_id
          where o.ativo and o.periodo @> $1::date and r.status in ('confirmada','hospedada') order by qt.ordem`, [d]),
      q(`select * from previsao_cafe($1::date, 7)`, [d]),
      q(`select t.*, qt.nome quarto, us.nome responsavel from tarefas t left join quartos qt on qt.id = t.quarto_id left join usuarios us on us.id = t.responsavel_id
          where t.status in ('aberta','andamento') and t.prazo <= $1::date + 1 ${!areasDe(u).includes("tarefas_gerir") ? "and (t.responsavel_id is null or t.responsavel_id = $2)" : "and $2::int is not null"} order by t.prazo, t.prioridade desc limit 50`, [d, u.id]),
      dinheiro ? q(`select count(*) filter (where status = 'novo' and enviado)::int enviados, count(*) filter (where status = 'novo' and not enviado and length(telefone) >= 10)::int abandonados from leads where atualizado_em > now() - interval '30 days'`) : [{}],
      dinheiro ? q(`select coalesce(sum(greatest(x.total_hospedagem + x.consumo - x.pago, 0)), 0) total from (select ${FIN} from reservas r where r.status in ('confirmada','hospedada') and r.checkin <= $1::date + 7) x`, [d]) : [{}],
    ]);
    const total = await q1(`select count(*)::int n from quartos where ativo`);
    if (!dinheiro) saidas.forEach((s) => { delete s.total_hospedagem; delete s.consumo; delete s.pago; });
    return { data: d, chegadas: dinheiro ? chegadas : chegadas.map(({ telefone, ...x }) => x), saidas, hospedados, cafe, tarefas, leads: leads[0], a_receber: receber[0]?.total, total_quartos: total.n };
  }],

  // ---------------- Mapa de quartos ----------------
  mapa: [DR, async (b) => {
    const [ini, fim] = intervalo(b, 120);
    const itens = await q(
      `select o.id, o.quarto_id, lower(o.periodo) checkin, upper(o.periodo) checkout, o.tipo, o.motivo, o.adultos, o.criancas, o.valor_diaria,
              r.id reserva_id, r.codigo, r.status, r.origem, r.grupo_nome, h.nome hospede, h.telefone,
              (select count(*) from ocupacoes o2 where o2.reserva_id = r.id and o2.ativo)::int n_quartos,
              ${FIN.replace(/\n/g, " ")}
         from ocupacoes o left join reservas r on r.id = o.reserva_id left join hospedes h on h.id = r.hospede_id
        where o.ativo and o.periodo && daterange($1::date, $2::date + 1)
        order by lower(o.periodo)`, [ini, fim]);
    return { itens };
  }],

  mover: [DR, async (b, u) => {
    const r = await q1(`select ocupacao_mover($1, $2, $3::date, $4::date, $5) r`, [int(b.id, 1), int(b.quarto_id, 1), data(b.checkin), data(b.checkout), u.id], u.id);
    return r.r;
  }],

  bloqueio_criar: [DR, async (b, u) => {
    const ids = Array.isArray(b.quartos) ? b.quartos.slice(0, 13).map((x) => int(x, 1)) : [int(b.quarto_id, 1)];
    const out = [];
    for (const qid of ids) out.push((await q1(`select bloqueio_criar($1, $2::date, $3::date, $4, $5) id`, [qid, data(b.checkin), data(b.checkout), txt(b.motivo || "Manutenção", 200), u.id], u.id)).id);
    return { ids: out };
  }],
  bloqueio_remover: [DR, async (b, u) => {
    await q(`update ocupacoes set ativo = false where id = $1 and tipo = 'bloqueio'`, [int(b.id, 1)], u.id);
    return { ok: true };
  }],

  // ---------------- Reservas ----------------
  reserva_get: [DR, async (b) => {
    const id = int(b.id, 1);
    // Garante o link do check-in online (token aleatório, criado uma vez por reserva)
    await q(`update reservas set checkin_token = $2 where id = $1 and checkin_token is null`, [id, crypto.randomBytes(18).toString("base64url")]);
    const r = await q1(`select r.*, ${FIN}, row_to_json(h) hospede from reservas r join hospedes h on h.id = r.hospede_id where r.id = $1`, [id]);
    if (!r) throw Object.assign(new Error("Reserva não encontrada."), { status: 404 });
    const [quartos, pagamentos, lancamentos, historico, anteriores] = await Promise.all([
      q(`select o.id, o.quarto_id, qt.nome quarto, lower(o.periodo) checkin, upper(o.periodo) checkout, o.adultos, o.criancas, o.valor_diaria, o.ativo
           from ocupacoes o join quartos qt on qt.id = o.quarto_id where o.reserva_id = $1 and o.ativo order by qt.ordem`, [id]),
      q(`select p.*, us.nome por from pagamentos p left join usuarios us on us.id = p.criado_por where reserva_id = $1 order by data, id`, [id]),
      q(`select l.*, us.nome por, qt.nome quarto from lancamentos l left join usuarios us on us.id = l.criado_por left join quartos qt on qt.id = l.quarto_id where reserva_id = $1 order by criado_em`, [id]),
      q(`select a.em, a.acao, a.tabela, us.nome por, a.antes, a.depois from auditoria a left join usuarios us on us.id = a.usuario_id
          where (a.tabela = 'reservas' and a.registro_id = $1::text)
             or (a.tabela in ('ocupacoes','pagamentos','lancamentos') and (coalesce(a.depois, a.antes)->>'reserva_id') = $1::text)
          order by a.em desc limit 40`, [id]),
      q(`select r2.id, r2.codigo, r2.checkin, r2.checkout, r2.status, r2.valor_hospedagem from reservas r2 where r2.hospede_id = $1 and r2.id <> $2 order by r2.checkin desc limit 10`, [r.hospede_id, id]),
    ]);
    return { reserva: r, quartos, pagamentos, lancamentos, historico, anteriores };
  }],

  reserva_salvar: [DR, async (b, u) => {
    const quartos = Array.isArray(b.quartos) ? b.quartos.slice(0, 13).map((x) => ({
      quarto_id: int(x.quarto_id, 1), checkin: data(x.checkin), checkout: data(x.checkout),
      adultos: int(x.adultos ?? 0, 0, 12), criancas: int(x.criancas ?? 0, 0, 12),
      ...(x.valor_diaria !== undefined && x.valor_diaria !== "" && x.valor_diaria !== null ? { valor_diaria: num(x.valor_diaria, 0, 100000) } : {}),
    })) : [];
    const h = b.hospede || {};
    const p = {
      id: b.id ? int(b.id, 1) : null,
      hospede: { id: h.id ? int(h.id, 1) : null, nome: txt(h.nome, 120), telefone: String(h.telefone || "").replace(/\D/g, "").slice(0, 15), email: txt(h.email, 120), documento: txt(h.documento, 40), cidade: txt(h.cidade, 80) },
      origem: umDe(b.origem, ORIGENS, "whatsapp"), status: b.status ? umDe(b.status, ["pre", "confirmada", "hospedada"]) : "",
      grupo_nome: txt(b.grupo_nome, 80), desconto: num(b.desconto || 0, 0, 1e6), condicoes_pagamento: txt(b.condicoes_pagamento, 500),
      sinal_previsto: num(b.sinal_previsto || 0, 0, 1e6), obs: txt(b.obs, 1000), acompanhantes: String(b.acompanhantes ?? "").replace(/[<>]/g, "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 12).join("\n").slice(0, 1000), lead_id: b.lead_id ? txt(b.lead_id, 40) : null, quartos,
    };
    // Demais hóspedes com documento: os nomes também vão para a lista simples (usada no Bar)
    const dados = validaAcompanhantes(b.acompanhantes_dados);
    if (dados) p.acompanhantes = dados.map((x) => x.nome).join("\n").slice(0, 1000);
    const r = await q1(`select reserva_salvar($1::jsonb, $2) r`, [JSON.stringify(p), u.id], u.id);
    if (dados) await salvaDados(r.r.id, dados, u.id);
    return r.r;
  }],

  // Mensagem pronta aberta no WhatsApp: guarda quando foi (aparece na reserva como "enviada")
  msg_marcar: [DR, async (b, u) => {
    const tipo = umDe(b.tipo, MSG_TIPOS);
    await q(`update reservas set mensagens = coalesce(mensagens, '{}'::jsonb) || jsonb_build_object($2::text, now()) where id = $1`, [int(b.id, 1), tipo], u.id);
    return { ok: true };
  }],
  ficha_conferir: [DR, async (b, u) => {
    await q(`update reservas set ficha_conferida_em = case when $2 then now() else null end where id = $1 and ficha is not null`, [int(b.id, 1), b.ok !== false], u.id);
    return { ok: true };
  }],
  reserva_status: [DR, async (b, u) => {
    const st = umDe(b.status, STATUS);
    const r = await q1(`select reserva_status($1, $2, $3, $4) r`, [int(b.id, 1), st, txt(b.motivo, 300), u.id], u.id);
    return r.r;
  }],

  reservas_busca: [DR, async (b) => {
    const termo = txt(b.q, 60);
    const ini = isData(b.ini) ? b.ini : "1900-01-01", fim = isData(b.fim) ? b.fim : "2999-12-31";
    const st = STATUS.includes(b.status) ? b.status : null, og = ORIGENS.includes(b.origem) ? b.origem : null;
    return { itens: await q(
      `select r.id, r.codigo, r.status, r.origem, r.grupo_nome, r.checkin, r.checkout, r.adultos, r.criancas, h.nome, h.telefone, ${FIN},
              (select string_agg(qt.nome, ', ' order by qt.ordem) from ocupacoes o join quartos qt on qt.id = o.quarto_id where o.reserva_id = r.id and o.ativo) quartos
         from reservas r join hospedes h on h.id = r.hospede_id
        where ($1 = '' or h.nome ilike '%' || $1 || '%' or h.telefone like '%' || regexp_replace($1, '\\D', '', 'g') || '%' and length(regexp_replace($1, '\\D', '', 'g')) >= 4 or r.codigo = upper($1) or r.grupo_nome ilike '%' || $1 || '%')
          and coalesce(r.checkout, r.criado_em::date) >= $2::date and coalesce(r.checkin, r.criado_em::date) <= $3::date
          and ($4::text is null or r.status::text = $4) and ($5::text is null or r.origem::text = $5)
        order by r.checkin desc nulls last limit 200`, [termo, ini, fim, st, og]) };
  }],

  hospede_busca: [DR, async (b) => {
    const t = txt(b.q, 60);
    if (t.length < 2) return { itens: [] };
    return { itens: await q(
      `select h.*, (select count(*) from reservas r where r.hospede_id = h.id and r.status in ${ATIVOS})::int estadias,
              (select max(checkout) from reservas r where r.hospede_id = h.id and r.status in ${ATIVOS}) ultima
         from hospedes h where h.nome ilike '%' || $1 || '%' or (length(regexp_replace($1, '\\D', '', 'g')) >= 4 and h.telefone like '%' || regexp_replace($1, '\\D', '', 'g') || '%')
        order by h.nome limit 15`, [t]) };
  }],

  disponiveis: [DR, async (b) => {
    const i = data(b.checkin), o = data(b.checkout);
    return { itens: await q(
      `select q.id, q.nome, c.nome categoria, c.capacidade, c.id categoria_id from quartos q join categorias c on c.id = q.categoria_id
        where q.ativo and not exists (select 1 from ocupacoes x where x.quarto_id = q.id and x.ativo and x.periodo && daterange($1::date, $2::date)
                                      and ($3::int is null or x.reserva_id is distinct from $3))
        order by q.ordem`, [i, o, b.reserva_id ? int(b.reserva_id, 1) : null]) };
  }],

  preco: [DR, async (b) => {
    const r = await q1(`select preco_estadia(q.categoria_id, $2, $3::date, $4::date) total from quartos q where q.id = $1`, [int(b.quarto_id, 1), int(b.pessoas, 1, 12), data(b.checkin), data(b.checkout)]);
    return { total: r?.total || 0 };
  }],

  // ---------------- Pagamentos ----------------
  pagamento_add: [DR, async (b, u) => {
    const r = await q1(`insert into pagamentos(reserva_id, tipo, valor, forma, data, obs, criado_por) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [int(b.reserva_id, 1), umDe(b.tipo, ["sinal", "saldo", "extra", "reembolso"]), num(b.valor, 0.01, 1e6), umDe(b.forma, ["pix", "cartao", "dinheiro", "transferencia", "booking", "outro"]), isData(b.data) ? b.data : hoje(), txt(b.obs, 300), u.id], u.id);
    return r;
  }],
  pagamento_del: [D, async (b, u) => { await q(`delete from pagamentos where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],

  // ---------------- Pré-reservas do site (leads) ----------------
  leads: [DR, async (b) => {
    const f = umDe(b.filtro, ["abertos", "enviados", "abandonados", "todos", "arquivados"], "abertos");
    const w = { abertos: "status in ('novo','contatado')", enviados: "enviado and status in ('novo','contatado')", abandonados: "not enviado and status in ('novo','contatado')", todos: "status <> 'arquivado'", arquivados: "status = 'arquivado'" }[f];
    return { itens: await q(`select * from leads where ${w} and (length(telefone) >= 8 or length(nome) >= 2) order by atualizado_em desc limit 300`) };
  }],
  acompanhantes: [DR, async (b, u) => {
    const dados = validaAcompanhantes(b.acompanhantes_dados);
    const lista = dados ? dados.map((x) => x.nome).join("\n").slice(0, 1000)
      : String(b.acompanhantes ?? "").replace(/[<>]/g, "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 12).join("\n").slice(0, 1000);
    await q(`update reservas set acompanhantes = $2 where id = $1`, [int(b.id, 1), lista], u.id);
    if (dados) await salvaDados(int(b.id, 1), dados, u.id);
    return { ok: true, acompanhantes: lista, acompanhantes_dados: dados };
  }],
  lead_status: [DR, async (b, u) => {
    await q(`update leads set status = $2, obs = case when $3 = '' then obs else $3 end, atualizado_em = now() where id = $1`,
      [txt(b.id, 40), umDe(b.status, ["novo", "contatado", "perdido", "arquivado"]), txt(b.obs, 400)], u.id);
    return { ok: true };
  }],
  lead_del: [D, async (b, u) => { await q(`delete from leads where id = $1`, [txt(b.id, 40)], u.id); return { ok: true }; }],

  // ---------------- Bar, restaurante, produtos ----------------
  hospedados: [T, async (b) => {
    const d = isData(b.data) ? b.data : hoje();
    return { itens: await q(
      `select r.id reserva_id, r.codigo, h.nome, r.acompanhantes, qt.id quarto_id, qt.nome quarto from ocupacoes o join reservas r on r.id = o.reserva_id
         join hospedes h on h.id = r.hospede_id join quartos qt on qt.id = o.quarto_id
        where o.ativo and o.periodo @> $1::date and r.status in ('confirmada','hospedada') order by qt.ordem`, [d]) };
  }],
  lancar: [T, async (b, u) => {
    const rid = int(b.reserva_id, 1);
    const st = await q1(`select status from reservas where id = $1`, [rid]);
    if (!st || !["confirmada", "hospedada", "finalizada"].includes(st.status)) throw Object.assign(new Error("Só dá para lançar consumo em reserva confirmada ou hospedada."), { status: 400 });
    const itens = (Array.isArray(b.itens) ? b.itens : []).slice(0, 40);
    if (!itens.length) throw Object.assign(new Error("Nenhum item."), { status: 400 });
    for (const it of itens) {
      let desc = txt(it.descricao, 120), preco = it.valor_unit, tipo = it.tipo, pid = it.produto_id ? int(it.produto_id, 1) : null;
      if (pid) {
        const p = await q1(`select nome, preco, tipo from produtos where id = $1 and ativo`, [pid]);
        if (!p) throw Object.assign(new Error("Produto não encontrado."), { status: 400 });
        desc = desc || p.nome; tipo = p.tipo; if (preco === undefined || preco === null || preco === "" || !areasDe(u).includes("pagamentos")) preco = p.preco;
      }
      if (!desc) throw Object.assign(new Error("Descreva o item."), { status: 400 });
      await q(`insert into lancamentos(reserva_id, quarto_id, produto_id, tipo, descricao, qtd, valor_unit, criado_por, pessoa) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [rid, it.quarto_id ? int(it.quarto_id, 1) : null, pid, umDe(tipo, ["bar", "restaurante", "produto", "servico", "extra"], "extra"), desc, num(it.qtd || 1, 0.01, 999), num(preco, 0, 1e5), u.id, txt(it.pessoa, 80)], u.id);
    }
    return { ok: true };
  }],
  lancamento_cancelar: [DR, async (b, u) => { await q(`update lancamentos set cancelado = true where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],
  consumo: [DR, async (b) => {
    const [ini, fim] = intervalo(b, 400);
    return { itens: await q(
      `select l.*, h.nome hospede, r.codigo, qt.nome quarto, us.nome por from lancamentos l join reservas r on r.id = l.reserva_id join hospedes h on h.id = r.hospede_id
         left join quartos qt on qt.id = l.quarto_id left join usuarios us on us.id = l.criado_por
        where l.criado_em::date between $1::date and $2::date order by l.criado_em desc limit 500`, [ini, fim]) };
  }],
  produto_salvar: [D, async (b, u) => {
    const v = [umDe(b.tipo, ["bar", "restaurante", "produto", "servico"]), txt(b.grupo, 60), txt(b.nome, 100), txt(b.descricao, 300), num(b.preco, 0, 1e5), !!b.no_cardapio, b.ativo !== false, int(b.ordem || 0, 0, 9999)];
    if (!v[2]) throw Object.assign(new Error("Informe o nome."), { status: 400 });
    if (b.id) await q(`update produtos set tipo=$2, grupo=$3, nome=$4, descricao=$5, preco=$6, no_cardapio=$7, ativo=$8, ordem=$9 where id=$1`, [int(b.id, 1), ...v], u.id);
    else await q(`insert into produtos(tipo, grupo, nome, descricao, preco, no_cardapio, ativo, ordem) values ($1,$2,$3,$4,$5,$6,$7,$8)`, v, u.id);
    return { ok: true };
  }],

  // ---------------- Tarefas ----------------
  tarefas: [T, async (b, u) => {
    const st = umDe(b.status, ["aberta", "feita", "quadro", "pendentes", "arquivada"], "aberta");
    const lista = { aberta: ["aberta"], feita: ["feita"], quadro: ["aberta", "andamento", "feita"], pendentes: ["aberta", "andamento"], arquivada: ["arquivada"] }[st];
    return { itens: await q(
      `select t.*, qt.nome quarto, us.nome responsavel, f.nome feita_por_nome from tarefas t left join quartos qt on qt.id = t.quarto_id
         left join usuarios us on us.id = t.responsavel_id left join usuarios f on f.id = t.feita_por
        where t.status = any($1::text[]) ${!areasDe(u).includes("tarefas_gerir") ? "and (t.responsavel_id is null or t.responsavel_id = $2)" : "and $2::int is not null"}
          and (t.status <> 'feita' or t.feita_em > now() - interval '30 days')
          and (t.status <> 'arquivada' or coalesce(t.feita_em, t.criado_em) > now() - interval '180 days')
        order by case when t.status in ('aberta','andamento') then t.prazo end, t.feita_em desc nulls last, t.id limit 300`, [lista, u.id]) };
  }],
  tarefa_salvar: [DR, async (b, u) => {
    const v = [txt(b.titulo, 140), txt(b.descricao, 600), b.quarto_id ? int(b.quarto_id, 1) : null, b.responsavel_id ? int(b.responsavel_id, 1) : null, isData(b.prazo) ? b.prazo : hoje(), umDe(b.prioridade, ["baixa", "normal", "alta"], "normal")];
    if (v[0].length < 2) throw Object.assign(new Error("Dê um título para a tarefa."), { status: 400 });
    if (b.id) await q(`update tarefas set titulo=$2, descricao=$3, quarto_id=$4, responsavel_id=$5, prazo=$6, prioridade=$7 where id=$1`, [int(b.id, 1), ...v], u.id);
    else await q(`insert into tarefas(titulo, descricao, quarto_id, responsavel_id, prazo, prioridade, criado_por) values ($1,$2,$3,$4,$5,$6,$7)`, [...v, u.id], u.id);
    return { ok: true };
  }],
  tarefa_status: [T, async (b, u) => {
    const novo = umDe(b.status, ["aberta", "andamento", "feita", "arquivada"], "aberta"), feita = novo === "feita";
    if (novo === "arquivada") {
      const r = await q(`update tarefas set status = 'arquivada' where id = $1 and status = 'feita' and ($3 <> 'equipe' or responsavel_id is null or responsavel_id = $2) returning id`, [int(b.id, 1), u.id, areasDe(u).includes("tarefas_gerir") ? "gerente" : "equipe"], u.id);
      if (!r.length) throw Object.assign(new Error("Só dá para arquivar tarefa concluída."), { status: 400 });
      return { ok: true };
    }
    const r = await q(`update tarefas set status = $2, feita_em = case when $3 then now() end, feita_por = case when $3 then $4::int end
                        where id = $1 and ($5 <> 'equipe' or responsavel_id is null or responsavel_id = $4) returning id`,
      [int(b.id, 1), novo, feita, u.id, areasDe(u).includes("tarefas_gerir") ? "gerente" : "equipe"], u.id);
    if (!r.length) throw Object.assign(new Error("Tarefa não encontrada."), { status: 404 });
    return { ok: true };
  }],
  tarefa_del: [DR, async (b, u) => { await q(`delete from tarefas where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],

  // ---------------- Relatórios ----------------
  relatorios: [D, async (b) => {
    const [ini, fim] = intervalo(b, 400);
    const comp = isData(b.ini2) && isData(b.fim2) ? intervalo({ ini: b.ini2, fim: b.fim2 }, 400) : null;
    const [diario, resumo, resumo2, cafe, top] = await Promise.all([
      q(`select * from relatorio_ocupacao($1::date, $2::date)`, [ini, fim]),
      q1(`select relatorio_resumo($1::date, $2::date) r`, [ini, fim]),
      comp ? q1(`select relatorio_resumo($1::date, $2::date) r`, comp) : null,
      q(`select * from previsao_cafe($1::date, 14)`, [hoje()]),
      q(`select l.descricao, sum(l.qtd)::numeric qtd, sum(l.total) total from lancamentos l where not l.cancelado and l.criado_em::date between $1::date and $2::date group by 1 order by 3 desc limit 10`, [ini, fim]),
    ]);
    return { diario, resumo: resumo.r, comparativo: resumo2 ? resumo2.r : null, cafe, top_consumo: top };
  }],
  auditoria: [D, async (b) => ({ itens: await q(
    `select a.id, a.em, a.acao, a.tabela, a.registro_id, us.nome por, a.antes, a.depois from auditoria a left join usuarios us on us.id = a.usuario_id
      where a.tabela <> 'config' or true order by a.em desc limit $1`, [int(b.limite || 150, 1, 1000)]) })],

  // ---------------- Ajustes (só dono) ----------------
  ajustes: [D, async () => {
    const [tarifas, temporadas, fechamentos, videos, usuarios, categorias] = await Promise.all([
      q(`select * from tarifas order by categoria_id, pessoas`),
      q(`select id, nome, lower(periodo) ini, upper(periodo) - 1 fim, ajuste_pct, min_noites from temporadas order by lower(periodo)`),
      q(`select id, lower(periodo) ini, upper(periodo) - 1 fim, motivo from fechamentos_site where upper(periodo) >= current_date order by lower(periodo)`),
      q(`select * from videos order by ordem, id`),
      q(`select id, nome, login, papel, areas, ativo, criado_em from usuarios order by ativo desc, nome`),
      q(`select * from categorias order by ordem`),
    ]);
    return { tarifas, temporadas, fechamentos, videos, usuarios, categorias };
  }],
  tarifas_salvar: [D, async (b, u) => {
    const lista = (Array.isArray(b.tarifas) ? b.tarifas : []).slice(0, 80);
    for (const t of lista) {
      await q(`insert into tarifas(categoria_id, pessoas, valor) values ($1,$2,$3) on conflict (categoria_id, pessoas) do update set valor = excluded.valor`,
        [int(t.categoria_id, 1), int(t.pessoas, 1, 12), num(t.valor, 0, 1e5)], u.id);
    }
    return { ok: true };
  }],
  // ---------------- Channex (Booking) ----------------
  channex_info: [D, async () => {
    const [cats, log, res, cfg] = await Promise.all([
      q(`select id, nome, channex_room_type, channex_rate_plan from categorias order by ordem`),
      q(`select em, tipo, ok, detalhe from channex_log order by em desc limit 30`),
      q(`select c.*, r.codigo from channex_reservas c left join reservas r on r.id = c.reserva_id order by c.atualizado_em desc limit 30`),
      q1(`select (select (valor->>0)::boolean from config where chave = 'channex_precos') precos, (select (valor->>0)::numeric from config where chave = 'channex_markup') markup`),
    ]);
    return { configurado: channexOn(), webhook: String(process.env.CHANNEX_WEBHOOK_SECRET || "").length >= 16, teste: /staging/.test(String(process.env.CHANNEX_URL || "")),
      categorias: cats, log, reservas: res, precos: !!cfg?.precos, markup: Number(cfg?.markup) || 0 };
  }],
  channex_listas: [D, async () => { if (!channexOn()) throw Object.assign(new Error("Channex ainda não configurado na Vercel."), { status: 400 }); return await cxListas(); }],
  channex_mapa_salvar: [D, async (b, u) => {
    const uuid = (v) => { const s = String(v || "").trim(); if (s && !/^[0-9a-f-]{36}$/i.test(s)) throw Object.assign(new Error("Código do Channex inválido."), { status: 400 }); return s || null; };
    for (const c of (Array.isArray(b.categorias) ? b.categorias : []).slice(0, 30))
      await q(`update categorias set channex_room_type = $2, channex_rate_plan = $3 where id = $1`, [int(c.id, 1), uuid(c.room_type), uuid(c.rate_plan)], u.id);
    return { ok: true, envio: channexOn() ? await enviaARI("ligação das suítes salva").catch((e) => ({ erro: e.message })) : null };
  }],
  channex_enviar: [D, async () => { if (!channexOn()) throw Object.assign(new Error("Channex ainda não configurado na Vercel."), { status: 400 }); return await enviaARI("enviado pela gestão"); }],
  channex_puxar: [D, async () => { if (!channexOn()) throw Object.assign(new Error("Channex ainda não configurado na Vercel."), { status: 400 }); return await puxaReservas("buscado pela gestão"); }],

  // ---------------- Calendário de preços ----------------
  // Valor de cada dia (diária para 2 pessoas), o valor padrão (tabela × temporada), se foi definido à mão e quantos quartos estão livres.
  precos_mes: [D, async (b) => {
    const cat = int(b.categoria_id, 1), ini = data(b.ini), n = int(b.dias || 42, 1, 62);
    const itens = await q(
      `with ref as (select pessoas from tarifas where categoria_id = $1 order by (pessoas >= 2) desc, case when pessoas >= 2 then pessoas else -pessoas end limit 1),
            d as (select generate_series($2::date, $2::date + ($3 - 1), interval '1 day')::date dia)
       select d.dia, preco_noite($1, coalesce((select pessoas from ref), 2), d.dia) valor,
              round(coalesce((select valor from tarifas where categoria_id = $1 and pessoas = (select pessoas from ref)), 0)
                    * (1 + coalesce((select ajuste_pct from temporadas where periodo @> d.dia), 0) / 100), 2) padrao,
              exists (select 1 from precos_dia p where p.categoria_id = $1 and p.dia = d.dia) manual,
              (select nome from temporadas where periodo @> d.dia) temporada,
              (select count(*) from quartos q where q.categoria_id = $1 and q.ativo
                  and not exists (select 1 from ocupacoes o where o.quarto_id = q.id and o.ativo and o.periodo @> d.dia))::int livres
         from d order by d.dia`, [cat, ini, n]);
    const t = await q1(`select count(*)::int total, (select pessoas from tarifas where categoria_id = $1 order by (pessoas >= 2) desc, case when pessoas >= 2 then pessoas else -pessoas end limit 1) ref
                          from quartos where categoria_id = $1 and ativo`, [cat]);
    return { itens, total: t.total, ref_pessoas: t.ref || 2 };
  }],
  precos_salvar: [D, async (b, u) => {
    const cats = [...new Set((Array.isArray(b.categorias) ? b.categorias : []).map((x) => int(x, 1)))].slice(0, 20);
    const dias = [...new Set((Array.isArray(b.dias) ? b.dias : []).map((x) => data(x)))].slice(0, 400);
    if (!cats.length || !dias.length) throw Object.assign(new Error("Escolha a suíte e os dias."), { status: 400 });
    const modo = umDe(b.modo, ["valor", "pct", "padrao"]);
    if (modo === "padrao") await q(`delete from precos_dia where categoria_id = any($1::int[]) and dia = any($2::date[])`, [cats, dias], u.id);
    else if (modo === "valor") {
      const v = num(b.valor, 1, 99999);
      await q(`insert into precos_dia(categoria_id, dia, valor) select c, d, $3 from unnest($1::int[]) c, unnest($2::date[]) d
               on conflict (categoria_id, dia) do update set valor = excluded.valor, atualizado_em = now()`, [cats, dias, v], u.id);
    } else {
      const pct = num(b.valor, -90, 500);
      // aplica o % sobre o valor atual de cada dia (o definido à mão ou o padrão)
      await q(`insert into precos_dia(categoria_id, dia, valor)
               select c, d, round(preco_noite(c, coalesce((select pessoas from tarifas where categoria_id = c order by (pessoas >= 2) desc, case when pessoas >= 2 then pessoas else -pessoas end limit 1), 2), d) * (1 + $3 / 100.0))
                 from unnest($1::int[]) c, unnest($2::date[]) d
                where preco_noite(c, 2, d) > 0
               on conflict (categoria_id, dia) do update set valor = excluded.valor, atualizado_em = now()`, [cats, dias, pct], u.id);
    }
    return { ok: true };
  }],
  temporada_salvar: [D, async (b, u) => {
    const ini = data(b.ini), fim = data(b.fim);
    if (fim < ini) throw Object.assign(new Error("A data final precisa ser depois da inicial."), { status: 400 });
    const v = [txt(b.nome, 80) || "Temporada", ini, fim, num(b.ajuste_pct || 0, -99, 500), int(b.min_noites || 1, 1, 30)];
    try {
      if (b.id) await q(`update temporadas set nome=$2, periodo=daterange($3::date, $4::date + 1), ajuste_pct=$5, min_noites=$6 where id=$1`, [int(b.id, 1), ...v], u.id);
      else await q(`insert into temporadas(nome, periodo, ajuste_pct, min_noites) values ($1, daterange($2::date, $3::date + 1), $4, $5)`, v, u.id);
    } catch (e) { if (e.status === 409) throw Object.assign(new Error("Essa temporada se sobrepõe a outra. Ajuste as datas."), { status: 409, amigavel: true }); throw e; }
    return { ok: true };
  }],
  temporada_del: [D, async (b, u) => { await q(`delete from temporadas where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],
  fechamento_salvar: [D, async (b, u) => {
    const ini = data(b.ini), fim = data(b.fim);
    if (fim < ini) throw Object.assign(new Error("Datas inválidas."), { status: 400 });
    await q(`insert into fechamentos_site(periodo, motivo) values (daterange($1::date, $2::date + 1), $3)`, [ini, fim, txt(b.motivo, 120)], u.id);
    return { ok: true };
  }],
  fechamento_del: [D, async (b, u) => { await q(`delete from fechamentos_site where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],
  config_salvar: [D, async (b, u) => {
    const permitidas = { whatsapp: (v) => String(v).replace(/\D/g, "").slice(0, 15), whatsapp_restaurante: (v) => String(v).replace(/\D/g, "").slice(0, 15),
      vendas_ate: (v) => [isData(v) ? v : ""], site_pausado: (v) => [!!v], sinal_pct: (v) => [num(v, 0, 100)], condicoes: (v) => txt(v, 1200),
      checkin_hora: (v) => txt(v, 10), checkout_hora: (v) => txt(v, 10), politica_pets: (v) => txt(v, 600),
      // Mensagens prontas (Ajustes › Mensagens)
      channex_precos: (v) => [!!v], channex_markup: (v) => [num(v || 0, -50, 200)],
      pix_chave: (v) => txt(v, 140), pix_nome: (v) => txt(v, 80), pix_banco: (v) => txt(v, 60),
      link_avaliacao: (v) => { const s = String(v || "").trim(); if (s && !/^https:\/\/\S+$/.test(s)) throw Object.assign(new Error("O link de avaliação precisa começar com https://"), { status: 400 }); return s.slice(0, 300); },
      msg_modelos: (v) => Object.fromEntries(MSG_TIPOS.filter((k) => v && typeof v[k] === "string" && v[k].trim()).map((k) => [k, String(v[k]).replace(/[<>]/g, "").slice(0, 1500)])) };
    for (const [k, f] of Object.entries(permitidas)) {
      if (b[k] === undefined) continue;
      await q(`insert into config(chave, valor) values ($1, $2::jsonb) on conflict (chave) do update set valor = excluded.valor, atualizado_em = now()`, [k, JSON.stringify(f(b[k]))], u.id);
    }
    return { ok: true };
  }],
  quarto_salvar: [D, async (b, u) => {
    const v = [txt(b.nome, 60), int(b.categoria_id, 1), int(b.ordem || 0, 0, 999), b.ativo !== false, txt(b.obs, 300)];
    if (v[0].length < 2) throw Object.assign(new Error("Dê um nome ao quarto."), { status: 400 });
    if (b.id) await q(`update quartos set nome=$2, categoria_id=$3, ordem=$4, ativo=$5, obs=$6 where id=$1`, [int(b.id, 1), ...v], u.id);
    else await q(`insert into quartos(nome, categoria_id, ordem, ativo, obs) values ($1,$2,$3,$4,$5)`, v, u.id);
    return { ok: true };
  }],
  categoria_salvar: [D, async (b, u) => {
    const fotos = (Array.isArray(b.fotos) ? b.fotos : []).filter((x) => /^https:\/\/\S+$/.test(String(x))).slice(0, 12);
    const car = (Array.isArray(b.caracteristicas) ? b.caracteristicas : []).map((x) => txt(x, 40)).filter(Boolean).slice(0, 12);
    await q(`update categorias set nome=$2, resumo=$3, descricao=$4, capacidade=$5, no_site=$6, fotos=$7::jsonb, caracteristicas=$8::jsonb where id=$1`,
      [int(b.id, 1), txt(b.nome, 80), txt(b.resumo, 160), txt(b.descricao, 1200), int(b.capacidade, 1, 12), b.no_site !== false, JSON.stringify(fotos), JSON.stringify(car)], u.id);
    return { ok: true };
  }],
  video_salvar: [D, async (b, u) => {
    const url = String(b.url || "").trim();
    if (!/^https:\/\/\S+$/.test(url)) throw Object.assign(new Error("Link do vídeo inválido."), { status: 400 });
    const capa = /^https:\/\/\S+$/.test(String(b.capa || "")) ? String(b.capa) : "";
    if (b.id) await q(`update videos set titulo=$2, url=$3, capa=$4, ordem=$5, ativo=$6 where id=$1`, [int(b.id, 1), txt(b.titulo, 80), url, capa, int(b.ordem || 0, 0, 999), b.ativo !== false], u.id);
    else await q(`insert into videos(titulo, url, capa, ordem) values ($1,$2,$3,$4)`, [txt(b.titulo, 80), url, capa, int(b.ordem || 0, 0, 999)], u.id);
    return { ok: true };
  }],
  video_del: [D, async (b, u) => { await q(`delete from videos where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],
  // ---------------- Central de dúvidas do site ----------------
  faq_painel: [D, async (b) => {
    const dias = int(b.dias || 30, 1, 365);
    const [itens, resumo, falta, vistas] = await Promise.all([
      q(`select id, tema, pergunta, resposta, palavras, traducoes, ordem, ativo, atualizado_em from faq order by ordem, id`),
      q1(`select count(*)::int buscas, count(*) filter (where achou)::int acharam, count(*) filter (where faq_id is not null)::int abriram,
                 count(*) filter (where perguntou)::int perguntaram
            from faq_buscas where atualizado_em > now() - make_interval(days => $1)`, [dias]),
      // O que procuraram e não acharam (ou acharam, mas ainda foram perguntar no WhatsApp)
      q(`select x.termo_norm, x.n, x.sem_resposta, x.perguntaram, x.ultima,
                (select termo from faq_buscas f where f.termo_norm = x.termo_norm order by atualizado_em desc limit 1) termo,
                (select string_agg(distinct idioma, ',') from faq_buscas f where f.termo_norm = x.termo_norm) idiomas
           from (select f.termo_norm, count(*)::int n, count(*) filter (where not f.achou)::int sem_resposta,
                        count(*) filter (where f.perguntou)::int perguntaram, max(f.atualizado_em) ultima
                   from faq_buscas f left join faq_termos t on t.termo_norm = f.termo_norm
                  where f.atualizado_em > now() - make_interval(days => $1) and (not f.achou or f.perguntou)
                    and (t.em is null or f.atualizado_em > t.em)   -- já respondido/ignorado: só conta o que veio depois
                  group by f.termo_norm) x
          order by x.n desc, x.ultima desc limit 60`, [dias]),
      q(`select faq_id, count(*)::int n from faq_buscas where faq_id is not null and atualizado_em > now() - make_interval(days => $1) group by faq_id`, [dias]),
    ]);
    return { itens, resumo, falta, vistas: Object.fromEntries(vistas.map((r) => [r.faq_id, r.n])), dias };
  }],
  faq_salvar: [D, async (b, u) => {
    const pergunta = txt(b.pergunta, 200), resposta = String(b.resposta ?? "").replace(/[<>]/g, "").trim().slice(0, 1500);
    if (pergunta.length < 3) throw Object.assign(new Error("Escreva a pergunta."), { status: 400 });
    if (resposta.length < 2) throw Object.assign(new Error("Escreva a resposta."), { status: 400 });
    const tr = {};
    for (const l of ["es", "en"]) {
      const x = (b.traducoes && b.traducoes[l]) || {};
      const y = { t: txt(x.t, 60), p: txt(x.p, 200), r: String(x.r ?? "").replace(/[<>]/g, "").trim().slice(0, 1500) };
      if (y.p && y.r) tr[l] = y;
    }
    const v = [txt(b.tema, 60) || "Geral", pergunta, resposta, txt(b.palavras, 400), JSON.stringify(tr), int(b.ordem || 0, 0, 9999), b.ativo !== false];
    let id;
    if (b.id) { id = int(b.id, 1); await q(`update faq set tema=$2, pergunta=$3, resposta=$4, palavras=$5, traducoes=$6::jsonb, ordem=$7, ativo=$8, atualizado_em=now() where id=$1`, [id, ...v], u.id); }
    else id = (await q1(`insert into faq(tema, pergunta, resposta, palavras, traducoes, ordem, ativo) values ($1,$2,$3,$4,$5::jsonb,$6,$7) returning id`, v, u.id)).id;
    // Respondendo a uma busca sem resposta: ela sai da lista
    const termos = (Array.isArray(b.termos) ? b.termos : []).map((x) => chaveBusca(x)).filter((x) => x.length >= 2).slice(0, 20);
    for (const k of termos) await q(`insert into faq_termos(termo_norm, como, faq_id) values ($1,'respondido',$2) on conflict (termo_norm) do update set como='respondido', faq_id=$2, em=now()`, [k, id]);
    return { ok: true, id };
  }],
  faq_del: [D, async (b, u) => { await q(`delete from faq where id = $1`, [int(b.id, 1)], u.id); return { ok: true }; }],
  faq_termo: [D, async (b) => {
    const k = chaveBusca(b.termo);
    if (k.length < 2) throw Object.assign(new Error("Termo inválido."), { status: 400 });
    if (b.voltar) await q(`delete from faq_termos where termo_norm = $1`, [k]);
    else await q(`insert into faq_termos(termo_norm, como) values ($1,'ignorado') on conflict (termo_norm) do update set como='ignorado', em=now()`, [k]);
    return { ok: true };
  }],

  usuario_salvar: [D, async (b, u) => {
    const login = txt(b.login, 40).toLowerCase(), papel = umDe(b.papel, ["dono", "recepcao", "equipe"]);
    if (!/^[a-z0-9._-]{3,40}$/.test(login)) throw Object.assign(new Error("Login: use 3 a 40 letras minúsculas, números, ponto ou traço."), { status: 400 });
    if (b.id && int(b.id, 1) === u.id && (papel !== "dono" || b.ativo === false)) throw Object.assign(new Error("Você não pode tirar o seu próprio acesso de dono."), { status: 400 });
    const areas = papel === "dono" ? null : (Array.isArray(b.areas) ? [...new Set(b.areas.map(String).filter((x) => AREAS.includes(x)))] : null);
    if (b.senha) { const f = senhaForte(b.senha); if (f) throw Object.assign(new Error(f), { status: 400 }); }
    if (b.id) {
      await q(`update usuarios set nome=$2, login=$3, papel=$4, ativo=$5, areas=$6 where id=$1`, [int(b.id, 1), txt(b.nome, 80), login, papel, b.ativo !== false, areas], u.id);
      if (b.senha) await q(`update usuarios set senha_hash=$2 where id=$1`, [int(b.id, 1), hashSenha(b.senha)], u.id);
      if (b.senha || b.ativo === false) await q(`delete from sessoes where usuario_id = $1`, [int(b.id, 1)]);
    } else {
      if (!b.senha) throw Object.assign(new Error("Defina uma senha inicial."), { status: 400 });
      await q(`insert into usuarios(nome, login, senha_hash, papel, areas) values ($1,$2,$3,$4,$5)`, [txt(b.nome, 80), login, hashSenha(b.senha), papel, areas], u.id);
    }
    return { ok: true };
  }],
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return responde(res, 405, { erro: "método" });
    if (!origemOk(req)) return responde(res, 403, { erro: "origem" });
    const u = await usuarioDe(req);
    if (!u) return responde(res, 401, { erro: "sessao" });
    const b = corpo(req);
    const acao = ACOES[String(b.a || "")];
    if (!acao) return responde(res, 400, { erro: "Ação desconhecida." });
    if (!podeAcao(String(b.a), acao, u)) return responde(res, 403, { erro: "Seu usuário não tem permissão para isso." });
    const out = await acao[1](b, u);
    // Mudou ocupação ou preço: avisa o Channex (Booking) na hora. Se o Channex falhar, a ação já foi salva; fica no log.
    if (SYNC_CHANNEX.has(String(b.a)) && channexOn()) await enviaARI(`após ${b.a}`).catch((e) => import("./_channex.js").then((m) => m.log("envio", false, e.message)));
    return responde(res, 200, out);
  } catch (e) { return falha(res, e); }
}
export { ACOES };
