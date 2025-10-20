import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIntegratedReport } from "@/hooks/useIntegratedReport";
import { toast } from "sonner";

interface CreateIntegratedReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (reportId: string) => void;
}

interface ReportConfig {
  title: string;
  type: 'Anual' | 'Semestral' | 'Trimestral';
  periodStart: Date | undefined;
  periodEnd: Date | undefined;
  framework?: string;
  sections: string[];
  includeAI: boolean;
}

const DEFAULT_SECTIONS = [
  { id: 'executive_summary', label: 'Sumário Executivo', default: true },
  { id: 'environmental', label: 'Performance Ambiental', default: true },
  { id: 'social', label: 'Performance Social', default: true },
  { id: 'governance', label: 'Governança', default: true },
  { id: 'goals_progress', label: 'Metas ESG e Progresso', default: true },
  { id: 'materiality', label: 'Análise de Materialidade', default: false },
  { id: 'kpis', label: 'Indicadores de Performance (KPIs)', default: true },
];

export function CreateIntegratedReportDialog({ open, onOpenChange, onSuccess }: CreateIntegratedReportDialogProps) {
  const [step, setStep] = useState(1);
  const { createReport, isCreating, currentUser } = useIntegratedReport();
  
  const [config, setConfig] = useState<ReportConfig>({
    title: '',
    type: 'Anual',
    periodStart: undefined,
    periodEnd: undefined,
    framework: 'GRI',
    sections: DEFAULT_SECTIONS.filter(s => s.default).map(s => s.id),
    includeAI: true,
  });

  const handleCreate = async () => {
    if (!config.title || !config.periodStart || !config.periodEnd) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (config.periodEnd < config.periodStart) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Get company_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser)
        .single();

      if (!profile?.company_id) {
        toast.error('Empresa não encontrada');
        return;
      }

      const reportData = {
        report_title: config.title,
        report_type: config.type,
        reporting_period_start: config.periodStart.toISOString(),
        reporting_period_end: config.periodEnd.toISOString(),
        framework: config.framework,
        content: {
          sections_to_include: config.sections,
          include_ai_insights: config.includeAI,
        },
        status: 'Rascunho',
        created_by_user_id: currentUser,
        company_id: profile.company_id,
      };

      createReport(reportData as any, {
        onSuccess: (data: any) => {
          onOpenChange(false);
          onSuccess?.(data.id);
          setStep(1);
          setConfig({
            title: '',
            type: 'Anual',
            periodStart: undefined,
            periodEnd: undefined,
            framework: 'GRI',
            sections: DEFAULT_SECTIONS.filter(s => s.default).map(s => s.id),
            includeAI: true,
          });
        },
      });
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const toggleSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Relatório ESG Integrado</DialogTitle>
          <DialogDescription>
            Etapa {step} de 3 - {step === 1 ? 'Informações Básicas' : step === 2 ? 'Escopo do Relatório' : 'Revisão'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Relatório *</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Relatório ESG Anual 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Relatório *</Label>
                <Select value={config.type} onValueChange={(value: any) => setConfig(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anual">Anual</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Framework (opcional)</Label>
                <Select value={config.framework} onValueChange={(value) => setConfig(prev => ({ ...prev, framework: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRI">GRI Standards</SelectItem>
                    <SelectItem value="SASB">SASB</SelectItem>
                    <SelectItem value="TCFD">TCFD</SelectItem>
                    <SelectItem value="IR">Integrated Reporting</SelectItem>
                    <SelectItem value="Custom">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !config.periodStart && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.periodStart ? format(config.periodStart, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={config.periodStart}
                      onSelect={(date) => setConfig(prev => ({ ...prev, periodStart: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Fim *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !config.periodEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.periodEnd ? format(config.periodEnd, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={config.periodEnd}
                      onSelect={(date) => setConfig(prev => ({ ...prev, periodEnd: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Scope */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Seções a Incluir</Label>
              <p className="text-sm text-muted-foreground mb-3">Selecione as seções que deseja incluir no relatório</p>
              
              <div className="space-y-2">
                {DEFAULT_SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.id}
                      checked={config.sections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Label htmlFor={section.id} className="cursor-pointer font-normal">
                      {section.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Insights de IA
                </CardTitle>
                <CardDescription>
                  Incluir análises e recomendações geradas por inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAI"
                    checked={config.includeAI}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeAI: checked as boolean }))}
                  />
                  <Label htmlFor="includeAI" className="cursor-pointer font-normal">
                    Ativar análises de IA
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revisão das Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{config.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <p className="font-medium">{config.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Framework</Label>
                    <p className="font-medium">{config.framework}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Período</Label>
                    <p className="font-medium">
                      {config.periodStart && format(config.periodStart, "dd/MM/yyyy", { locale: ptBR })}
                      {' - '}
                      {config.periodEnd && format(config.periodEnd, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Seções ({config.sections.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {config.sections.map(sectionId => {
                      const section = DEFAULT_SECTIONS.find(s => s.id === sectionId);
                      return section ? (
                        <span key={sectionId} className="text-xs bg-secondary px-2 py-1 rounded">
                          {section.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">IA</Label>
                  <p className="font-medium">{config.includeAI ? 'Ativada' : 'Desativada'}</p>
                </div>
              </CardContent>
            </Card>

            {config.sections.length === 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">Você deve selecionar pelo menos uma seção</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isCreating}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || config.sections.length === 0}>
              {isCreating ? (
                <>
                  <FileText className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Relatório
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Note: Add this import at the top of the file
import { supabase } from "@/integrations/supabase/client";
