// Edge function: lembretes diários por e-mail aos avaliadores de eficácia.
//
// Roda via pg_cron uma vez por dia (ver migration acompanhante).
// Para cada empresa:
//   1. Busca trainings com `efficacy_evaluation_deadline IS NOT NULL` e que
//      ainda não têm `training_efficacy_evaluations` com status='Concluída'.
//   2. Agrupa por `efficacy_evaluator_employee_id` e resolve o e-mail do
//      evaluator no `employees` (case-insensitive).
//   3. Envia 1 e-mail por evaluator com a lista de pendências.
//   4. Filtro temporal: 7, 3 e 1 dias antes do prazo, ou quando atrasado.
//      Mesma cadência usada por `notificationTriggers.checkTrainingEfficacyDeadlines`.
//   5. Idempotência: log em `efficacy_email_reminders_log` com unique
//      (evaluator_employee_id, sent_date) impede duplicar no mesmo dia.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Domínio `daton.com.br` é o que está verified no Resend (mesmo usado por
// `email-mailing-management`). Sender pode ser sobrescrito por env var.
const FROM_EMAIL = Deno.env.get("EFFICACY_REMINDER_FROM_EMAIL")
  || "Plataforma Daton <no-reply@daton.com.br>";
const APP_URL = Deno.env.get("APP_URL") || "https://daton.com.br";

const REMINDER_DAYS = [7, 5, 3, 1] as const;

interface PendingEvaluation {
  training_id: string;
  training_name: string;
  category: string | null;
  deadline: string;
  days_remaining: number;
  evaluator_employee_id: string;
}

interface EvaluatorBucket {
  employee_id: string;
  employee_name: string;
  email: string;
  company_id: string;
  company_name: string;
  pending: PendingEvaluation[];
}

// Pluralização PT-BR: escolhe singular pra n=1, plural pra demais.
function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}

