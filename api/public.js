import { q, q1, corpo, responde, falha, ipDe, limite, txt, isData, hoje } from "./_db.js";
import { validaFicha } from "./_ficha.js";

// API pública do site. Só expõe: suítes, preços, nº de quartos livres, cardápio e vídeos.
// NUNCA devolve nomes, telefones ou reservas de hóspedes.
// Palavras que não ajudam a agrupar buscas ("tem estacionamento?" = "estacionamento")
const VAZIAS = new Set("a o os as um uma uns umas de da do das dos e em no na nos nas para pra pro por com sem que se tem ter tenho voces voce vcs vc eu meu minha qual quais como onde quando posso pode podem ha ao aos la el los las es un una y con hay puedo the an is are do does can i you to of in for it there".split(" "));
export const normaliza = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export const chaveBusca = (s) => { const n = normaliza(s); const k = n.split(" ").filter((w) => w && !VAZIAS.has(w)).join(" "); return (k || n).slice(0, 120); };

const CFG_PUBLICA = ["whatsapp", "whatsapp_restaurante", "vendas_ate", "site_pausado", "sinal_pct", "condicoes", "checkin_hora", "checkout_hora", "politica_pets", "empresa_razao", "empresa_cnpj", "empresa_endereco", "empresa_cadastur"];

