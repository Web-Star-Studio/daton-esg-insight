import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createContactSchema, COMMERCIAL_RECIPIENT } from "../../supabase/functions/commercial-contact/schema";
const schema = createContactSchema(z);
const valid = { nome: "Pessoa Teste", email: "teste@example.com", empresa: "Empresa Teste", cargo: "Gestor", telefone: "", interesse: "Compliance", mensagem: "Quero conhecer a gestão de compliance.", consentimento: true, website: "", requestId: "c74199d4-c7ad-4f3c-83d4-87e3e405037e" };
describe("commercial contact", () => {
  it("routes commercial submissions to Felipe", () => { expect(COMMERCIAL_RECIPIENT).toBe("felipe@webstar.studio"); });
  it("does not accept a client-selected recipient", () => { expect(schema.safeParse({ ...valid, to: "other@example.com" }).success).toBe(false); });
  it("requires contact authorization", () => { expect(schema.safeParse({ ...valid, consentimento: false }).success).toBe(false); expect(schema.safeParse(valid).success).toBe(true); });
  it("rejects invalid email addresses", () => { expect(schema.safeParse({ ...valid, email: "invalid" }).success).toBe(false); });
});