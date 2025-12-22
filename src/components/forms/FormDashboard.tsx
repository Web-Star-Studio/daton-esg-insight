import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm, type FormSubmission, type FormField } from "@/services/customForms";
import { FieldBarChart } from "./charts/FieldBarChart";
import { FieldPieChart } from "./charts/FieldPieChart";
import { OpenResponsesSection } from "./charts/OpenResponsesSection";
import { NPSScoreCard, calculateNPS } from "./charts/NPSScoreCard";
import { 
  Download, 
  Users, 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  MessageSquare,
  Table as TableIcon,
  TrendingUp,
  ThumbsUp
} from "lucide-react";

interface FormDashboardProps {
  formId: string;
  open: boolean;
  onClose: () => void;
}

interface AggregatedData {
  name: string;
  value: number;
}

// Closed field types that can be charted
const CLOSED_FIELD_TYPES = ['select', 'multiselect', 'checkbox'];
const OPEN_FIELD_TYPES = ['text', 'textarea'];
const NPS_FIELD_TYPE = 'nps';

function aggregateFieldData(submissions: FormSubmission[], field: FormField): AggregatedData[] {
  const counts: Record<string, number> = {};

  if (field.type === 'checkbox') {
    // For checkbox, count true/false
    submissions.forEach(s => {
      const value = s.submission_data[field.id];
      const label = value === true ? 'Sim' : value === false ? 'Não' : null;
      if (label) {
        counts[label] = (counts[label] || 0) + 1;
      }
    });
  } else if (field.type === 'multiselect') {
    // For multiselect, count each selected option
    submissions.forEach(s => {
      const values = s.submission_data[field.id];
      if (Array.isArray(values)) {
        values.forEach(v => {
          const normalizedValue = String(v);
          counts[normalizedValue] = (counts[normalizedValue] || 0) + 1;
        });
      }
    });
  } else if (field.type === 'select') {
    // For select, count each option
    submissions.forEach(s => {
      const value = s.submission_data[field.id];
      if (value) {
        const normalizedValue = String(value);
        counts[normalizedValue] = (counts[normalizedValue] || 0) + 1;
      }
    });
  }

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getOpenResponses(submissions: FormSubmission[], field: FormField) {
  return submissions
    .filter(s => s.submission_data[field.id])
    .map(s => ({
      text: String(s.submission_data[field.id]),
      date: s.submitted_at,
      user: s.submitted_by?.full_name
    }));
}

export function FormDashboard({ formId, open, onClose }: FormDashboardProps) {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && formId) {
      loadData();
    }
  }, [open, formId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, submissionsData] = await Promise.all([
        customFormsService.getForm(formId),
        customFormsService.getFormSubmissions(formId)
      ]);
      
      setForm(formData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { closedFields, openFields, npsFields } = useMemo(() => {
    if (!form) return { closedFields: [], openFields: [], npsFields: [] };
    
    return {
      closedFields: form.structure_json.fields.filter(f => CLOSED_FIELD_TYPES.includes(f.type)),
      openFields: form.structure_json.fields.filter(f => OPEN_FIELD_TYPES.includes(f.type)),
      npsFields: form.structure_json.fields.filter(f => f.type === NPS_FIELD_TYPE)
    };
  }, [form]);

  // Calculate NPS data for each NPS field
  const npsDataMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateNPS>> = {};
    npsFields.forEach(field => {
      const responses = submissions
        .map(s => s.submission_data[field.id])
        .filter(v => v !== null && v !== undefined)
        .map(v => Number(v));
      map[field.id] = calculateNPS(responses);
    });
    return map;
  }, [npsFields, submissions]);

  const stats = useMemo(() => {
    if (!submissions.length) {
      return { total: 0, lastDate: null, avgPerDay: 0 };
    }

    const dates = submissions.map(s => new Date(s.submitted_at));
    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      total: submissions.length,
      lastDate,
      avgPerDay: (submissions.length / daysDiff).toFixed(1)
    };
  }, [submissions]);

  const handleExportToCSV = async () => {
    if (!form || submissions.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      const fields = form.structure_json.fields;
      const headers = ['Data de Submissão', 'Usuário', ...fields.map(f => f.label)];
      
      const csvContent = [
        headers.join(','),
        ...submissions.map(submission => {
          const row = [
            new Date(submission.submitted_at).toLocaleDateString('pt-BR'),
            submission.submitted_by?.full_name || 'Usuário não encontrado',
            ...fields.map(field => {
              const value = submission.submission_data[field.id];
              if (Array.isArray(value)) {
                return `"${value.join(', ')}"`;
              }
              return `"${value || ''}"`;
            })
          ];
          return row.join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.title}_respostas.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: "Arquivo exportado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (fieldType === 'date' && value) return new Date(value).toLocaleDateString('pt-BR');
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Carregando Dashboard...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!form) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Formulário não encontrado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Não foi possível carregar os dados do formulário.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{form.title}</DialogTitle>
              {form.description && (
                <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={form.is_published ? "default" : "secondary"}>
                {form.is_published ? "Publicado" : "Rascunho"}
              </Badge>
              <Button size="sm" onClick={handleExportToCSV} disabled={submissions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="resumo" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="graficos" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Gráficos</span>
            </TabsTrigger>
            <TabsTrigger value="abertas" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Abertas</span>
            </TabsTrigger>
            <TabsTrigger value="tabela" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Tabela</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* RESUMO TAB */}
            <TabsContent value="resumo" className="m-0 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.structure_json.fields.length} campos no formulário
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Última Resposta</CardTitle>
                    <Calendar className="h-5 w-5 text-chart-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {stats.lastDate ? formatDate(stats.lastDate) : 'Nenhuma'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média de {stats.avgPerDay} respostas/dia
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Campos Analisáveis</CardTitle>
                    <PieChartIcon className="h-5 w-5 text-chart-3" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{closedFields.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {openFields.length} campos de texto livre
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* NPS Score Cards - Prominent display */}
              {npsFields.length > 0 && submissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5" />
                    Net Promoter Score (NPS)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {npsFields.map(field => (
                      <NPSScoreCard
                        key={field.id}
                        fieldLabel={field.label}
                        data={npsDataMap[field.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Overview Charts */}
              {closedFields.length > 0 && submissions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {closedFields.slice(0, 4).map((field, index) => {
                    const data = aggregateFieldData(submissions, field);
                    return index % 2 === 0 ? (
                      <FieldBarChart 
                        key={field.id} 
                        fieldLabel={field.label} 
                        data={data}
                        colorIndex={index}
                      />
                    ) : (
                      <FieldPieChart 
                        key={field.id} 
                        fieldLabel={field.label} 
                        data={data}
                      />
                    );
                  })}
                </div>
              )}

              {submissions.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma resposta ainda</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Este formulário ainda não recebeu nenhuma resposta. Compartilhe o link ou QR Code para começar a coletar dados.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* GRÁFICOS TAB */}
            <TabsContent value="graficos" className="m-0 space-y-6">
              {closedFields.length === 0 && npsFields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sem campos fechados</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Este formulário não possui campos do tipo seleção, checkbox, NPS ou múltipla escolha para gerar gráficos.
                    </p>
                  </CardContent>
                </Card>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sem dados para gráficos</h3>
                    <p className="text-sm text-muted-foreground">
                      Aguardando respostas para gerar visualizações.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* NPS Section */}
                  {npsFields.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5" />
                        Net Promoter Score (NPS)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {npsFields.map(field => (
                          <NPSScoreCard
                            key={`nps-${field.id}`}
                            fieldLabel={field.label}
                            data={npsDataMap[field.id]}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bar Charts Section */}
                  {closedFields.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Gráficos de Barras
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {closedFields.map((field, index) => (
                          <FieldBarChart
                            key={`bar-${field.id}`}
                            fieldLabel={field.label}
                            data={aggregateFieldData(submissions, field)}
                            colorIndex={index}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pie Charts Section */}
                  {closedFields.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        Gráficos de Pizza
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {closedFields.map((field) => (
                          <FieldPieChart
                            key={`pie-${field.id}`}
                            fieldLabel={field.label}
                            data={aggregateFieldData(submissions, field)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* RESPOSTAS ABERTAS TAB */}
            <TabsContent value="abertas" className="m-0 space-y-6">
              {openFields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sem campos de texto</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Este formulário não possui campos de texto ou textarea para exibir respostas abertas.
                    </p>
                  </CardContent>
                </Card>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sem respostas</h3>
                    <p className="text-sm text-muted-foreground">
                      Aguardando respostas para exibir.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {openFields.map((field) => (
                    <OpenResponsesSection
                      key={field.id}
                      fieldLabel={field.label}
                      responses={getOpenResponses(submissions, field)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TABELA TAB */}
            <TabsContent value="tabela" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    Todas as Respostas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma resposta encontrada</h3>
                      <p className="text-muted-foreground">
                        Este formulário ainda não recebeu nenhuma resposta.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Data</TableHead>
                            <TableHead className="whitespace-nowrap">Usuário</TableHead>
                            {form.structure_json.fields.map((field) => (
                              <TableHead key={field.id} className="whitespace-nowrap">
                                {field.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="whitespace-nowrap">
                                {formatDate(submission.submitted_at)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {submission.submitted_by?.full_name || 'Não identificado'}
                              </TableCell>
                              {form.structure_json.fields.map((field) => (
                                <TableCell key={field.id} className="max-w-[200px] truncate">
                                  {formatValue(submission.submission_data[field.id], field.type)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
