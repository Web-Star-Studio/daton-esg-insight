import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value = {
    selectedCompany: user?.company || null
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
