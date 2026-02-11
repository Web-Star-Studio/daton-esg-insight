import { createContext, useContext, ReactNode } from "react";

interface DemoContextType {
  isDemo: boolean;
}

const DemoContext = createContext<DemoContextType>({ isDemo: false });

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  return (
    <DemoContext.Provider value={{ isDemo: true }}>
      {children}
    </DemoContext.Provider>
  );
}
