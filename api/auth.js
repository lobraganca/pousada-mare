import { q, q1, corpo, responde, falha, ipDe, limite, contaLimite, zeraLimite, txt } from "./_db.js";
import { hashSenha, confereSenha, igual, senhaForte, criaSessao, apagaCookie, encerraSessao, usuarioDe, origemOk } from "./_auth.js";

// Login da Gestão. Primeira vez: entre com ADMIN_USER / ADMIN_PASS (variáveis da Vercel)
// e o sistema cria o usuário "dono". Depois disso a senha passa a valer só do banco.
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const u = await usuarioDe(req);
      return responde(res, u ? 200 : 401, u ? { usuario: u } : { erro: "sessao" });
    }
    if (req.method !== "POST") return responde(res, 405, { erro: "método" });
    if (!origemOk(req)) return responde(res, 403, { erro: "origem" });
    const b = corpo(req);

    if (b.acao === "login") {
      const login = txt(b.login, 40).toLowerCase(), senha = String(b.senha || "").slice(0, 200);
      const chave = `login:${ipDe(req)}`, chaveUser = `login-user:${login}`;
      if ((await contaLimite(chave)) >= 8 || (await contaLimite(chaveUser)) >= 10)
        return responde(res, 429, { erro: "Muitas tentativas. Espere 15 minutos e tente de novo." });

      let u = await q1(`select id, nome, login, papel, senha_hash from usuarios where login = $1 and ativo`, [login]);
      let ok = !!u && confereSenha(senha, u.senha_hash);

      // primeiro acesso: ainda não há nenhum usuário → cria o dono a partir das variáveis da Vercel
      if (!u) {
        const n = await q1(`select count(*)::int n from usuarios`);
        const AU = String(process.env.ADMIN_USER || "").trim().toLowerCase(), AP = String(process.env.ADMIN_PASS || "");
        if (n.n === 0 && AU && AP.length >= 8 && igual(login, AU) && igual(senha, AP)) {
          u = await q1(`insert into usuarios(nome, login, senha_hash, papel) values ('Dono', $1, $2, 'dono') returning id, nome, login, papel`, [AU, hashSenha(AP)]);
          ok = true;
        }
      }
      if (!ok) {
        await limite(chave, 8, 900); await limite(chaveUser, 10, 900);
        await new Promise((r) => setTimeout(r, 400));
        return responde(res, 401, { erro: "Login ou senha incorretos." });
      }
      await zeraLimite(chave); await zeraLimite(chaveUser);
      await q(`delete from sessoes where expira_em < now()`);
      await criaSessao(res, u.id, req);
      return responde(res, 200, { usuario: { id: u.id, nome: u.nome, login: u.login, papel: u.papel } });
    }

    if (b.acao === "logout") {
      await encerraSessao(req); apagaCookie(res);
      return responde(res, 200, { ok: true });
    }

    if (b.acao === "senha") {
      const u = await usuarioDe(req);
      if (!u) return responde(res, 401, { erro: "sessao" });
      const atual = await q1(`select senha_hash from usuarios where id = $1`, [u.id]);
      if (!confereSenha(String(b.atual || ""), atual.senha_hash)) return responde(res, 400, { erro: "A senha atual não confere." });
      const fraca = senhaForte(b.nova);
      if (fraca) return responde(res, 400, { erro: fraca });
      await q(`update usuarios set senha_hash = $1 where id = $2`, [hashSenha(b.nova), u.id], u.id);
      await q(`delete from sessoes where usuario_id = $1`, [u.id]);   // derruba outras sessões
      await criaSessao(res, u.id, req);
      return responde(res, 200, { ok: true });
    }

    return responde(res, 400, { erro: "ação" });
  } catch (e) { return falha(res, e); }
}
