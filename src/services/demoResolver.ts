import { getAllDemoMockData } from "@/data/demo";
import { createDemoQueryResolver } from "@/data/demo/queryResolver";

type DemoWindow = Window & { __DATON_DEMO_MODE__?: boolean };

let resolver: ((queryKey: readonly unknown[]) => unknown) | null = null;

export const isDemoRuntimeEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as DemoWindow).__DATON_DEMO_MODE__);
};

export const resolveDemoData = <T>(queryKey: readonly unknown[]): T => {
  if (!resolver) {
    resolver = createDemoQueryResolver(getAllDemoMockData());
  }

  return resolver(queryKey) as T;
};
