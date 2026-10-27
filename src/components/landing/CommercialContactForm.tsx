import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { createContactSchema } from "../../../supabase/functions/commercial-contact/schema";

const schema = createContactSchema(z);
const interests = ["Qualidade e auditorias", "ESG e gestão ambiental", "Compliance", "Pessoas e treinamentos", "Gestão integrada"];

export function CommercialContactForm() {
  const [fields, setFields] = useState({ nome: "", email: "", cargo: "", empresa: "", telefone: "", interesse: "", mensagem: "", website: "", consentimento: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [failure, setFailure] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const busy = useRef(false);
  const update = (key: string, value: string | boolean) => {
    setFields(prev => ({ ...prev, [key]: value }));
    requestId.current = crypto.randomUUID();
    setErrors(prev => ({ ...prev, [key]: "" }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    const parsed = schema.safeParse({ ...fields, requestId: requestId.current });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
      return;
    }
    busy.current = true;
    setStatus("sending"); setFailure("");
    try {
      // Initialize only when sending so missing hosting configuration cannot crash the page.
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("commercial-contact", { body: parsed.data });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        throw new Error(details);
      }
      if (data?.success !== true) throw new Error("O envio não foi confirmado pelo serviço.");
      setStatus("sent");
    } catch (error) {
      console.error("commercial-contact failed:", error instanceof Error ? error.message : "Unknown error");
      setFailure("Não foi possível confirmar o envio. Seus dados foram mantidos; tente novamente ou escreva para contato@daton.com.br.");
      setStatus("idle");
    } finally { busy.current = false; }
  };
  if (status === "sent") return <div role="status" className="space-y-4 py-6"><CheckCircle2 className="h-9 w-9" /><h2 className="text-xl font-semibold">Pedido enviado</h2><p>Obrigado pelo interesse. A equipe Daton poderá entrar em contato pelos dados informados.</p><Button variant="secondary" onClick={() => { setStatus("idle"); setFields({ nome: "", email: "", cargo: "", empresa: "", telefone: "", interesse: "", mensagem: "", website: "", consentimento: false }); requestId.current = crypto.randomUUID(); }}>Enviar outro pedido</Button></div>;
  return <>
    <h2 className="text-xl font-semibold">Converse com a equipe Daton</h2>
    <p className="mt-2 text-sm opacity-90">Conte o que sua empresa precisa para avaliarmos como o Daton pode ajudar.</p>
    <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <fieldset disabled={status === "sending"} className="contents">
        {([ ["nome", "Nome completo", "Seu nome", 100], ["email", "E-mail corporativo", "voce@empresa.com", 255], ["empresa", "Empresa", "Nome da empresa", 150], ["cargo", "Cargo", "Seu cargo", 100], ["telefone", "Telefone / WhatsApp (opcional)", "(00) 00000-0000", 25] ] as const).map(([key, label, placeholder, max]) => <div key={key} className={key === "telefone" ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={key}>{label}{key !== "telefone" && " *"}</Label><Input id={key} type={key === "email" ? "email" : key === "telefone" ? "tel" : "text"} autoComplete={key === "nome" ? "name" : key === "email" ? "email" : key === "empresa" ? "organization" : key === "telefone" ? "tel" : "organization-title"} required={key !== "telefone"} maxLength={max} value={fields[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} className="commercial-input" aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} />{errors[key] && <p id={`${key}-error`} className="text-sm" role="alert">{errors[key]}</p>}</div>)}
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="interesse">Área de interesse *</Label><select id="interesse" className="commercial-input h-11 w-full rounded-md border px-3 text-sm" value={fields.interesse} onChange={event => update("interesse", event.target.value)} required aria-invalid={!!errors.interesse}><option value="">Selecione uma área</option>{interests.map(value => <option key={value}>{value}</option>)}</select>{errors.interesse && <p role="alert" className="text-sm">Selecione uma área de interesse.</p>}</div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="mensagem">O que você quer melhorar na sua operação? *</Label><textarea id="mensagem" className="commercial-input min-h-24 w-full rounded-md border p-3 text-sm" maxLength={2000} required value={fields.mensagem} onChange={event => update("mensagem", event.target.value)} placeholder="Descreva suas necessidades e o que gostaria de conhecer no Daton." aria-invalid={!!errors.mensagem} />{errors.mensagem && <p role="alert" className="text-sm">{errors.mensagem}</p>}</div>
        <div className="hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={event => update("website", event.target.value)} /></div>
        <div className="sm:col-span-2"><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={fields.consentimento} onChange={event => update("consentimento", event.target.checked)} required /><span>Autorizo a equipe Daton a usar estes dados para responder ao meu pedido comercial, conforme a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</span></label>{errors.consentimento && <p role="alert" className="mt-2 text-sm">{errors.consentimento}</p>}</div>
        {failure && <p role="alert" className="text-sm sm:col-span-2">{failure}</p>}
        <Button type="submit" className="commercial-submit w-full rounded-xl sm:col-span-2" disabled={status === "sending"}>{status === "sending" ? <><Loader2 className="animate-spin" />Enviando…</> : <><Send />Solicitar contato</>}</Button>
      </fieldset>
    </form>
  </>;
}
