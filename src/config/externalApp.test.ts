import { describe, it, expect } from "vitest";
import { buildPainelRedirect, isLandingPath } from "./externalApp";

describe("landing-only routing", () => {
  it("keeps landing pages local", () => {
    expect(isLandingPath("/")).toBe(true);
    expect(isLandingPath("/termos/")).toBe(true);
  });
  it("sends system routes to painel preserving path", () => {
    expect(isLandingPath("/dashboard")).toBe(false);
    expect(buildPainelRedirect("/dashboard", "?a=1")).toBe("https://painel.daton.com.br/dashboard?a=1");
  });
  it("sends login to painel root", () => {
    expect(buildPainelRedirect("/auth")).toBe("https://painel.daton.com.br");
  });
});
