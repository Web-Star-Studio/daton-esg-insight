// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEnv, type ConfigEnv, type UserConfig } from "vite";
import viteConfig from "../../vite.config";

const configure = viteConfig as (env: ConfigEnv) => UserConfig;

afterEach(() => vi.unstubAllEnvs());

describe("Lovable Cloud publication from a clean checkout", () => {
  it("includes only public browser values bound to the linked Cloud project", () => {
    const source = readFileSync(".env.production", "utf8");
    const entries = Object.fromEntries(
      source.split("\n").filter(line => line.trim() && !line.startsWith("#"))
        .map(line => line.split("=")),
    );
    expect(Object.keys(entries).sort()).toEqual([
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_URL",
    ]);
    const projectId = readFileSync("supabase/config.toml", "utf8")
      .match(/^project_id = "([a-z]+)"/m)?.[1];
    expect(projectId).toBeTruthy();
    expect(entries.VITE_SUPABASE_URL).toBe(`https://${projectId}.supabase.co`);
    expect(entries.VITE_SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_[A-Za-z0-9_-]+$/);
  });

  it("loads a valid production connection without injected process variables", () => {
    vi.stubEnv("VITE_SUPABASE_URL", undefined);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", undefined);
    const env = loadEnv("production", process.cwd(), "VITE_");
    expect(env.VITE_SUPABASE_URL).toMatch(/^https:\/\/[a-z]+\.supabase\.co$/);
    expect(env.VITE_SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_/);
    expect(() => configure({ command: "build", mode: "production" })).not.toThrow();
  });
});
