import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

interface BenefitsReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BenefitsReportModal({
  open,
  onOpenChange,
}: BenefitsReportModalProps) {
  const [selectedReport, setSelectedReport] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: "payroll",
      title: "Folha de Pagamento",
      description: "Relatório completo da folha de pagamento mensal",
      icon: FileText,
    },
    {
      id: "benefits-cost",
      title: "Custos de Benefícios",
      description: "Análise detalhada dos custos por benefício",
      icon: DollarSign,
    },
    {
      id: "employee-benefits",
      title: "Benefícios por Funcionário",
      description: "Relatório individual de benefícios por funcionário",
      icon: Users,
    },
    {
      id: "salary-evolution",
      title: "Evolução Salarial",
      description: "Histórico de reajustes e progressão salarial",
      icon: TrendingUp,
    },
    {
      id: "benefits-participation",
      title: "Participação em Benefícios",
      description: "Taxa de adesão e utilização dos benefícios",
      icon: PieChart,
    },
  ];

  const periods = [
    { value: "current-month", label: "Mês Atual" },
    { value: "last-month", label: "Mês Anterior" },
    { value: "current-quarter", label: "Trimestre Atual" },
    { value: "last-quarter", label: "Trimestre Anterior" },
    { value: "current-year", label: "Ano Atual" },
    { value: "last-year", label: "Ano Anterior" },
    { value: "custom", label: "Período Personalizado" },
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error("Selecione um tipo de relatório");
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportName = reportTypes.find(r => r.id === selectedReport)?.title || "Relatório";
      toast.success(`${reportName} gerado com sucesso!`);
      
      // Here you would typically trigger a download or open the report
      
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  // Production - load real payroll and benefits data
  const [payrollData, setPayrollData] = useState({
    payroll: {
      totalEmployees: 0,
      totalSalaries: 0,
      totalBenefits: 0,
      totalCost: 0,
    },
    benefits: {},
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios de Benefícios e Remuneração
          </DialogTitle>
          <DialogDescription>
            Gere relatórios detalhados sobre benefícios, salários e custos da empresa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
            <TabsTrigger value="preview">Prévia dos Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período do Relatório</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {period.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((report) => (
                    <Card
                      key={report.id}
                      className={`cursor-pointer transition-colors ${
                        selectedReport === report.id 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-muted-foreground/20"
                      }`}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <report.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{report.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {report.description}
                            </p>
                          </div>
                          {selectedReport === report.id && (
                            <Badge variant="default" className="text-xs">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating || !selectedReport}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{payrollData.payroll.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">Ativos na folha</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Salários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {payrollData.payroll.totalSalaries.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Custo mensal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Benefícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {payrollData.payroll.totalBenefits.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Custo mensal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {payrollData.payroll.totalCost.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Salários + Benefícios</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Participação em Benefícios</CardTitle>
                <CardDescription>Número de funcionários por benefício</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(payrollData.benefits).map(([key, benefit]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm">
                          {key === 'healthPlan' && 'Plano de Saúde'}
                          {key === 'mealAllowance' && 'Vale Alimentação'}
                          {key === 'transport' && 'Vale Transporte'}
                          {key === 'lifeInsurance' && 'Seguro de Vida'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{benefit.participants} funcionários</span>
                        <div className="text-xs text-muted-foreground">
                          R$ {benefit.cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}