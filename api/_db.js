import crypto from "node:crypto";

// Conexão com o Postgres (Neon). A Vercel cria a variável DATABASE_URL
// sozinha quando você liga o Neon em Storage › Connect Database.
let _sql = null;
async function sql() {
  if (_sql) return _sql;
  const url = String(process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim().replace(/^["']|["']$/g, "");
  if (!url) throw Object.assign(new Error("Banco de dados não configurado (falta DATABASE_URL na Vercel)."), { status: 503 });
  const { neon, types } = await import("@neondatabase/serverless");
  // Colunas "date" voltam como texto AAAA-MM-DD (sem virar data com hora e fuso, que quebrava as telas)
  TIPOS = { getTypeParser: (oid, fmt) => (oid === 1082 ? (v) => v : types.getTypeParser(oid, fmt)) };
  _sql = neon(url);
  return _sql;
}
let TIPOS;

// Executa SQL SEMPRE com parâmetros ($1, $2…) — nunca concatenando texto do usuário.
// Quando há um usuário logado, a consulta roda numa transação que grava quem fez (auditoria).
export async function q(text, params = [], uid = null) {
  try {
    if (globalThis.__TEST_DB) return await globalThis.__TEST_DB(text, params, uid);
    const s = await sql();
    if (uid == null) return await s.query(text, params, { types: TIPOS });
    const r = await s.transaction([
      s.query("select set_config('app.usuario', $1, true)", [String(uid)], { types: TIPOS }),
      s.query(text, params, { types: TIPOS }),
    ]);
    return r[1];
  } catch (e) { throw traduz(e); }
}
// Colunas novas criadas sozinhas (uma vez por instância), para não depender de rodar SQL no Neon à mão.
const COLUNAS = [
  ["reservas", "acompanhantes_dados", "jsonb not null default '[]'"],
  ["hospedes", "nascimento", "date"],
];
let _colunas = null;
export function garanteColunas() {
  if (globalThis.__TEST_DB) return Promise.resolve();
  if (!_colunas) _colunas = (async () => {
    const tem = await q(`select table_name || '.' || column_name c from information_schema.columns where table_schema = current_schema() and (table_name, column_name) in (${COLUNAS.map((_, i) => `($${2 * i + 1}, $${2 * i + 2})`).join(", ")})`, COLUNAS.flatMap((x) => [x[0], x[1]]));
    const ja = new Set(tem.map((x) => x.c));
    for (const [t, c, tipo] of COLUNAS) if (!ja.has(t + "." + c)) await q(`alter table ${t} add column if not exists ${c} ${tipo}`);
  })().catch((e) => { _colunas = null; console.error("garanteColunas:", e.message); });
  return _colunas;
}
export const q1 = async (text, params, uid) => (await q(text, params, uid))[0] || null;

// Erros de regra de negócio (P0001) viram mensagem amigável; o resto vira erro genérico.
function traduz(e) {
  if (e && e.code === "P0001") return Object.assign(new Error(e.message), { status: 400, amigavel: true });
  if (e && e.code === "23P01") return Object.assign(new Error("Conflito de datas: esse quarto já está ocupado nesse período."), { status: 409, amigavel: true });
  if (e && e.code === "23505") return Object.assign(new Error("Já existe um registro com esse nome."), { status: 409, amigavel: true });
  if (e && (e.code === "23514" || e.code === "22P02" || e.code === "22007" || e.code === "22008")) return Object.assign(new Error("Algum dado está em formato inválido. Confira e tente de novo."), { status: 400, amigavel: true });
  return e;
}

// Data de hoje no fuso de Cumuruxatiba (UTC−3)
export const hoje = (d = new Date()) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
export const isData = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

export const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
export const ipDe = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim().slice(0, 60);

// Limite de tentativas (login, pedidos do site…) guardado no banco — vale para todos os servidores.
export async function limite(chave, max, janelaSeg) {
  const r = await q1(
    `insert into login_falhas(chave, n, ate) values ($1, 1, now() + make_interval(secs => $2))
     on conflict (chave) do update set
       n = case when login_falhas.ate < now() then 1 else login_falhas.n + 1 end,
       ate = case when login_falhas.ate < now() then now() + make_interval(secs => $2) else login_falhas.ate end
     returning n`, [hash(chave), janelaSeg]);
  return (r?.n || 0) <= max;
}
export async function contaLimite(chave) {
  const r = await q1(`select n from login_falhas where chave = $1 and ate > now()`, [hash(chave)]);
  return r?.n || 0;
}
export const zeraLimite = (chave) => q(`delete from login_falhas where chave = $1`, [hash(chave)]);

export function corpo(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch { b = {}; } }
  return b && typeof b === "object" ? b : {};
}

export function responde(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export function falha(res, e) {
  if (e && e.amigavel) return responde(res, e.status || 400, { erro: e.message });
  if (e && e.status) return responde(res, e.status, { erro: e.message });
  console.error(e);
  return responde(res, 500, { erro: "Algo deu errado no servidor. Tente de novo em instantes." });
}

// Validação simples de texto (corta tamanho, tira < > para evitar HTML injetado)
export const txt = (v, n = 200) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
export const num = (v, min = 0, max = 1e7) => { const x = Number(v); if (!isFinite(x) || x < min || x > max) throw Object.assign(new Error("Número inválido."), { status: 400 }); return Math.round(x * 100) / 100; };
export const int = (v, min = 0, max = 1e9) => { const x = Number(v); if (!Number.isInteger(x) || x < min || x > max) throw Object.assign(new Error("Valor inválido."), { status: 400 }); return x; };
export const data = (v) => { if (!isData(v)) throw Object.assign(new Error("Data inválida."), { status: 400 }); return v; };
export const umDe = (v, lista, padrao) => (lista.includes(v) ? v : padrao === undefined ? (() => { throw Object.assign(new Error("Opção inválida."), { status: 400 }); })() : padrao);