export default async function handler(req, res) {
  try {
    const a = String(req.query?.a || "");

    if (req.method === "GET" && a === "site") {
      const [cats, cfg, menu, vids, temps] = await Promise.all([
        q(`select c.id, c.slug, c.nome, c.resumo, c.descricao, c.capacidade, c.area_m2, c.caracteristicas, c.fotos,
                  coalesce((select jsonb_object_agg(pessoas, valor) from tarifas t where t.categoria_id = c.id), '{}') tarifas,
                  (select count(*) from quartos q where q.categoria_id = c.id and q.ativo)::int quartos
             from categorias c where c.no_site order by c.ordem`),
        q(`select chave, valor from config where chave = any($1)`, [CFG_PUBLICA]),
        q(`select id, tipo, grupo, nome, descricao, preco from produtos where ativo and no_cardapio and tipo in ('restaurante','bar') order by ordem, nome`),
        q(`select id, titulo, url, capa from videos where ativo order by ordem, id`),
        q(`select nome, lower(periodo) ini, upper(periodo) fim, ajuste_pct, min_noites from temporadas where upper(periodo) >= current_date order by lower(periodo)`),
      ]);
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({
        categorias: cats, cardapio: menu, videos: vids, temporadas: temps,
        config: Object.fromEntries(cfg.map((r) => [r.chave, r.valor])),
      }));
    }

    if (req.method === "GET" && a === "disp") {
      const i = String(req.query.in || ""), o = String(req.query.out || "");
      if (!isData(i) || !isData(o) || i < hoje()) return responde(res, 400, { erro: "datas" });
      if (!(await limite(`disp:${ipDe(req)}`, 120, 600))) return responde(res, 429, { erro: "Muitas consultas. Aguarde alguns minutos." });
      const r = await q1(`select disponibilidade_publica($1::date, $2::date) d`, [i, o]);
      return responde(res, 200, r.d);
    }

    // Pré-reserva sendo montada no site: salva mesmo que a pessoa NÃO envie no WhatsApp.
    if (req.method === "POST" && a === "lead") {
      const b = corpo(req);
      const id = txt(b.id, 40).replace(/[^\w-]/g, "");
      const nome = txt(b.nome, 80), tel = String(b.telefone || "").replace(/\D/g, "").slice(0, 15);
      if (id.length < 6 || (nome.length < 2 && tel.length < 8)) return responde(res, 204, {});
      const existe = await q1(`select status from leads where id = $1`, [id]);
      if (!existe && !(await limite(`lead:${ipDe(req)}`, 15, 3600))) return responde(res, 204, {});
      const itens = Array.isArray(b.itens) ? b.itens.slice(0, 13).map((x) => ({
        categoria: txt(x.categoria, 80), quartos: Math.max(1, Math.min(13, parseInt(x.quartos) || 1)),
        adultos: Math.max(0, Math.min(12, parseInt(x.adultos) || 0)), criancas: Math.max(0, Math.min(12, parseInt(x.criancas) || 0)),
      })) : [];
      const ci = isData(b.checkin) ? b.checkin : null, co = isData(b.checkout) ? b.checkout : null;
      const cidade = (() => { try { return decodeURIComponent(String(req.headers["x-vercel-ip-city"] || "")).slice(0, 60); } catch { return ""; } })();
      await q(
        `insert into leads(id, nome, telefone, cidade, checkin, checkout, adultos, criancas, itens, valor_estimado, obs, etapa, enviado, enviado_em, origem_aprox)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13, case when $13 then now() end, $14)
         on conflict (id) do update set
           nome = coalesce(nullif(excluded.nome,''), leads.nome), telefone = coalesce(nullif(excluded.telefone,''), leads.telefone),
           cidade = coalesce(nullif(excluded.cidade,''), leads.cidade), checkin = coalesce(excluded.checkin, leads.checkin),
           checkout = coalesce(excluded.checkout, leads.checkout), adultos = excluded.adultos, criancas = excluded.criancas,
           itens = excluded.itens, valor_estimado = excluded.valor_estimado, obs = excluded.obs,
           etapa = greatest(leads.etapa, excluded.etapa),
           enviado = leads.enviado or excluded.enviado, enviado_em = coalesce(leads.enviado_em, excluded.enviado_em),
           atualizado_em = now()
         where leads.status in ('novo','contatado')`,
        [id, nome, tel, txt(b.cidade, 60), ci, co, Math.min(60, parseInt(b.adultos) || 0), Math.min(60, parseInt(b.criancas) || 0),
         JSON.stringify(itens), Math.max(0, Math.min(1e6, Number(b.valor) || 0)), txt(b.obs, 400), Math.min(4, parseInt(b.etapa) || 1), !!b.enviado, cidade]);
      return responde(res, 204, {});
    }

    // Central de dúvidas: perguntas e respostas publicadas (com o texto de Ajustes que algumas usam)
    // Check-in online: o hóspede abre o link secreto da reserva e preenche a ficha.
    // O link só funciona até o dia da saída e não mostra valores nem dados de outras reservas.
    if (a === "ficha") {
      const b = req.method === "POST" ? corpo(req) : {};
      const tk = String(req.method === "POST" ? b.t : req.query.t || "");
      if (!/^[A-Za-z0-9_-]{20,60}$/.test(tk)) return responde(res, 404, { erro: "link" });
      if (!(await limite(`ficha:${ipDe(req)}`, 40, 3600))) return responde(res, 429, { erro: "Muitas tentativas. Aguarde alguns minutos." });
      const r = await q1(`select r.id, r.codigo, r.status, r.checkin, r.checkout, r.adultos, r.criancas, r.ficha, r.ficha_em, h.nome
                            from reservas r join hospedes h on h.id = r.hospede_id
                           where r.checkin_token = $1 and r.status in ('pre','confirmada','hospedada') and r.checkout >= $2::date`, [tk, hoje()]);
      if (!r) return responde(res, 404, { erro: "link" });
      const fechada = r.status === "hospedada";
      if (req.method === "GET") {
        const [quartos, cfg] = await Promise.all([
          q(`select distinct c.nome from ocupacoes o join quartos qt on qt.id = o.quarto_id join categorias c on c.id = qt.categoria_id where o.reserva_id = $1 and o.ativo`, [r.id]),
          q(`select chave, valor from config where chave = any($1)`, [["whatsapp", "checkin_hora", "checkout_hora"]]),
        ]);
        return responde(res, 200, { nome: r.nome, codigo: r.codigo, checkin: r.checkin, checkout: r.checkout, adultos: r.adultos, criancas: r.criancas,
          suites: quartos.map((x) => x.nome), ficha: r.ficha, ficha_em: r.ficha_em, fechada, config: Object.fromEntries(cfg.map((x) => [x.chave, x.valor])) });
      }
      if (req.method !== "POST") return responde(res, 405, { erro: "método" });
      if (fechada) return responde(res, 409, { erro: "O check-in desta reserva já foi feito na recepção." });
      const f = validaFicha(b.ficha, r);
      const nomes = f.acompanhantes.map((p) => p.nome).join("\n");
      await q(`update reservas set ficha = $2::jsonb, ficha_em = now(), ficha_conferida_em = null,
                      acompanhantes = case when $3 <> '' then $3 else acompanhantes end where id = $1`, [r.id, JSON.stringify(f), nomes]);
      await q(`update reservas set acompanhantes_dados = $2::jsonb where id = $1`, [r.id, JSON.stringify(f.acompanhantes.map((p) => ({ nome: p.nome, doc_tipo: p.doc_tipo, doc: p.doc, nascimento: p.nascimento, vinculo: p.vinculo || "", parentesco: p.parentesco || "" })))]).catch(() => {});
      await q(`update hospedes set documento = $2, email = case when $3 <> '' then $3 else email end, cidade = case when $4 <> '' then $4 else cidade end
                where id = (select hospede_id from reservas where id = $1)`,
        [r.id, (f.titular.doc_tipo === "cpf" ? "CPF " : f.titular.doc_tipo.toUpperCase() + " ") + f.titular.doc, f.titular.email, [f.titular.cidade, f.titular.uf].filter(Boolean).join(" / ").slice(0, 60)]);
      return responde(res, 200, { ok: true });
    }

    if (req.method === "GET" && a === "faq") {
      const [itens, cfg] = await Promise.all([
        q(`select id, tema, pergunta, resposta, palavras, traducoes from faq where ativo order by ordem, id`),
        q(`select chave, valor from config where chave = any($1)`, [["whatsapp", "condicoes", "politica_pets", "checkin_hora", "checkout_hora"]]),
      ]);
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ itens, config: Object.fromEntries(cfg.map((r) => [r.chave, r.valor])) }));
    }

    // Registra o que a pessoa procurou (só o texto da busca; nada que identifique quem foi).
    // Cada busca tem um id criado no navegador: enquanto a pessoa digita, a mesma linha é atualizada.
    if (req.method === "POST" && a === "busca") {
      const b = corpo(req);
      const id = String(b.id || "");
      const termo = txt(b.termo, 120);
      if (!/^[A-Za-z0-9_-]{8,40}$/.test(id) || termo.length < 2) return responde(res, 204, {});
      const chave = chaveBusca(termo);
      if (chave.length < 2) return responde(res, 204, {});
      const existe = await q1(`select 1 from faq_buscas where id = $1`, [id]);
      if (!existe && !(await limite(`busca:${ipDe(req)}`, 60, 3600))) return responde(res, 204, {});
      const faqId = Number.isInteger(b.faq_id) && b.faq_id > 0 ? b.faq_id : null;
      const idioma = ["pt", "es", "en"].includes(b.idioma) ? b.idioma : "pt";
      await q(
        `insert into faq_buscas(id, termo, termo_norm, idioma, achou, faq_id, perguntou)
         values ($1, $2, $3, $4, $5, (select id from faq where id = $6), $7)
         on conflict (id) do update set
           termo = excluded.termo, termo_norm = excluded.termo_norm, achou = excluded.achou,
           faq_id = coalesce(excluded.faq_id, faq_buscas.faq_id),
           perguntou = faq_buscas.perguntou or excluded.perguntou, atualizado_em = now()
         where faq_buscas.criado_em > now() - interval '1 day'`,
        [id, termo, chave, idioma, !!b.achou, faqId, !!b.perguntou]);
      return responde(res, 204, {});
    }

    return responde(res, 404, { erro: "não encontrado" });
  } catch (e) { return falha(res, e); }
}
