import { q, q1, hoje } from "./_db.js";

// =====================================================================
//  Integração com o Channex (channel manager que conversa com o Booking)
//  • Saída: manda para o Channex quantos quartos de cada suíte estão livres
//    em cada dia (e, se ligado, o preço). O Channex repassa ao Booking.
//  • Entrada: quando chega/muda/cancela uma reserva no Booking, o Channex
//    avisa (webhook em /api/channex) e o sistema puxa, lança e confirma (ack).
//  Variáveis na Vercel: CHANNEX_API_KEY, CHANNEX_PROPERTY_ID,
//  CHANNEX_WEBHOOK_SECRET e, só para testes, CHANNEX_URL (staging).
// =====================================================================
const BASE = () => String(process.env.CHANNEX_URL || "https://secure.channex.io/api/v1").replace(/\/+$/, "");
const PROP = () => String(process.env.CHANNEX_PROPERTY_ID || "").trim();
export const channexOn = () => !!(String(process.env.CHANNEX_API_KEY || "").trim() && PROP());
const DIAS = 500; // janela enviada ao Channex (a partir de hoje)

async function cx(method, path, body) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(BASE() + path, { method, signal: ac.signal, headers: { "user-api-key": String(process.env.CHANNEX_API_KEY).trim(), "Content-Type": "application/json", Accept: "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(`Channex respondeu ${r.status}: ${JSON.stringify(j.errors || j).slice(0, 300)}`), { channex: true });
    return j;
  } catch (e) { if (e.name === "AbortError") throw Object.assign(new Error("Channex não respondeu a tempo."), { channex: true }); throw e; }
  finally { clearTimeout(t); }
}
export async function log(tipo, ok, detalhe) {
  try { await q(`insert into channex_log(tipo, ok, detalhe) values ($1, $2, $3)`, [tipo, ok, String(detalhe || "").slice(0, 1000)]); } catch { /* log nunca derruba a operação */ }
}
const addDia = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const iso = (d) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

// Junta dias seguidos com o mesmo valor em um intervalo (menos dados para o Channex)
function faixas(linhas, chave, extra) {
  const out = []; let cur = null;
  for (const l of linhas) {
    const v = l[chave], d = iso(l.dia);
    if (cur && cur.v === v && cur.k === l.k && addDia(cur.date_to, 1) === d) { cur.date_to = d; continue; }
    if (cur) out.push(cur);
    cur = { k: l.k, v, date_from: d, date_to: d, ...extra(l) };
  }
  if (cur) out.push(cur);
  return out.map(({ k, v, ...r }) => r);
}

// Tipos de quarto e planos de tarifa da propriedade no Channex (para ligar com as suítes)
export async function listas() {
  const p = encodeURIComponent(PROP());
  const [rt, rp] = await Promise.all([
    cx("GET", `/room_types?filter[property_id]=${p}&pagination[limit]=100`),
    cx("GET", `/rate_plans?filter[property_id]=${p}&pagination[limit]=100`),
  ]);
  return {
    room_types: (rt.data || []).map((x) => ({ id: x.id, nome: x.attributes?.title, quartos: x.attributes?.count_of_rooms })),
    rate_plans: (rp.data || []).map((x) => ({ id: x.id, nome: x.attributes?.title, room_type_id: x.relationships?.room_type?.data?.id || x.attributes?.room_type_id })),
  };
}

// Envia disponibilidade (e preços, se ligado) dos próximos dias
export async function enviaARI(motivo = "") {
  if (!channexOn()) return { ok: false, motivo: "não configurado" };
  const ini = hoje(), fim = addDia(ini, DIAS - 1);
  const cats = await q(`select id, channex_room_type, channex_rate_plan from categorias where coalesce(channex_room_type,'') <> ''`);
  if (!cats.length) return { ok: false, motivo: "nenhuma suíte ligada ao Channex" };
  const disp = await q(
    `select c.id k, d::date dia,
            (select count(*) from quartos qt where qt.categoria_id = c.id and qt.ativo
               and not exists (select 1 from ocupacoes o where o.quarto_id = qt.id and o.ativo and o.periodo @> d::date))::int livres
       from categorias c, generate_series($1::date, $2::date, interval '1 day') d
      where coalesce(c.channex_room_type,'') <> '' order by c.id, d`, [ini, fim]);
  const porCat = Object.fromEntries(cats.map((c) => [c.id, c]));
  const values = faixas(disp, "livres", (l) => ({ property_id: PROP(), room_type_id: porCat[l.k].channex_room_type, availability: l.livres }));
  const r1 = await cx("POST", "/availability", { values });
  const avisos = [...(r1.meta?.warnings || [])];
  let nPrecos = 0;
  const cfg = await q1(`select (select (valor->>0)::boolean from config where chave = 'channex_precos') precos, (select (valor->>0)::numeric from config where chave = 'channex_markup') markup`);
  if (cfg?.precos) {
    const mk = 1 + (Number(cfg.markup) || 0) / 100;
    const comPlano = cats.filter((c) => c.channex_rate_plan);
    if (comPlano.length) {
      const pr = await q(
        `select c.id k, d::date dia, round(preco_noite(c.id, coalesce((select pessoas from tarifas t where t.categoria_id = c.id order by (pessoas >= 2) desc, case when pessoas >= 2 then pessoas else -pessoas end limit 1), 2), d::date) * $3, 2) valor
           from categorias c, generate_series($1::date, $2::date, interval '1 day') d
          where coalesce(c.channex_rate_plan,'') <> '' order by c.id, d`, [ini, fim, mk]);
      const rv = faixas(pr.filter((x) => Number(x.valor) > 0), "valor", (l) => ({ property_id: PROP(), rate_plan_id: porCat[l.k].channex_rate_plan, rate: Number(l.valor).toFixed(2) }));
      nPrecos = rv.length;
      if (rv.length) { const r2 = await cx("POST", "/restrictions", { values: rv }); avisos.push(...(r2.meta?.warnings || [])); }
    }
  }
  await log("envio", !avisos.length, `${motivo ? motivo + " · " : ""}${values.length} faixas de disponibilidade${nPrecos ? `, ${nPrecos} de preço` : ""}${avisos.length ? " · avisos: " + JSON.stringify(avisos).slice(0, 500) : ""}`);
  return { ok: true, faixas: values.length, precos: nPrecos, avisos };
}

// Escolhe um quarto livre da suíte (prefere os que a reserva já ocupa, quando é alteração)
async function quartoLivre(cat, ci, co, reservaId, usados) {
  const r = await q1(
    `select qt.id from quartos qt
      where qt.categoria_id = $1 and qt.ativo and not (qt.id = any($5::int[]))
        and not exists (select 1 from ocupacoes o where o.quarto_id = qt.id and o.ativo and o.periodo && daterange($2::date, $3::date)
                          and o.reserva_id is distinct from $4)
      order by exists (select 1 from ocupacoes o where o.quarto_id = qt.id and o.reserva_id = $4 and o.ativo) desc, qt.ordem, qt.id limit 1`,
    [cat, ci, co, reservaId, usados]);
  return r ? r.id : null;
}

async function aplica(rev) {
  const a = rev.attributes || rev;
  const bid = String(a.booking_id || ""), ota = String(a.ota_name || "Channex"), cod = String(a.ota_reservation_code || a.unique_id || "");
  const ant = await q1(`select * from channex_reservas where booking_id = $1`, [bid]);
  const cli = a.customer || {}, nome = [cli.name, cli.surname].filter(Boolean).join(" ").trim() || `Hóspede ${ota}`;
  const guarda = (reservaId, erro) => q(
    `insert into channex_reservas(booking_id, reserva_id, revision_id, status, ota, codigo_ota, nome, erro, atualizado_em)
     values ($1,$2,$3,$4,$5,$6,$7,$8, now())
     on conflict (booking_id) do update set reserva_id = coalesce(excluded.reserva_id, channex_reservas.reserva_id), revision_id = excluded.revision_id,
       status = excluded.status, ota = excluded.ota, codigo_ota = excluded.codigo_ota, nome = excluded.nome, erro = excluded.erro, atualizado_em = now()`,
    [bid, reservaId, rev.id, a.status, ota, cod, nome, erro]);
  try {
    if (a.status === "cancelled") {
      if (ant?.reserva_id) {
        const st = await q1(`select status from reservas where id = $1`, [ant.reserva_id]);
        if (st && !["cancelada", "no_show", "finalizada"].includes(st.status)) await q(`select reserva_status($1, 'cancelada', $2, null)`, [ant.reserva_id, `Cancelada no ${ota}`]);
      }
      await guarda(ant?.reserva_id || null, null);
      return { acao: "cancelada", reserva_id: ant?.reserva_id || null };
    }
    const cats = await q(`select id, channex_room_type from categorias where coalesce(channex_room_type,'') <> ''`);
    const catDe = (rt) => (cats.find((c) => c.channex_room_type === rt) || {}).id;
    const usados = [], quartos = [];
    for (const rm of a.rooms || []) {
      const cat = catDe(rm.room_type_id);
      if (!cat) throw Object.assign(new Error(`tipo de quarto do Channex ${rm.room_type_id} não está ligado a nenhuma suíte`), { amigavel: true });
      const ci = rm.checkin_date || a.arrival_date, co = rm.checkout_date || a.departure_date;
      const qid = await quartoLivre(cat, ci, co, ant?.reserva_id || null, usados);
      if (!qid) throw Object.assign(new Error(`não há quarto livre da suíte para ${ci} a ${co} (possível overbooking)`), { amigavel: true });
      usados.push(qid);
      const noites = Math.max(1, Math.round((Date.parse(co) - Date.parse(ci)) / 864e5));
      const oc = rm.occupancy || {};
      const item = { quarto_id: qid, checkin: ci, checkout: co, adultos: Math.min(12, +oc.adults || 1), criancas: Math.min(12, (+oc.children || 0) + (+oc.infants || 0)) };
      if (Number(rm.amount) > 0) item.valor_diaria = Math.round(Number(rm.amount) / noites * 100) / 100;
      quartos.push(item);
    }
    if (!quartos.length) throw Object.assign(new Error("reserva sem quartos"), { amigavel: true });
    const obs = [`${ota} #${cod}`, a.arrival_hour ? `Chegada prevista: ${a.arrival_hour}` : "", a.notes ? String(a.notes).slice(0, 600) : ""].filter(Boolean).join("\n");
    const p = { id: ant?.reserva_id || null, hospede: { nome: nome.slice(0, 120), telefone: String(cli.phone || "").replace(/\D/g, "").slice(0, 15), email: String(cli.mail || "").slice(0, 120) },
      origem: /booking/i.test(ota) ? "booking" : "outro", status: "confirmada", obs, quartos };
    if (ant?.reserva_id) { const st = await q1(`select status from reservas where id = $1`, [ant.reserva_id]); if (st && st.status !== "confirmada") p.status = st.status === "pre" ? "confirmada" : st.status === "hospedada" ? "hospedada" : "confirmada"; }
    const r = await q1(`select reserva_salvar($1::jsonb, null) r`, [JSON.stringify(p)]);
    await guarda(r.r.id, null);
    return { acao: ant?.reserva_id ? "alterada" : "nova", reserva_id: r.r.id };
  } catch (e) {
    if (!e.amigavel) throw e; // erro de rede/banco: não confirma, o Channex reenvia
    await guarda(ant?.reserva_id || null, e.message);
    await q(`insert into tarefas(titulo, descricao, prazo, prioridade, origem)
             select $1, $2, current_date, 'alta', 'auto_channex'
              where not exists (select 1 from tarefas where origem = 'auto_channex' and titulo = $1 and status in ('aberta','andamento'))`,
      [`${ota}: reserva ${cod} de ${nome} precisa de atenção`.slice(0, 140), `O sistema não conseguiu lançar sozinho: ${e.message}. Confira no Channex e lance ou ajuste a reserva à mão.`]);
    return { acao: "erro", erro: e.message };
  }
}

// Puxa as reservas novas/alteradas/canceladas que ainda não foram confirmadas (ack)
export async function puxaReservas(motivo = "") {
  if (!channexOn()) return { ok: false, motivo: "não configurado" };
  const res = { novas: 0, alteradas: 0, canceladas: 0, erros: 0 };
  for (let pagina = 0; pagina < 10; pagina++) {
    const f = await cx("GET", `/booking_revisions/feed?filter[property_id]=${encodeURIComponent(PROP())}&order[inserted_at]=asc`);
    const lista = f.data || [];
    if (!lista.length) break;
    for (const rev of lista) {
      const r = await aplica(rev);
      res[{ nova: "novas", alterada: "alteradas", cancelada: "canceladas", erro: "erros" }[r.acao]]++;
      await cx("POST", `/booking_revisions/${encodeURIComponent(rev.id)}/ack`);
    }
    if (lista.length < 10) break;
  }
  const total = res.novas + res.alteradas + res.canceladas + res.erros;
  if (total) await log("reservas", !res.erros, `${motivo ? motivo + " · " : ""}${res.novas} novas, ${res.alteradas} alteradas, ${res.canceladas} canceladas${res.erros ? `, ${res.erros} com erro (ver tarefas)` : ""}`);
  if (total - res.erros > 0) await enviaARI("depois de reservas do Channex").catch((e) => log("envio", false, e.message));
  return { ok: true, ...res };
}
