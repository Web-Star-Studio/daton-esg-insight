import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ReportConfig {
  templateId: string;
  dateRange: DateRange | undefined;
  outputFormat: 'pdf' | 'excel' | 'both';
  sections: string[];
  detailLevel: number;
  includeAI: boolean;
}

interface ReportGeneratorConfigurationProps {
  onGenerate: (config: ReportConfig) => void;
  isGenerating?: boolean;
}

const AVAILABLE_SECTIONS = [
  { id: 'executive_summary', label: 'Sumário Executivo', default: true },
  { id: 'metrics', label: 'Métricas e KPIs', default: true },
  { id: 'charts', label: 'Gráficos e Visualizações', default: true },
  { id: 'trends', label: 'Análise de Tendências', default: false },
  { id: 'benchmarking', label: 'Benchmarking Setorial', default: false },
  { id: 'recommendations', label: 'Recomendações', default: true },
  { id: 'appendix', label: 'Anexos e Dados Brutos', default: false },
];

export function ReportGeneratorConfiguration({ onGenerate, isGenerating }: ReportGeneratorConfigurationProps) {
  const [templateId, setTemplateId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'excel' | 'both'>('pdf');
  const [sections, setSections] = useState<string[]>(
    AVAILABLE_SECTIONS.filter(s => s.default).map(s => s.id)
  );
  const [detailLevel, setDetailLevel] = useState([50]);
  const [includeAI, setIncludeAI] = useState(true);

  const handleSectionToggle = (sectionId: string) => {
    setSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerate = () => {
    if (!templateId || !dateRange) return;

    onGenerate({
      templateId,
      dateRange,
      outputFormat,
      sections,
      detailLevel: detailLevel[0],
      includeAI,
    });
  };

  const isValid = templateId && dateRange?.from && dateRange?.to;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Configurar Relatório
        </CardTitle>
        <CardDescription>
          Configure os parâmetros do seu relatório inteligente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Template do Relatório</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="esg-executive-ai">🤖 ESG Executivo com IA</SelectItem>
              <SelectItem value="quality-predictive">📊 Análise Preditiva de Qualidade</SelectItem>
              <SelectItem value="emissions-smart">🌱 Inventário GEE Inteligente</SelectItem>
              <SelectItem value="governance-dashboard">🏛️ Dashboard de Governança</SelectItem>
              <SelectItem value="compliance-smart">⚖️ Monitor de Compliance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Período dos Dados</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  "Selecione o período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Formato de Saída</Label>
          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'pdf' | 'excel' | 'both')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF apenas</SelectItem>
              <SelectItem value="excel">Excel apenas</SelectItem>
              <SelectItem value="both">PDF + Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sections Selection */}
        <div className="space-y-2">
          <Label>Seções a Incluir</Label>
          <div className="space-y-2 border rounded-md p-4">
            {AVAILABLE_SECTIONS.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={section.id}
                  checked={sections.includes(section.id)}
                  onCheckedChange={() => handleSectionToggle(section.id)}
                />
                <Label
                  htmlFor={section.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {section.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Level */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Nível de Detalhe</Label>
            <span className="text-sm text-muted-foreground">
              {detailLevel[0] < 30 ? 'Sumário' : detailLevel[0] < 70 ? 'Padrão' : 'Detalhado'}
            </span>
          </div>
          <Slider
            value={detailLevel}
            onValueChange={setDetailLevel}
            min={0}
            max={100}
            step={10}
            className="w-full"
          />
        </div>

        {/* AI Enhancement */}
        <div className="flex items-center justify-between space-x-2 border rounded-md p-4">
          <div className="space-y-0.5">
            <Label htmlFor="ai-insights" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Insights de IA
            </Label>
            <p className="text-sm text-muted-foreground">
              Incluir análises e recomendações geradas por inteligência artificial
            </p>
          </div>
          <Switch
            id="ai-insights"
            checked={includeAI}
            onCheckedChange={setIncludeAI}
          />
        </div>

        {/* Preview */}
        {isValid && (
          <div className="border rounded-md p-4 bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Preview da Configuração
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {sections.length} seções selecionadas</p>
              <p>• Formato: {outputFormat === 'both' ? 'PDF + Excel' : outputFormat.toUpperCase()}</p>
              <p>• Insights de IA: {includeAI ? 'Sim' : 'Não'}</p>
              <p>• Tempo estimado: {includeAI ? '8-12' : '3-5'} minutos</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!isValid || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Gerando Relatório...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Gerar Relatório
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}