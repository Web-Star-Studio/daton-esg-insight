import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { carbonCompensationService, type ConservationActivity, type ConservationActivityType } from "@/services/carbonCompensation";
import { CalendarIcon, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConservationActivityModalProps {
  open: boolean;
  onClose: () => void;
  onActivityCreated: () => void;
  activity?: ConservationActivity | null;
}

export function ConservationActivityModal({ 
  open, 
  onClose, 
  onActivityCreated, 
  activity 
}: ConservationActivityModalProps) {
  const [activityTypes, setActivityTypes] = useState<ConservationActivityType[]>([]);
  const [formData, setFormData] = useState({
    activity_type: "",
    title: "",
    description: "",
    location: "",
    area_size: 0,
    start_date: new Date(),
    end_date: undefined as Date | undefined,
    status: "Planejada" as 'Planejada' | 'Em Andamento' | 'Concluída' | 'Suspensa',
    investment_amount: 0,
    carbon_impact_estimate: 0,
    methodology: "",
    monitoring_plan: "",
  });
  const [loading, setLoading] = useState(false);
  const [calculatingImpact, setCalculatingImpact] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadActivityTypes();
      if (activity) {
        setFormData({
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description || "",
          location: activity.location || "",
          area_size: activity.area_size || 0,
          start_date: new Date(activity.start_date),
          end_date: activity.end_date ? new Date(activity.end_date) : undefined,
          status: activity.status as 'Planejada' | 'Em Andamento' | 'Concluída' | 'Suspensa',
          investment_amount: activity.investment_amount,
          carbon_impact_estimate: activity.carbon_impact_estimate,
          methodology: activity.methodology || "",
          monitoring_plan: activity.monitoring_plan || "",
        });
      } else {
        resetForm();
      }
    }
  }, [open, activity]);

  const loadActivityTypes = async () => {
    try {
      const types = await carbonCompensationService.getActivityTypes();
      setActivityTypes(types);
    } catch (error) {
      console.error('Erro ao carregar tipos de atividade:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      activity_type: "",
      title: "",
      description: "",
      location: "",
      area_size: 0,
      start_date: new Date(),
      end_date: undefined,
      status: "Planejada" as 'Planejada' | 'Em Andamento' | 'Concluída' | 'Suspensa',
      investment_amount: 0,
      carbon_impact_estimate: 0,
      methodology: "",
      monitoring_plan: "",
    });
  };

  const calculateCarbonImpact = async () => {
    if (!formData.activity_type || !formData.area_size) {
      toast({
        title: "Aviso",
        description: "Selecione o tipo de atividade e informe a área para calcular o impacto",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculatingImpact(true);
      const years = formData.end_date && formData.start_date 
        ? Math.ceil((formData.end_date.getTime() - formData.start_date.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 10; // Default 10 years

      const impact = await carbonCompensationService.calculateCarbonImpact(
        formData.activity_type,
        formData.area_size,
        years
      );

      setFormData(prev => ({ ...prev, carbon_impact_estimate: impact }));
      
      toast({
        title: "Impacto Calculado",
        description: `Estimativa: ${impact.toFixed(2)} tCO₂e em ${years} anos`,
      });
    } catch (error) {
      console.error('Erro ao calcular impacto:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular impacto de carbono",
        variant: "destructive",
      });
    } finally {
      setCalculatingImpact(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação e sanitização
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedLocation = formData.location.trim();
    const trimmedMethodology = formData.methodology.trim();
    const trimmedMonitoringPlan = formData.monitoring_plan.trim();

    if (!trimmedTitle || !formData.activity_type || !formData.start_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (título, tipo de atividade e data de início).",
        variant: "destructive",
      });
      return;
    }

    if (trimmedTitle.length > 255) {
      toast({
        title: "Título muito longo",
        description: "O título deve ter no máximo 255 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (formData.area_size < 0) {
      toast({
        title: "Área inválida",
        description: "A área deve ser um valor positivo.",
        variant: "destructive",
      });
      return;
    }

    if (formData.investment_amount < 0) {
      toast({
        title: "Investimento inválido",
        description: "O investimento deve ser um valor positivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const sanitizedData = {
        ...formData,
        title: trimmedTitle,
        description: trimmedDescription,
        location: trimmedLocation,
        methodology: trimmedMethodology,
        monitoring_plan: trimmedMonitoringPlan,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
      };

      if (activity) {
        await carbonCompensationService.updateActivity(activity.id, sanitizedData);
        toast({
          title: "Sucesso",
          description: "Atividade atualizada com sucesso!",
        });
      } else {
        await carbonCompensationService.createActivity(sanitizedData);
        toast({
          title: "Sucesso",
          description: "Atividade de conservação criada com sucesso!",
        });
      }

      onActivityCreated();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      const errorMessage = error?.message || "Erro ao salvar atividade de conservação";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = activityTypes.find(t => t.name === formData.activity_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activity ? 'Editar' : 'Nova'} Atividade de Conservação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_type">Tipo de Atividade *</Label>
              <Select 
                value={formData.activity_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {type.carbon_factor} tCO₂e/{type.unit}/ano
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'Planejada' | 'Em Andamento' | 'Concluída' | 'Suspensa' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejada">Planejada</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Suspensa">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título da Atividade *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Reflorestamento da Área Norte"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os objetivos e escopo da atividade..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Fazenda São João, MG"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_size">
                Área ({selectedType?.unit || 'hectares'})
              </Label>
              <div className="flex gap-2">
                <Input
                  id="area_size"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.area_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, area_size: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={calculateCarbonImpact}
                  disabled={calculatingImpact}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || new Date() }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investment_amount">Investimento (R$)</Label>
              <Input
                id="investment_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.investment_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, investment_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbon_impact_estimate">Impacto Estimado (tCO₂e)</Label>
              <Input
                id="carbon_impact_estimate"
                type="number"
                step="0.01"
                min="0"
                value={formData.carbon_impact_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, carbon_impact_estimate: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Metodologia</Label>
            <Input
              id="methodology"
              value={formData.methodology}
              onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
              placeholder={selectedType?.methodology_reference || "Ex: REDD+, CDM-AR"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monitoring_plan">Plano de Monitoramento</Label>
            <Textarea
              id="monitoring_plan"
              value={formData.monitoring_plan}
              onChange={(e) => setFormData(prev => ({ ...prev, monitoring_plan: e.target.value }))}
              placeholder="Descreva como será feito o monitoramento da atividade..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : activity ? "Atualizar" : "Criar Atividade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}