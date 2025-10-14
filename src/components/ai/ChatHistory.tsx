import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Trash2, Edit2, Check, X, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface ChatHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Methods and state passed from parent to avoid mounting a second chat hook
  listConversations: () => Promise<any[]>;
  openConversation: (convId: string) => Promise<void>;
  renameConversation: (convId: string, newTitle: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  startNewConversation: () => Promise<void>;
  conversationId: string | null;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export function ChatHistory({ open, onOpenChange, listConversations, openConversation, renameConversation, deleteConversation, startNewConversation, conversationId }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  // Load conversations when drawer opens
  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    const data = await listConversations();
    setConversations(data);
  };

  const handleOpen = async (convId: string) => {
    await openConversation(convId);
    onOpenChange(false);
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (convId: string) => {
    if (editTitle.trim()) {
      await renameConversation(convId, editTitle.trim());
      await loadConversations();
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteConversation(deleteConfirmId);
      await loadConversations();
      setDeleteConfirmId(null);
    }
  };

  const handleNewConversation = async () => {
    await startNewConversation();
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Histórico de Conversas
            </SheetTitle>
            <SheetDescription>
              Suas conversas anteriores com o Assistente IA
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button 
              onClick={handleNewConversation} 
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-2 pr-4">
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm mt-2">Inicie uma nova conversa para começar</p>
                  </div>
                )}

                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative rounded-lg border p-4 transition-all hover:border-primary ${
                      conv.id === conversationId ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(conv.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleSaveEdit(conv.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpen(conv.id)}
                          className="text-left w-full"
                        >
                          <h4 className="font-medium mb-1 line-clamp-1">
                            {conv.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </button>

                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(conv)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => setDeleteConfirmId(conv.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conversa e todas as suas mensagens serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}