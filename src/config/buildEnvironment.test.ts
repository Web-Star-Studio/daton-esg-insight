import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConfigEnv, UserConfig } from "vite";

vi.mock("vite", async (importOriginal) => {
  const original = await importOriginal<typeof import("vite")>();
  return { ...original, loadEnv: () => ({}) };
});

import viteConfig from "../../vite.config";

const configure = viteConfig as (env: ConfigEnv) => UserConfig;

afterEach(() => vi.unstubAllEnvs());

describe("Cloud build environment validation", () => {
  it("allows managed development previews to inject Cloud values later", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => configure({ command: "build", mode: "development" })).not.toThrow();
  });

  it("blocks publication when Cloud configuration is missing", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => configure({ command: "build", mode: "production" })).toThrow(
      "Lovable Cloud configuration missing: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  });
});