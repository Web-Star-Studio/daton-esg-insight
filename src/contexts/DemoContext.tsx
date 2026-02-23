import { createContext, useContext, ReactNode, useEffect } from "react";

interface DemoContextType {
  isDemo: boolean;
}

const DemoContext = createContext<DemoContextType>({ isDemo: false });

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    (window as Window & { __DATON_DEMO_MODE__?: boolean }).__DATON_DEMO_MODE__ = true;
    return () => {
      delete (window as Window & { __DATON_DEMO_MODE__?: boolean }).__DATON_DEMO_MODE__;
    };
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo: true }}>
      {children}
    </DemoContext.Provider>
  );
}
