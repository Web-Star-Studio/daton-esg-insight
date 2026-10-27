import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@4.6.7";
import { createContactSchema, COMMERCIAL_RECIPIENT, COMMERCIAL_SENDER } from "./schema.ts";
import { buildCommercialMessage } from "./message.ts";

const schema = createContactSchema(z);
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Intentionally public: this endpoint accepts commercial requests, not account operations.
// Recipient and sender are server-owned; no legacy database access is performed.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond(405, { error: "Método não permitido." });
  try {
    const raw = await req.text();
    if (raw.length > 12000) return respond(413, { error: "Solicitação muito extensa." });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return respond(400, { error: "Solicitação inválida." }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return respond(400, { error: "Confira os campos e a autorização de contato." });
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const connectionKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey || !connectionKey) return respond(503, { error: "Envio indisponível no momento." });
    const data = parsed.data;
    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Idempotency-Key": `daton-commercial-${data.requestId}` },
      body: JSON.stringify({
        from: COMMERCIAL_SENDER, to: [COMMERCIAL_RECIPIENT], reply_to: data.email,
        subject: "Novo contato comercial — Daton",
        text: buildCommercialMessage(data),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const details = await response.text();
      console.error("commercial-contact provider failure", response.status, details);
      return respond(502, { error: "Não foi possível enviar. Tente novamente em instantes.", providerStatus: response.status });
    }
    const result = await response.json();
    if (typeof result.id !== "string") return respond(502, { error: "O envio não foi confirmado. Tente novamente." });
    return respond(200, { success: true, reference: data.requestId });
  } catch {
    return respond(503, { error: "Envio indisponível no momento. Tente novamente." });
  }
});