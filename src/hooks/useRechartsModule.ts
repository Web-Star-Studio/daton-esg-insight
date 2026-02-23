import { useEffect, useState } from "react";

export type RechartsModule = Awaited<ReturnType<typeof loadRecharts>>;

const loadRecharts = () => import("recharts");

export function useRechartsModule() {
  const [module, setModule] = useState<RechartsModule | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadRecharts().then((loadedModule) => {
      if (isMounted) {
        setModule(loadedModule);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return module;
}
