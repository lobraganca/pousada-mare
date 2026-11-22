-- =====================================================================
--  POUSADA MARÉ · Cumuruxatiba — Banco de dados (PostgreSQL / Neon)
--  Rode este arquivo UMA vez no SQL Editor do Neon (ou psql).
--  Pode rodar de novo sem perder dados: tudo usa "if not exists".
-- =====================================================================
--  Regras de ouro garantidas pelo PRÓPRIO BANCO (não dependem do site):
--   • Um quarto nunca tem duas reservas/bloqueios na mesma noite
--     (restrição EXCLUDE — impossível gerar overbooking, mesmo com
--     duas pessoas clicando ao mesmo tempo).
--   • Valores nunca negativos, datas sempre coerentes (saída > entrada).
--   • Tudo o que muda em reservas, pagamentos, consumo, preços e quartos
--     fica registrado na tabela "auditoria" (quem, quando, antes/depois).
--   • Senhas guardadas só como hash scrypt; sessões só como hash SHA-256.
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- Tipos ----------
do $$ begin
  create type origem_reserva as enum ('site','whatsapp','booking','telefone','balcao','outro');
exception when duplicate_object then null; end $$;
do $$ begin
  create type status_reserva as enum ('pre','confirmada','hospedada','finalizada','cancelada','no_show');
exception when duplicate_object then null; end $$;
do $$ begin
  create type papel_usuario as enum ('dono','recepcao','equipe');
exception when duplicate_object then null; end $$;

