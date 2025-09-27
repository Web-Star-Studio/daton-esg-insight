import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Trash2, Calculator, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { errorHandler } from "@/utils/errorHandler";
import { EmissionSource } from "@/services/emissions";

interface ActivityDataRecord {
  id: string;
  period_start_date: string;
  period_end_date: string;
  quantity: number;
  unit: string;
  source_document?: string;
  created_at: string;
}

interface ActivityDataListProps {
  source: EmissionSource;
  onDataChange?: () => void;
  onEditData?: (data: ActivityDataRecord) => void;
}

export function ActivityDataList({ source, onDataChange, onEditData }: ActivityDataListProps) {
  const [activityData, setActivityData] = useState<ActivityDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActivityData();
  }, [source.id]);

  const loadActivityData = async () => {
    await errorHandler.withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('activity_data')
          .select('*')
          .eq('emission_source_id', source.id)
          .order('period_start_date', { ascending: false });

        if (error) throw error;

        setActivityData(data || []);
        setIsLoading(false);
      },
      {
        component: 'ActivityDataList',
        function: 'loadActivityData',
        additionalData: { sourceId: source.id }
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este dado de atividade?')) {
      return;
    }

    await errorHandler.withErrorHandling(
      async () => {
        const { error } = await supabase
          .from('activity_data')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Sucesso", 
          description: "Dado de atividade excluído com sucesso!",
        });

        loadActivityData();
        onDataChange?.();
      },
      {
        component: 'ActivityDataList',
        function: 'handleDelete',
        additionalData: { activityDataId: id, sourceId: source.id }
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  if (activityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dados de Atividade</CardTitle>
          <CardDescription>Nenhum dado de atividade encontrado para esta fonte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Adicione dados de atividade para calcular as emissões.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Dados de Atividade ({activityData.length})</h3>
      </div>

      <div className="space-y-3">
        {activityData.map((data) => (
          <Card key={data.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(data.period_start_date), "dd/MM/yyyy", { locale: ptBR })} - {" "}
                      {format(new Date(data.period_end_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="font-mono">
                      {data.quantity.toLocaleString('pt-BR')} {data.unit}
                    </Badge>

                    {data.source_document && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        {data.source_document}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Adicionado em {format(new Date(data.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditData?.(data)}
                    className="text-primary hover:text-primary"
                    title="Editar dados"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(data.id)}
                    className="text-destructive hover:text-destructive"
                    title="Excluir dados"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}