import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLicenseConditions } from '@/services/licenseAI';
import { ConditionCard } from './ConditionCard';

interface ConditionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseId: string;
}

interface ConditionFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  searchQuery?: string;
}

export const ConditionsManagerModal: React.FC<ConditionsManagerModalProps> = ({
  isOpen,
  onClose,
  licenseId,
}) => {
  const [filters, setFilters] = useState<ConditionFilters>({});
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const { data: conditions, isLoading, refetch } = useQuery({
    queryKey: ['license-conditions', licenseId, filters],
    queryFn: () => getLicenseConditions(licenseId),
    enabled: isOpen && !!licenseId,
  });

  const filteredConditions = conditions?.filter((condition) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!condition.condition_text.toLowerCase().includes(query)) return false;
    }
    if (filters.status?.length && !filters.status.includes(condition.status)) return false;
    if (filters.priority?.length && !filters.priority.includes(condition.priority)) return false;
    if (filters.category?.length && !filters.category.includes(condition.condition_category || '')) return false;
    
    if (selectedTab !== 'all') {
      if (selectedTab === 'pending' && condition.status !== 'pending') return false;
      if (selectedTab === 'in_progress' && condition.status !== 'in_progress') return false;
      if (selectedTab === 'completed' && condition.status !== 'completed') return false;
    }
    
    return true;
  }) || [];

  const stats = {
    total: conditions?.length || 0,
    pending: conditions?.filter((c) => c.status === 'pending').length || 0,
    in_progress: conditions?.filter((c) => c.status === 'in_progress').length || 0,
    completed: conditions?.filter((c) => c.status === 'completed').length || 0,
    overdue: conditions?.filter((c) => c.due_date && new Date(c.due_date) < new Date()).length || 0,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Gerenciamento de Condicionantes
          </DialogTitle>
        </DialogHeader>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary/50" />
            </div>
          </div>
          
          <div className="p-4 bg-success/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/50" />
            </div>
          </div>
          
          <div className="p-4 bg-warning/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </div>
          
          <div className="p-4 bg-destructive/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Cumprimento</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar condicionantes..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>
          
          <Select
            value={filters.priority?.[0] || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, priority: value === 'all' ? [] : [value] })
            }
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category?.[0] || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, category: value === 'all' ? [] : [value] })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="monitoring">Monitoramento</SelectItem>
              <SelectItem value="reporting">Relatório</SelectItem>
              <SelectItem value="control">Controle</SelectItem>
              <SelectItem value="management">Gestão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">
              Todas ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Em Andamento ({stats.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({stats.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="flex-1 overflow-y-auto mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando condicionantes...</p>
              </div>
            ) : filteredConditions.length > 0 ? (
              filteredConditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  onUpdate={refetch}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma condicionante encontrada</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
