import { q, hoje, responde, falha } from "./_db.js";
import { channexOn, puxaReservas, enviaARI, log } from "./_channex.js";

// Roda todo dia às 7h (horário da Bahia). Configurado em vercel.json.
//  • cria tarefas de arrumação para as chegadas do dia
//  • avisa (tarefa) reservas que deveriam ter chegado ontem e não fizeram check-in → decidir no-show
//  • lembretes: cobrar sinal (pré-reserva +24h), véspera da chegada, chegada sem check-in online, pedir avaliação
//  • limpa sessões vencidas, pedidos do site e buscas da Central de dúvidas com mais de 1 ano (LGPD)
//  • apaga a ficha de hóspede (documento, acompanhantes) 5 anos depois da saída (LGPD)
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
    // ---- Atendimento: lembretes para a recepção (uma tarefa por reserva enquanto estiver aberta) ----
    const semTarefa = (origem) => `not exists (select 1 from tarefas t where t.origem = '${origem}' and t.titulo like '%(' || r.codigo || ')%' and t.status in ('aberta','andamento'))`;
    // Pré-reserva há mais de 24h sem o sinal
    await q(`insert into tarefas(titulo, descricao, prazo, prioridade, origem)
             select 'Cobrar sinal: ' || h.nome || ' (' || r.codigo || ')', 'Pré-reserva feita há ' || (current_date - r.criado_em::date) || ' dia(s) e o sinal ainda não entrou. Use a mensagem pronta "Dados do Pix" na reserva.', $1::date, 'alta', 'auto_sinal'
               from reservas r join hospedes h on h.id = r.hospede_id
              where r.status = 'pre' and r.criado_em < now() - interval '24 hours' and r.checkin >= $1::date
                and coalesce((select sum(valor) from pagamentos p where p.reserva_id = r.id and p.tipo in ('sinal','saldo','extra')), 0) < greatest(r.sinal_previsto, 0.01)
                and ${semTarefa("auto_sinal")}`, [d]);
    // Chega amanhã: mandar o lembrete da véspera (e o check-in online, se não fez)
    await q(`insert into tarefas(titulo, descricao, prazo, prioridade, origem)
             select 'Lembrete da véspera: ' || h.nome || ' (' || r.codigo || ') chega amanhã',
                    case when r.ficha is null then 'Ainda não fez o check-in online. Mande a mensagem pronta "Lembrete da véspera", que já leva o link.' else 'Check-in online já preenchido. Mande a mensagem pronta "Lembrete da véspera".' end,
                    $1::date, 'normal', 'auto_vespera'
               from reservas r join hospedes h on h.id = r.hospede_id
              where r.status in ('pre','confirmada') and r.checkin = $1::date + 1 and r.mensagens->>'vespera' is null and h.telefone <> ''
                and ${semTarefa("auto_vespera")}`, [d]);
    // Chega hoje sem check-in online: conferir documentos no balcão
    await q(`insert into tarefas(titulo, descricao, prazo, prioridade, origem)
             select 'Sem check-in online: ' || h.nome || ' (' || r.codigo || ') chega hoje', 'Na chegada, peça o documento e os dados dos acompanhantes, ou envie o link do check-in online pela reserva.', $1::date, 'normal', 'auto_ficha'
               from reservas r join hospedes h on h.id = r.hospede_id
              where r.status in ('pre','confirmada') and r.checkin = $1::date and r.ficha is null
                and ${semTarefa("auto_ficha")}`, [d]);
    // Saiu ontem: pedir avaliação
    await q(`insert into tarefas(titulo, descricao, prazo, prioridade, origem)
             select 'Pedir avaliação: ' || h.nome || ' (' || r.codigo || ')', 'Saiu ontem. Mande a mensagem pronta "Pedir avaliação" na reserva.', $1::date, 'baixa', 'auto_avaliacao'
               from reservas r join hospedes h on h.id = r.hospede_id
              where r.status = 'finalizada' and r.checkout = $1::date - 1 and r.mensagens->>'avaliacao' is null and h.telefone <> ''
                and not exists (select 1 from tarefas t where t.origem = 'auto_avaliacao' and t.titulo like '%(' || r.codigo || ')%')`, [d]);
    // Channex: confere reservas que não chegaram pelo aviso e reenvia toda a disponibilidade (rede de segurança)
    if (channexOn()) {
      await puxaReservas("rotina diária").catch((e) => log("reservas", false, e.message));
      await enviaARI("rotina diária").catch((e) => log("envio", false, e.message));
    }
    await q(`delete from channex_log where em < now() - interval '90 days'`);
    await q(`delete from sessoes where expira_em < now()`);
    await q(`delete from login_falhas where ate < now()`);
    await q(`delete from leads where atualizado_em < now() - interval '365 days' and status <> 'convertido'`);
    await q(`delete from faq_buscas where atualizado_em < now() - interval '365 days'`);
    // Ficha de hóspede: guardada 5 anos após a saída (obrigação legal + defesa), depois é apagada
    await q(`update reservas set ficha = null, acompanhantes = '', checkin_token = null
              where checkout < current_date - interval '5 years' and (ficha is not null or acompanhantes <> '' or checkin_token is not null)`);
    await q(`update reservas set acompanhantes_dados = '[]' where checkout < current_date - interval '5 years' and acompanhantes_dados <> '[]'`).catch(() => {});
    await q(`update hospedes h set nascimento = null where nascimento is not null
              and not exists (select 1 from reservas r where r.hospede_id = h.id and r.checkout >= current_date - interval '5 years')`).catch(() => {});
    await q(`update hospedes h set documento = '' where documento <> ''
              and not exists (select 1 from reservas r where r.hospede_id = h.id and r.checkout >= current_date - interval '5 years')`);
    return responde(res, 200, { ok: true });
  } catch (e) { return falha(res, e); }
}
