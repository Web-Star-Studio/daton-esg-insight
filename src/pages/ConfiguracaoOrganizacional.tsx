import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  Save as SaveIcon,
  Trash2,
  Briefcase,
  Building2,
  Target
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configuração organizacional...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configuração Organizacional</h1>
          <p className="text-muted-foreground">
            Gerencie as informações e estrutura da sua organização
          </p>
        </div>
        </div>

        <Tabs defaultValue="basico" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
            <TabsTrigger value="estrutura">Estrutura Organizacional</TabsTrigger>
            <TabsTrigger value="escopo">Escopo de Relato</TabsTrigger>
            <TabsTrigger value="financeiro">Dados Financeiros</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>
                  Informações básicas sobre a organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input
                      id="company-name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor de Atividade</Label>
                    <Select
                      value={formData.sector || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                    >
                      <SelectTrigger id="sector">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturing">Manufatura</SelectItem>
                        <SelectItem value="services">Serviços</SelectItem>
                        <SelectItem value="technology">Tecnologia</SelectItem>
                        <SelectItem value="finance">Financeiro</SelectItem>
                        <SelectItem value="retail">Varejo</SelectItem>
                        <SelectItem value="energy">Energia</SelectItem>
                        <SelectItem value="healthcare">Saúde</SelectItem>
                        <SelectItem value="education">Educação</SelectItem>
                        <SelectItem value="agriculture">Agricultura</SelectItem>
                        <SelectItem value="construction">Construção</SelectItem>
                        <SelectItem value="transportation">Transporte</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal-structure">Estrutura Legal</Label>
                    <Select
                      value={formData.legal_structure || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, legal_structure: value }))}
                    >
                      <SelectTrigger id="legal-structure">
                        <SelectValue placeholder="Selecione a estrutura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporation">Sociedade Anônima</SelectItem>
                        <SelectItem value="limited">Limitada</SelectItem>
                        <SelectItem value="public">Empresa Pública</SelectItem>
                        <SelectItem value="mixed">Economia Mista</SelectItem>
                        <SelectItem value="cooperative">Cooperativa</SelectItem>
                        <SelectItem value="other">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço da Sede</Label>
                  <Textarea
                    id="address"
                    value={formData.headquarters_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, headquarters_address: e.target.value }))}
                    placeholder="Digite o endereço completo da sede"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrutura" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Unidades de Negócio
                  </CardTitle>
                  <CardDescription>
                    Defina as diferentes unidades de negócio da organização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da unidade"
                      value={newBusinessUnit.name || ''}
                      onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Localização"
                      value={newBusinessUnit.location || ''}
                      onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <Button onClick={addBusinessUnit}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {businessUnits.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{unit.name}</p>
                          <p className="text-sm text-muted-foreground">{unit.location}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBusinessUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Subsidiárias
                  </CardTitle>
                  <CardDescription>
                    Liste as subsidiárias e controle se estão incluídas no escopo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome da subsidiária"
                      value={newSubsidiary.name || ''}
                      onChange={(e) => setNewSubsidiary(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="País"
                      value={newSubsidiary.country || ''}
                      onChange={(e) => setNewSubsidiary(prev => ({ ...prev, country: e.target.value }))}
                    />
                    <Input
                      placeholder="% de participação"
                      type="number"
                      value={newSubsidiary.ownership_percentage || ''}
                      onChange={(e) => setNewSubsidiary(prev => ({ ...prev, ownership_percentage: parseFloat(e.target.value) }))}
                    />
                    <Button onClick={addSubsidiary}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {subsidiaries.map((subsidiary) => (
                      <div key={subsidiary.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{subsidiary.name}</p>
                            <Badge variant={subsidiary.included_in_scope ? "default" : "secondary"}>
                              {subsidiary.included_in_scope ? "Incluída" : "Excluída"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {subsidiary.country} • {subsidiary.ownership_percentage}% participação
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubsidiary(subsidiary.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="escopo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Definição do Escopo de Relato
                </CardTitle>
                <CardDescription>
                  Configure os limites organizacionais e operacionais para os relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reporting-scope">Escopo de Relato</Label>
                  <Textarea
                    id="reporting-scope"
                    value={formData.reporting_scope || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporting_scope: e.target.value }))}
                    placeholder="Descreva o escopo de relato da organização"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-start">Início Ano Fiscal</Label>
                    <Input
                      id="fiscal-start"
                      type="date"
                      value={formData.fiscal_year_start || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fiscal_year_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-end">Fim Ano Fiscal</Label>
                    <Input
                      id="fiscal-end"
                      type="date"
                      value={formData.fiscal_year_end || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fiscal_year_end: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Informações Financeiras
                </CardTitle>
                <CardDescription>
                  Dados financeiros relevantes para os relatórios de sustentabilidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Receita Anual (R$)</Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.annual_revenue || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, annual_revenue: parseFloat(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Número de Funcionários</Label>
                    <Input
                      id="employees"
                      type="number"
                      value={formData.employee_count || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_count: parseInt(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-exchange">Bolsa de Valores</Label>
                    <Input
                      id="stock-exchange"
                      value={formData.stock_exchange || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_exchange: e.target.value }))}
                      placeholder="Ex: B3, NYSE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-symbol">Símbolo na Bolsa</Label>
                    <Input
                      id="stock-symbol"
                      value={formData.stock_symbol || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_symbol: e.target.value }))}
                      placeholder="Ex: PETR4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateProfileMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
           </Button>
        </div>
    </>
  );
}