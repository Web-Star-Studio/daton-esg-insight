import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { carbonCompensationService, type ConservationActivity } from "@/services/carbonCompensation";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityMonitoringModalProps {
  open: boolean;
  onClose: () => void;
  onMonitoringCreated: () => void;
  activity: ConservationActivity;
}

export function ActivityMonitoringModal({ 
  open, 
  onClose, 
  onMonitoringCreated, 
  activity 
}: ActivityMonitoringModalProps) {
  const [formData, setFormData] = useState({
    monitoring_date: new Date(),
    progress_percentage: 0,
    carbon_sequestered: 0,
    area_completed: 0,
    notes: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      monitoring_date: new Date(),
      progress_percentage: 0,
      carbon_sequestered: 0,
      area_completed: 0,
      notes: "",
    });
    setEvidenceFiles([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.monitoring_date) {
      toast({
        title: "Erro",
        description: "Data de monitoramento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // TODO: Upload files to storage and get URLs
      const evidenceUrls: string[] = [];

      const data = {
        activity_id: activity.id,
        monitoring_date: formData.monitoring_date.toISOString().split('T')[0],
        progress_percentage: formData.progress_percentage,
        carbon_sequestered: formData.carbon_sequestered,
        area_completed: formData.area_completed,
        notes: formData.notes.trim() || undefined,
        evidence_files: evidenceUrls,
      };

      await carbonCompensationService.createMonitoring(data);
      
      toast({
        title: "Sucesso",
        description: "Registro de monitoramento criado com sucesso!",
      });

      onMonitoringCreated();
      onClose();
    } catch (error) {
      console.error('Erro ao criar monitoramento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar registro de monitoramento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Monitoramento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Atividade: {activity.title}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Data do Monitoramento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.monitoring_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.monitoring_date 
                    ? format(formData.monitoring_date, "PPP", { locale: ptBR }) 
                    : "Selecione a data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.monitoring_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, monitoring_date: date || new Date() }))}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progress_percentage">Progresso Geral (%)</Label>
              <Input
                id="progress_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.progress_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: parseFloat(e.target.value) || 0 }))}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbon_sequestered">Carbono Sequestrado (tCO₂e)</Label>
              <Input
                id="carbon_sequestered"
                type="number"
                min="0"
                step="0.01"
                value={formData.carbon_sequestered}
                onChange={(e) => setFormData(prev => ({ ...prev, carbon_sequestered: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_completed">
              Área Completada ({activity.area_size ? `de ${activity.area_size} ha` : 'hectares'})
            </Label>
            <Input
              id="area_completed"
              type="number"
              min="0"
              max={activity.area_size || undefined}
              step="0.01"
              value={formData.area_completed}
              onChange={(e) => setFormData(prev => ({ ...prev, area_completed: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações e Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Descreva o progresso, observações importantes, dificuldades encontradas..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Evidências (Fotos, Documentos)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <input
                type="file"
                id="evidence-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="evidence-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Clique para adicionar fotos ou documentos
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Suporta: JPG, PNG, PDF, DOC
                </span>
              </label>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Registrar Monitoramento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}