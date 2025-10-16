import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createGRIReport, initializeGRIReport } from "@/services/griReports";
import { toast } from "@/hooks/use-toast";

interface CreateGRIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: any) => void;
}

export const CreateGRIReportModal: React.FC<CreateGRIReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("Relatório de Sustentabilidade");
  const [year, setYear] = useState(new Date().getFullYear());
  const [griVersion, setGriVersion] = useState("GRI Standards");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !year || !startDate || !endDate || !griVersion) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (startDate >= endDate) {
      toast({
        title: "Erro",
        description: "A data de início deve ser anterior à data de fim",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        title,
        year,
        gri_standard_version: griVersion,
        reporting_period_start: format(startDate, 'yyyy-MM-dd'),
        reporting_period_end: format(endDate, 'yyyy-MM-dd'),
      };

      const newReport = await createGRIReport(reportData);

      if (newReport?.id) {
        await initializeGRIReport(newReport.id);

        toast({
          title: "Sucesso",
          description: "Relatório GRI criado com sucesso!",
        });

        onSubmit(newReport);
        onClose();
        
        // Reset form
        setTitle("");
        setYear(new Date().getFullYear());
        setStartDate(undefined);
        setEndDate(undefined);
        setGriVersion("GRI Standards");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar relatório GRI. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório GRI</DialogTitle>
          <DialogDescription>
            Crie um novo relatório de sustentabilidade seguindo os padrões GRI. Preencha as informações básicas para começar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Relatório *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Relatório de Sustentabilidade 2024"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano do Relatório *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gri_version">Versão GRI *</Label>
                <Select value={griVersion} onValueChange={setGriVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a versão GRI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRI Standards">GRI Standards</SelectItem>
                    <SelectItem value="GRI Standards 2021">GRI Standards 2021</SelectItem>
                    <SelectItem value="GRI G4">GRI G4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Período de Reporte *</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
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
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
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
                  <Label htmlFor="end_date">Data de Fim</Label>
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
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title || !year || !startDate || !endDate || !griVersion}
            >
              {isSubmitting ? "Criando..." : "Criar Relatório"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};