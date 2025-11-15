import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Users, FolderKanban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AnaliseRentabilidade() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [analysisType, setAnalysisType] = useState<'project' | 'category'>('project');

  // Análise por Projeto
  const { data: projectProfitability } = useQuery({
    queryKey: ['project-profitability', selectedYear],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return [];

      // Buscar projetos com orçamentos
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          budgets (
            planned_amount,
            spent_amount
          )
        `)
        .eq('company_id', profile.company_id);

      return projects?.map(project => {
        const totalPlanned = project.budgets?.reduce((sum, b) => sum + Number(b.planned_amount), 0) || 0;
        const totalSpent = project.budgets?.reduce((sum, b) => sum + Number(b.spent_amount), 0) || 0;
        const economy = totalPlanned - totalSpent;
        const roi = totalPlanned > 0 ? ((totalPlanned - totalSpent) / totalPlanned) * 100 : 0;

        return {
          name: project.name,
          orcado: totalPlanned,
          realizado: totalSpent,
          economia: economy,
          roi: roi,
          status: project.status,
        };
      }) || [];
    },
  });

  // Análise por Categoria de Despesa
  const { data: categoryProfitability } = useQuery({
    queryKey: ['category-profitability', selectedYear],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return [];

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('year', selectedYear);

      const categoryMap = new Map();

      budgets?.forEach(budget => {
        const existing = categoryMap.get(budget.category) || { 
          planned: 0, 
          spent: 0 
        };
        categoryMap.set(budget.category, {
          planned: existing.planned + Number(budget.planned_amount),
          spent: existing.spent + Number(budget.spent_amount),
        });
      });

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        orcado: data.planned,
        realizado: data.spent,
        economia: data.planned - data.spent,
        eficiencia: data.planned > 0 ? ((data.planned - data.spent) / data.planned) * 100 : 0,
      }));
    },
  });

  const chartData = analysisType === 'project' ? projectProfitability : categoryProfitability;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Análise de Rentabilidade
          </h1>
          <p className="text-muted-foreground mt-2">
            Entenda o retorno dos seus investimentos e projetos
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Por Projeto
              </div>
            </SelectItem>
            <SelectItem value="category">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Por Categoria
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gráfico de Rentabilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Orçado vs Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={analysisType === 'project' ? 'name' : 'category'} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="orcado" fill="hsl(var(--primary))" name="Orçado" />
              <Bar dataKey="realizado" fill="hsl(var(--destructive))" name="Realizado" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Rentabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{analysisType === 'project' ? 'Projeto' : 'Categoria'}</TableHead>
                <TableHead className="text-right">Orçado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Economia</TableHead>
                <TableHead className="text-right">Eficiência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData?.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {analysisType === 'project' ? item.name : item.category}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {item.orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {item.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={`text-right ${item.economia >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    R$ {Math.abs(item.economia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {item.economia < 0 && ' (excedido)'}
                  </TableCell>
                  <TableCell className="text-right">
                    {analysisType === 'project' ? item.roi?.toFixed(1) : item.eficiencia.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
