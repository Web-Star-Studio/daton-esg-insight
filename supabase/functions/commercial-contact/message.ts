import type { CommercialContact } from "./schema.ts";

export function buildCommercialMessage(data: CommercialContact) {
  return [
    "Contato comercial Daton",
    "",
    `Nome: ${data.nome}`,
    `Empresa: ${data.empresa}`,
    ...(data.cargo ? [`Cargo: ${data.cargo}`] : []),
    `E-mail: ${data.email}`,
    `Telefone / WhatsApp: ${data.telefone || "Não informado"}`,
    ...(data.interesse ? [`Interesse: ${data.interesse}`] : []),
    "",
    "Mensagem:",
    data.mensagem || "Não informada",
    "",
    "Autorização de contato: concedida pelo formulário.",
    `Referência: ${data.requestId}`,
  ].join("\n");
}
