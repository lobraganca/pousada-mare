-- Atendimento automático — rode UMA vez no Neon (SQL Editor) se o banco já existia
-- antes desta versão. Pode rodar de novo sem problema.

-- ---------- Atendimento automático (mensagens prontas, check-in online) ----------
alter table reservas add column if not exists mensagens jsonb not null default '{}';   -- {"pix": "2026-11-22T10:00…", …} quando cada mensagem pronta foi aberta
alter table reservas add column if not exists checkin_token text unique;          -- link secreto do check-in online
alter table reservas add column if not exists ficha jsonb;                        -- ficha preenchida pelo hóspede
alter table reservas add column if not exists ficha_em timestamptz;
alter table reservas add column if not exists ficha_conferida_em timestamptz;
