import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getRegulatorySettings,
  updateRegulatorySettings,
} from "@/services/regulatoryDocuments";
import {
  getSgqSettings,
  updateSgqSettings,
} from "@/services/sgqIsoDocuments";
import { Settings, Save } from "lucide-react";

export const DocumentSettingsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Regulatory settings
  const [settingsValue, setSettingsValue] = useState("30");

  const { data: settings } = useQuery({
    queryKey: ["regulatory-documents", "settings"],
    queryFn: getRegulatorySettings,
  });

  useEffect(() => {
    if (settings?.default_expiring_days !== undefined) {
      setSettingsValue(String(settings.default_expiring_days));
    }
  }, [settings?.default_expiring_days]);

  const saveSettingsMutation = useMutation({
    mutationFn: (days: number) => updateRegulatorySettings(days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatory-documents"] });
      toast({ title: "Configuração salva com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    },
  });

  // SGQ settings
  const [sgqSettingsValue, setSgqSettingsValue] = useState("30");

  const { data: sgqSettings } = useQuery({
    queryKey: ["sgq-documents", "settings"],
    queryFn: getSgqSettings,
  });

  useEffect(() => {
    if (sgqSettings?.default_expiring_days !== undefined) {
      setSgqSettingsValue(String(sgqSettings.default_expiring_days));
    }
  }, [sgqSettings?.default_expiring_days]);

  const saveSgqSettingsMutation = useMutation({
    mutationFn: (days: number) => updateSgqSettings(days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      toast({ title: "Configuração SGQ salva com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configuração SGQ", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Regulatory Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Prazo Padrão — Documentos Regulatórios
          </CardTitle>
          <CardDescription>
            Define quantos dias antes do vencimento o status passa para "A Vencer"
            nos documentos regulatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Dias padrão</Label>
              <Input
                type="number"
                min={0}
                value={settingsValue}
                onChange={(e) => setSettingsValue(e.target.value)}
                placeholder={String(settings?.default_expiring_days ?? 30)}
                className="w-[140px]"
              />
            </div>
            <Button
              onClick={() => saveSettingsMutation.mutate(Number(settingsValue || 30))}
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar padrão
            </Button>
            <p className="text-sm text-muted-foreground">
              Atual: {settings?.default_expiring_days ?? 30} dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SGQ Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Prazo Padrão — Documentos SGQ/ISO
          </CardTitle>
          <CardDescription>
            Define quantos dias antes do vencimento o status passa para "A Vencer"
            nos documentos SGQ/ISO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Dias padrão</Label>
              <Input
                type="number"
                min={0}
                value={sgqSettingsValue}
                onChange={(e) => setSgqSettingsValue(e.target.value)}
                placeholder={String(sgqSettings?.default_expiring_days ?? 30)}
                className="w-[140px]"
              />
            </div>
            <Button
              onClick={() => saveSgqSettingsMutation.mutate(Number(sgqSettingsValue || 30))}
              disabled={saveSgqSettingsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar padrão
            </Button>
            <p className="text-sm text-muted-foreground">
              Atual: {sgqSettings?.default_expiring_days ?? 30} dias
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
