import React, { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Package, 
  BarChart3, 
  Gavel, 
  Trash2, 
  Flag, 
  Recycle, 
  FileText, 
  ShieldCheck, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Download,
  Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAssetsHierarchy } from "@/services/assets";
import { supabase } from "@/integrations/supabase/client";

const BancoDados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("empresa");

  // Fetch company data
  const { data: companyData } = useQuery({
    queryKey: ['company-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch assets
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssetsHierarchy
  });

  // Fetch emission sources
  const { data: emissionSources } = useQuery({
    queryKey: ['emission-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emission_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch licenses
  const { data: licenses } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch goals
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch compliance tasks
  const { data: complianceTasks } = useQuery({
    queryKey: ['compliance-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const sections = [
    {
      id: "empresa",
      title: "Dados da Empresa",
      icon: Building2,
      count: companyData ? 1 : 0,
      data: companyData
    },
    {
      id: "ativos",
      title: "Ativos",
      icon: Package,
      count: assets?.length || 0,
      data: assets
    },
    {
      id: "emissoes",
      title: "Fontes de Emissão",
      icon: BarChart3,
      count: emissionSources?.length || 0,
      data: emissionSources
    },
    {
      id: "licencas",
      title: "Licenças",
      icon: Gavel,
      count: licenses?.length || 0,
      data: licenses
    },
    {
      id: "metas",
      title: "Metas ESG",
      icon: Flag,
      count: goals?.length || 0,
      data: goals
    },
    {
      id: "documentos",
      title: "Documentos",
      icon: FileText,
      count: documents?.length || 0,
      data: documents
    },
    {
      id: "compliance",
      title: "Compliance",
      icon: ShieldCheck,
      count: complianceTasks?.length || 0,
      data: complianceTasks
    }
  ];

  const DataSummaryCard = ({ section }: { section: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection(section.id)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground/80">
          {section.title}
        </CardTitle>
        <section.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{section.count}</div>
        <p className="text-xs text-muted-foreground">
          {section.count === 1 ? 'registro' : 'registros'} no sistema
        </p>
      </CardContent>
    </Card>
  );

  const DataTable = ({ section }: { section: any }) => {
    const filteredData = section.data?.filter((item: any) => 
      Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) || [];

    if (!section.data || section.data.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <section.icon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum registro encontrado para {section.title}</p>
            <Button className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar {section.title.slice(0, -1)}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{filteredData.length} registro(s) encontrado(s)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredData.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{item.name || item.title || item.file_name || 'Item'}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description || item.category || item.status || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status && (
                    <Badge variant={item.status === 'Ativo' || item.status === 'Concluída' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredData.length > 5 && (
              <div className="text-center py-4">
                <Button variant="outline" size="sm">
                  Ver todos ({filteredData.length - 5} restantes)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const activeCurrentSection = sections.find(s => s.id === activeSection);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banco de Dados</h1>
            <p className="text-muted-foreground">
              Central de dados do sistema - visualize, gerencie e exporte todas as informações da sua empresa
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="text-xs">
                <section.icon className="w-4 h-4 mr-1" />
                {section.title.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sections.map((section) => (
                <DataSummaryCard key={section.id} section={section} />
              ))}
            </div>
          </TabsContent>

          {/* Individual Section Tabs */}
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={`Buscar em ${section.title}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DataTable section={section} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sections.reduce((total, section) => total + section.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dados gerenciados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seções Ativas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sections.filter(s => s.count > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                de {sections.length} seções disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hoje</div>
              <p className="text-xs text-muted-foreground">
                Dados sincronizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Sistema operacional
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BancoDados;