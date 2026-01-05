import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { mailingService, MailingList } from '@/services/mailingService';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  description: string;
  formIds: string[];
}

interface MailingListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  mailingList?: MailingList | null;
}

export function MailingListModal({
  open,
  onOpenChange,
  mode,
  mailingList
}: MailingListModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      formIds: []
    }
  });

  const selectedFormIds = watch('formIds');

  const { data: forms = [], error: formsError } = useQuery({
    queryKey: ['mailing-forms'],
    queryFn: () => mailingService.getForms(),
    enabled: open
  });

  useEffect(() => {
    if (formsError) {
      toast({ 
        title: 'Erro ao carregar formulários', 
        description: formsError.message, 
        variant: 'destructive' 
      });
    }
  }, [formsError, toast]);

  const { data: listDetails } = useQuery({
    queryKey: ['mailing-list-details', mailingList?.id],
    queryFn: () => mailingService.getMailingList(mailingList!.id),
    enabled: open && mode === 'edit' && !!mailingList?.id
  });

  useEffect(() => {
    if (mode === 'edit' && listDetails) {
      reset({
        name: listDetails.name,
        description: listDetails.description || '',
        formIds: listDetails.forms?.map(f => f.id) || []
      });
    } else if (mode === 'create') {
      reset({ name: '', description: '', formIds: [] });
    }
  }, [mode, listDetails, reset, open]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => mailingService.createMailingList({
      name: data.name,
      description: data.description || undefined,
      formIds: data.formIds
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      toast({ title: 'Lista criada com sucesso' });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar lista', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => mailingService.updateMailingList(mailingList!.id, {
      name: data.name,
      description: data.description || undefined,
      formIds: data.formIds
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mailing-list-details'] });
      toast({ title: 'Lista atualizada com sucesso' });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar lista', description: error.message, variant: 'destructive' });
    }
  });

  const onSubmit = (data: FormData) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const toggleForm = (formId: string) => {
    const current = selectedFormIds || [];
    if (current.includes(formId)) {
      setValue('formIds', current.filter(id => id !== formId));
    } else {
      setValue('formIds', [...current, formId]);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Lista de Envio' : 'Editar Lista de Envio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Lista *</Label>
            <Input
              id="name"
              placeholder="Ex: Funcionários RH"
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição opcional da lista..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Formulários Vinculados</Label>
            <p className="text-xs text-muted-foreground">
              Selecione os formulários que podem ser enviados para esta lista
            </p>
            {forms.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-md">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum formulário publicado</p>
              </div>
            ) : (
              <ScrollArea className="h-40 border rounded-md p-2">
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleForm(form.id)}
                    >
                      <Checkbox
                        checked={selectedFormIds?.includes(form.id)}
                        onCheckedChange={() => toggleForm(form.id)}
                      />
                      <span className="text-sm">{form.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Criar Lista' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
