import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getComments, addComment, deleteComment } from '@/services/licenseObservations';

interface CommentThreadProps {
  targetId: string;
  targetType: 'alert' | 'observation';
}

export function CommentThread({ targetId, targetType }: CommentThreadProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => getComments(targetId, targetType)
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => addComment(targetId, targetType, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      setNewComment('');
      toast.success('Comentário adicionado');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      toast.success('Comentário removido');
    },
    onError: () => {
      toast.error('Erro ao remover comentário');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addMutation.mutate(newComment);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">
                      {comment.user?.full_name || 'Usuário'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Comentar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
