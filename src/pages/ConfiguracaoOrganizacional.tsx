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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configuração organizacional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração Organizacional</h1>
          <p className="text-muted-foreground">
            Configure o perfil e estrutura da sua organização para relatórios de sustentabilidade
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={updateProfileMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basico" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
            <TabsTrigger value="estrutura">Estrutura Organizacional</TabsTrigger>
            <TabsTrigger value="escopo">Escopo do Relatório</TabsTrigger>
            <TabsTrigger value="financeiro">Informações Financeiras</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Dados Corporativos
                  </CardTitle>
                  <CardDescription>
                    Informações básicas da empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Razão Social</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo da empresa"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj || ''}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sector">Setor de Atuação</Label>
                    <Select
                      value={formData.sector || ''}
                      onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturing">Manufatura</SelectItem>
                        <SelectItem value="financial">Serviços Financeiros</SelectItem>
                        <SelectItem value="technology">Tecnologia</SelectItem>
                        <SelectItem value="healthcare">Saúde</SelectItem>
                        <SelectItem value="energy">Energia</SelectItem>
                        <SelectItem value="retail">Varejo</SelectItem>
                        <SelectItem value="agriculture">Agronegócio</SelectItem>
                        <SelectItem value="construction">Construção</SelectItem>
                        <SelectItem value="mining">Mineração</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="legal_structure">Estrutura Legal</Label>
                    <Select
                      value={formData.legal_structure || ''}
                      onValueChange={(value) => setFormData({ ...formData, legal_structure: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ltda">Sociedade Limitada (Ltda)</SelectItem>
                        <SelectItem value="sa">Sociedade Anônima (S.A.)</SelectItem>
                        <SelectItem value="mei">Microempreendedor Individual</SelectItem>
                        <SelectItem value="eireli">EIRELI</SelectItem>
                        <SelectItem value="cooperativa">Cooperativa</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </CardTitle>
                  <CardDescription>
                    Sede e informações geográficas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="headquarters_address">Endereço da Sede</Label>
                    <Textarea
                      id="headquarters_address"
                      value={formData.headquarters_address || ''}
                      onChange={(e) => setFormData({ ...formData, headquarters_address: e.target.value })}
                      placeholder="Endereço completo da matriz"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="headquarters_country">País</Label>
                    <Select
                      value={formData.headquarters_country || ''}
                      onValueChange={(value) => setFormData({ ...formData, headquarters_country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR">Brasil</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="CO">Colômbia</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="employee_count">Número de Funcionários</Label>
                    <Input
                      id="employee_count"
                      type="number"
                      value={formData.employee_count || ''}
                      onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                      placeholder="Total de colaboradores"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="estrutura" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unidades de Negócio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Unidades de Negócio
                  </CardTitle>
                  <CardDescription>
                    Gerencie as diferentes unidades da organização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {businessUnits.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{unit.name}</h4>
                          <p className="text-sm text-muted-foreground">{unit.location}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{unit.employees} funcionários</Badge>
                            <Badge variant="outline">{unit.revenue_percentage}% receita</Badge>
                          </div>
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

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Adicionar Nova Unidade</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome da unidade"
                        value={newBusinessUnit.name || ''}
                        onChange={(e) => setNewBusinessUnit({ ...newBusinessUnit, name: e.target.value })}
                      />
                      <Input
                        placeholder="Localização"
                        value={newBusinessUnit.location || ''}
                        onChange={(e) => setNewBusinessUnit({ ...newBusinessUnit, location: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Funcionários"
                        value={newBusinessUnit.employees || ''}
                        onChange={(e) => setNewBusinessUnit({ ...newBusinessUnit, employees: parseInt(e.target.value) || 0 })}
                      />
                      <Input
                        type="number"
                        placeholder="% Receita"
                        value={newBusinessUnit.revenue_percentage || ''}
                        onChange={(e) => setNewBusinessUnit({ ...newBusinessUnit, revenue_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={addBusinessUnit} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Unidade
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subsidiárias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Subsidiárias
                  </CardTitle>
                  <CardDescription>
                    Controle empresas controladas e coligadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {subsidiaries.map((subsidiary) => (
                      <div key={subsidiary.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{subsidiary.name}</h4>
                          <p className="text-sm text-muted-foreground">{subsidiary.country}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{subsidiary.ownership_percentage}% participação</Badge>
                            <Badge variant={subsidiary.included_in_scope ? 'default' : 'secondary'}>
                              {subsidiary.included_in_scope ? 'Incluída' : 'Excluída'}
                            </Badge>
                          </div>
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

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Adicionar Nova Subsidiária</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome da empresa"
                        value={newSubsidiary.name || ''}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, name: e.target.value })}
                      />
                      <Input
                        placeholder="País"
                        value={newSubsidiary.country || ''}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, country: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="% Propriedade"
                        value={newSubsidiary.ownership_percentage || ''}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, ownership_percentage: parseFloat(e.target.value) || 0 })}
                      />
                      <Select
                        value={newSubsidiary.included_in_scope ? 'included' : 'excluded'}
                        onValueChange={(value) => setNewSubsidiary({ ...newSubsidiary, included_in_scope: value === 'included' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Incluir no escopo?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="included">Incluída</SelectItem>
                          <SelectItem value="excluded">Excluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addSubsidiary} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Subsidiária
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="escopo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Escopo do Relatório
                </CardTitle>
                <CardDescription>
                  Defina o escopo e período dos relatórios de sustentabilidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reporting_scope">Descrição do Escopo</Label>
                  <Textarea
                    id="reporting_scope"
                    value={formData.reporting_scope || ''}
                    onChange={(e) => setFormData({ ...formData, reporting_scope: e.target.value })}
                    placeholder="Descreva o escopo organizacional dos relatórios (unidades, subsidiárias, períodos incluídos)..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fiscal_year_start">Início do Ano Fiscal</Label>
                    <Input
                      id="fiscal_year_start"
                      type="date"
                      value={formData.fiscal_year_start || ''}
                      onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fiscal_year_end">Fim do Ano Fiscal</Label>
                    <Input
                      id="fiscal_year_end"
                      type="date"
                      value={formData.fiscal_year_end || ''}
                      onChange={(e) => setFormData({ ...formData, fiscal_year_end: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Informações Financeiras
                </CardTitle>
                <CardDescription>
                  Dados financeiros para contexto dos relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="annual_revenue">Receita Anual (R$)</Label>
                  <Input
                    id="annual_revenue"
                    type="number"
                    value={formData.annual_revenue || ''}
                    onChange={(e) => setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) || 0 })}
                    placeholder="Receita anual total"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock_exchange">Bolsa de Valores</Label>
                    <Select
                      value={formData.stock_exchange || ''}
                      onValueChange={(value) => setFormData({ ...formData, stock_exchange: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a bolsa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B3">B3 (Brasil)</SelectItem>
                        <SelectItem value="NYSE">NYSE</SelectItem>
                        <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                        <SelectItem value="LSE">LSE (Londres)</SelectItem>
                        <SelectItem value="private">Empresa Privada</SelectItem>
                        <SelectItem value="other">Outras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stock_symbol">Ticker/Símbolo</Label>
                    <Input
                      id="stock_symbol"
                      value={formData.stock_symbol || ''}
                      onChange={(e) => setFormData({ ...formData, stock_symbol: e.target.value })}
                      placeholder="Ex: PETR4, VALE3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}