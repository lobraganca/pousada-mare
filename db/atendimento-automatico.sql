-- Atendimento automático e calendário de preços — rode UMA vez no Neon (SQL Editor) se o banco já existia
-- antes desta versão. Pode rodar de novo sem problema.

-- ---------- Atendimento automático (mensagens prontas, check-in online) ----------
alter table reservas add column if not exists mensagens jsonb not null default '{}';   -- {"pix": "2026-11-22T10:00…", …} quando cada mensagem pronta foi aberta
alter table reservas add column if not exists checkin_token text unique;          -- link secreto do check-in online
alter table reservas add column if not exists ficha jsonb;                        -- ficha preenchida pelo hóspede
alter table reservas add column if not exists ficha_em timestamptz;
alter table reservas add column if not exists ficha_conferida_em timestamptz;

-- ---------- Calendário de preços: valor definido pelo dono para um dia (diária para 2 pessoas) ----------
create table if not exists precos_dia (
  categoria_id int not null references categorias(id) on delete cascade,
  dia date not null,
  valor numeric(10,2) not null check (valor > 0 and valor < 100000),
  atualizado_em timestamptz not null default now(),
  primary key (categoria_id, dia)
);

drop trigger if exists tg_audit on precos_dia;
create trigger tg_audit after insert or update or delete on precos_dia for each row execute function fn_auditoria();

-- preço da noite passa a considerar o Calendário de preços
create or replace function preco_noite(p_cat int, p_pessoas int, p_data date) returns numeric
language sql stable as $$
  -- Diária de UMA noite. Se o dono definiu um valor para o dia no Calendário de preços,
  -- ele vale (é o preço para 2 pessoas; outras lotações mantêm a proporção da tabela base).
  -- Senão: tabela base × ajuste da temporada.
  with ts as (select pessoas, valor from tarifas where categoria_id = p_cat),
  base as (select coalesce((select valor from ts where pessoas >= greatest(p_pessoas, 1) order by pessoas limit 1),
                           (select valor from ts order by pessoas desc limit 1), 0) v),
  ref as (select coalesce((select valor from ts where pessoas >= 2 order by pessoas limit 1),
                          (select valor from ts order by pessoas desc limit 1)) v),
  dia as (select valor from precos_dia where categoria_id = p_cat and dia = p_data)
  select case when exists (select 1 from dia) and coalesce((select v from ref), 0) > 0
              then round((select valor from dia) * (select v from base) / (select v from ref), 2)
              else round((select v from base) * (1 + coalesce((select ajuste_pct from temporadas where periodo @> p_data), 0) / 100), 2) end
$$;


