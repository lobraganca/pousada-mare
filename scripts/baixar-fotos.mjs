// Baixa as fotos e a logo do site antigo (CheckinWeb) para dentro do projeto.
// Rode UMA vez no seu computador, na pasta do projeto:   node scripts/baixar-fotos.mjs
// Depois faça commit da pasta fotos/. O site passa a usar as cópias locais
// (e, se alguma faltar, ainda busca no endereço antigo).
import { mkdir, writeFile, access } from "node:fs/promises";
const CDN = "https://cdn.checkinweb.com.br/img/173/";
const LISTA = [
  "book/lg_1542722639-lazer-pousada-mare-em-cumuruxatiba2.png",
  "book/xl_1556298791-195b9b0c-8d96-446b-83c2-5384b804dd07.jpg",
  "book/xl_1556298863-d444bb5a-6fca-4cb2-bbfd-71fc20ef10ab.jpg",
  "book/xl_1556299019-329f021f-e15f-45b3-8124-b53f0da8e0a6.jpg",
  "book/xl_1556299232-45b93d48-f8e4-47f3-a0bf-49c99c5e8eab.jpg",
  "book/xl_1556299837-eca30598-62b3-4a42-8c58-d0b5eb2a8f4e.jpg",
  "book/xl_1579972469-8a5746f8-d2fd-42f2-866e-1751cb0ca142.jpg",
  "book/xl_1579972507-0c15c171-9389-4c7a-86de-f803982e152d.jpg",
  "book/xl_1579972555-50b0514d-7e82-43e6-bee8-e4dd40836d2b.jpg",
  "book/xl_1579972575-7805df8a-2d18-45b0-9b4f-82592f7ed3be.jpg",
  "book/xl_1579972588-19589f35-c167-437f-b52b-2935b5832ff7.jpg",
  "book/xl_1579972602-c3434fc0-8abe-40e6-bfb1-61ee0c1d984b.jpg",
  "book/xl_1579972614-bcda6405-57a2-4277-8689-a5a6ebc77d31.jpg",
  "book/xl_1642194851-pousada-em-cumuruxatiba-prado-bahia-4.jpg",
  "book/xl_1642194874-pousada-em-cumuruxatiba-prado-bahia-2.jpg",
  "book/xl_1642194881-pousada-em-cumuruxatiba-prado-bahia-3.jpg",
  "book/xl_1642194905-pousada-em-cumuruxatiba-prado-bahia-8.jpg",
  "book/xl_1642194922-pousada-em-cumuruxatiba-prado-bahia-9.jpg",
  "book/xl_1642194945-pousada-em-cumuruxatiba-prado-bahia-16.jpg",
  "book/xl_1642195033-pousada-em-cumuruxatiba-prado-bahia-10.jpg",
  "book/xl_1642195073-pousada-em-cumuruxatiba-prado-bahia-15.jpg",
  "fotos_acomodacao/xl_1542727784-quarto-pousada-mare-em-cumuruxatiba-vista-para-o-mar3.png",
  "fotos_acomodacao/xl_1680780803-20220708-131137.jpg",
  "fotos_acomodacao/xl_1680781143-20220708-131307.jpg",
  "fotos_acomodacao/xl_1693659411-imagem-do-whatsapp-de-2023-08-25-a-s-10-08-46.jpg",
  "fotos_acomodacao/xl_1762791534-imagem-do-whatsapp-de-2025-08-28-a-s-11-27-49-27519c31.jpg",
  "fotos_acomodacao/xl_1764166372-quarto-anexo.jpg",
  "fotos_acomodacao/xl_1764618315-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-50-69db9ec3.jpg",
  "fotos_acomodacao/xl_1769085283-imagem-do-whatsapp-de-2025-08-28-a-s-12-37-48-938825a7.jpg",
  "fotos_acomodacao/xl_1769085333-imagem-do-whatsapp-de-2025-08-28-a-s-12-38-02-129b31ed.jpg",
  "fotos_acomodacao/xl_1769085475-imagem-do-whatsapp-de-2025-08-28-a-s-12-14-22-8c49310f.jpg",
  "slides/original_1592342231-a1b84ca7-1854-40b5-9333-c8418cd09f17.jpg",
  "slides/original_1592342264-7ee67f9b-1037-43f1-9ec6-bc435184451d.jpg",
  "slides/original_1642195005-pousada-em-cumuruxatiba-prado-bahia-2.jpg",
  "slides/xl_1592339103-37000625-dbb1-405a-b11c-668f0a9b0f36-1.jpg",
  "slides/xl_1592342210-6e16c44a-4b4d-468d-a381-df688297c784.jpg",
  "upload/images/E5938AE7-BCB9-486F-8AB2-12DF8BCD6D53.jpeg",
  "upload/images/WhatsApp%20Image%202022-06-08%20at%2012.47.53.jpeg",
  "upload/images/WhatsApp%20Image%202023-03-17%20at%2018.00.59.jpeg",
  "upload/images/WhatsApp%20Image%202023-03-17%20at%2018.01.00.jpeg",
  "upload/images/WhatsApp%20Image%202023-05-31%20at%2015.12.39.jpeg",
  "logomarca/original_1542657455-logomarca-pousada-mare-em-cumuruxatiba2.png"
];
export const local = (p) => "fotos/" + decodeURIComponent(p).replace(/[\/\s]+/g, "_").replace(/[^\w.-]/g, "");
await mkdir("fotos", { recursive: true });
let ok = 0, falhas = [];
for (const p of LISTA) {
  const destino = local(p);
  try { await access(destino); ok++; continue; } catch {}
  try {
    const r = await fetch(CDN + p);
    if (!r.ok) throw new Error("HTTP " + r.status);
    await writeFile(destino, Buffer.from(await r.arrayBuffer()));
    ok++; console.log("ok ", destino);
  } catch (e) { falhas.push(p + " (" + e.message + ")"); }
}
try { await access("img/logo.png"); } catch { try { await writeFile("img/logo.png", await (await import("node:fs/promises")).readFile(local(LISTA[LISTA.length - 1]))); } catch {} }
console.log(`\n${ok}/${LISTA.length} fotos em fotos/` + (falhas.length ? `\nFalharam:\n - ${falhas.join("\n - ")}` : ""));
