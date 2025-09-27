import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar, User } from 'lucide-react';
import { useCompliance } from '@/contexts/ComplianceContext';

export function AdvancedFilters() {
  const { 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter, 
    priorityFilter, 
    setPriorityFilter,
    users 
  } = useCompliance();

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const activeFiltersCount = [
    searchTerm ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    priorityFilter !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros em linha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Filtro por Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Em Atraso">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Prioridade */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridade</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica (Vencidas/Próx. 3 dias)</SelectItem>
                <SelectItem value="high">Alta (Próximos 7 dias)</SelectItem>
                <SelectItem value="medium">Média (Próximos 30 dias)</SelectItem>
                <SelectItem value="low">Baixa (Mais de 30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Frequência */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frequência</label>
            <Select value="all">
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Única">Única</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
                <SelectItem value="Semestral">Semestral</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vencimento</label>
            <Select value="all">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="tomorrow">Amanhã</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            
            {searchTerm && (
              <Badge variant="outline" className="gap-1">
                Busca: "{searchTerm}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSearchTerm('')}
                />
              </Badge>
            )}
            
            {statusFilter !== 'all' && (
              <Badge variant="outline" className="gap-1">
                Status: {statusFilter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStatusFilter('all')}
                />
              </Badge>
            )}
            
            {priorityFilter !== 'all' && (
              <Badge variant="outline" className="gap-1">
                Prioridade: {priorityFilter === 'critical' ? 'Crítica' : 
                             priorityFilter === 'high' ? 'Alta' :
                             priorityFilter === 'medium' ? 'Média' : 'Baixa'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setPriorityFilter('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}