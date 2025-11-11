import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function AIProcessingSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-processing-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { data: company, error } = await supabase
        .from('companies')
        .select('auto_ai_processing')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      return company;
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (autoProcessing: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { error } = await supabase
        .from('companies')
        .update({ auto_ai_processing: autoProcessing })
        .eq('id', profile.company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-processing-settings'] });
      toast.success('Configurações atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Erro ao atualizar configurações');
    }
  });

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    try {
      await updateSettings.mutateAsync(checked);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Processamento Automático de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Processamento Automático de IA
        </CardTitle>
        <CardDescription>
          Configure quando a IA deve processar documentos automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-1 flex-1 pr-4">
            <Label htmlFor="auto-processing" className="text-base font-medium cursor-pointer">
              Processar automaticamente após upload
            </Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, documentos serão analisados pela IA imediatamente após o upload
            </p>
          </div>
          <Switch
            id="auto-processing"
            checked={settings?.auto_ai_processing || false}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>

        {/* Status Info */}
        {settings?.auto_ai_processing ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              <strong>Processamento automático ativado</strong>
              <br />
              Todos os novos documentos serão processados automaticamente pela IA após o upload.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Processamento manual</strong>
              <br />
              Você precisará clicar em "Analisar" para processar documentos com IA.
            </AlertDescription>
          </Alert>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recursos incluídos no processamento
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Extração inteligente de dados estruturados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Análise de confiança e validação de campos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Reconciliação de dados com aprovação manual</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Histórico completo de auditoria</span>
            </li>
          </ul>
        </div>

        {/* Save button (optional - already auto-saves) */}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Salvando configurações...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
