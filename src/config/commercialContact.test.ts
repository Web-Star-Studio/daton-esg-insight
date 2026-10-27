import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createContactSchema, COMMERCIAL_RECIPIENT } from "../../supabase/functions/commercial-contact/schema";
import { buildCommercialMessage } from "../../supabase/functions/commercial-contact/message";

const schema = createContactSchema(z);
const valid = {
  nome: "Pessoa Teste",
  email: "teste@example.com",
  empresa: "Empresa Teste",
  consentimento: true,
  website: "",
  requestId: "c74199d4-c7ad-4f3c-83d4-87e3e405037e",
};

describe("commercial contact", () => {
  it("accepts a first contact with only name, email and company", () => {
    const data = schema.parse(valid);
    expect(data.telefone).toBe("");
    expect(data.mensagem).toBe("");
  });

  it.each(["nome", "email", "empresa"])("requires %s", field => {
    expect(schema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
  });

  it.each(["", "   ", "Dúvida sobre ESG."])("accepts optional message %j", mensagem => {
    expect(schema.safeParse({ ...valid, mensagem }).success).toBe(true);
  });

  it("validates optional information when provided", () => {
    expect(schema.safeParse({ ...valid, telefone: "123" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, telefone: "+55 (81) 99999-0000" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, mensagem: "x".repeat(2001) }).success).toBe(false);
  });

  it("continues accepting the previous form during rollout", () => {
    expect(schema.safeParse({ ...valid, cargo: "Gestor", interesse: "Compliance", telefone: "", mensagem: "Quero conhecer a gestão de compliance." }).success).toBe(true);
  });

  it("formats the short contact without unused qualification fields", () => {
    const text = buildCommercialMessage(schema.parse(valid));
    expect(text).toContain("Nome: Pessoa Teste");
    expect(text).toContain("Empresa: Empresa Teste");
    expect(text).toContain("Telefone / WhatsApp: Não informado");
    expect(text).toContain("Mensagem:\nNão informada");
    expect(text).toContain(`Referência: ${valid.requestId}`);
    expect(text).not.toMatch(/Cargo:|Interesse:|undefined/);
  });

  it("preserves the information supplied through optional or legacy fields", () => {
    const text = buildCommercialMessage(schema.parse({ ...valid, cargo: "Gestor", interesse: "Compliance", telefone: "+55 (81) 99999-0000", mensagem: "Quero conhecer o Daton." }));
    expect(text).toContain("Cargo: Gestor");
    expect(text).toContain("Interesse: Compliance");
    expect(text).toContain("Telefone / WhatsApp: +55 (81) 99999-0000");
    expect(text).toContain("Mensagem:\nQuero conhecer o Daton.");
  });

  it("routes commercial submissions to Felipe", () => {
    expect(COMMERCIAL_RECIPIENT).toBe("felipe@webstar.studio");
  });

  it("does not accept a client-selected recipient", () => {
    expect(schema.safeParse({ ...valid, to: "other@example.com" }).success).toBe(false);
  });

  it("requires contact authorization", () => {
    expect(schema.safeParse({ ...valid, consentimento: false }).success).toBe(false);
  });

  it("rejects invalid email addresses", () => {
    expect(schema.safeParse({ ...valid, email: "invalid" }).success).toBe(false);
  });

  it("rejects honeypot and header injection attempts", () => {
    expect(schema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, nome: "Nome\nBcc: outro@example.com" }).success).toBe(false);
  });
});
