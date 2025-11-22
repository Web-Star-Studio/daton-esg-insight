import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DatabaseSearch } from '@/components/database/DatabaseSearch';
import { DomainFilter } from '@/components/database/DomainFilter';
import { TableStatistics } from '@/components/database/TableStatistics';
import { DatabaseTableCard } from '@/components/database/DatabaseTableCard';
import { 
  parseSupabaseDatabase, 
  searchTables, 
  filterTablesByDomain 
} from '@/utils/databaseSchemaParser';
import { toast } from 'sonner';

export default function DatabaseDocumentation() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [scrollToTable, setScrollToTable] = useState<string | null>(null);
  
  const databaseData = useMemo(() => parseSupabaseDatabase(), []);
  
  const filteredTables = useMemo(() => {
    let tables = databaseData.tables;
    
    // Apply domain filter
    if (selectedDomains.length > 0) {
      tables = filterTablesByDomain(tables, selectedDomains);
    }
    
    // Apply search filter
    if (searchQuery) {
      tables = searchTables(tables, searchQuery);
    }
    
    return tables.sort((a, b) => a.name.localeCompare(b.name));
  }, [databaseData.tables, searchQuery, selectedDomains]);
  
  const handleToggleDomain = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };
  
  const handleTableClick = (tableName: string) => {
    setScrollToTable(tableName);
    const element = document.getElementById(`table-${tableName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setScrollToTable(null), 2000);
    }
  };
  
  const handleExportMarkdown = () => {
    let markdown = `# Documentação do Banco de Dados\n\n`;
    markdown += `**Total de Tabelas:** ${databaseData.totalTables}\n`;
    markdown += `**Total de Relacionamentos:** ${databaseData.totalRelationships}\n`;
    markdown += `**Total de Colunas:** ${databaseData.totalColumns}\n\n`;
    
    filteredTables.forEach(table => {
      markdown += `## ${table.name}\n\n`;
      markdown += `**Domínio:** ${table.domain}\n`;
      markdown += `**Descrição:** ${table.description}\n\n`;
      
      markdown += `### Colunas\n\n`;
      markdown += `| Nome | Tipo | PK | FK | Nullable |\n`;
      markdown += `|------|------|----|----|----------|\n`;
      table.columns.forEach(col => {
        markdown += `| ${col.name} | ${col.type} | ${col.isPrimaryKey ? '✓' : ''} | ${col.isForeignKey ? '✓' : ''} | ${col.nullable ? '✓' : ''} |\n`;
      });
      
      if (table.relationships.length > 0) {
        markdown += `\n### Relacionamentos\n\n`;
        table.relationships.forEach(rel => {
          markdown += `- ${rel.columns.join(', ')} → ${rel.referencedTable} (${rel.referencedColumns.join(', ')})\n`;
        });
      }
      
      if (table.businessRules.length > 0) {
        markdown += `\n### Regras de Negócio\n\n`;
        table.businessRules.forEach(rule => {
          markdown += `- ${rule}\n`;
        });
      }
      
      markdown += `\n---\n\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database-documentation.md';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Documentação exportada com sucesso!');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">📚 Documentação do Banco de Dados</h1>
                <p className="text-muted-foreground mt-1">
                  Estrutura completa, relacionamentos e regras de negócio
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportMarkdown}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Markdown
              </Button>
            </div>
          </div>
          
          {/* Statistics */}
          <TableStatistics
            totalTables={databaseData.totalTables}
            totalRelationships={databaseData.totalRelationships}
            totalColumns={databaseData.totalColumns}
            totalDomains={databaseData.domains.length}
          />
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <DatabaseSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
          />
          
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Filtrar por Domínio
            </h3>
            <DomainFilter
              domains={databaseData.domains}
              selectedDomains={selectedDomains}
              onToggleDomain={handleToggleDomain}
            />
          </div>
          
          {(searchQuery || selectedDomains.length > 0) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                Mostrando {filteredTables.length} de {databaseData.totalTables} tabelas
              </span>
              {(searchQuery || selectedDomains.length > 0) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDomains([]);
                  }}
                  className="h-auto p-0"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Tables List */}
      <div className="container mx-auto px-4 py-8">
        {filteredTables.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tabela encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou realizar uma nova busca
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTables.map(table => (
              <div 
                key={table.name} 
                id={`table-${table.name}`}
                className={scrollToTable === table.name ? 'ring-2 ring-primary rounded-lg' : ''}
              >
                <DatabaseTableCard 
                  table={table} 
                  onTableClick={handleTableClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
