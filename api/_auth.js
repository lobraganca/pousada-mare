import crypto from "node:crypto";
import { q, q1, hash } from "./_db.js";

// ---------- Senhas: scrypt com sal aleatório (nunca guardamos a senha) ----------
export function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(String(senha), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${h}`;
}
export function confereSenha(senha, guardado) {
  const [alg, salt, h] = String(guardado || "").split("$");
  if (alg !== "scrypt" || !salt || !h) return false;
  const x = crypto.scryptSync(String(senha), salt, 64, { N: 16384, r: 8, p: 1 });
  const y = Buffer.from(h, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export const igual = (a, b) => crypto.timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));

export function senhaForte(s) {
  s = String(s || "");
  if (s.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return "Use letras e números na senha.";
  return "";
}

// ---------- Sessão: token aleatório no cookie httpOnly; no banco só o hash ----------
const COOKIE = "mare_s";
const HORAS = 12;

export async function criaSessao(res, uid, req) {
  const token = crypto.randomBytes(32).toString("base64url");
  await q(`insert into sessoes(token_hash, usuario_id, expira_em, ip, ua) values ($1, $2, now() + make_interval(hours => $3), $4, $5)`,
    [hash(token), uid, HORAS, String(req.headers["x-forwarded-for"] || "").split(",")[0].slice(0, 60), String(req.headers["user-agent"] || "").slice(0, 200)]);
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${HORAS * 3600}`);
}
export function apagaCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
function tokenDe(req) {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,})`).exec(String(req.headers.cookie || ""));
  return m ? m[1] : "";
}
export async function encerraSessao(req) {
  const t = tokenDe(req);
  if (t) await q(`delete from sessoes where token_hash = $1`, [hash(t)]);
}

// Proteção contra CSRF: só aceita POST vindo do próprio site e com o cabeçalho X-Mare.
export function origemOk(req) {
  if (req.headers["x-mare"] !== "1") return false;
  const o = req.headers.origin;
  if (!o) return true; // alguns navegadores não mandam Origin em same-origin
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

// Retorna o usuário logado (ou null). Renova a sessão a cada uso.
export async function usuarioDe(req) {
  const t = tokenDe(req);
  if (!t) return null;
  const u = await q1(
    `update sessoes s set expira_em = now() + make_interval(hours => $2)
       from usuarios u
      where s.token_hash = $1 and s.expira_em > now() and u.id = s.usuario_id and u.ativo
     returning u.id, u.nome, u.login, u.papel, u.areas`, [hash(t), HORAS]);
  return u;
}
