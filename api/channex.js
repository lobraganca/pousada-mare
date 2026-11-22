import crypto from "node:crypto";
import { corpo, responde, falha } from "./_db.js";
import { channexOn, puxaReservas, log } from "./_channex.js";

// Webhook do Channex: avisa que chegou/mudou/cancelou reserva no Booking (e outros canais).
// Configure no Channex o cabeçalho X-Channex-Webhook-Secret com o mesmo valor de CHANNEX_WEBHOOK_SECRET.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return responde(res, 405, { erro: "método" });
    const seg = String(process.env.CHANNEX_WEBHOOK_SECRET || "");
    const vem = String(req.headers["x-channex-webhook-secret"] || "");
    const ok = seg.length >= 16 && vem.length === seg.length && crypto.timingSafeEqual(Buffer.from(vem), Buffer.from(seg));
    if (!ok) return responde(res, 401, { erro: "não autorizado" });
    if (!channexOn()) return responde(res, 200, { ok: false, motivo: "não configurado" });
    const b = corpo(req), ev = String(b.event || "");
    if (ev.startsWith("booking") || ev === "non_acked_booking") return responde(res, 200, await puxaReservas(`aviso ${ev}`));
    if (["sync_error", "rate_error", "booking_unmapped_room", "booking_unmapped_rate"].includes(ev)) await log("aviso", false, `${ev}: ${JSON.stringify(b.payload || {}).slice(0, 600)}`);
    return responde(res, 200, { ok: true });
  } catch (e) { await log("erro", false, e.message); return falha(res, e); }
}