-- ---------- Configurações gerais (chave → valor) ----------
create table if not exists config (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- ---------- Usuários, sessões e segurança de login ----------
create table if not exists usuarios (
  id serial primary key,
  nome text not null check (length(nome) between 2 and 80),
  login text not null unique check (login ~ '^[a-z0-9._-]{3,40}$'),
  senha_hash text not null,
  papel papel_usuario not null default 'equipe',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists sessoes (
  token_hash text primary key,            -- só o hash; o token real fica no cookie httpOnly
  usuario_id int not null references usuarios(id) on delete cascade,
  criada_em timestamptz not null default now(),
  expira_em timestamptz not null,
  ip text, ua text
);
create index if not exists sessoes_usuario on sessoes(usuario_id);

create table if not exists login_falhas (
  chave text primary key,                 -- hash do IP + login
  n int not null default 0,
  ate timestamptz not null
);

-- ---------- Acomodações ----------
create table if not exists categorias (
  id serial primary key,
  slug text not null unique,
  nome text not null,
  resumo text not null default '',
  descricao text not null default '',
  capacidade int not null check (capacidade between 1 and 12),
  area_m2 int,
  caracteristicas jsonb not null default '[]',
  fotos jsonb not null default '[]',
  no_site boolean not null default true,
  ordem int not null default 0
);

-- preço da diária por número de pessoas (2, 3, 4, 5…)
create table if not exists tarifas (
  categoria_id int not null references categorias(id) on delete cascade,
  pessoas int not null check (pessoas between 1 and 12),
  valor numeric(10,2) not null check (valor >= 0),
  primary key (categoria_id, pessoas)
);

-- temporadas: ajuste % sobre a tarifa base e mínimo de noites
create table if not exists temporadas (
  id serial primary key,
  nome text not null,
  periodo daterange not null check (not isempty(periodo)),
  ajuste_pct numeric(6,2) not null default 0 check (ajuste_pct > -100),
  min_noites int not null default 1 check (min_noites between 1 and 30),
  exclude using gist (periodo with &&)    -- temporadas não se sobrepõem
);

-- datas em que o site NÃO aceita pré-reserva (os donos "fecham" o calendário)
create table if not exists fechamentos_site (
  id serial primary key,
  periodo daterange not null check (not isempty(periodo)),
  motivo text not null default ''
);

create table if not exists quartos (
  id serial primary key,
  nome text not null unique,
  categoria_id int not null references categorias(id),
  ordem int not null default 0,
  ativo boolean not null default true,
  obs text not null default ''
);

-- ---------- Hóspedes e reservas ----------
create table if not exists hospedes (
  id serial primary key,
  nome text not null check (length(nome) between 2 and 120),
  telefone text not null default '' check (telefone ~ '^[0-9]{0,15}$'),
  email text not null default '',
  documento text not null default '',
  cidade text not null default '',
  obs text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists hospedes_tel on hospedes(telefone);
create index if not exists hospedes_nome on hospedes(lower(nome));

create table if not exists leads (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{6,40}$'),
  nome text not null default '',
  telefone text not null default '',
  cidade text not null default '',
  checkin date, checkout date,
  adultos int not null default 0, criancas int not null default 0,
  itens jsonb not null default '[]',      -- [{categoria, quartos, pessoas}]
  valor_estimado numeric(10,2) not null default 0,
  obs text not null default '',
  etapa int not null default 1,
  enviado boolean not null default false,
  enviado_em timestamptz,
  status text not null default 'novo' check (status in ('novo','contatado','convertido','perdido','arquivado')),
  reserva_id int,
  origem_aprox text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists leads_data on leads(atualizado_em desc);

create table if not exists reservas (
  id serial primary key,
  codigo text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  hospede_id int not null references hospedes(id),
  origem origem_reserva not null default 'whatsapp',
  status status_reserva not null default 'pre',
  grupo_nome text not null default '',
  checkin date, checkout date,            -- calculados a partir dos quartos
  adultos int not null default 0, criancas int not null default 0,
  valor_hospedagem numeric(10,2) not null default 0 check (valor_hospedagem >= 0),
  desconto numeric(10,2) not null default 0 check (desconto >= 0),
  condicoes_pagamento text not null default '',
  sinal_previsto numeric(10,2) not null default 0 check (sinal_previsto >= 0),
  obs text not null default '',
  motivo_status text not null default '',
  lead_id text references leads(id) on delete set null,
  criado_por int references usuarios(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists reservas_datas on reservas(checkin, checkout);
create index if not exists reservas_status on reservas(status);

-- Cada noite de cada quarto: reserva OU bloqueio. É aqui que mora o anti-overbooking.
create table if not exists ocupacoes (
  id serial primary key,
  quarto_id int not null references quartos(id),
  periodo daterange not null check (not isempty(periodo) and lower_inc(periodo) and not upper_inc(periodo)),
  tipo text not null check (tipo in ('reserva','bloqueio')),
  reserva_id int references reservas(id) on delete cascade,
  adultos int not null default 0 check (adultos >= 0),
  criancas int not null default 0 check (criancas >= 0),
  valor_diaria numeric(10,2) not null default 0 check (valor_diaria >= 0),
  motivo text not null default '',
  ativo boolean not null default true,
  criado_por int references usuarios(id),
  criado_em timestamptz not null default now(),
  check ((tipo = 'reserva') = (reserva_id is not null)),
  constraint sem_overbooking exclude using gist (quarto_id with =, periodo with &&) where (ativo)
);
create index if not exists ocupacoes_reserva on ocupacoes(reserva_id);
create index if not exists ocupacoes_periodo on ocupacoes using gist (periodo) where (ativo);

create table if not exists pagamentos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  tipo text not null check (tipo in ('sinal','saldo','extra','reembolso')),
  valor numeric(10,2) not null check (valor > 0),
  forma text not null check (forma in ('pix','cartao','dinheiro','transferencia','booking','outro')),
  data date not null default current_date,
  obs text not null default '',
  criado_por int references usuarios(id),
  criado_em timestamptz not null default now()
);
create index if not exists pagamentos_reserva on pagamentos(reserva_id);

-- ---------- Bar, restaurante, produtos e lançamentos ----------
create table if not exists produtos (
  id serial primary key,
  tipo text not null check (tipo in ('bar','restaurante','produto','servico')),
  grupo text not null default '',          -- seção do cardápio (Entradas, Pratos, Drinks…)
  nome text not null,
  descricao text not null default '',
  preco numeric(10,2) not null check (preco >= 0),
  no_cardapio boolean not null default true,
  ativo boolean not null default true,
  ordem int not null default 0
);

create table if not exists lancamentos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  quarto_id int references quartos(id),
  produto_id int references produtos(id),
  tipo text not null check (tipo in ('bar','restaurante','produto','servico','extra')),
  descricao text not null,
  qtd numeric(8,2) not null check (qtd > 0),
  valor_unit numeric(10,2) not null check (valor_unit >= 0),
  total numeric(12,2) generated always as (round(qtd * valor_unit, 2)) stored,
  cancelado boolean not null default false,
  criado_por int references usuarios(id),
  criado_em timestamptz not null default now()
);
create index if not exists lancamentos_reserva on lancamentos(reserva_id);

-- ---------- Tarefas da equipe ----------
create table if not exists tarefas (
  id serial primary key,
  titulo text not null check (length(titulo) between 2 and 140),
  descricao text not null default '',
  quarto_id int references quartos(id),
  responsavel_id int references usuarios(id),
  prazo date not null default current_date,
  prioridade text not null default 'normal' check (prioridade in ('baixa','normal','alta')),
  status text not null default 'aberta' check (status in ('aberta','andamento','feita','arquivada')),
  origem text not null default 'manual',
  feita_em timestamptz, feita_por int references usuarios(id),
  criado_por int references usuarios(id),
  criado_em timestamptz not null default now()
);
create index if not exists tarefas_prazo on tarefas(status, prazo);

-- ---------- Vídeos do site ----------
create table if not exists videos (
  id serial primary key,
  titulo text not null default '',
  url text not null check (url ~ '^https://'),
  capa text not null default '',
  ordem int not null default 0,
  ativo boolean not null default true
);

-- ---------- Atendimento automático (mensagens prontas, check-in online) ----------
alter table reservas add column if not exists mensagens jsonb not null default '{}';   -- {"pix": "2026-11-22T10:00…", …} quando cada mensagem pronta foi aberta

-- ---------- Central de dúvidas do site ----------
create table if not exists faq (
  id serial primary key,
  tema text not null default 'Geral',
  pergunta text not null check (length(pergunta) between 3 and 200),
  resposta text not null check (length(resposta) between 2 and 1500),
  palavras text not null default '',          -- outras palavras que as pessoas usam (ex.: cachorro, gato)
  traducoes jsonb not null default '{}',      -- {"es":{"t":tema,"p":pergunta,"r":resposta},"en":{…}}
  ordem int not null default 0,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
-- O que as pessoas digitaram na busca (uma linha por busca; sem nome nem telefone)
create table if not exists faq_buscas (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,40}$'),
  termo text not null,
  termo_norm text not null,
  idioma text not null default 'pt',
  achou boolean not null default false,      -- a busca trouxe alguma resposta
  faq_id int references faq(id) on delete set null,  -- resposta que a pessoa abriu
  perguntou boolean not null default false,  -- tocou em "Perguntar no WhatsApp"
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists faq_buscas_em on faq_buscas(atualizado_em desc);
create index if not exists faq_buscas_termo on faq_buscas(termo_norm);
-- Termos que o dono já respondeu ou decidiu ignorar (somem da lista "não acharam")
create table if not exists faq_termos (
  termo_norm text primary key,
  como text not null check (como in ('respondido','ignorado')),
  faq_id int references faq(id) on delete set null,
  em timestamptz not null default now()
);

-- ---------- Auditoria ----------
create table if not exists auditoria (
  id bigserial primary key,
  em timestamptz not null default now(),
  usuario_id int,
  acao text not null,
  tabela text not null,
  registro_id text,
  antes jsonb, depois jsonb
);
create index if not exists auditoria_em on auditoria(em desc);

create or replace function fn_auditoria() returns trigger language plpgsql as $$
declare u int := nullif(current_setting('app.usuario', true), '')::int;
        a jsonb; d jsonb;
begin
  if tg_op <> 'INSERT' then a := to_jsonb(old) - 'senha_hash'; end if;
  if tg_op <> 'DELETE' then d := to_jsonb(new) - 'senha_hash'; end if;
  if tg_op = 'UPDATE' and a = d then return new; end if;
  insert into auditoria(usuario_id, acao, tabela, registro_id, antes, depois)
  values (u, lower(tg_op), tg_table_name, coalesce(d->>'id', a->>'id', d->>'categoria_id', a->>'categoria_id'), a, d);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['reservas','ocupacoes','pagamentos','lancamentos','tarifas','temporadas',
                           'quartos','usuarios','produtos','hospedes','fechamentos_site','categorias','config','faq'] loop
    execute format('drop trigger if exists tg_audit on %I', t);
    execute format('create trigger tg_audit after insert or update or delete on %I for each row execute function fn_auditoria()', t);
  end loop;
end $$;

-- =====================================================================
--  FUNÇÕES DE NEGÓCIO (o servidor só chama estas funções)
-- =====================================================================

-- Erro amigável padronizado
create or replace function erro(msg text) returns void language plpgsql as $$
begin raise exception using errcode = 'P0001', message = msg; end $$;

-- Preço de UMA noite numa categoria, para N pessoas, numa data
create or replace function preco_noite(p_cat int, p_pessoas int, p_data date) returns numeric
language sql stable as $$
  with base as (
    select valor from tarifas
     where categoria_id = p_cat and pessoas >= greatest(p_pessoas, 1)
     order by pessoas limit 1
  ), maior as (
    select valor from tarifas where categoria_id = p_cat order by pessoas desc limit 1
  )
  select round(coalesce((select valor from base), (select valor from maior), 0)
         * (1 + coalesce((select ajuste_pct from temporadas where periodo @> p_data), 0) / 100), 2)
$$;

-- Total de uma estadia
create or replace function preco_estadia(p_cat int, p_pessoas int, p_in date, p_out date) returns numeric
language sql stable as $$
  select coalesce(sum(preco_noite(p_cat, p_pessoas, d::date)), 0)
    from generate_series(p_in, p_out - 1, interval '1 day') d
$$;

-- Recalcula datas, pessoas e valor da reserva a partir dos quartos ativos
create or replace function reserva_recalc(p_id int) returns void language plpgsql as $$
begin
  update reservas r set
    checkin = coalesce(x.ini, r.checkin), checkout = coalesce(x.fim, r.checkout),
    adultos = coalesce(x.ad, r.adultos), criancas = coalesce(x.cr, r.criancas),
    valor_hospedagem = coalesce(x.valor, r.valor_hospedagem),
    atualizado_em = now()
  from (select min(lower(periodo)) ini, max(upper(periodo)) fim, sum(adultos)::int ad, sum(criancas)::int cr,
               sum(valor_diaria * (upper(periodo) - lower(periodo))) valor
          from ocupacoes where reserva_id = p_id and ativo) x
  where r.id = p_id and x.ini is not null;
end $$;

-- Mensagem clara quando há conflito de datas
create or replace function conflito_msg(p_quarto int, p_periodo daterange, p_ignorar int) returns text
language sql stable as $$
  select 'O quarto ' || q.nome || ' já está ocupado entre ' ||
         to_char(greatest(lower(o.periodo), lower(p_periodo)), 'DD/MM') || ' e ' ||
         to_char(least(upper(o.periodo), upper(p_periodo)), 'DD/MM') ||
         case when o.tipo = 'bloqueio' then ' (bloqueado: ' || coalesce(nullif(o.motivo,''),'manutenção') || ')'
              else ' (reserva ' || r.codigo || ' – ' || h.nome || ')' end
    from ocupacoes o join quartos q on q.id = o.quarto_id
    left join reservas r on r.id = o.reserva_id left join hospedes h on h.id = r.hospede_id
   where o.quarto_id = p_quarto and o.ativo and o.periodo && p_periodo
     and (p_ignorar is null or o.id <> p_ignorar)
   limit 1
$$;

-- Insere uma ocupação validando capacidade e conflito
create or replace function ocupacao_inserir(p_res int, q jsonb, p_user int) returns int language plpgsql as $$
declare v_q quartos; v_cap int; v_in date := (q->>'checkin')::date; v_out date := (q->>'checkout')::date;
        v_ad int := coalesce((q->>'adultos')::int, 0); v_cr int := coalesce((q->>'criancas')::int, 0);
        v_diaria numeric; v_id int; v_msg text;
begin
  if v_in is null or v_out is null or v_out <= v_in then perform erro('Datas inválidas: a saída precisa ser depois da entrada.'); end if;
  if v_out - v_in > 90 then perform erro('Estadia acima de 90 noites. Confira as datas.'); end if;
  select * into v_q from quartos where id = (q->>'quarto_id')::int and ativo;
  if not found then perform erro('Quarto não encontrado.'); end if;
  select capacidade into v_cap from categorias where id = v_q.categoria_id;
  if v_ad + v_cr > v_cap then perform erro(format('O quarto %s comporta até %s pessoas.', v_q.nome, v_cap)); end if;
  v_msg := conflito_msg(v_q.id, daterange(v_in, v_out), null);
  if v_msg is not null then perform erro(v_msg); end if;
  v_diaria := coalesce((q->>'valor_diaria')::numeric,
              round(preco_estadia(v_q.categoria_id, greatest(v_ad + v_cr, 1), v_in, v_out) / (v_out - v_in), 2));
  insert into ocupacoes(quarto_id, periodo, tipo, reserva_id, adultos, criancas, valor_diaria, criado_por)
  values (v_q.id, daterange(v_in, v_out), 'reserva', p_res, v_ad, v_cr, v_diaria, p_user)
  returning id into v_id;
  return v_id;
exception when exclusion_violation then
  perform erro(coalesce(conflito_msg(v_q.id, daterange(v_in, v_out), null), 'Conflito de datas neste quarto.'));
end $$;

-- Cria ou edita uma reserva (individual, grupo ou vários quartos) de forma atômica.
-- p: {id?, hospede:{id?,nome,telefone,email,documento,cidade}, origem, status, grupo_nome, desconto,
--     condicoes_pagamento, sinal_previsto, obs, lead_id, quartos:[{quarto_id,checkin,checkout,adultos,criancas,valor_diaria?}]}
create or replace function reserva_salvar(p jsonb, p_user int) returns jsonb language plpgsql as $$
declare v_id int := nullif(p->>'id','')::int; v_h int; h jsonb := coalesce(p->'hospede','{}'); q jsonb;
        v_tel text := regexp_replace(coalesce(h->>'telefone',''), '\D', '', 'g'); v_res reservas;
begin
  if jsonb_typeof(p->'quartos') <> 'array' or jsonb_array_length(p->'quartos') = 0 then
    perform erro('Escolha pelo menos um quarto.'); end if;
  if jsonb_array_length(p->'quartos') > 13 then perform erro('Máximo de 13 quartos por reserva.'); end if;
  if length(coalesce(h->>'nome','')) < 2 then perform erro('Informe o nome do hóspede.'); end if;
  if coalesce(p->>'status','') in ('cancelada','no_show','finalizada') then
    perform erro('Use os botões de cancelar / no-show / check-out para encerrar uma reserva.'); end if;

  -- hóspede: usa o existente (por id ou telefone) ou cria
  v_h := nullif(h->>'id','')::int;
  if v_h is null and length(v_tel) >= 10 then select id into v_h from hospedes where telefone = v_tel order by id limit 1; end if;
  if v_h is null then
    insert into hospedes(nome, telefone, email, documento, cidade)
    values (left(h->>'nome',120), left(v_tel,15), left(coalesce(h->>'email',''),120), left(coalesce(h->>'documento',''),40), left(coalesce(h->>'cidade',''),80))
    returning id into v_h;
  else
    update hospedes set nome = left(h->>'nome',120), telefone = coalesce(nullif(left(v_tel,15),''), telefone),
           email = coalesce(nullif(left(h->>'email',120),''), email), documento = coalesce(nullif(left(h->>'documento',40),''), documento),
           cidade = coalesce(nullif(left(h->>'cidade',80),''), cidade)
     where id = v_h;
  end if;

  if v_id is null then
    insert into reservas(hospede_id, origem, status, grupo_nome, desconto, condicoes_pagamento, sinal_previsto, obs, lead_id, criado_por, acompanhantes)
    values (v_h, coalesce(nullif(p->>'origem',''),'whatsapp')::origem_reserva, coalesce(nullif(p->>'status',''),'pre')::status_reserva,
            left(coalesce(p->>'grupo_nome',''),80), coalesce((p->>'desconto')::numeric,0), left(coalesce(p->>'condicoes_pagamento',''),500),
            coalesce((p->>'sinal_previsto')::numeric,0), left(coalesce(p->>'obs',''),1000), nullif(p->>'lead_id',''), p_user, left(coalesce(p->>'acompanhantes',''),1000))
    returning id into v_id;
  else
    select * into v_res from reservas where id = v_id for update;
    if not found then perform erro('Reserva não encontrada.'); end if;
    if v_res.status in ('cancelada','no_show','finalizada') then perform erro('Esta reserva está encerrada. Reabra antes de editar.'); end if;
    update reservas set hospede_id = v_h, origem = coalesce(nullif(p->>'origem',''), origem::text)::origem_reserva,
           status = coalesce(nullif(p->>'status',''), status::text)::status_reserva,
           grupo_nome = left(coalesce(p->>'grupo_nome', grupo_nome),80), desconto = coalesce((p->>'desconto')::numeric, desconto),
           condicoes_pagamento = left(coalesce(p->>'condicoes_pagamento', condicoes_pagamento),500),
           sinal_previsto = coalesce((p->>'sinal_previsto')::numeric, sinal_previsto), obs = left(coalesce(p->>'obs', obs),1000),
           acompanhantes = left(coalesce(p->>'acompanhantes', acompanhantes),1000),
           atualizado_em = now()
     where id = v_id;
    -- libera os quartos antigos e grava os novos (tudo na mesma transação)
    update ocupacoes set ativo = false where reserva_id = v_id and ativo;
  end if;

  for q in select * from jsonb_array_elements(p->'quartos') loop
    perform ocupacao_inserir(v_id, q, p_user);
  end loop;
  perform reserva_recalc(v_id);
  if nullif(p->>'lead_id','') is not null then
    update leads set status = 'convertido', reserva_id = v_id, atualizado_em = now() where id = p->>'lead_id';
  end if;
  return jsonb_build_object('id', v_id, 'codigo', (select codigo from reservas where id = v_id));
end $$;

-- Arrastar no mapa: muda quarto e/ou datas de UMA ocupação (reserva ou bloqueio)
create or replace function ocupacao_mover(p_id int, p_quarto int, p_in date, p_out date, p_user int) returns jsonb
language plpgsql as $$
declare o ocupacoes; v_cap int; v_msg text; v_cat int; v_nova numeric; v_status status_reserva;
begin
  select * into o from ocupacoes where id = p_id and ativo for update;
  if not found then perform erro('Item não encontrado no mapa.'); end if;
  if p_out <= p_in then perform erro('A saída precisa ser depois da entrada.'); end if;
  select c.capacidade, c.id into v_cap, v_cat from quartos q join categorias c on c.id = q.categoria_id where q.id = p_quarto and q.ativo;
  if v_cap is null then perform erro('Quarto não encontrado.'); end if;
  if o.tipo = 'reserva' then
    select status into v_status from reservas where id = o.reserva_id;
    if v_status in ('cancelada','no_show','finalizada') then perform erro('Reserva encerrada não pode ser movida.'); end if;
    if o.adultos + o.criancas > v_cap then perform erro(format('Esse quarto comporta até %s pessoas.', v_cap)); end if;
  end if;
  v_msg := conflito_msg(p_quarto, daterange(p_in, p_out), p_id);
  if v_msg is not null then perform erro(v_msg); end if;
  -- mudou de categoria? recalcula a diária pela tabela
  if o.tipo = 'reserva' and v_cat <> (select categoria_id from quartos where id = o.quarto_id) then
    v_nova := round(preco_estadia(v_cat, greatest(o.adultos + o.criancas,1), p_in, p_out) / (p_out - p_in), 2);
  end if;
  update ocupacoes set quarto_id = p_quarto, periodo = daterange(p_in, p_out), valor_diaria = coalesce(v_nova, valor_diaria) where id = p_id;
  if o.reserva_id is not null then perform reserva_recalc(o.reserva_id); end if;
  return jsonb_build_object('ok', true, 'nova_diaria', v_nova);
exception when exclusion_violation then
  perform erro(coalesce(conflito_msg(p_quarto, daterange(p_in, p_out), p_id), 'Conflito de datas.'));
end $$;

-- Bloqueio de quarto (manutenção etc.)
create or replace function bloqueio_criar(p_quarto int, p_in date, p_out date, p_motivo text, p_user int) returns int
language plpgsql as $$
declare v_id int; v_msg text;
begin
  if p_out <= p_in then perform erro('A data final precisa ser depois da inicial.'); end if;
  v_msg := conflito_msg(p_quarto, daterange(p_in, p_out), null);
  if v_msg is not null then perform erro(v_msg); end if;
  insert into ocupacoes(quarto_id, periodo, tipo, motivo, criado_por)
  values (p_quarto, daterange(p_in, p_out), 'bloqueio', left(coalesce(p_motivo,'Manutenção'),200), p_user) returning id into v_id;
  return v_id;
exception when exclusion_violation then perform erro('Conflito de datas neste quarto.');
end $$;

-- Mudança de status: confirmar, check-in, check-out, cancelar, no-show, reabrir
create or replace function reserva_status(p_id int, p_status text, p_motivo text, p_user int) returns jsonb
language plpgsql as $$
declare r reservas; v_novo status_reserva := p_status::status_reserva; q record;
begin
  select * into r from reservas where id = p_id for update;
  if not found then perform erro('Reserva não encontrada.'); end if;
  if v_novo in ('cancelada','no_show') then
    update ocupacoes set ativo = false where reserva_id = p_id and ativo;     -- libera os quartos
  elsif r.status in ('cancelada','no_show') then
    -- reabrir: tenta reocupar os mesmos quartos/datas (falha se alguém já pegou)
    for q in select distinct on (quarto_id, periodo) * from ocupacoes where reserva_id = p_id order by quarto_id, periodo, id desc loop
      if conflito_msg(q.quarto_id, q.periodo, null) is not null then perform erro('Não dá para reabrir: ' || conflito_msg(q.quarto_id, q.periodo, null)); end if;
      update ocupacoes set ativo = true where id = q.id;
    end loop;
  end if;
  if v_novo = 'finalizada' then
    -- cria tarefa de arrumação para cada quarto liberado
    insert into tarefas(titulo, quarto_id, prazo, prioridade, origem, criado_por)
    select 'Arrumar ' || qt.nome || ' (saída ' || r.codigo || ')', o.quarto_id, current_date, 'alta', 'auto_checkout', p_user
      from ocupacoes o join quartos qt on qt.id = o.quarto_id where o.reserva_id = p_id and o.ativo;
  end if;
  update reservas set status = v_novo, motivo_status = left(coalesce(p_motivo,''),300), atualizado_em = now() where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- Disponibilidade pública (o site só vê isto: contagens e preços, NUNCA dados de hóspedes)
create or replace function disponibilidade_publica(p_in date, p_out date) returns jsonb
language plpgsql stable as $$
declare v_fechado boolean; v_ate date; v_min int; v_noites int := p_out - p_in;
begin
  if p_in is null or p_out is null or p_out <= p_in or v_noites > 60 or p_in < current_date - 1 then
    return jsonb_build_object('erro', 'datas');
  end if;
  v_ate := nullif(coalesce((select valor->>0 from config where chave = 'vendas_ate'), ''), '')::date;
  v_fechado := exists(select 1 from fechamentos_site where periodo && daterange(p_in, p_out))
               or (v_ate is not null and p_out > v_ate + 1)
               or coalesce((select (valor->>0)::boolean from config where chave = 'site_pausado'), false);
  select coalesce(max(min_noites),1) into v_min from temporadas where periodo && daterange(p_in, p_out);
  return jsonb_build_object(
    'fechado', v_fechado, 'min_noites', v_min, 'noites', v_noites,
    'categorias', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug,
        'livres', (select count(*) from quartos q where q.categoria_id = c.id and q.ativo
                    and not exists (select 1 from ocupacoes o where o.quarto_id = q.id and o.ativo and o.periodo && daterange(p_in, p_out))),
        'precos', (select jsonb_object_agg(t.pessoas, preco_estadia(c.id, t.pessoas, p_in, p_out)) from tarifas t where t.categoria_id = c.id)
      ) order by c.ordem), '[]') from categorias c where c.no_site)
  );
end $$;

-- Ocupação dia a dia (quartos ocupados / ativos, pessoas)
create or replace function relatorio_ocupacao(p_ini date, p_fim date) returns table(dia date, quartos_ocupados int, total_quartos int, pessoas int, chegadas int, saidas int)
language sql stable as $$
  select d::date,
    (select count(distinct o.quarto_id) from ocupacoes o join reservas r on r.id = o.reserva_id
      where o.ativo and o.tipo = 'reserva' and o.periodo @> d::date and r.status in ('pre','confirmada','hospedada','finalizada'))::int,
    (select count(*) from quartos where ativo)::int,
    (select coalesce(sum(o.adultos + o.criancas),0) from ocupacoes o join reservas r on r.id = o.reserva_id
      where o.ativo and o.tipo = 'reserva' and o.periodo @> d::date and r.status in ('pre','confirmada','hospedada','finalizada'))::int,
    (select count(*) from reservas r where r.checkin = d::date and r.status in ('pre','confirmada','hospedada','finalizada'))::int,
    (select count(*) from reservas r where r.checkout = d::date and r.status in ('pre','confirmada','hospedada','finalizada'))::int
  from generate_series(p_ini, p_fim, interval '1 day') d
$$;

-- Resumo de um período (para comparar períodos)
create or replace function relatorio_resumo(p_ini date, p_fim date) returns jsonb
language sql stable as $$
  with noites as (
    select o.*, r.origem, greatest(lower(o.periodo), p_ini) a, least(upper(o.periodo), p_fim + 1) b
      from ocupacoes o join reservas r on r.id = o.reserva_id
     where o.ativo and o.tipo = 'reserva' and o.periodo && daterange(p_ini, p_fim + 1)
       and r.status in ('pre','confirmada','hospedada','finalizada')
  ), res as (
    select * from reservas where status in ('pre','confirmada','hospedada','finalizada')
       and checkin <= p_fim and checkout > p_ini
  )
  select jsonb_build_object(
    'diarias_vendidas', coalesce((select sum(b - a) from noites), 0),
    'capacidade', (select count(*) from quartos where ativo) * (p_fim - p_ini + 1),
    'receita_hospedagem', coalesce((select sum((b - a) * valor_diaria) from noites), 0),
    'reservas', (select count(*) from res),
    'hospedes', coalesce((select sum(adultos + criancas) from res), 0),
    'permanencia_media', coalesce((select round(avg(checkout - checkin)::numeric, 1) from res), 0),
    'consumo', coalesce((select sum(total) from lancamentos where not cancelado and criado_em::date between p_ini and p_fim), 0),
    'cancelamentos', (select count(*) from reservas where status = 'cancelada' and checkin between p_ini and p_fim),
    'no_shows', (select count(*) from reservas where status = 'no_show' and checkin between p_ini and p_fim),
    'por_origem', coalesce((select jsonb_object_agg(origem, n) from (select origem, count(*) n from res group by origem) x), '{}')
  )
$$;

-- Previsão do café: quem dormiu na noite anterior toma café no dia
create or replace function previsao_cafe(p_ini date, p_dias int) returns table(dia date, adultos int, criancas int)
language sql stable as $$
  select d::date,
    coalesce(sum(o.adultos),0)::int, coalesce(sum(o.criancas),0)::int
  from generate_series(p_ini, p_ini + (p_dias - 1), interval '1 day') d
  left join ocupacoes o on o.ativo and o.tipo = 'reserva' and o.periodo @> (d::date - 1)
  left join reservas r on r.id = o.reserva_id and r.status in ('pre','confirmada','hospedada')
  where o.id is null or r.id is not null
  group by d order by d
$$;

-- pré-reservas arquivadas (para bancos criados antes desta versão)
do $$ begin
  alter table leads drop constraint if exists leads_status_check;
  alter table leads add constraint leads_status_check check (status in ('novo','contatado','convertido','perdido','arquivado'));
end $$;

-- nomes dos hóspedes de cada quarto e quem pediu no bar
alter table reservas add column if not exists acompanhantes text not null default '';
alter table lancamentos add column if not exists pessoa text not null default '';

-- quadro de tarefas: em andamento e arquivadas
do $$ begin
  alter table tarefas drop constraint if exists tarefas_status_check;
  alter table tarefas add constraint tarefas_status_check check (status in ('aberta','andamento','feita','arquivada'));
end $$;

-- Áreas liberadas por pessoa (Ajustes › Usuários). Vazio = padrão do papel.
alter table usuarios add column if not exists areas text[];
