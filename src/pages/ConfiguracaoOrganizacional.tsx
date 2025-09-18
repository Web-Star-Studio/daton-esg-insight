import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  MapPin, 
  Users, 
  FileText, 
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizationalProfile {
  id: string;
  name: string;
  cnpj: string;
  sector?: string;
  legal_structure?: string;
  governance_model?: string;
  headquarters_address?: string;
  headquarters_country?: string;
  headquarters_coordinates?: any;
  business_units?: any[];
  subsidiaries_included?: any[];
  subsidiaries_excluded?: any[];
  reporting_scope?: string;
  fiscal_year_start?: string;
  fiscal_year_end?: string;
  employee_count?: number;
  annual_revenue?: number;
  stock_exchange?: string;
  stock_symbol?: string;
}

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
  location: string;
  employees: number;
  revenue_percentage: number;
}

interface Subsidiary {
  id: string;
  name: string;
  country: string;
  ownership_percentage: number;
  included_in_scope: boolean;
  reason?: string;
}

export default function ConfiguracaoOrganizacional() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [newBusinessUnit, setNewBusinessUnit] = useState<Partial<BusinessUnit>>({});
  const [newSubsidiary, setNewSubsidiary] = useState<Partial<Subsidiary>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['organizational-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as OrganizationalProfile;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<OrganizationalProfile>) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', profile?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizational-profile'] });
      toast({
        title: "Sucesso",
        description: "Perfil organizacional atualizado com sucesso",
      });
    },
  });

  const [formData, setFormData] = useState<Partial<OrganizationalProfile>>({});

  // Atualizar formData quando profile for carregado
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setBusinessUnits(profile.business_units || []);
      setSubsidiaries([
        ...(profile.subsidiaries_included || []).map((s: any) => ({ ...s, included_in_scope: true })),
        ...(profile.subsidiaries_excluded || []).map((s: any) => ({ ...s, included_in_scope: false }))
      ]);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData = {
      ...formData,
      business_units: businessUnits,
      subsidiaries_included: subsidiaries.filter(s => s.included_in_scope),
      subsidiaries_excluded: subsidiaries.filter(s => !s.included_in_scope),
    };

    await updateProfileMutation.mutateAsync(updatedData);
  };

  const addBusinessUnit = () => {
    if (newBusinessUnit.name && newBusinessUnit.location) {
      const unit: BusinessUnit = {
        id: Date.now().toString(),
        name: newBusinessUnit.name || '',
        description: newBusinessUnit.description || '',
        location: newBusinessUnit.location || '',
        employees: newBusinessUnit.employees || 0,
        revenue_percentage: newBusinessUnit.revenue_percentage || 0,
      };
      setBusinessUnits([...businessUnits, unit]);
      setNewBusinessUnit({});
    }
  };

  const removeBusinessUnit = (id: string) => {
    setBusinessUnits(businessUnits.filter(unit => unit.id !== id));
  };

  const addSubsidiary = () => {
    if (newSubsidiary.name && newSubsidiary.country) {
      const subsidiary: Subsidiary = {
        id: Date.now().toString(),
        name: newSubsidiary.name || '',
        country: newSubsidiary.country || '',
        ownership_percentage: newSubsidiary.ownership_percentage || 0,
        included_in_scope: newSubsidiary.included_in_scope || false,
        reason: newSubsidiary.reason || '',
      };
      setSubsidiaries([...subsidiaries, subsidiary]);
      setNewSubsidiary({});
    }
  };

  const removeSubsidiary = (id: string) => {
    setSubsidiaries(subsidiaries.filter(sub => sub.id !== id));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando configuração organizacional...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuração Organizacional</h1>
            <p className="text-muted-foreground">
              Gerencie as informações e estrutura da sua organização
            </p>
          </div>
        </div>
        {/* Conteúdo da página será implementado */}
      </div>
    </MainLayout>
  );
}