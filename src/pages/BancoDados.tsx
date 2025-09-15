import React, { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { DataCard } from "@/components/DataCard";
import { FilterBar } from "@/components/FilterBar";
import { StatsOverview } from "@/components/StatsOverview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download,
  Settings,
  RefreshCw,
  Grid3x3,
  List,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useAllDatabaseData, DatabaseSection } from "@/hooks/useAllDatabaseData";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BancoDados = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Fetch all database data
  const { sections, isLoading, totalRecords } = useAllDatabaseData();
  
  // Global search and filtering
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    clearAll,
    results: filteredSections,
    stats
  } = useGlobalSearch(sections);

  const activeSections = sections.filter(section => section.status === 'active').length;

  const DataTable = ({ section }: { section: DatabaseSection }) => {
    const dataArray = Array.isArray(section.data) ? section.data : section.data ? [section.data] : [];
    const displayData = dataArray.slice(0, 10); // Show first 10 items
    
    if (section.status === 'error') {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg font-medium mb-2">Erro ao carregar dados</p>
              <p className="text-sm mb-4">Não foi possível carregar {section.title}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (dataArray.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
              <p className="text-sm mb-4">{section.title} ainda não possui dados</p>
              <Button>
                <span className="mr-2">+</span>
                Adicionar {section.title}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{dataArray.length} registro(s) encontrado(s)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.name || item.title || item.file_name || `Item ${index + 1}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.description || item.category || item.type || 'Sem descrição'}
                  </TableCell>
                  <TableCell>
                    {item.status && (
                      <Badge variant={
                        item.status === 'Ativo' || item.status === 'Concluída' ? 'default' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dataArray.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline">
                Ver todos os {dataArray.length} registros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banco de Dados</h1>
            <p className="text-muted-foreground">
              Central completa de dados - visualize, gerencie e exporte todas as informações da sua empresa
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Carregando dados do banco de dados...
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Dados
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview 
          totalRecords={totalRecords}
          totalSections={sections.length}
          activeSections={activeSections}
          isLoading={isLoading}
        />

        {/* Advanced Filter Bar */}
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilters={activeFilters}
          addFilter={addFilter}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
          clearAll={clearAll}
          stats={stats}
        />

        {/* Main Content */}
        {viewMode === 'grid' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSections.map((section) => (
                <DataCard
                  key={section.id}
                  section={section}
                  onClick={() => setSelectedSection(section.id)}
                  isSelected={selectedSection === section.id}
                />
              ))}
            </div>
            
            {/* Detailed view for selected section */}
            {selectedSection && (
              <div className="mt-8">
                <DataTable 
                  section={filteredSections.find(s => s.id === selectedSection)!} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map((section) => (
              <DataTable key={section.id} section={section} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredSections.length === 0 && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground text-center">
                <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                <p className="text-sm mb-4">
                  Tente ajustar os filtros ou termos de busca
                </p>
                <Button onClick={clearAll}>
                  Limpar todos os filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default BancoDados;