// Shared schema factory keeps browser and server validation identical.
export function createContactSchema(z: typeof import("zod").z) {
  const singleLine = (max: number) => z.string().trim().min(1, "Preencha este campo.").max(max).regex(/^[^\r\n\u0000-\u001f]+$/, "Informe um texto válido.");
  return z.object({
    nome: singleLine(100),
    email: z.string().trim().email("Informe um e-mail válido.").max(255),
    empresa: singleLine(150),
    // Compatibility with already-open pages from the previous form.
    cargo: singleLine(100).optional(),
    telefone: z.string().trim().max(25).refine(v => !v || (/^[+()\d\s.-]+$/.test(v) && v.replace(/\D/g, "").length >= 10), "Informe um telefone válido.").optional().default(""),
    interesse: z.enum(["Qualidade e auditorias", "ESG e gestão ambiental", "Compliance", "Pessoas e treinamentos", "Gestão integrada"]).optional(),
    mensagem: z.string().trim().max(2000).optional().default(""),
    consentimento: z.literal(true, { error: "Autorize o contato comercial para continuar." }),
    website: z.string().max(0),
    requestId: z.uuid(),
  }).strict();
}

export const COMMERCIAL_RECIPIENT = "felipe@webstar.studio";
export const COMMERCIAL_SENDER = "Daton <contato@daton.com.br>";

export type CommercialContact = import("zod").infer<ReturnType<typeof createContactSchema>>;
