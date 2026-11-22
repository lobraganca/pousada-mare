import { q, hoje, responde, falha } from "./_db.js";

// Roda todo dia às 7h (horário da Bahia). Configurado em vercel.json.
//  • cria tarefas de arrumação para as chegadas do dia
//  • avisa (tarefa) reservas que deveriam ter chegado ontem e não fizeram check-in → decidir no-show
//  • limpa sessões vencidas, pedidos do site e buscas da Central de dúvidas com mais de 1 ano (LGPD)
export default async function handler(req, res) {
  try {
    const seg = process.env.CRON_SECRET;
    if (!seg || req.headers.authorization !== `Bearer ${seg}`) return responde(res, 401, { erro: "não autorizado" });
    const d = hoje();
    await q(`insert into tarefas(titulo, quarto_id, prazo, prioridade, origem)
             select 'Preparar ' || qt.nome || ' para chegada de ' || split_part(h.nome, ' ', 1), o.quarto_id, $1::date, 'alta', 'auto_chegada'
               from ocupacoes o join reservas r on r.id = o.reserva_id join hospedes h on h.id = r.hospede_id join quartos qt on qt.id = o.quarto_id
              where o.ativo and lower(o.periodo) = $1::date and r.status in ('pre','confirmada')
                and not exists (select 1 from tarefas t where t.origem = 'auto_chegada' and t.quarto_id = o.quarto_id and t.prazo = $1::date)`, [d]);
    await q(`insert into tarefas(titulo, prazo, prioridade, origem)
             select 'Verificar no-show: ' || h.nome || ' (' || r.codigo || ') não fez check-in', $1::date, 'alta', 'auto_noshow'
               from reservas r join hospedes h on h.id = r.hospede_id
              where r.status in ('pre','confirmada') and r.checkin < $1::date
                and not exists (select 1 from tarefas t where t.origem = 'auto_noshow' and t.titulo like '%(' || r.codigo || ')%')`, [d]);
    await q(`delete from sessoes where expira_em < now()`);
    await q(`delete from login_falhas where ate < now()`);
    await q(`delete from leads where atualizado_em < now() - interval '365 days' and status <> 'convertido'`);
    await q(`delete from faq_buscas where atualizado_em < now() - interval '365 days'`);
    return responde(res, 200, { ok: true });
  } catch (e) { return falha(res, e); }
}
