import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SupplierUser {
  id: string;
  name: string;
  email: string;
  company_id: string;
}

interface SupplierAuthContextType {
  supplier: SupplierUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  sessionToken: string | null;
  login: (document: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const SupplierAuthContext = createContext<SupplierAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'supplier_session_token';

export function SupplierAuthProvider({ children }: { children: React.ReactNode }) {
  const [supplier, setSupplier] = useState<SupplierUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Validate session on mount
  const validateSession = useCallback(async () => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supplier-auth', {
        body: { action: 'validate_session', sessionToken: storedToken }
      });

      if (error || !data?.valid) {
        localStorage.removeItem(STORAGE_KEY);
        setSessionToken(null);
        setSupplier(null);
      } else {
        setSessionToken(storedToken);
        setSupplier(data.supplier);
        setMustChangePassword(data.mustChangePassword || false);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = async (document: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-auth', {
        body: { action: 'login', document, password }
      });

      if (error) {
        return { success: false, error: 'Erro ao conectar com o servidor' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Credenciais inválidas' };
      }

      // Store session
      localStorage.setItem(STORAGE_KEY, data.sessionToken);
      setSessionToken(data.sessionToken);
      setSupplier(data.supplier);
      setMustChangePassword(data.mustChangePassword || false);

      return { 
        success: true, 
        mustChangePassword: data.mustChangePassword 
      };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!sessionToken) {
      return { success: false, error: 'Sessão não encontrada' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('supplier-auth', {
        body: { action: 'change_password', sessionToken, newPassword }
      });

      if (error) {
        return { success: false, error: 'Erro ao conectar com o servidor' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Erro ao alterar senha' };
      }

      setMustChangePassword(false);
      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Erro ao alterar senha' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await supabase.functions.invoke('supplier-auth', {
          body: { action: 'logout', sessionToken }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setSessionToken(null);
    setSupplier(null);
    setMustChangePassword(false);
  };

  const value: SupplierAuthContextType = {
    supplier,
    isLoading,
    isAuthenticated: !!supplier && !!sessionToken,
    mustChangePassword,
    sessionToken,
    login,
    changePassword,
    logout
  };

  return (
    <SupplierAuthContext.Provider value={value}>
      {children}
    </SupplierAuthContext.Provider>
  );
}

export function useSupplierAuth() {
  const context = useContext(SupplierAuthContext);
  if (context === undefined) {
    throw new Error('useSupplierAuth must be used within a SupplierAuthProvider');
  }
  return context;
}
