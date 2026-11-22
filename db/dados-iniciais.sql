-- =====================================================================
--  Dados iniciais da Pousada Maré (rode DEPOIS do schema.sql, uma vez)
--  Preços das suítes = tarifário atual do site (dom–seg).
--  ATENÇÃO: nomes dos 13 quartos e a divisão por categoria são
--  provisórios — ajuste na Gestão › Ajustes › Quartos.
--  Preços do cardápio são EXEMPLOS — ajuste na Gestão › Cardápio.
-- =====================================================================

insert into categorias (slug, nome, resumo, descricao, capacidade, area_m2, caracteristicas, fotos, ordem) values
('dupla-vista-mar', 'Suíte Dupla · Vista para o mar', 'Varanda com rede de frente para o mar',
 'Suíte com ar-condicionado split, frigobar, varanda com rede e vista privilegiada para o mar. Banheiro privativo e enxoval cuidadoso.',
 2, null, '["Vista para o mar","Varanda com rede","Ar-condicionado","Frigobar","Aceita crianças"]',
 '["https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1769085283-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-48-938825a7.jpg","https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1549626291-sm-1542657189-quarto-casal-pousada-mare-em-cumuruxatiba4.png"]', 1),
('quadrupla-conjugada', 'Suíte Quádrupla Conjugada', 'Quartos reversíveis para famílias, até 5 pessoas',
 'Quartos conjugados e reversíveis — privacidade para a família toda. Varanda com rede e vista para o mar, ar-condicionado split, frigobar e amenities.',
 5, null, '["Quartos conjugados","Varanda com rede","Vista para o mar","Frigobar","Amenities"]',
 '["https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1764618315-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-50-69db9ec3.jpg","https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1542727784-quarto-pousada-mare-em-cumuruxatiba-vista-para-o-mar3.png"]', 2),
('varanda-acessivel', 'Suíte de Varanda Reservada · Acessível', 'Piso térreo, adaptada para PcD, até 5 pessoas',
 'Planejada com acessibilidade: piso térreo, banheiro adaptado com barras de apoio, pia rebaixada, box amplo. Varanda reservada, ar-condicionado e frigobar.',
 5, null, '["Acessível (PcD)","Piso térreo","Varanda reservada","Ar-condicionado","Frigobar"]',
 '["https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1680780803-20220708-131137.jpg","https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1680781143-20220708-131307.jpg"]', 3),
('economica', 'Suíte Econômica · Sem varanda', '24 m², cama de casal + bicama, até 4 pessoas',
 'Suíte arejada com duas janelas, cama de casal e bicama, ar-condicionado split e frigobar. Ótimo custo-benefício.',
 4, 24, '["24 m²","Cama casal + bicama","Ar-condicionado","Frigobar","Aceita crianças"]',
 '["https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1693659411-imagem-do-whatsapp-de-2023-08-25-a-s-10-08-46.jpg","https://cdn.checkinweb.com.br/img/173/fotos_acomodacao/lg_1769085475-imagem-do-whatsapp-de-2025-08-28-a-s-12-14-22-8c49310f.jpg"]', 4)
on conflict (slug) do nothing;

insert into tarifas (categoria_id, pessoas, valor)
select c.id, t.p, t.v from categorias c join (values
 ('dupla-vista-mar',2,680),
 ('quadrupla-conjugada',2,680),('quadrupla-conjugada',3,870),('quadrupla-conjugada',4,1060),('quadrupla-conjugada',5,1250),
 ('varanda-acessivel',2,590),('varanda-acessivel',3,710),('varanda-acessivel',4,830),('varanda-acessivel',5,950),
 ('economica',2,550),('economica',3,670),('economica',4,790)
) t(slug,p,v) on t.slug = c.slug
on conflict do nothing;

insert into quartos (nome, categoria_id, ordem)
select q.nome, c.id, q.o from (values
 ('Suíte 01','dupla-vista-mar',1),('Suíte 02','dupla-vista-mar',2),('Suíte 03','dupla-vista-mar',3),('Suíte 04','dupla-vista-mar',4),
 ('Suíte 05','quadrupla-conjugada',5),('Suíte 06','quadrupla-conjugada',6),('Suíte 07','quadrupla-conjugada',7),('Suíte 08','quadrupla-conjugada',8),
 ('Suíte 09 · Acessível','varanda-acessivel',9),
 ('Suíte 10','economica',10),('Suíte 11','economica',11),('Suíte 12','economica',12),('Suíte 13','economica',13)
) q(nome,slug,o) join categorias c on c.slug = q.slug
on conflict (nome) do nothing;

insert into temporadas (nome, periodo, ajuste_pct, min_noites) values
('Réveillon 2026/27', daterange('2026-12-27','2027-01-03'), 30, 5),
('Verão 2027', daterange('2027-01-03','2027-02-28'), 15, 3)
on conflict do nothing;

