import { txt, isData, hoje } from "./_db.js";

// Ficha do check-in online (dados que a recepção pediria no balcão).
// Valida tudo no servidor; devolve a ficha limpa ou lança erro com mensagem amigável.
const erro = (m) => Object.assign(new Error(m), { status: 400 });
const TIPOS = ["cpf", "rg", "passaporte", "outro"];

export function cpfValido(v) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let n = 9; n <= 10; n++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
    if ((((s * 10) % 11) % 10) !== +d[n]) return false;
  }
  return true;
}
const idade = (nasc, ref) => { const a = new Date(nasc + "T12:00:00Z"), b = new Date(ref + "T12:00:00Z"); let i = b.getUTCFullYear() - a.getUTCFullYear(); if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) i--; return i; };

function pessoa(p, quem, ref, titular) {
  p = p && typeof p === "object" ? p : {};
  const nome = txt(p.nome, 120).replace(/\s+/g, " ");
  if (nome.length < 3 || !/\s/.test(nome)) throw erro(`${quem}: escreva o nome completo.`);
  const doc_tipo = TIPOS.includes(p.doc_tipo) ? p.doc_tipo : "cpf";
  let doc = txt(p.doc, 30);
  if (doc_tipo === "cpf") { doc = doc.replace(/\D/g, ""); if (!cpfValido(doc)) throw erro(`${quem}: o CPF não confere. Confira os números.`); doc = doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); }
  else if (doc.replace(/\W/g, "").length < 4) throw erro(`${quem}: informe o número do documento.`);
  const nascimento = String(p.nascimento || "");
  if (!isData(nascimento) || nascimento < "1900-01-01" || nascimento > hoje()) throw erro(`${quem}: informe a data de nascimento.`);
  const anos = idade(nascimento, ref);
  if (!Number.isFinite(anos)) throw erro(`${quem}: data de nascimento inválida.`);
  if (titular && anos < 18) throw erro("O titular da reserva precisa ser maior de idade.");
  const out = { nome, doc_tipo, doc, nascimento, nacionalidade: txt(p.nacionalidade, 40) || (doc_tipo === "cpf" ? "Brasileira" : "") };
  if (!titular && anos < 18) {
    out.parentesco = txt(p.parentesco, 40);
    if (!out.parentesco) throw erro(`${quem}: é menor de idade. Informe o parentesco com o titular.`);
  }
  return out;
}

export function validaFicha(f, r) {
  f = f && typeof f === "object" ? f : {};
  // data de referência para idade = dia da chegada (o banco pode devolver Date ou texto)
  const ref = r.checkin instanceof Date ? r.checkin.toISOString().slice(0, 10) : isData(String(r.checkin || "").slice(0, 10)) ? String(r.checkin).slice(0, 10) : hoje();
  const t = pessoa(f.titular, "Titular", ref, true);
  const email = txt(f.titular && f.titular.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw erro("Titular: o e-mail parece errado.");
  Object.assign(t, { email, cidade: txt(f.titular && f.titular.cidade, 60), uf: txt(f.titular && f.titular.uf, 30), pais: txt(f.titular && f.titular.pais, 40) });
  const max = Math.max(0, (r.adultos || 0) + (r.criancas || 0) - 1);
  const lista = (Array.isArray(f.acompanhantes) ? f.acompanhantes : []).filter((p) => p && String(p.nome || "").trim());
  if (lista.length > Math.max(max, 12)) throw erro("Há mais acompanhantes do que pessoas na reserva.");
  const acompanhantes = lista.slice(0, 12).map((p, i) => pessoa(p, `Acompanhante ${i + 1}`, ref, false));
  let placa = String(f.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (placa && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) throw erro("A placa do carro parece errada (ex.: ABC1D23).");
  const chegada_hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(f.chegada_hora || "")) ? f.chegada_hora : "";
  if (f.aceite !== true) throw erro("Para enviar, marque que leu a Política de Privacidade.");
  return { titular: t, acompanhantes, placa, carro: txt(f.carro, 40), chegada_hora, obs: txt(f.obs, 400), aceite_em: new Date().toISOString() };
}
