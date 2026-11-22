# Pousada Maré — site + sistema de gestão

Mesmo molde do projeto Ingá (HTML + funções da Vercel), mas com **banco Postgres (Neon)** em tabelas, que é o que garante zero overbooking direto no banco.

```
index.html          site público (ondas, suítes, vídeos, cardápio, pré-reserva → WhatsApp)
gestao.html         app de gestão  → pousadamarecumuru.com.br/gestao
demo.js             modo demonstração (só roda fora do domínio oficial / sem API)
blob-upload.js      envio de vídeos do celular (mesmo do Leopardos)
api/public.js       site: suítes, preços, disponibilidade, cardápio, vídeos, pedidos (leads)
api/auth.js         login / logout / troca de senha
api/g.js            todas as ações da gestão (com permissão por papel)
api/video.js        upload de vídeos (Vercel Blob)
api/cron.js         todo dia 7h: tarefas de chegada, aviso de no-show, limpeza LGPD
db/schema.sql       tabelas, regras e funções (rodar 1x)
db/dados-iniciais.sql  suítes, preços, 13 quartos, cardápio de exemplo
```

## Colocar no ar (≈15 min)

1. Suba esta pasta para um repositório (ex.: `lobraganca/pousada-mare`) e importe na Vercel.
2. **Banco:** Vercel › Storage › *Create Database* › **Neon (Postgres)** › conectar ao projeto. Isso cria a `DATABASE_URL`.
3. No Neon › **SQL Editor**: cole e rode `db/schema.sql`, depois `db/dados-iniciais.sql`.
4. **Vídeos:** Vercel › Storage › **Blob** › conectar ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
5. **Variáveis** (Settings › Environment Variables):
   - `ADMIN_USER` = login do dono (ex.: `isidro`)
   - `ADMIN_PASS` = senha forte (8+ letras e números) — só vale no **primeiro** login; depois a senha fica no banco (hash scrypt).
   - `CRON_SECRET` = qualquer texto longo aleatório.
6. Publique. Entre em `/gestao` com ADMIN_USER/ADMIN_PASS e crie os usuários da recepção e da equipe em **Ajustes › Usuários**.
7. Domínio: aponte `pousadamarecumuru.com.br` para a Vercel.

## Antes de entregar
- **Fotos e logo do site antigo:** na pasta do projeto, rode `node scripts/baixar-fotos.mjs` (precisa de Node 18+). Ele baixa as 41 fotos usadas + a logo para `fotos/` e `img/logo.png`. Faça commit da pasta. O site usa essas cópias e, se faltar alguma, busca no endereço antigo da CheckinWeb.
- **Logo:** o cabeçalho usa uma versão em vetor redesenhada da logo (a original tem só 300 px). Peça aos donos o arquivo original em vetor (.ai, .pdf ou .svg) para ficar idêntica.
- **Domínio:** hoje está com a CheckinWeb. Peça acesso ao Registro.br para apontar `pousadamarecumuru.com.br` para a Vercel.
- **13 quartos:** o site atual só lista 4 tipos de suíte; criei Suíte 01…13 (4 duplas, 4 quádruplas, 1 acessível, 4 econômicas). Ajuste nomes/tipos em **Ajustes › Quartos e suítes**.
- **Cardápio:** os pratos são os citados no site; os **preços são exemplos** — ajuste em **Bar & consumo › Editar cardápio**.
- **Fotos:** vêm do CDN do site antigo (checkinweb). Baixe para `fotos/` antes de cancelar o serviço antigo.

## Segurança
- Overbooking impossível: restrição `EXCLUDE` no Postgres (quarto + período) — vale até com duas pessoas clicando ao mesmo tempo, e também para bloqueios de manutenção.
- Todas as consultas parametrizadas (sem SQL montado com texto do usuário); entradas validadas no servidor.
- Senhas em scrypt; sessão em cookie `HttpOnly; Secure; SameSite=Strict`, no banco só o hash do token; expira em 12h sem uso.
- Proteção CSRF (cabeçalho `X-Mare` + checagem de origem), limite de tentativas de login (8 por IP / 15 min) e de pedidos do site.
- Papéis: **dono** (tudo), **recepção** (operação, sem preços/usuários/relatórios), **equipe** (tarefas e lançamentos do bar, sem valores de hospedagem).
- A API pública nunca devolve nomes/telefones de hóspedes — só contagem de quartos livres e preços.
- **Auditoria:** toda mudança em reservas, pagamentos, consumo, preços, quartos e usuários vai para a tabela `auditoria` (quem, quando, antes/depois) — veja em **Ajustes › Histórico**.
- Cabeçalhos CSP/HSTS no `vercel.json`; `/gestao` não indexável e não pode ser embutida em outro site.
- LGPD: pedidos do site não convertidos são apagados após 1 ano (cron).

## Booking e Channex
O dono contou que usa Channex (link da bio) e Booking. Um próximo passo é sincronizar a disponibilidade com o Channex para o Booking não vender um quarto já ocupado aqui.
Reservas do Booking entram manualmente com origem **Booking** (o sistema bloqueia se o quarto já estiver ocupado). Integração automática por iCal pode ser um próximo passo.
