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