insert into config (chave, valor) values
('whatsapp', '"5573998456129"'),
('whatsapp_restaurante', '"5573996561413"'),
('vendas_ate', '["2027-06-30"]'),
('site_pausado', '[false]'),
('sinal_pct', '[50]'),
('condicoes', '"Sinal de 50% para confirmar a reserva via PIX. Saldo no check-in. Cancelamento com até 30 dias: devolução do sinal; depois disso o sinal vira crédito para remarcação em até 6 meses."'),
('checkin_hora', '"14h"'), ('checkout_hora', '"12h"'),
('politica_pets', '"Pets são bem-vindos com aviso prévio. Pedimos que fiquem sempre acompanhados, fora das camas e da área da piscina e do restaurante. Consulte a recepção."')
on conflict (chave) do nothing;

insert into produtos (tipo, grupo, nome, descricao, preco, ordem) values
('restaurante','Pratos da casa','Paella de frutos do mar','Receita espanhola do Isidro, para 2 pessoas',189,1),
('restaurante','Pratos da casa','Moqueca de peixe','Com pirão, arroz e farofa de dendê, para 2 pessoas',159,2),
('restaurante','Pratos da casa','Arroz de polvo','Polvo macio, arroz cremoso e azeite',149,3),
('restaurante','Pratos da casa','Risoto de camarão','Camarões frescos da costa',129,4),
('restaurante','Petiscos (até 17h)','Isca de peixe','Com molho tártaro',69,5),
('restaurante','Petiscos (até 17h)','Camarão alho e óleo','Porção',89,6),
('restaurante','Petiscos (até 17h)','Batata frita','Porção',35,7),
('bar','Bebidas','Água mineral','500 ml',6,10),
('bar','Bebidas','Refrigerante lata','350 ml',8,11),
('bar','Bebidas','Suco natural','Frutas da estação',14,12),
('bar','Bebidas','Água de coco','Gelada',10,13),
('bar','Cervejas','Cerveja long neck','',14,14),
('bar','Cervejas','Cerveja 600 ml','',18,15),
('bar','Drinks','Caipirinha','Limão, cachaça artesanal',25,16),
('bar','Drinks','Caipiroska de frutas','Morango, maracujá ou kiwi',29,17),
('produto','Lojinha','Protetor solar','FPS 50',45,30),
('produto','Lojinha','Canga Pousada Maré','',60,31),
('servico','Serviços','Lavanderia (peça)','',8,40),
('servico','Serviços','Taxa de rolha','Vinho ou espumante',40,41);

