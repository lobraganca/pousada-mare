import { q, q1, corpo, responde, falha, ipDe, limite, txt, isData, hoje } from "./_db.js";

// API pública do site. Só expõe: suítes, preços, nº de quartos livres, cardápio e vídeos.
// NUNCA devolve nomes, telefones ou reservas de hóspedes.
const CFG_PUBLICA = ["whatsapp", "whatsapp_restaurante", "vendas_ate", "site_pausado", "sinal_pct", "condicoes", "checkin_hora", "checkout_hora", "politica_pets"];

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

    return responde(res, 404, { erro: "não encontrado" });
  } catch (e) { return falha(res, e); }
}
