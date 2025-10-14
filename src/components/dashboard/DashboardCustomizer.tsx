import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export type WidgetType = 
  | "onboarding"
  | "tasks"
  | "goals"
  | "intelligence"
  | "alerts"
  | "predictive"
  | "emissions"
  | "compliance"
  | "risks"
  | "opportunities";

interface Widget {
  id: WidgetType;
  label: string;
  description: string;
}

const availableWidgets: Widget[] = [
  { id: "onboarding", label: "Onboarding", description: "Quick start guide" },
  { id: "tasks", label: "Tasks", description: "Recent and upcoming tasks" },
  { id: "goals", label: "Goals", description: "Progress on active goals" },
  { id: "intelligence", label: "Intelligence Hub", description: "AI-powered insights" },
  { id: "alerts", label: "Intelligent Alerts", description: "Active alerts and notifications" },
  { id: "predictive", label: "Predictive Analytics", description: "Forecasts and risk scores" },
  { id: "emissions", label: "Emissions Summary", description: "Carbon footprint overview" },
  { id: "compliance", label: "Compliance Status", description: "Regulatory compliance tracking" },
  { id: "risks", label: "Risk Matrix", description: "Risk assessment dashboard" },
  { id: "opportunities", label: "Opportunities", description: "Strategic opportunities" },
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgets: WidgetType[];
  onWidgetsChange: (widgets: WidgetType[]) => void;
  userId: string;
}

export function DashboardCustomizer({ 
  open, 
  onOpenChange, 
  currentWidgets, 
  onWidgetsChange,
  userId 
}: DashboardCustomizerProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>(currentWidgets);
  const [saving, setSaving] = useState(false);

  const handleToggleWidget = (widgetId: WidgetType) => {
    setSelectedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dashboard_preferences: {
            layout: 'default',
            widgets: selectedWidgets
          }
        })
        .eq('id', userId);

      if (error) throw error;

      onWidgetsChange(selectedWidgets);
      toast.success("Dashboard customizado com sucesso");
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving dashboard preferences', error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Selecione os widgets que deseja exibir no seu dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {availableWidgets.map((widget) => (
            <div
              key={widget.id}
              className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <Checkbox
                id={widget.id}
                checked={selectedWidgets.includes(widget.id)}
                onCheckedChange={() => handleToggleWidget(widget.id)}
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor={widget.id}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {widget.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {widget.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
