// Shared schema factory keeps browser and server validation identical.
export function createContactSchema(z: typeof import("zod").z) {
  const singleLine = (max: number) => z.string().trim().min(1, "Preencha este campo.").max(max).regex(/^[^\r\n\u0000-\u001f]+$/, "Informe um texto válido.");
  return z.object({
    nome: singleLine(100),
    email: z.string().trim().email("Informe um e-mail válido.").max(255),
    empresa: singleLine(150),
    cargo: singleLine(100),
    telefone: z.string().trim().max(25).refine(v => !v || (/^[+()\d\s.-]+$/.test(v) && v.replace(/\D/g, "").length >= 10), "Informe um telefone válido."),
    interesse: z.enum(["Qualidade e auditorias", "ESG e gestão ambiental", "Compliance", "Pessoas e treinamentos", "Gestão integrada"]),
    mensagem: z.string().trim().min(10, "Conte um pouco mais sobre sua necessidade.").max(2000),
    consentimento: z.literal(true, { error: "Autorize o contato comercial para continuar." }),
    website: z.string().max(0),
    requestId: z.uuid(),
  }).strict();
}

export const COMMERCIAL_RECIPIENT = "felipe@webstar.studio";
export const COMMERCIAL_SENDER = "Daton <contato@daton.com.br>";