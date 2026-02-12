import { useModuleSettings } from '@/hooks/useModuleSettings';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export function ModuleSettingsPanel() {
  const { settings, isLoading, updateModuleSetting } = useModuleSettings();
  const { toast } = useToast();

  const handleToggle = async (moduleKey: string, field: 'enabled_live' | 'enabled_demo', currentValue: boolean) => {
    try {
      await updateModuleSetting.mutateAsync({ moduleKey, field, value: !currentValue });
      toast({
        title: 'Módulo atualizado',
        description: `Configuração de "${moduleKey}" alterada com sucesso.`,
      });
    } catch {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar a configuração do módulo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings || settings.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">Nenhum módulo configurado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Módulo</TableHead>
          <TableHead>Chave</TableHead>
          <TableHead className="text-center">Live</TableHead>
          <TableHead className="text-center">Demo</TableHead>
          <TableHead>Última atualização</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {settings.map((mod) => (
          <TableRow key={mod.id}>
            <TableCell className="font-medium">{mod.module_name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {mod.module_key}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={mod.enabled_live}
                onCheckedChange={() => handleToggle(mod.module_key, 'enabled_live', mod.enabled_live)}
                disabled={updateModuleSetting.isPending}
              />
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={mod.enabled_demo}
                onCheckedChange={() => handleToggle(mod.module_key, 'enabled_demo', mod.enabled_demo)}
                disabled={updateModuleSetting.isPending}
              />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {mod.updated_at
                ? format(new Date(mod.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
