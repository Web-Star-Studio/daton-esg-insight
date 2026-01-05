import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { mailingService, MailingList } from '@/services/mailingService';
import { useToast } from '@/hooks/use-toast';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailingList: MailingList | null;
}

interface FormData {
  email: string;
  name: string;
  companyName: string;
}

export function AddContactModal({
  open,
  onOpenChange,
  mailingList
}: AddContactModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
      name: '',
      companyName: ''
    }
  });

  const addMutation = useMutation({
    mutationFn: (data: FormData) => mailingService.addContact(mailingList!.id, {
      email: data.email,
      name: data.name || undefined,
      companyName: data.companyName || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mailing-list-details'] });
      toast({ title: 'Contato adicionado com sucesso!' });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar contato', description: error.message, variant: 'destructive' });
    }
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    addMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Contato
          </DialogTitle>
          {mailingList && (
            <p className="text-sm text-muted-foreground">
              Lista: <span className="font-medium">{mailingList.name}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              placeholder="Ex: Tech Solutions Ltda"
              {...register('companyName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Contato</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              {...register('name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Ex: joao@empresa.com"
              {...register('email', { 
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
