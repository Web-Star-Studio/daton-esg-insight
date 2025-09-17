import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GRIReport, createGRIReport, initializeGRIReport } from "@/services/griReports";
import { toast } from "sonner";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim do período de relatório");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the report
      const createdReport = await createGRIReport({
        title,
        year,
        gri_standard_version: griVersion,
        reporting_period_start: format(startDate, 'yyyy-MM-dd'),
        reporting_period_end: format(endDate, 'yyyy-MM-dd'),
        status: 'Rascunho',
        completion_percentage: 0,
      });

      // Initialize with mandatory indicators and default sections
      await initializeGRIReport(createdReport.id);
      
      toast.success("Relatório GRI criado com sucesso!");
      onSubmit(createdReport);
      
      // Reset form
      setTitle("Relatório de Sustentabilidade");
      setYear(new Date().getFullYear());
      setGriVersion("2023");
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast.error("Erro ao criar relatório. Tente novamente.");
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
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2030"
                required
              />
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