-- Central de dúvidas: perguntas iniciais (só se ainda não houver nenhuma).
-- {condicoes}, {pets}, {checkin} e {checkout} são trocados pelo texto de Ajustes › Site.
insert into faq (tema, pergunta, resposta, palavras, traducoes, ordem)
select * from (values
  ('Reserva e pagamento', 'Como faço uma reserva?', 'Toque em Montar reserva, escolha as datas, quantas pessoas vêm e as suítes. O site mostra o valor e você envia o pedido pelo WhatsApp. A recepção confirma a disponibilidade e manda os dados para pagamento.', 'reservar vaga disponibilidade agendar marcar datas', '{"es": {"t": "Reserva y pago", "p": "¿Cómo hago una reserva?", "r": "Toca en Reservar, elige las fechas, cuántas personas vienen y las suites. El sitio muestra el precio y envías el pedido por WhatsApp. La recepción confirma la disponibilidad y te envía los datos para el pago."}, "en": {"t": "Booking and payment", "p": "How do I book?", "r": "Tap Book your stay, choose your dates, how many people are coming and the suites. The website shows the price and you send the request on WhatsApp. The front desk confirms availability and sends you the payment details."}}'::jsonb, 10),
  ('Reserva e pagamento', 'Como funciona o pagamento e o cancelamento?', '{condicoes}', 'pagar pagamento pix sinal entrada deposito saldo cancelar cancelamento desistir remarcar reembolso devolucao', '{"es": {"t": "Reserva y pago", "p": "¿Cómo funcionan el pago y la cancelación?", "r": "Para confirmar la reserva pedimos una seña del 50% por PIX. El saldo se paga en el check-in. Si cancelas con hasta 30 días de anticipación, devolvemos la seña; después de eso, la seña queda como crédito para cambiar la fecha dentro de 6 meses."}, "en": {"t": "Booking and payment", "p": "How do payment and cancellation work?", "r": "To confirm the booking we ask for a 50% deposit via PIX. The balance is paid at check-in. If you cancel up to 30 days before, we refund the deposit; after that, the deposit becomes credit to rebook within 6 months."}}'::jsonb, 20),
  ('Reserva e pagamento', 'Quanto custa a diária?', 'O valor depende da suíte, do número de pessoas e da época. Toque em Montar reserva e escolha as datas: o site mostra na hora o valor total da estadia.', 'preco valor diaria quanto custa tarifa orcamento', '{"es": {"t": "Reserva y pago", "p": "¿Cuánto cuesta la noche?", "r": "El precio depende de la suite, del número de personas y de la época. Toca en Reservar y elige las fechas: el sitio muestra al instante el valor total de la estadía."}, "en": {"t": "Booking and payment", "p": "How much is a night?", "r": "The price depends on the suite, the number of guests and the season. Tap Book your stay and choose your dates: the website shows the total for your stay right away."}}'::jsonb, 30),
  ('Chegada e horários', 'Como chego do aeroporto?', 'Os aeroportos mais próximos são o de Teixeira de Freitas (110 km, cerca de 2 h) e o de Porto Seguro (230 km, cerca de 4 h). O centro de Prado fica a 32 km e a vila de Cumuruxatiba, a 2,5 km. O trecho final, de cerca de 30 km, é de estrada de terra.', 'aeroporto voo aviao porto seguro teixeira de freitas distancia estrada terra rota caminho chegar', '{"es": {"t": "Llegada y horarios", "p": "¿Cómo llego desde el aeropuerto?", "r": "Los aeropuertos más cercanos son el de Teixeira de Freitas (110 km, unas 2 h) y el de Porto Seguro (230 km, unas 4 h). El centro de Prado está a 32 km y el pueblo de Cumuruxatiba, a 2,5 km. El tramo final, de unos 30 km, es de camino de tierra."}, "en": {"t": "Arrival and times", "p": "How do I get here from the airport?", "r": "The nearest airports are Teixeira de Freitas (110 km, about 2 h) and Porto Seguro (230 km, about 4 h). Prado town centre is 32 km away and Cumuruxatiba village is 2.5 km away. The last stretch, about 30 km, is a dirt road."}}'::jsonb, 40),
  ('Chegada e horários', 'Qual o horário de check-in e check-out?', 'Check-in a partir das {checkin} e check-out até as {checkout}. A portaria funciona das 7h às 19h; se for chegar mais tarde, avise pelo WhatsApp.', 'horario hora entrada saida checkin checkout portaria chegar tarde noite', '{"es": {"t": "Llegada y horarios", "p": "¿A qué hora son el check-in y el check-out?", "r": "Check-in desde las 14h y check-out hasta las 12h. La portería funciona de 7h a 19h; si vas a llegar más tarde, avísanos por WhatsApp."}, "en": {"t": "Arrival and times", "p": "What are the check-in and check-out times?", "r": "Check-in from 2 pm and check-out by 12 noon. The front gate is staffed from 7 am to 7 pm; if you''re arriving later, let us know on WhatsApp."}}'::jsonb, 50),
  ('Chegada e horários', 'Onde fica a pousada?', 'Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (BA). A pousada é pé na areia, na praia do Rio do Peixe Grande, onde o rio encontra o mar.', 'endereco localizacao mapa rua google maps praia', '{"es": {"t": "Llegada y horarios", "p": "¿Dónde queda la posada?", "r": "Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (Bahía). La posada está frente a la playa de Rio do Peixe Grande, donde el río se encuentra con el mar."}, "en": {"t": "Arrival and times", "p": "Where is the inn?", "r": "Alameda Roberto Pompeu, 15, Rio do Peixe Grande, Cumuruxatiba, Prado (Bahia). The inn sits right on Rio do Peixe Grande beach, where the river meets the sea."}}'::jsonb, 60),
  ('Suítes', 'Quais suítes vocês têm?', 'Suítes duplas com vista para o mar e varanda com rede, suítes quádruplas conjugadas para famílias (até 5 pessoas), uma suíte acessível no térreo e suítes econômicas sem varanda (até 4 pessoas). Todas têm ar-condicionado e frigobar.', 'quarto quartos suite acomodacao vista mar varanda rede ar condicionado frigobar casal', '{"es": {"t": "Suites", "p": "¿Qué suites tienen?", "r": "Suites dobles con vista al mar y galería con hamaca, suites cuádruples conectadas para familias (hasta 5 personas), una suite accesible en planta baja y suites económicas sin galería (hasta 4 personas). Todas tienen aire acondicionado y frigobar."}, "en": {"t": "Suites", "p": "What suites do you have?", "r": "Double suites with sea view and a veranda with a hammock, connecting quadruple suites for families (up to 5 people), an accessible ground-floor suite and economy suites without a veranda (up to 4 people). All have air conditioning and a minibar."}}'::jsonb, 70),
  ('Suítes', 'A pousada é acessível para cadeirantes?', 'Sim. A Suíte de Varanda Reservada fica no térreo e tem banheiro adaptado, com barras de apoio, pia rebaixada e box amplo. Se precisar de algo a mais, conte no pedido de reserva.', 'acessivel acessibilidade cadeirante cadeira rodas pcd deficiente mobilidade rampa idoso', '{"es": {"t": "Suites", "p": "¿La posada es accesible en silla de ruedas?", "r": "Sí. La Suite de Galería Reservada está en planta baja y tiene baño adaptado, con barras de apoyo, lavabo bajo y ducha amplia. Si necesitas algo más, cuéntalo en el pedido de reserva."}, "en": {"t": "Suites", "p": "Is the inn wheelchair accessible?", "r": "Yes. The Private Veranda Suite is on the ground floor with an adapted bathroom: grab bars, a lowered sink and a wide shower. If you need anything else, mention it in your booking request."}}'::jsonb, 80),
  ('Família e pets', 'Posso levar crianças?', 'Pode, sim. Na reserva, contam como crianças as que têm até 12 anos. Para famílias, a Suíte Quádrupla Conjugada tem quartos reversíveis para até 5 pessoas. Precisa de berço? Escreva no campo de pedidos especiais da reserva.', 'crianca criancas filho filhos bebe berco familia idade', '{"es": {"t": "Familia y mascotas", "p": "¿Puedo ir con niños?", "r": "¡Claro! En la reserva, cuentan como niños los de hasta 12 años. Para familias, la Suite Cuádruple Conectada tiene habitaciones reversibles para hasta 5 personas. ¿Necesitas cuna? Escríbelo en el campo de pedidos especiales de la reserva."}, "en": {"t": "Family and pets", "p": "Can I bring children?", "r": "Of course. In the booking, children are those up to 12 years old. For families, the Connecting Quadruple Suite has flexible rooms for up to 5 people. Need a cot? Write it in the special requests field of your booking."}}'::jsonb, 90),
  ('Família e pets', 'Aceita pet?', '{pets}', 'pet pets cachorro cao gato animal animais bicho', '{"es": {"t": "Familia y mascotas", "p": "¿Aceptan mascotas?", "r": "Las mascotas son bienvenidas con aviso previo. Pedimos que estén siempre acompañadas, fuera de las camas y de las áreas de la piscina y del restaurante. Consulta con la recepción."}, "en": {"t": "Family and pets", "p": "Are pets allowed?", "r": "Pets are welcome with advance notice. We ask that they''re always accompanied and kept off the beds and away from the pool and restaurant areas. Please check with the front desk."}}'::jsonb, 100),
  ('Estrutura', 'O que tem na pousada?', 'Piscina ampla com sauna, bar na praia, restaurante e café da manhã de frente para o mar, tudo entre jardins e amendoeiras.', 'piscina sauna bar estrutura lazer jardim cafe da manha', '{"es": {"t": "Instalaciones", "p": "¿Qué hay en la posada?", "r": "Piscina amplia con sauna, bar en la playa, restaurante y desayuno frente al mar, entre jardines y almendros."}, "en": {"t": "Facilities", "p": "What does the inn offer?", "r": "A large pool with a sauna, a beach bar, a restaurant and breakfast facing the sea, among gardens and almond trees."}}'::jsonb, 110),
  ('Estrutura', 'Tem internet e sinal de celular?', 'A internet é limitada na região. Na praia, só a operadora Vivo tem sinal. A rede elétrica é 220 V.', 'internet wifi wi fi sinal celular operadora vivo tim claro tomada voltagem 220 110', '{"es": {"t": "Instalaciones", "p": "¿Hay internet y señal de celular?", "r": "La internet es limitada en la zona. En la playa, solo la operadora Vivo tiene señal. La red eléctrica es de 220 V."}, "en": {"t": "Facilities", "p": "Is there internet and phone signal?", "r": "Internet is limited in the area. On the beach, only the Vivo network has signal. Power outlets are 220 V."}}'::jsonb, 120),
  ('Restaurante', 'O restaurante abre para quem não está hospedado?', 'Abre, sim. Almoço das 12h às 15h, petiscos até as 17h e jantar com pedido das 15h às 19h. Para reservar mesa, chame o restaurante pelo WhatsApp.', 'restaurante almoco jantar comida cardapio petisco mesa horario', '{"es": {"t": "Restaurante", "p": "¿El restaurante está abierto para quien no se hospeda?", "r": "Sí. Almuerzo de 12h a 15h, picadas hasta las 17h y cena con pedido de 15h a 19h. Para reservar mesa, escríbele al restaurante por WhatsApp."}, "en": {"t": "Restaurant", "p": "Is the restaurant open to non-guests?", "r": "Yes. Lunch from 12 to 3 pm, snacks until 5 pm and dinner ordered between 3 and 7 pm. To book a table, message the restaurant on WhatsApp."}}'::jsonb, 130)
) v(tema, pergunta, resposta, palavras, traducoes, ordem)
where not exists (select 1 from faq);
