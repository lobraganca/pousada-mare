/* Pousada Maré: tradução do site (português, espanhol, inglês).
   Como funciona: o site é escrito em português; este arquivo troca os textos na tela
   pelo idioma escolhido. Para traduzir um texto novo, acrescente uma linha em D:
   "Texto em português": ["Texto en español", "Text in English"]                    */
(function () {
  "use strict";
  var LS = ["pt", "es", "en"];
  var L = (function () {
    try { var q = new URLSearchParams(location.search).get("lang"); if (q && LS.indexOf(q) >= 0) { localStorage.mareLang = q; return q; } } catch (e) {}
    try { var s = localStorage.mareLang; if (s && LS.indexOf(s) >= 0) return s; } catch (e) {}
    var n = String(navigator.language || "pt").toLowerCase();
    return n.indexOf("pt") === 0 ? "pt" : n.indexOf("es") === 0 ? "es" : "en";
  })();
  var I = L === "es" ? 0 : 1;
  var LOC = { pt: "pt-BR", es: "es-ES", en: "en-US" }[L];
  window.mareLang = L;
  document.documentElement.lang = LOC === "pt-BR" ? "pt-BR" : L;

  /* datas no idioma escolhido */
  if (L !== "pt") {
    var tl = Date.prototype.toLocaleDateString, ts = Date.prototype.toLocaleString;
    Date.prototype.toLocaleDateString = function (l, o) { return tl.call(this, /^pt/i.test(l || "") ? LOC : l, o); };
    Date.prototype.toLocaleString = function (l, o) { return ts.call(this, /^pt/i.test(l || "") && !(o && o.style) ? LOC : l, o); };
  }

  var D = {
    /* menu e cabeçalho */
    "Suítes": ["Suites", "Suites"], "Restaurante": ["Restaurante", "Restaurant"], "A pousada": ["La posada", "The inn"],
    "Como chegar": ["Cómo llegar", "Getting here"], "Esgotada nessas datas": ["Agotada en estas fechas", "Sold out for these dates"], "Só resta 1 suíte": ["Queda solo 1 suite", "Only 1 suite left"], "Últimas 2 suítes": ["Últimas 2 suites", "Last 2 suites"],
    "Todas as suítes já estão reservadas nessas datas.": ["Todas las suites ya están reservadas en estas fechas.", "All suites are already booked for these dates."], "Escolher outras datas": ["Elegir otras fechas", "Choose other dates"], "Dúvidas": ["Preguntas", "FAQ"], "Cardápio": ["Menú", "Menu"], "Montar reserva": ["Reservar", "Book your stay"],
    "Principal": ["Principal", "Main"], "Menu": ["Menú", "Menu"], "Abrir menu": ["Abrir menú", "Open menu"], "Fechar menu": ["Cerrar menú", "Close menu"],
    "Pousada Maré, início": ["Pousada Maré, inicio", "Pousada Maré, home"],
    /* abertura */
    "Agora em Cumuru: maré calma": ["Ahora en Cumuru: marea tranquila", "Now in Cumuru: calm tide"],
    "Agora em Cumuru: maré viva": ["Ahora en Cumuru: marea viva", "Now in Cumuru: spring tide"],
    "Agora em Cumuru": ["Ahora en Cumuru", "Now in Cumuru"],
    "Pé na areia em Cumuruxatiba, Bahia": ["Frente al mar en Cumuruxatiba, Bahía", "Right on the beach in Cumuruxatiba, Bahia"],
    "Café da manhã incluído": ["Desayuno incluido", "Breakfast included"], "Chá da tarde de cortesia": ["Merienda de cortesía", "Complimentary afternoon tea"],
    "Toque para montar sua reserva": ["Toca para armar tu reserva", "Tap to plan your stay"],
    "Chegada": ["Llegada", "Check-in"], "Saída": ["Salida", "Check-out"], "Hóspedes": ["Huéspedes", "Guests"], "Escolher": ["Elegir", "Choose"],
    "Ver valores e reservar": ["Ver precios y reservar", "See prices and book"],
    "Anterior": ["Anterior", "Previous"], "Próximo": ["Siguiente", "Next"],
    /* destaques */
    "Pé na areia": ["Frente al mar", "Right on the sand"], "Praia do Rio do Peixe Grande": ["Playa de Rio do Peixe Grande", "Rio do Peixe Grande beach"],
    "Piscina ampla com sauna": ["Gran piscina con sauna", "Large pool with sauna"], "Entre jardins e amendoeiras": ["Entre jardines y almendros", "Among gardens and almond trees"],
    "Café e chá da tarde": ["Desayuno y merienda", "Breakfast and afternoon tea"], "Incluídos na diária": ["Incluidos en la tarifa", "Included in the rate"],
    "Acessível de ponta a ponta": ["Accesible de punta a punta", "Accessible throughout"], "Suíte adaptada no térreo": ["Suite adaptada en planta baja", "Adapted suite on the ground floor"],
    /* suítes */
    "Acomodações": ["Alojamiento", "Rooms"], "Escolha sua suíte": ["Elige tu suite", "Choose your suite"],
    "Arraste para o lado e toque em \"Reservar\" para ver o valor das suas datas.": ["Desliza hacia el lado y toca \"Reservar\" para ver el precio de tus fechas.", "Swipe sideways and tap \"Book\" to see the price for your dates."],
    "Suíte Dupla": ["Suite Doble", "Double Suite"], "Vista para o mar": ["Vista al mar", "Sea view"], "Varanda com rede": ["Balcón con hamaca", "Balcony with hammock"],
    "Ar-condicionado": ["Aire acondicionado", "Air conditioning"], "Frigobar": ["Minibar", "Minibar"], "diária a partir de": ["por noche desde", "per night from"],
    "Reservar": ["Reservar", "Book"], "Suíte Quádrupla Conjugada": ["Suite Cuádruple Comunicada", "Connecting Family Suite"],
    "Quartos reversíveis para famílias, até 5 pessoas": ["Habitaciones comunicadas para familias, hasta 5 personas", "Connecting rooms for families, up to 5 people"],
    "Quartos conjugados": ["Habitaciones comunicadas", "Connecting rooms"], "Suíte de Varanda Reservada": ["Suite con Balcón Privado", "Private Balcony Suite"],
    "Acessível": ["Accesible", "Accessible"], "Acessível (PcD)": ["Accesible (movilidad reducida)", "Accessible (reduced mobility)"], "Piso térreo": ["Planta baja", "Ground floor"],
    "Varanda reservada": ["Balcón privado", "Private balcony"], "Suíte Econômica": ["Suite Económica", "Standard Suite"], "Sem varanda": ["Sin balcón", "No balcony"],
    "Cama casal + bicama": ["Cama doble + cama nido", "Double bed + trundle bed"],
    "Suíte Dupla · Vista para o mar": ["Suite Doble · Vista al mar", "Double Suite · Sea view"],
    "Suíte de Varanda Reservada · Acessível": ["Suite con Balcón Privado · Accesible", "Private Balcony Suite · Accessible"],
    "Suíte Econômica · Sem varanda": ["Suite Económica · Sin balcón", "Standard Suite · No balcony"],
    "Varanda com rede de frente para o mar": ["Balcón con hamaca frente al mar", "Balcony with hammock facing the sea"],
    "Piso térreo, adaptada para PcD, até 5 pessoas": ["Planta baja, adaptada para movilidad reducida, hasta 5 personas", "Ground floor, adapted for reduced mobility, up to 5 people"],
    "24 m², cama de casal + bicama, até 4 pessoas": ["24 m², cama doble + cama nido, hasta 4 personas", "24 m², double bed + trundle bed, up to 4 people"],
    "Foto anterior": ["Foto anterior", "Previous photo"], "Próxima foto": ["Foto siguiente", "Next photo"],
    /* faixa */
    "Piscina com sauna": ["Piscina con sauna", "Pool with sauna"], "Bar na praia": ["Bar en la playa", "Beach bar"], "Beach tennis": ["Beach tenis", "Beach tennis"],
    "Café à beira-mar": ["Desayuno frente al mar", "Seaside breakfast"], "Chá da tarde": ["Merienda", "Afternoon tea"], "Restaurante Maré": ["Restaurante Maré", "Maré Restaurant"],
    "Copa baby": ["Rincón del bebé", "Baby corner"], "Suítes com vista para o mar": ["Suites con vista al mar", "Sea-view suites"],
    /* restaurante */
    "Bahia, Espanha e Minas à mesa": ["Bahía, España y Minas en la mesa", "Bahia, Spain and Minas on the table"],
    "A cozinha do Isidro, com ingredientes frescos da região. Aberto também a quem não está hospedado.": ["La cocina de Isidro, con ingredientes frescos de la región. Abierto también a quienes no se hospedan.", "Isidro's cooking, with fresh local ingredients. Also open to non-guests."],
    "Almoço": ["Almuerzo", "Lunch"], "12h às 15h": ["12 a 15 h", "12 to 3 pm"], "Petiscos": ["Tapas", "Snacks"], "até 17h": ["hasta las 17 h", "until 5 pm"],
    "Jantar": ["Cena", "Dinner"], "pedidos 15h às 19h": ["pedidos de 15 a 19 h", "orders 3 to 7 pm"], "Ver o cardápio": ["Ver el menú", "See the menu"], "Reservar mesa": ["Reservar mesa", "Book a table"],
    "Mesa do Restaurante Maré de frente para o mar": ["Mesa del Restaurante Maré frente al mar", "Table at Maré Restaurant facing the sea"],
    /* experiências */
    "O que só a Maré tem": ["Lo que solo Maré tiene", "Only at Maré"], "Para nadar sem pressa, entre jardins e amendoeiras.": ["Para nadar sin prisa, entre jardines y almendros.", "For an unhurried swim among gardens and almond trees."],
    "Pé na areia, onde o rio encontra o mar.": ["Frente al mar, donde el río se encuentra con el océano.", "On the sand, where the river meets the sea."],
    "Quadra de beach tennis": ["Cancha de beach tenis", "Beach tennis court"], "Na areia, para o fim da tarde.": ["En la arena, para el final de la tarde.", "On the sand, for late afternoons."],
    "Quartos para famílias": ["Habitaciones para familias", "Family rooms"], "Suítes conjugadas e reversíveis.": ["Suites comunicadas y flexibles.", "Connecting, flexible suites."],
    "Todas as áreas planejadas, suíte adaptada no térreo.": ["Todas las áreas planificadas, suite adaptada en planta baja.", "Every area planned for access, adapted suite on the ground floor."],
    "Copa baby e salão de jogos": ["Rincón del bebé y sala de juegos", "Baby corner and games room"], "Copa para os pequenos, playground e sinuca.": ["Cocina para los pequeños, juegos infantiles y billar.", "A kitchen corner for little ones, playground and pool table."],
    "Buffet à beira-mar e chá cortesia da casa.": ["Bufé frente al mar y merienda de cortesía.", "Seaside buffet and complimentary afternoon tea."],
    /* maré */
    "A maré de hoje": ["La marea de hoy", "Today's tide"], "Lua de hoje": ["Luna de hoy", "Tonight's moon"], "Fase da lua hoje": ["Fase de la luna hoy", "Moon phase today"],
    "Maré mais calma": ["Marea más tranquila", "Calmer tide"], "Maré viva": ["Marea viva", "Spring tide"], "maré calma": ["marea tranquila", "calm tide"], "maré viva": ["marea viva", "spring tide"],
    "Lua cheia": ["Luna llena", "Full moon"], "Lua nova": ["Luna nueva", "New moon"], "Lua crescente": ["Luna creciente", "Waxing crescent"], "Lua minguante": ["Luna menguante", "Waning crescent"],
    "Quarto crescente": ["Cuarto creciente", "First quarter"], "Quarto minguante": ["Cuarto menguante", "Last quarter"], "Crescente gibosa": ["Gibosa creciente", "Waxing gibbous"], "Minguante gibosa": ["Gibosa menguante", "Waning gibbous"],
    "Longe das luas cheia e nova, a diferença entre maré alta e baixa é menor e o mar fica mais calmo. Bom dia para nadar e para a rede na varanda.": ["Lejos de la luna llena y la nueva, la diferencia entre marea alta y baja es menor y el mar está más tranquilo. Buen día para nadar y para la hamaca en el balcón.", "Away from the full and new moons, the gap between high and low tide is smaller and the sea is calmer. A good day for a swim and the hammock on the balcony."],
    "Perto da lua cheia e da nova, a maré baixa desce mais e aparecem piscinas naturais e bancos de areia em frente à pousada. Bom dia para caminhar na maré baixa.": ["Cerca de la luna llena y la nueva, la marea baja desciende más y aparecen piscinas naturales y bancos de arena frente a la posada. Buen día para caminar con la marea baja.", "Near the full and new moons, low tide drops further and natural pools and sandbanks appear in front of the inn. A good day for a walk at low tide."],
    "Calculado pela fase da lua. Horários exatos na": ["Calculado por la fase lunar. Horarios exactos en la", "Worked out from the moon phase. Exact times in the"],
    "tábua de marés da Marinha": ["tabla de mareas de la Marina de Brasil", "Brazilian Navy tide table"],
    /* como chegar */
    "Antes de vir": ["Antes de venir", "Before you come"], "Tudo para planejar": ["Todo para planificar", "Everything to plan your trip"],
    "Clima": ["Clima", "Weather"], "Regras e pets": ["Normas y mascotas", "Rules and pets"],
    "Aeroporto de Porto Seguro, cerca de 4 h": ["Aeropuerto de Porto Seguro, unas 4 h", "Porto Seguro airport, about 4 h"],
    "Aeroporto de Teixeira de Freitas, cerca de 2 h": ["Aeropuerto de Teixeira de Freitas, unas 2 h", "Teixeira de Freitas airport, about 2 h"],
    "Centro de Prado": ["Centro de Prado", "Prado town centre"], "Vila de Cumuruxatiba": ["Pueblo de Cumuruxatiba", "Cumuruxatiba village"],
    "O trecho final, de cerca de 30 km, é de estrada de terra.": ["El último tramo, de unos 30 km, es de camino de tierra.", "The last stretch, about 30 km, is a dirt road."],
    "Portaria das 7h às 19h. Chegando mais tarde, avise pelo WhatsApp.": ["Recepción de 7 a 19 h. Si llegas más tarde, avísanos por WhatsApp.", "Front desk open 7 am to 7 pm. Arriving later? Let us know on WhatsApp."],
    "Internet limitada na região: só a Vivo tem sinal na praia. Rede 220 V.": ["Internet limitada en la zona: solo la operadora Vivo tiene señal en la playa. Corriente de 220 V.", "Limited internet in the area: only the Vivo network has signal on the beach. 220 V power."],
    "Abrir no Google Maps": ["Abrir en Google Maps", "Open in Google Maps"],
    "Calor o ano todo, com meses mais secos de junho a setembro. Máxima média e chuva do mês em Prado (Climatempo).": ["Calor todo el año, con meses más secos de junio a septiembre. Máxima media y lluvia del mes en Prado (Climatempo).", "Warm all year, with drier months from June to September. Average high and monthly rainfall in Prado (Climatempo)."],
    "jan": ["ene", "Jan"], "fev": ["feb", "Feb"], "mar": ["mar", "Mar"], "abr": ["abr", "Apr"], "mai": ["may", "May"], "jun": ["jun", "Jun"],
    "jul": ["jul", "Jul"], "ago": ["ago", "Aug"], "set": ["sep", "Sep"], "out": ["oct", "Oct"], "nov": ["nov", "Nov"], "dez": ["dic", "Dec"],
    "Sinal e pagamento": ["Seña y pago", "Deposit and payment"], "Cancelamento": ["Cancelación", "Cancellation"], "Pets": ["Mascotas", "Pets"], "Horários": ["Horarios", "Times"],
    "Sinal de 50% para confirmar a reserva via PIX. Saldo no check-in. Cancelamento com até 30 dias: devolução do sinal; depois disso o sinal vira crédito para remarcação em até 6 meses.": ["Seña del 50% para confirmar la reserva por PIX (transferencia brasileña). El resto se paga en el check-in. Cancelación con 30 días o más: se devuelve la seña; después, la seña queda como crédito para cambiar la fecha dentro de 6 meses.", "50% deposit to confirm the booking via PIX (Brazilian bank transfer). Balance due at check-in. Cancel 30 or more days ahead and the deposit is refunded; after that it becomes credit to rebook within 6 months."],
    "Cancelamento com até 30 dias: devolução do sinal; depois disso o sinal vira crédito para remarcação em até 6 meses.": ["Cancelación con 30 días o más: se devuelve la seña; después, la seña queda como crédito para cambiar la fecha dentro de 6 meses.", "Cancel 30 or more days ahead and the deposit is refunded; after that it becomes credit to rebook within 6 months."],
    "Pets são bem-vindos com aviso prévio. Pedimos que fiquem sempre acompanhados, fora das camas e da área da piscina e do restaurante. Consulte a recepção.": ["Las mascotas son bienvenidas con aviso previo. Pedimos que estén siempre acompañadas y fuera de las camas, la piscina y el restaurante. Consulta con la recepción.", "Pets are welcome with advance notice. Please keep them with you at all times and off the beds, the pool area and the restaurant. Ask the front desk."],
    "Check-in a partir das 14h e check-out até as 12h. Portaria das 7h às 19h.": ["Check-in desde las 14 h y check-out hasta las 12 h. Recepción de 7 a 19 h.", "Check-in from 2 pm, check-out by 12 noon. Front desk open 7 am to 7 pm."],
    "Check-in a partir das 14h e check-out até as 12h.": ["Check-in desde las 14 h y check-out hasta las 12 h.", "Check-in from 2 pm, check-out by 12 noon."],
    "Pedimos um sinal para garantir a reserva; o saldo é pago no check-in.": ["Pedimos una seña para garantizar la reserva; el resto se paga en el check-in.", "We ask for a deposit to secure the booking; the balance is paid at check-in."],
    "Consulte a política de cancelamento com a recepção.": ["Consulta la política de cancelación con la recepción.", "Ask the front desk about the cancellation policy."],
    "Fale com a recepção antes de trazer seu pet.": ["Habla con la recepción antes de traer a tu mascota.", "Talk to the front desk before bringing your pet."],
    /* galeria, vídeos, final */
    "Galeria": ["Galería", "Gallery"], "Dias na Maré": ["Días en Maré", "Days at Maré"], "Vídeos": ["Videos", "Videos"], "A Maré em movimento": ["Maré en movimiento", "Maré in motion"],
    "Nascer do sol na praia": ["Amanecer en la playa", "Sunrise on the beach"], "Fechar vídeo": ["Cerrar video", "Close video"],
    "Monte sua reserva em 1 minuto": ["Arma tu reserva en 1 minuto", "Plan your stay in 1 minute"],
    "Escolha as datas e as suítes, veja o valor e envie o pedido pelo WhatsApp. A recepção confirma e manda os dados para pagamento.": ["Elige las fechas y las suites, mira el precio y envía el pedido por WhatsApp. La recepción confirma y te manda los datos para el pago.", "Choose your dates and suites, see the price and send your request on WhatsApp. The front desk confirms and sends payment details."],
    "Falar no WhatsApp": ["Hablar por WhatsApp", "Chat on WhatsApp"],
    /* rodapé */
    "Fale com a pousada": ["Habla con la posada", "Contact the inn"], "Recepção, WhatsApp": ["Recepción, WhatsApp", "Front desk, WhatsApp"], "Conversar": ["Escribir", "Chat"],
    "Copiar": ["Copiar", "Copy"], "Copiado": ["Copiado", "Copied"], "E-mail": ["Correo", "Email"], "Escrever": ["Escribir", "Write"], "Onde estamos": ["Dónde estamos", "Where we are"],
    "Área da pousada": ["Área de la posada", "Staff area"], "Site criado por": ["Sitio creado por", "Website by"],
    "Pousada Maré · Cumuruxatiba, BA ·": ["Pousada Maré · Cumuruxatiba, Bahía ·", "Pousada Maré · Cumuruxatiba, Bahia, Brazil ·"],
    "Pousada Maré · Cumuruxatiba, Bahia": ["Pousada Maré · Cumuruxatiba, Bahía", "Pousada Maré · Cumuruxatiba, Bahia, Brazil"],
    "Conversar no WhatsApp": ["Escribir por WhatsApp", "Chat on WhatsApp"], "Fechar": ["Cerrar", "Close"],
    "WhatsApp de Lorena Bragança": ["WhatsApp de Lorena Bragança", "Lorena Bragança on WhatsApp"], "Instagram de Lorena Bragança": ["Instagram de Lorena Bragança", "Lorena Bragança on Instagram"],
    /* reserva */
    "Sua estadia": ["Tu estadía", "Your stay"], "Escolha as datas e quantas pessoas vêm.": ["Elige las fechas y cuántas personas vienen.", "Choose your dates and how many people are coming."],
    "Seus dados": ["Tus datos", "Your details"], "Datas": ["Fechas", "Dates"], "Enviar": ["Enviar", "Send"],
    "Para começar, seu nome e WhatsApp. Assim a recepção fala com você.": ["Para empezar, tu nombre y WhatsApp. Así la recepción puede hablar contigo.", "To start, your name and WhatsApp number, so the front desk can reach you."],
    "Nome completo": ["Nombre completo", "Full name"], "Cidade": ["Ciudad", "City"], "Algum pedido especial?": ["¿Algún pedido especial?", "Any special requests?"],
    "Aniversário, chegada depois das 19h, berço, acessibilidade": ["Cumpleaños, llegada después de las 19 h, cuna, accesibilidad", "Birthday, arriving after 7 pm, cot, accessibility"],
    "Usamos estes dados só para responder sobre esta reserva.": ["Usamos estos datos solo para responder sobre esta reserva.", "We only use these details to reply about this booking."],
    "Usamos estes dados só para responder sobre esta reserva. O que você preencher fica salvo para a recepção poder te ajudar, mesmo que você não envie.": ["Usamos estos datos solo para responder sobre esta reserva. Lo que completes queda guardado para que la recepción pueda ayudarte, aunque no lo envíes.", "We only use these details to reply about this booking. What you fill in is saved so the front desk can help you, even if you don't send it."],
    "Política de Privacidade": ["Política de Privacidad", "Privacy Policy"],
    "Escolher as datas": ["Elegir las fechas", "Choose dates"], "Mês anterior": ["Mes anterior", "Previous month"], "Próximo mês": ["Mes siguiente", "Next month"],
    "feriado ou temporada, com valores especiais": ["feriado o temporada, con precios especiales", "holiday or peak season, special rates"],
    "Adultos": ["Adultos", "Adults"], "a partir de 13 anos": ["desde 13 años", "13 and over"], "Crianças": ["Niños", "Children"], "até 12 anos": ["hasta 12 años", "up to 12"],
    "Vou levar meu pet": ["Voy a llevar a mi mascota", "I'm bringing my pet"], "a recepção explica os cuidados": ["la recepción te explica las normas", "the front desk will explain the rules"],
    "Menos": ["Menos", "Fewer"], "Mais": ["Más", "More"], "Voltar": ["Volver", "Back"], "Escolha a chegada e a saída": ["Elige la llegada y la salida", "Choose check-in and check-out"],
    "Ver as suítes": ["Ver las suites", "See the suites"], "Agora toque no dia da saída.": ["Ahora toca el día de salida.", "Now tap your check-out day."],
    "As suítes": ["Las suites", "The suites"], "Escolha as suítes. A recepção confirma a disponibilidade com você.": ["Elige las suites. La recepción te confirma la disponibilidad.", "Choose your suites. The front desk will confirm availability with you."],
    "Calculando os valores…": ["Calculando los precios…", "Working out prices…"], "Revisar o pedido": ["Revisar el pedido", "Review request"],
    "Quem fica em cada suíte": ["Quién se queda en cada suite", "Who stays in each suite"], "Cada suíte precisa de pelo menos um adulto.": ["Cada suite necesita al menos un adulto.", "Each suite needs at least one adult."],
    "valor sob consulta": ["precio a consultar", "price on request"], "Ajustar a saída": ["Ajustar la salida", "Change check-out"],
    "Essas datas ainda não estão abertas no site, mas você pode enviar o pedido: a recepção verifica e responde pelo WhatsApp.": ["Estas fechas aún no están abiertas en el sitio, pero puedes enviar el pedido: la recepción lo revisa y responde por WhatsApp.", "These dates aren't open on the website yet, but you can still send your request: the front desk will check and reply on WhatsApp."],
    "Não foi possível calcular os valores agora. Continue e a recepção passa tudo pelo WhatsApp.": ["No pudimos calcular los precios ahora. Continúa y la recepción te pasa todo por WhatsApp.", "We couldn't work out prices right now. Carry on and the front desk will send everything on WhatsApp."],
    "Tudo certo?": ["¿Todo bien?", "All set?"], "Confira e envie pelo WhatsApp.": ["Revisa y envía por WhatsApp.", "Check and send on WhatsApp."], "Nome": ["Nombre", "Name"],
    "Enviar pelo WhatsApp": ["Enviar por WhatsApp", "Send on WhatsApp"], "Pedido enviado": ["Pedido enviado", "Request sent"], "A recepção responde pelo WhatsApp.": ["La recepción responde por WhatsApp.", "The front desk will reply on WhatsApp."],
    "Até breve.": ["Hasta pronto.", "See you soon."], "toque aqui": ["toca aquí", "tap here"],
    "Seu pedido foi para o WhatsApp da recepção, que confirma a disponibilidade e envia os dados para pagamento. Se o WhatsApp não abriu,": ["Tu pedido fue al WhatsApp de la recepción, que confirma la disponibilidad y envía los datos para el pago. Si WhatsApp no se abrió,", "Your request went to the front desk's WhatsApp. They'll confirm availability and send payment details. If WhatsApp didn't open,"],
    "Montar reserva ": ["Reservar ", "Book your stay "],
    /* cardápio */
    "Cardápio do Restaurante Maré": ["Menú del Restaurante Maré", "Maré Restaurant menu"], "Fechar cardápio": ["Cerrar menú", "Close menu"], "Tudo": ["Todo", "All"],
    "Almoço das 12h às 15h, petiscos até as 17h, jantar com pedido das 15h às 19h.": ["Almuerzo de 12 a 15 h, tapas hasta las 17 h, cena con pedido de 15 a 19 h.", "Lunch 12 to 3 pm, snacks until 5 pm, dinner orders 3 to 7 pm."],
    "Valores em reais. Hóspedes podem lançar na conta da suíte.": ["Precios en reales brasileños. Los huéspedes pueden cargarlo a la cuenta de la suite.", "Prices in Brazilian reais. Guests can charge it to their suite."],
    "Pedir pelo WhatsApp": ["Pedir por WhatsApp", "Order on WhatsApp"],
    "O cardápio está sendo atualizado. Fale com o restaurante pelo WhatsApp.": ["El menú se está actualizando. Habla con el restaurante por WhatsApp.", "The menu is being updated. Contact the restaurant on WhatsApp."],
    "Pratos da casa": ["Platos de la casa", "House dishes"], "Petiscos (até 17h)": ["Tapas (hasta las 17 h)", "Snacks (until 5 pm)"], "Bebidas": ["Bebidas", "Drinks"],
    "Cervejas": ["Cervezas", "Beers"], "Drinks": ["Cócteles", "Cocktails"],
    "Paella de frutos do mar": ["Paella de mariscos", "Seafood paella"], "Receita espanhola do Isidro, para 2 pessoas": ["Receta española de Isidro, para 2 personas", "Isidro's Spanish recipe, serves 2"],
    "Moqueca de peixe": ["Moqueca de pescado", "Fish moqueca (Bahian stew)"], "Com pirão, arroz e farofa de dendê, para 2 pessoas": ["Con pirão, arroz y farofa de aceite de palma, para 2 personas", "With pirão, rice and palm-oil farofa, serves 2"],
    "Arroz de polvo": ["Arroz con pulpo", "Octopus rice"], "Polvo macio, arroz cremoso e azeite": ["Pulpo tierno, arroz cremoso y aceite de oliva", "Tender octopus, creamy rice and olive oil"],
    "Risoto de camarão": ["Risotto de camarones", "Shrimp risotto"], "Camarões frescos da costa": ["Camarones frescos de la costa", "Fresh local shrimp"],
    "Isca de peixe": ["Bocaditos de pescado", "Fried fish bites"], "Com molho tártaro": ["Con salsa tártara", "With tartar sauce"],
    "Camarão alho e óleo": ["Camarones al ajillo", "Garlic shrimp"], "Porção": ["Porción", "Portion"], "Batata frita": ["Papas fritas", "French fries"],
    "Água mineral": ["Agua mineral", "Mineral water"], "Refrigerante lata": ["Refresco en lata", "Soft drink (can)"], "Suco natural": ["Jugo natural", "Fresh juice"],
    "Frutas da estação": ["Frutas de temporada", "Seasonal fruit"], "Água de coco": ["Agua de coco", "Coconut water"], "Gelada": ["Bien fría", "Chilled"],
    "Cerveja long neck": ["Cerveza long neck", "Beer (long neck)"], "Cerveja 600 ml": ["Cerveza 600 ml", "Beer 600 ml"], "Caipirinha": ["Caipiriña", "Caipirinha"],
    "Limão, cachaça artesanal": ["Lima, cachaza artesanal", "Lime, craft cachaça"], "Caipiroska de frutas": ["Caipiroska de frutas", "Fruit caipiroska"],
    "Morango, maracujá ou kiwi": ["Fresa, maracuyá o kiwi", "Strawberry, passion fruit or kiwi"]
  };
  var PES = ["persona", "person"], PESS = ["personas", "people"], NO = ["noche", "night"], NOS = ["noches", "nights"];
  var MES = { pt: "janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro".split(" "), es: "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split(" "), en: "January February March April May June July August September October November December".split(" ") };
  var pl = function (n, a, b) { return n + " " + (+n === 1 ? a[I] : b[I]); };
  var R = [
    [/^(\d+) pessoas?$/, function (m) { return pl(m[1], PES, PESS); }],
    [/^Até (\d+) pessoas?$/, function (m) { return (I ? "Up to " : "Hasta ") + pl(m[1], PES, PESS); }],
    [/^Até (\d+) pessoas?\. (.+)$/, function (m) { return (I ? "Up to " : "Hasta ") + pl(m[1], PES, PESS) + ". " + (tr(m[2]) || m[2]); }],
    [/^Foto (\d+)$/, function (m) { return (I ? "Photo " : "Foto ") + m[1]; }],
    [/^(\d+) noites?$/, function (m) { return pl(m[1], NO, NOS); }],
    [/^por (\d+) noites?$/, function (m) { return (I ? "for " : "por ") + pl(m[1], NO, NOS); }],
    [/^Total, (\d+) noites?$/, function (m) { return "Total, " + pl(m[1], NO, NOS); }],
    [/^a (R\$ .+)$/, function (m) { return (I ? "to " : "a ") + m[1]; }],
    [/^Hoje, (.+)$/, function (m) { return (I ? "Today, " : "Hoy, ") + (tr(m[1]) || tr(m[1].charAt(0).toUpperCase() + m[1].slice(1)) || m[1]).toLowerCase(); }],
    [/^(\d+) adultos?(?: e (\d+) crianças?)?(, com pet)?$/, function (m) { return pl(m[1], ["adulto", "adult"], ["adultos", "adults"]) + (m[2] ? (I ? " and " : " y ") + pl(m[2], ["niño", "child"], ["niños", "children"]) : "") + (m[3] ? (I ? ", with a pet" : ", con mascota") : ""); }],
    [/^(.+), (\d+) pessoas?$/, function (m) { var t = tr(m[1]); return t ? t + ", " + pl(m[2], PES, PESS) : null; }],
    [/^Adultos (.*)$/, function (m) { return (I ? "Adults " : "Adultos ") + m[1]; }],
    [/^Crianças (.*)$/, function (m) { return (I ? "Children " : "Niños ") + m[1]; }],
    [/^Suíte (\d+)(.*)$/, function (m) { return "Suite " + m[1] + (m[2] ? m[2].replace("Acessível", I ? "Accessible" : "Accesible") : ""); }],
    [/^Para confirmar, a recepção pede um sinal de (\d+)% \((R\$ [^)]+)\) e envia os dados para pagamento pelo WhatsApp\.$/, function (m) { return I ? "To confirm, the front desk asks for a " + m[1] + "% deposit (" + m[2] + ") and sends payment details on WhatsApp." : "Para confirmar, la recepción pide una seña del " + m[1] + "% (" + m[2] + ") y envía los datos para el pago por WhatsApp."; }],
    [/^Essas suítes acomodam (\d+) pessoas e vocês são (\d+)\. Escolha mais uma\.$/, function (m) { return I ? "These suites fit " + m[1] + " people and you are " + m[2] + ". Choose one more." : "Estas suites alojan a " + m[1] + " personas y ustedes son " + m[2] + ". Elige una más."; }],
    [/^Nessas datas, as suítes livres acomodam até (\d+) pessoas?\.$/, function (m) { return I ? "For these dates, the available suites fit up to " + pl(m[1], PES, PESS) + "." : "En estas fechas, las suites libres alojan hasta " + pl(m[1], PES, PESS) + "."; }],
    [/^Nesse período a estadia mínima é de (\d+) noites\.$/, function (m) { return I ? "For these dates the minimum stay is " + m[1] + " nights." : "En este período la estadía mínima es de " + m[1] + " noches."; }],
    [/^(\d+) de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)$/, function (m) { var k = MES.pt.indexOf(m[2]); return I ? MES.en[k] + " " + m[1] : m[1] + " de " + MES.es[k]; }],
    [/^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (\d{4})$/, function (m) { var k = MES.pt.indexOf(m[1]); return I ? MES.en[k] + " " + m[2] : MES.es[k] + " de " + m[2]; }]
  ];
  var SEM = [["D", "L", "M", "X", "J", "V", "S"], ["S", "M", "T", "W", "T", "F", "S"]];
  function tr(t) {
    if (Object.prototype.hasOwnProperty.call(D, t)) return D[t][I];
    for (var i = 0; i < R.length; i++) { var m = t.match(R[i][0]); if (m) { var r = R[i][1](m); if (r != null) return r; } }
    return null;
  }
  window.mareT = function (t) { return L === "pt" ? t : (tr(t) || t); };
  /* mensagem de WhatsApp: a recepção lê em português, então avisamos o idioma */
  var OLA = { "Olá! Vim pelo site da Pousada Maré.": ["¡Hola! Vengo del sitio web de Pousada Maré.", "Hi! I found you on the Pousada Maré website."],
    "Olá! Gostaria de reservar uma mesa no Restaurante Maré.": ["¡Hola! Me gustaría reservar una mesa en el Restaurante Maré.", "Hi! I'd like to book a table at Maré Restaurant."],
    "Olá! Vi o cardápio no site e gostaria de fazer um pedido ou reservar uma mesa no Restaurante Maré.": ["¡Hola! Vi el menú en el sitio y me gustaría hacer un pedido o reservar una mesa en el Restaurante Maré.", "Hi! I saw the menu on the website and would like to order or book a table at Maré Restaurant."],
    "Olá! Gostaria de consultar valores e datas na Pousada Maré.": ["¡Hola! Quisiera consultar precios y fechas en Pousada Maré.", "Hi! I'd like to ask about prices and dates at Pousada Maré."] };
  window.mareZap = function (m) {
    if (L === "pt" || !m) return m;
    if (OLA[m]) return OLA[m][I] + (I ? " (I speak English)" : " (Hablo español)");
    return (I ? "Hi! I'm writing in English.\n\n" : "¡Hola! Escribo en español.\n\n") + m;
  };

  /* troca de textos na tela */
  var W = new WeakMap(), ATR = ["placeholder", "aria-label", "title", "alt"], escrevendo = false;
  function txt(n) {
    var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName) || (p.closest && p.closest("[data-sem-trad]"))) return;
    var cur = n.nodeValue, st = W.get(n), pt = st && cur === st.out ? st.pt : cur;
    var k = pt.replace(/\s+/g, " ").trim(); if (!k) return;
    var out;
    if (p.parentNode && p.parentNode.classList && p.parentNode.classList.contains("sem") && k.length === 1) { var ix = [].indexOf.call(p.parentNode.children, p); out = SEM[I][ix] || k; }
    else { var t = tr(k); if (t == null) { W.set(n, { pt: pt, out: cur }); return; } out = pt.replace(k, t); }
    W.set(n, { pt: pt, out: out }); if (out !== cur) n.nodeValue = out;
  }
  function atr(el) {
    var st = W.get(el) || {};
    ATR.forEach(function (a) {
      if (!el.hasAttribute(a)) return; var cur = el.getAttribute(a), s = st[a], pt = s && cur === s.out ? s.pt : cur, t = tr(pt.trim());
      if (t == null) { st[a] = { pt: pt, out: cur }; return; } st[a] = { pt: pt, out: t }; if (t !== cur) el.setAttribute(a, t);
    });
    W.set(el, st);
  }
  function passa(raiz) {
    if (raiz.nodeType === 3) { txt(raiz); return; }
    if (raiz.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(raiz.nodeName)) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) txt(n);
    if (raiz.hasAttribute && ATR.some(function (a) { return raiz.hasAttribute(a); })) atr(raiz);
    raiz.querySelectorAll && raiz.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(atr);
  }
  var ob;
  function tudo(ms) {
    if (escrevendo) return; escrevendo = true;
    try { if (ms) ms.forEach(function (m) { if (m.type === "characterData") txt(m.target); else if (m.type === "attributes") atr(m.target); else m.addedNodes.forEach(passa); }); else passa(document.body); }
    finally { if (ob) ob.takeRecords(); escrevendo = false; }
  }
  /* seletor de idioma */
  function seletor() {
    var css = document.createElement("style");
    css.textContent = ".lang{display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(127,127,127,.16);flex:none}.lang button{border:0;background:none;color:inherit;font:inherit;font-size:12.5px;font-weight:700;padding:6px 9px;border-radius:999px;cursor:pointer;letter-spacing:.02em}.lang button[aria-pressed=true]{background:#fff;color:#0B3B45}header .lang{margin-left:4px}.menu-tela .lang{align-self:flex-start;margin-top:14px;background:rgba(11,59,69,.08);color:#0B3B45}.menu-tela .lang button{font-size:15px;padding:9px 14px}@media (max-width:900px){header .lang{margin-left:auto}header .lang+.abre{margin-left:0}}";
    document.head.appendChild(css);
    var h = function () { return '<div class="lang" role="group" aria-label="Idioma / Language" data-sem-trad>' + [["pt", "PT", "Português"], ["es", "ES", "Español"], ["en", "EN", "English"]].map(function (x) { return '<button type="button" data-lang="' + x[0] + '" aria-pressed="' + (x[0] === L) + '" title="' + x[2] + '" lang="' + x[0] + '">' + x[1] + '</button>'; }).join("") + '</div>'; };
    var ab = document.querySelector("header .abre"); if (ab) ab.insertAdjacentHTML("beforebegin", h());
    var mt = document.querySelector(".menu-tela .btn"); if (mt) mt.insertAdjacentHTML("afterend", h());
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lang]"); if (!b) return; var l = b.dataset.lang; if (l === L) return;
      try { localStorage.mareLang = l; sessionStorage.mareY = String(scrollY); } catch (x) {}
      var u = new URL(location.href); u.searchParams.delete("lang"); location.replace(u.toString());
    });
    try { var y = sessionStorage.mareY; if (y) { sessionStorage.removeItem("mareY"); setTimeout(function () { scrollTo(0, +y); }, 60); } } catch (x) {}
  }
  function inicia() {
    seletor();
    if (L === "pt") return;
    var tt = { "Pousada Maré · Cumuruxatiba, Bahia": ["Pousada Maré · Cumuruxatiba, Bahía", "Pousada Maré · Beachfront inn in Cumuruxatiba, Bahia, Brazil"] };
    if (tt[document.title]) document.title = tt[document.title][I];
    tudo();
    ob = new MutationObserver(tudo);
    ob.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicia); else inicia();
})();
