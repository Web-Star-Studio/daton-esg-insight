import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GRIReport, createGRIReport, initializeGRIReport, getGRIReports } from "@/services/griReports";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateGRIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: GRIReport) => void;
}

export function CreateGRIReportModal({ isOpen, onClose, onSubmit }: CreateGRIReportModalProps) {
  const [title, setTitle] = useState("Relatório de Sustentabilidade");
  const [year, setYear] = useState(new Date().getFullYear());
  const [griVersion, setGriVersion] = useState("2023");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<GRIReport | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const checkForDuplicateYear = async (selectedYear: number) => {
    if (!selectedYear) return;
    
    setIsCheckingDuplicates(true);
    try {
      const reports = await getGRIReports();
      const duplicate = reports.find(r => r.year === selectedYear);
      setExistingReport(duplicate || null);
    } catch (error) {
      console.error('Erro ao verificar relatórios existentes:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    checkForDuplicateYear(newYear);
  };

  const handleOpenExisting = () => {
    if (existingReport) {
      onSubmit(existingReport);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim do período de relatório");
      return;
    }

    if (existingReport) {
      const confirmed = window.confirm(
        `Já existe um relatório GRI para o ano ${year}. Deseja continuar criando um novo relatório?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    let createdReport: GRIReport | null = null;
    
    try {
      // Create the report
      createdReport = await createGRIReport({
        title,
        year,
        gri_standard_version: griVersion,
        reporting_period_start: format(startDate, 'yyyy-MM-dd'),
        reporting_period_end: format(endDate, 'yyyy-MM-dd'),
        status: 'Rascunho',
        completion_percentage: 0,
      });

      toast.success("Relatório GRI criado com sucesso!");
      
      // Try to initialize - but don't fail the creation if this fails
      try {
        await initializeGRIReport(createdReport.id);
        toast.success("Relatório inicializado com indicadores padrão!");
      } catch (initError) {
        console.error('Erro ao inicializar relatório:', initError);
        const errorMessage = initError instanceof Error ? initError.message : 'Erro desconhecido';
        console.log('Detalhes do erro de inicialização:', {
          error: initError,
          code: (initError as any)?.code,
          details: (initError as any)?.details,
          message: (initError as any)?.message
        });
        toast.warning("Relatório criado, mas houve erro na inicialização. Você pode adicionar indicadores manualmente.");
      }
      
      onSubmit(createdReport);
      
      // Reset form
      setTitle("Relatório de Sustentabilidade");
      setYear(new Date().getFullYear());
      setGriVersion("2023");
      setStartDate(undefined);
      setEndDate(undefined);
      setExistingReport(null);
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      console.log('Detalhes do erro:', {
        error,
        code: (error as any)?.code,
        details: (error as any)?.details,
        message: (error as any)?.message
      });
      
      let errorMessage = "Erro ao criar relatório. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = `Já existe um relatório para o ano ${year}. Tente um ano diferente ou edite o existente.`;
        } else if (error.message.includes('company_id')) {
          errorMessage = "Erro: empresa não identificada. Verifique seu perfil de usuário.";
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório GRI</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Relatório</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Relatório de Sustentabilidade 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano de Referência</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                min="2020"
                max="2030"
                required
                disabled={isCheckingDuplicates}
              />
              {isCheckingDuplicates && (
                <p className="text-xs text-muted-foreground">Verificando relatórios existentes...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gri-version">Versão GRI</Label>
              <Select value={griVersion} onValueChange={setGriVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">GRI Standards 2023</SelectItem>
                  <SelectItem value="2021">GRI Standards 2021</SelectItem>
                  <SelectItem value="2016">GRI Standards 2016</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {existingReport && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Já existe um relatório GRI para {year}: "{existingReport.title}". 
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal underline" 
                  onClick={handleOpenExisting}
                >
                  Abrir relatório existente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !startDate || !endDate}
            >
              {isSubmitting ? "Criando..." : "Criar Relatório"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}