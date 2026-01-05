import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  Plus, 
  Search, 
  Users, 
  FileSpreadsheet, 
  Send,
  MoreHorizontal,
  Trash2,
  Edit,
  Upload,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { mailingService, MailingList } from '@/services/mailingService';
import { MailingListModal } from '@/components/mailing/MailingListModal';
import { ImportContactsModal } from '@/components/mailing/ImportContactsModal';
import { MailingListDetailsModal } from '@/components/mailing/MailingListDetailsModal';
import { SendCampaignModal } from '@/components/mailing/SendCampaignModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ListasDeEnvio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  const { data: mailingLists = [], isLoading } = useQuery({
    queryKey: ['mailing-lists'],
    queryFn: () => mailingService.getMailingLists()
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => mailingService.deleteMailingList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      toast({ title: 'Lista excluída com sucesso' });
      setDeleteDialogOpen(false);
      setListToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir lista', description: error.message, variant: 'destructive' });
    }
  });

  const filteredLists = mailingLists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (list: MailingList) => {
    setSelectedList(list);
    setIsEditModalOpen(true);
  };

  const handleImport = (list: MailingList) => {
    setSelectedList(list);
    setIsImportModalOpen(true);
  };

  const handleViewDetails = (list: MailingList) => {
    setSelectedList(list);
    setIsDetailsModalOpen(true);
  };

  const handleSendCampaign = (list: MailingList) => {
    setSelectedList(list);
    setIsCampaignModalOpen(true);
  };

  const handleDelete = (listId: string) => {
    setListToDelete(listId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Listas de Envio
            </h1>
            <p className="text-muted-foreground">
              Gerencie listas de email para envio de formulários
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Lista
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar listas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lists Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLists.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhuma lista encontrada</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Tente uma busca diferente' : 'Crie sua primeira lista de envio'}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Lista
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLists.map((list) => (
              <Card key={list.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{list.name}</CardTitle>
                      {list.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {list.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(list)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(list)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleImport(list)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Contatos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendCampaign(list)}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Campanha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(list.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{list.contact_count || 0} contatos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{list.form_count || 0} formulários</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleImport(list)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Importar
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleSendCampaign(list)}
                      disabled={(list.contact_count || 0) === 0}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Criado em {format(new Date(list.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <MailingListModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      <MailingListModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        mode="edit"
        mailingList={selectedList}
      />

      <ImportContactsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        mailingList={selectedList}
      />

      <MailingListDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        mailingListId={selectedList?.id}
      />

      <SendCampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setIsCampaignModalOpen}
        mailingList={selectedList}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lista de envio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os contatos e histórico de campanhas serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listToDelete && deleteMutation.mutate(listToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
