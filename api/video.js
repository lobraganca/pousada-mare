import { handleUpload } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { usuarioDe, origemOk } from "./_auth.js";
import { corpo, responde } from "./_db.js";

// Envio de vídeos curtos (formato reels) direto do celular para o Vercel Blob,
// igual ao site Leopardos. Só dono e recepção, logados, podem enviar ou apagar.
const MAX = 200 * 1024 * 1024; // 200 MB

function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const k = Object.keys(process.env).find((n) => /READ_WRITE_TOKEN$/.test(n) && /^vercel_blob_rw_/.test(String(process.env[n])));
  return k ? process.env[k] : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return responde(res, 405, { erro: "método" });
  const token = blobToken();
  if (!token) return responde(res, 503, { erro: "Falta ligar o espaço de vídeos (Blob) na Vercel." });
  const body = corpo(req);
  // o aviso de "upload concluído" vem da própria Vercel (sem cookie); o resto exige login
  const ehCallback = body && body.type === "blob.upload-completed";
  if (!ehCallback) {
    if (!origemOk(req) && body.type !== "blob.generate-client-token") return responde(res, 403, { erro: "origem" });
    const u = await usuarioDe(req);
    if (!u || !["dono", "recepcao"].includes(u.papel)) return responde(res, 401, { erro: "Entre na Gestão para enviar vídeos." });
  }
  if (body.acao === "apagar") {
    const url = String(body.url || "");
    if (!/^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\/(videos|capas)\//.test(url)) return responde(res, 400, { erro: "url" });
    try { await del(url, { token }); } catch {}
    return responde(res, 200, { ok: true });
  }
  try {
    const out = await handleUpload({
      body, request: req, token,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^(videos|capas)\/[\w.-]+$/.test(pathname)) throw new Error("Caminho inválido.");
        return {
          allowedContentTypes: pathname.startsWith("capas/") ? ["image/jpeg", "image/png", "image/webp"] : ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
          maximumSizeInBytes: MAX, addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return responde(res, 200, out);
  } catch (e) {
    return responde(res, 400, { erro: String((e && e.message) || e) });
  }
}