function buildEmailHtml(bucket: EvaluatorBucket): string {
  const overdue = bucket.pending.filter(p => p.days_remaining < 0);
  const upcoming = bucket.pending.filter(p => p.days_remaining >= 0);
  const total = bucket.pending.length;
  const link = `${APP_URL}/avaliacao-eficacia`;

  const row = (p: PendingEvaluation) => {
    const days = Math.abs(p.days_remaining);
    const status =
      p.days_remaining < 0
        ? `<span style="color:#dc2626;font-weight:600">Atrasado há ${days} ${plural(days, "dia", "dias")}</span>`
        : p.days_remaining === 0
          ? `<span style="color:#dc2626;font-weight:600">Vence hoje</span>`
          : `<span style="color:#ca8a04">Vence em ${days} ${plural(days, "dia", "dias")}</span>`;
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${p.training_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${p.category || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${new Date(p.deadline).toLocaleDateString("pt-BR")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${status}</td>
      </tr>
    `;
  };

  const intro =
    total === 1
      ? `Você é responsável por <strong>1 avaliação</strong> de eficácia de treinamento em <strong>${bucket.company_name}</strong> que precisa de atenção.`
      : `Você é responsável por <strong>${total} avaliações</strong> de eficácia de treinamentos em <strong>${bucket.company_name}</strong> que precisam de atenção.`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Avaliações de Eficácia Pendentes</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;color:#111827">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h2 style="margin:0 0 8px 0;color:#111827">Olá, ${bucket.employee_name.split(" ")[0]}</h2>
    <p style="margin:0 0 16px 0;color:#4b5563">${intro}</p>

    ${overdue.length > 0 ? `<h3 style="color:#dc2626;margin:16px 0 8px 0">⚠️ ${overdue.length === 1 ? "Atrasada" : "Atrasadas"} (${overdue.length})</h3>` : ""}
    ${upcoming.length > 0 ? `<h3 style="color:#111827;margin:16px 0 8px 0">${upcoming.length === 1 ? "Próxima do prazo" : "Próximas do prazo"} (${upcoming.length})</h3>` : ""}

    <table style="width:100%;border-collapse:collapse;margin:8px 0">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Treinamento</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Categoria</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Prazo</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Status</th>
        </tr>
      </thead>
      <tbody>
        ${[...overdue, ...upcoming].map(row).join("")}
      </tbody>
    </table>

    <div style="margin-top:24px;text-align:center">
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Avaliar agora</a>
    </div>

    <p style="margin-top:24px;color:#6b7280;font-size:12px;line-height:1.5">Este é um lembrete automático enviado quando há treinamentos com prazo de avaliação em 7, 3 ou 1 dia, ou já atrasados.</p>
  </div>
</body></html>`;
}

// Idempotência: 1 envio por (evaluator, dia). Usa a tabela dedicada
// `efficacy_email_reminders_log` em vez de `notifications` porque essa última
// exige user_id NOT NULL — e o evaluator pode não ter conta auth vinculada.
async function alreadyNotifiedToday(
  supabase: ReturnType<typeof createClient>,
  evaluatorEmployeeId: string,
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data, error } = await supabase
    .from("efficacy_email_reminders_log")
    .select("id")
    .eq("evaluator_employee_id", evaluatorEmployeeId)
    .eq("sent_date", today)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[efficacy-reminder] log lookup error:", error.message);
    return false;
  }
  return !!data;
}

async function recordReminderSent(
  supabase: ReturnType<typeof createClient>,
  bucket: EvaluatorBucket,
  externalEmailId: string | null,
): Promise<void> {
  const { error } = await supabase.from("efficacy_email_reminders_log").insert({
    company_id: bucket.company_id,
    evaluator_employee_id: bucket.employee_id,
    evaluator_email: bucket.email,
    training_count: bucket.pending.length,
    resend_id: externalEmailId,
  });
  if (error) {
    // Erro de unique violation = corrida com outra invocação concorrente:
    // outra instância já gravou o log, então a idempotência se manteve.
    // Outros erros são logados pra investigação mas não falham o envio.
    if (error.code !== "23505") {
      console.error("[efficacy-reminder] log insert error:", error.message);
    }
  }
}

async function processCompany(
  supabase: ReturnType<typeof createClient>,
  resend: Resend,
  companyId: string,
  companyName: string,
  force = false,
): Promise<{ sent: number; skipped: number; errors: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Trainings com prazo definido + sem evaluation concluída.
  const { data: trainings, error: tErr } = await supabase
    .from("training_programs")
    .select("id, name, category, efficacy_evaluation_deadline, end_date, efficacy_evaluator_employee_id")
    .eq("company_id", companyId)
    .not("efficacy_evaluation_deadline", "is", null)
    .not("efficacy_evaluator_employee_id", "is", null);
  if (tErr) {
    console.error(`[efficacy-reminder] training fetch failed for ${companyId}:`, tErr.message);
    return { sent: 0, skipped: 0, errors: 1 };
  }
  if (!trainings || trainings.length === 0) return { sent: 0, skipped: 0, errors: 0 };

  const trainingIds = trainings.map(t => t.id);
  const { data: evaluations } = await supabase
    .from("training_efficacy_evaluations")
    .select("training_program_id, status")
    .in("training_program_id", trainingIds)
    .eq("status", "Concluída");
  const concluded = new Set((evaluations || []).map(e => e.training_program_id));

  const evaluatorBuckets = new Map<string, PendingEvaluation[]>();
  for (const t of trainings) {
    if (concluded.has(t.id)) continue;
    if (!t.efficacy_evaluator_employee_id || !t.efficacy_evaluation_deadline) continue;
    // Janela de avaliação só abre após o término do treinamento.
    // Se ainda não chegou o end_date, não envia lembrete.
    if (t.end_date) {
      const endDate = new Date(t.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (today.getTime() < endDate.getTime()) continue;
    }
    const deadline = new Date(t.efficacy_evaluation_deadline);
    deadline.setHours(0, 0, 0, 0);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
    // Manda só nos dias-chave (7, 5, 3, 1) ou quando atrasado.
    const shouldRemind = days < 0 || (REMINDER_DAYS as readonly number[]).includes(days);
    if (!shouldRemind) continue;
    const arr = evaluatorBuckets.get(t.efficacy_evaluator_employee_id) || [];
    arr.push({
      training_id: t.id,
      training_name: t.name,
      category: t.category,
      deadline: t.efficacy_evaluation_deadline,
      days_remaining: days,
      evaluator_employee_id: t.efficacy_evaluator_employee_id,
    });
    evaluatorBuckets.set(t.efficacy_evaluator_employee_id, arr);
  }

  if (evaluatorBuckets.size === 0) return { sent: 0, skipped: 0, errors: 0 };

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email")
    .in("id", Array.from(evaluatorBuckets.keys()));

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  for (const emp of employees || []) {
    if (!emp.email) {
      skipped++;
      continue;
    }
    const pending = evaluatorBuckets.get(emp.id);
    if (!pending || pending.length === 0) continue;

    if (!force && await alreadyNotifiedToday(supabase, emp.id)) {
      skipped++;
      continue;
    }

    const bucket: EvaluatorBucket = {
      employee_id: emp.id,
      employee_name: emp.full_name,
      email: emp.email.trim().toLowerCase(),
      company_id: companyId,
      company_name: companyName,
      pending,
    };

    try {
      const total = pending.length;
      const isSingular = total === 1;
      const hasOverdue = pending.some(p => p.days_remaining < 0);
      const subject = hasOverdue
        ? (isSingular
          ? `🔔 1 avaliação de eficácia atrasada`
          : `🔔 ${total} avaliações de eficácia atrasadas`)
        : (isSingular
          ? `🔔 Lembrete: 1 avaliação de eficácia próxima do prazo`
          : `🔔 Lembrete: ${total} avaliações de eficácia próximas do prazo`);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: bucket.email,
        subject,
        html: buildEmailHtml(bucket),
      });
      const externalId = (result as any)?.data?.id || null;
      await recordReminderSent(supabase, bucket, externalId);
      sent++;
      // Resend rate limit: 2 emails/second.
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (err) {
      console.error(`[efficacy-reminder] send failed for ${bucket.email}:`, (err as Error).message);
      errors++;
    }
  }

  return { sent, skipped, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // Optional payload:
  //   - companyId: restringe pra 1 empresa (teste manual)
  //   - force: ignora a idempotência (envia mesmo se já notificou hoje).
  //     Útil pra reenviar quando há fix urgente em conteúdo do email.
  let payload: { companyId?: string; force?: boolean } = {};
  try {
    payload = (await req.json()) || {};
  } catch {
    payload = {};
  }

  let companiesQuery = supabase.from("companies").select("id, name");
  if (payload.companyId) {
    companiesQuery = companiesQuery.eq("id", payload.companyId);
  }
  const { data: companies, error: cErr } = await companiesQuery;

  if (cErr) {
    return new Response(JSON.stringify({ error: cErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary: Record<string, { sent: number; skipped: number; errors: number }> = {};
  for (const company of companies || []) {
    summary[company.name] = await processCompany(
      supabase, resend, company.id, company.name, !!payload.force,
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed_companies: Object.keys(summary).length,
      summary,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
