import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  FileSpreadsheet, 
  Mail, 
  Trash2,
  User,
  Building2,
  UserPlus
} from 'lucide-react';
import { mailingService, MailingList } from '@/services/mailingService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddContactModal } from './AddContactModal';

interface MailingListDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailingListId?: string;
}

export function MailingListDetailsModal({
  open,
  onOpenChange,
  mailingListId
}: MailingListDetailsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addContactOpen, setAddContactOpen] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ['mailing-list-details', mailingListId],
    queryFn: () => mailingService.getMailingList(mailingListId!),
    enabled: open && !!mailingListId
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => mailingService.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailing-list-details'] });
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      toast({ title: 'Contato removido' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover contato', description: error.message, variant: 'destructive' });
    }
  });

  // Create a minimal MailingList object for the AddContactModal
  const mailingListForModal: MailingList | null = list ? {
    id: list.id,
    name: list.name,
    description: list.description,
    company_id: list.company_id,
    created_by_user_id: list.created_by_user_id,
    created_at: list.created_at,
    updated_at: list.updated_at
  } : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Detalhes da Lista
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : list ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div>
                <h2 className="text-xl font-semibold">{list.name}</h2>
                {list.description && (
                  <p className="text-muted-foreground mt-1">{list.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Criado em {format(new Date(list.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{list.contacts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Contatos</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{list.forms?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Formulários</p>
                  </div>
                </div>
              </div>

              {/* Linked Forms */}
              {list.forms && list.forms.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Formulários Vinculados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {list.forms.map((form) => (
                      <Badge key={form.id} variant="secondary">
                        {form.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contatos ({list.contacts?.length || 0})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddContactOpen(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                {list.contacts && list.contacts.length > 0 ? (
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-1">
                      {list.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{contact.email}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {contact.company_name && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Building2 className="h-3 w-3" />
                                    {contact.company_name}
                                  </span>
                                )}
                                {contact.name && (
                                  <span className="truncate">
                                    {contact.company_name && '• '}
                                    {contact.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={contact.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {contact.status === 'active' ? 'Ativo' : contact.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteContactMutation.mutate(contact.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum contato na lista</p>
                    <p className="text-sm">Importe contatos via CSV ou adicione manualmente</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AddContactModal
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        mailingList={mailingListForModal}
      />
    </>
  );
}
