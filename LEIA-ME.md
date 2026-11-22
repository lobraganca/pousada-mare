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
db/central-duvidas.sql  Central de dúvidas (rodar 1x se o banco já existia antes dela)
db/atendimento-automatico.sql  mensagens prontas, check-in online e calendário de preços (rodar 1x se o banco já existia)
checkin.html        check-in online do hóspede (abre pelo link secreto da reserva)
api/_ficha.js       validação da ficha (CPF, idade, placa…)
duvidas.js          Central de dúvidas do site (busca, respostas, WhatsApp com a pergunta pronta)
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

## Booking pelo Channex
- **Saída:** toda vez que uma reserva é criada, alterada, movida, cancelada ou um quarto é bloqueado, o sistema manda ao Channex quantos quartos de cada suíte ficam livres nos próximos 500 dias. Opcional: manda também os preços do Calendário de preços, com acréscimo em % para o Booking.
- **Entrada:** o Channex avisa em `/api/channex` (webhook) quando chega, muda ou cancela uma reserva. O sistema escolhe um quarto livre da suíte, lança a reserva (origem Booking, valor do Booking, código da OTA nas observações), confirma o recebimento (ack) e reenvia a disponibilidade. Se não houver quarto livre ou a suíte não estiver ligada, cria uma **tarefa urgente** para a recepção.
- **Rede de segurança:** a rotina das 7h busca reservas que tenham escapado e reenvia toda a disponibilidade.
- **Para ligar:** variáveis `CHANNEX_API_KEY`, `CHANNEX_PROPERTY_ID` e `CHANNEX_WEBHOOK_SECRET` na Vercel (para testar no ambiente de teste do Channex, também `CHANNEX_URL=https://staging.channex.io/api/v1`). Depois, em **Ajustes › Booking (Channex)**, ligue cada suíte ao tipo de quarto e ao plano de tarifa (botão *Carregar do Channex*) e crie o webhook no Channex com o cabeçalho `X-Channex-Webhook-Secret`. A tela mostra o passo a passo e o histórico de envios.

## Central de dúvidas
- No site, a seção **Dúvidas** tem uma busca: a pessoa digita e a resposta aparece na hora (aceita erro de digitação, sem acento, sinônimos como "cachorro" → pet, e os 3 idiomas).
- Não achou? O botão **Perguntar no WhatsApp** abre a conversa com a pergunta já escrita.
- Na gestão, **Dúvidas do site** mostra o que procuraram e não acharam (do mais procurado para o menos). **Responder** cria a resposta já com o termo como palavra de busca; **Ignorar** tira da lista.
- Só o texto da busca é guardado (nada de nome, telefone ou IP), e é apagado depois de 1 ano.
- Acesso: o dono vê sempre; para a recepção, marque **Dúvidas do site** em Ajustes › Usuários.
- Banco que já existia: rode `db/central-duvidas.sql` uma vez no Neon. Ele já cadastra 13 perguntas iniciais (com espanhol e inglês), escritas só com informações que estão no site. Peça ao dono para revisar e completar (ex.: estacionamento, cartão, transfer).

## Mensagens prontas (WhatsApp)
- Em cada reserva, o cartão **Mensagens prontas** tem 5 botões: Dados do Pix, Reserva confirmada, Como chegar, Lembrete da véspera e Pedir avaliação. O texto sai com nome, datas e valores; dá para ajustar antes de enviar.
- O botão em destaque é o que faz sentido agora (pré-reserva → Pix; confirmada → confirmação/como chegar; véspera → lembrete; depois da saída → avaliação). Depois de enviada, aparece ✓ com a data.
- **Ajustes › Mensagens**: chave Pix, nome e banco, link de avaliação do Google e os textos (com botão para voltar ao padrão).

## Check-in online
- Cada reserva ganha um link secreto (`/checkin?t=…`). Ele vai nas mensagens **Link do check-in online**, **Reserva confirmada** e **Lembrete da véspera**, ou pelo botão **Copiar link** no cartão *Check-in online* da reserva.
- O hóspede preenche, em português, espanhol ou inglês: titular (nome, documento, nascimento, nacionalidade, e-mail, cidade), acompanhantes (com parentesco para menores de 18), horário de chegada, placa e modelo do carro e pedidos. Ele precisa aceitar a Política de Privacidade.
- O servidor confere: CPF válido, titular maior de idade, parentesco de menores, placa no formato brasileiro. Os nomes viram a lista de hóspedes da reserva, e o documento, e-mail e cidade vão para o cadastro do hóspede.
- Na reserva, a recepção vê a ficha e toca em **Marcar como conferido**. O link para de funcionar depois do check-in na recepção ou depois da data de saída.

## LGPD
- **Política de Privacidade** em `/privacidade` (português, espanhol e inglês), com link no rodapé do site, no formulário de reserva, na Central de dúvidas e no check-in online. O hóspede só envia a ficha depois de aceitar a política.
- O texto diz o que é coletado em cada momento (pré-reserva, reserva, ficha de hóspede, buscas), para quê, a base legal, com quem é compartilhado (Vercel, Neon, WhatsApp, Google), por quanto tempo fica guardado, como é protegido e como pedir acesso, correção ou exclusão (resposta em até 15 dias).
- **Prazos, apagados sozinhos pela rotina diária:** pré-reservas não convertidas e buscas, 1 ano; ficha de hóspede (documento, acompanhantes e link), 5 anos após a saída.
- **Antes de publicar:** revisar o texto jurídico e, se quiser, incluir razão social e CNPJ (o lugar está marcado no arquivo `privacidade.html`).

## Calendário de preços
- Em **Ajustes › Preços e temporadas**, o calendário mostra, mês a mês e para cada suíte, a diária de cada dia (para 2 pessoas) e quantos quartos estão livres. As cores vão do verde (mais barato) ao laranja (mais caro).
- Toque nos dias (ou em **Fins de semana**, **Mês todo**, ou no nome do dia da semana para pegar todas as sextas, por exemplo) e escolha: **novo valor em R$**, **ajuste em %** (pode valer para todas as suítes) ou **voltar ao padrão**.
- Dia com valor definido à mão fica com borda e mostra a diferença em % para o padrão. Para mais pessoas, o preço mantém a proporção da tabela base (ex.: se a tabela tem 4 pessoas = 1,56 × o casal, continua assim).
- A tabela base e as temporadas continuam valendo para os dias sem valor definido.

## Tarefas automáticas (rotina das 7h)
Além de preparar quartos e avisar no-show, a rotina cria lembretes para a recepção, um por reserva, sem repetir enquanto a tarefa estiver aberta:
- **Cobrar sinal:** pré-reserva com mais de 24h e sem pagamento.
- **Lembrete da véspera:** hóspede chega amanhã e a mensagem da véspera ainda não foi enviada. Avisa também se ele não fez o check-in online.
- **Sem check-in online:** chega hoje e não preencheu a ficha.
- **Pedir avaliação:** saiu ontem e ainda não recebeu o pedido.

