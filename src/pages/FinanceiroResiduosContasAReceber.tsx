import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getReceivableWastes, getReceivablesStats, type ReceivableWaste, type ReceivablesStats } from "@/services/wasteFinance";
import { Download, TrendingUp, DollarSign, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#22c55e', '#f59e0b'];

export default function FinanceiroResiduosContasAReceber() {
  const [receivables, setReceivables] = useState<ReceivableWaste[]>([]);
  const [stats, setStats] = useState<ReceivablesStats | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  async function loadData() {
    try {
      setLoading(true);

      if ((window as any).__DATON_DEMO_MODE__ === true) {
        const allReceivables = [
          { id: 'rw-1', mtr_number: 'MTR-2026-0045', waste_description: 'Papel e Papelão', collection_date: '2026-02-15T00:00:00Z', quantity: 1250.5, unit: 'kg', destination_name: 'Recicla Brasil Ltda', revenue_per_unit: 0.45, revenue_total: 562.73, final_treatment_type: 'Reciclagem' },
          { id: 'rw-2', mtr_number: 'MTR-2026-0046', waste_description: 'Plástico PET', collection_date: '2026-02-10T00:00:00Z', quantity: 780.0, unit: 'kg', destination_name: 'Ecopack Reciclagem', revenue_per_unit: 1.20, revenue_total: 936.00, final_treatment_type: 'Reciclagem' },
          { id: 'rw-3', mtr_number: 'MTR-2026-0038', waste_description: 'Metal Ferroso', collection_date: '2026-01-28T00:00:00Z', quantity: 2100.0, unit: 'kg', destination_name: 'Sucatec Metais', revenue_per_unit: 0.60, revenue_total: 1260.00, final_treatment_type: 'Reciclagem' },
          { id: 'rw-4', mtr_number: 'MTR-2026-0031', waste_description: 'Alumínio', collection_date: '2026-01-20T00:00:00Z', quantity: 320.0, unit: 'kg', destination_name: 'Sucatec Metais', revenue_per_unit: 4.80, revenue_total: 1536.00, final_treatment_type: 'Reciclagem' },
          { id: 'rw-5', mtr_number: 'MTR-2025-0198', waste_description: 'Vidro', collection_date: '2025-12-15T00:00:00Z', quantity: 650.0, unit: 'kg', destination_name: 'Vidrolar', revenue_per_unit: 0.15, revenue_total: 97.50, final_treatment_type: 'Reciclagem' },
        ];

        const filteredReceivables = allReceivables.filter(r => r.collection_date.startsWith(selectedYear));
        const totalRevenueYear = filteredReceivables.reduce((sum, item) => sum + (item.revenue_total || 0), 0);

        // Sum revenue by material for demo
        const revenueByMaterial = filteredReceivables.reduce((acc, curr) => {
          if (curr.waste_description && curr.revenue_total) {
            acc[curr.waste_description] = (acc[curr.waste_description] || 0) + curr.revenue_total;
          }
          return acc;
        }, {} as Record<string, number>);

        const totalQuantity = filteredReceivables.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const avgPricePerTon = totalQuantity > 0 ? (totalRevenueYear / totalQuantity) * 1000 : 0;

        setReceivables(filteredReceivables);
        setStats({
          total_revenue_year: totalRevenueYear || 8450.30,
          avg_price_per_ton: avgPricePerTon || 380.00,
          revenue_by_material: Object.keys(revenueByMaterial).length > 0 ? revenueByMaterial : { 'Papel e Papelão': 2340.50, 'Plástico PET': 1850.20, 'Metal Ferroso': 2200.00, 'Alumínio': 1560.80, 'Vidro': 498.80 },
          monthly_comparison: [
            { month: 'Set', revenue: 1200.50 }, { month: 'Out', revenue: 1350.20 },
            { month: 'Nov', revenue: 1450.80 }, { month: 'Dez', revenue: 1680.40 },
            { month: 'Jan', revenue: 1420.60 }, { month: 'Fev', revenue: 1347.80 },
          ],
        });
        setLoading(false);
        return;
      }

      const [receivablesData, statsData] = await Promise.all([
        getReceivableWastes(selectedYear),
        getReceivablesStats(selectedYear)
      ]);
      setReceivables(receivablesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading receivables:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as contas a receber.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (receivables.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há registros de recicláveis para o ano selecionado.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ["MTR", "Descrição", "Data Coleta", "Quantidade", "Unidade", "Destino", "R$/Unidade", "Receita Total", "Tratamento Final"].join(";"),
      ...receivables.map(item => [
        item.mtr_number,
        item.waste_description,
        format(new Date(item.collection_date), 'dd/MM/yyyy', { locale: ptBR }),
        item.quantity,
        item.unit,
        item.destination_name || '-',
        item.revenue_per_unit?.toFixed(2) || '0.00',
        item.revenue_total?.toFixed(2) || '0.00',
        item.final_treatment_type || '-'
      ].join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contas_receber_reciclavel_${selectedYear}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `Arquivo exportado com ${receivables.length} registros.`,
    });
  }

  const filteredReceivables = receivables.filter(item =>
    item.mtr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.waste_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Preparar dados para gráfico de pizza (receita por material)
  const pieChartData = stats ? Object.entries(stats.revenue_by_material).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100
  })) : [];

  // Preparar dados para gráfico de barras (receita mensal)
  const barChartData = stats?.monthly_comparison || [];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="w-full overflow-hidden py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber - Recicláveis</h1>
          <p className="text-muted-foreground mt-1">
            Receitas com venda de materiais recicláveis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total {selectedYear}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.total_revenue_year.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {receivables.length} operações de venda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio por Tonelada</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.avg_price_per_ton.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média ponderada do ano
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiais Comercializados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.revenue_by_material).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tipos diferentes de recicláveis
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal - {selectedYear}</CardTitle>
            <CardDescription>Evolução da receita ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Receita por Material */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Material</CardTitle>
            <CardDescription>Distribuição de receita por tipo de reciclável</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${entry.value.toLocaleString('pt-BR')}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Recicláveis */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas de Recicláveis</CardTitle>
          <CardDescription>
            Listagem detalhada de todas as operações de venda de materiais recicláveis
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Buscar por MTR, material ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MTR</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">R$/Un</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead>Tratamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum registro encontrado com os filtros aplicados." : "Nenhum reciclável vendido no ano selecionado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceivables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.mtr_number}</TableCell>
                      <TableCell className="font-medium">{item.waste_description}</TableCell>
                      <TableCell>{format(new Date(item.collection_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {item.unit}
                      </TableCell>
                      <TableCell>{item.destination_name || '-'}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.revenue_per_unit ? `R$ ${item.revenue_per_unit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {(item.revenue_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {item.final_treatment_type ? (
                          <Badge variant="outline">{item.final_treatment_type}</Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
