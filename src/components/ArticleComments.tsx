import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, User, Clock, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { qualityManagementService } from "@/services/qualityManagement";

interface ArticleComment {
  id: string;
  comment_text: string;
  comment_type: string;
  author_user_id: string;
  created_at: string;
  is_resolved: boolean;
  parent_comment_id?: string;
}

interface ArticleCommentsProps {
  articleId: string;
}

const COMMENT_TYPES = [
  { value: "comment", label: "Comentário", icon: MessageSquare, color: "bg-blue-100 text-blue-800" },
  { value: "suggestion", label: "Sugestão", icon: Lightbulb, color: "bg-yellow-100 text-yellow-800" },
  { value: "approval_request", label: "Solicitação de Aprovação", icon: AlertCircle, color: "bg-orange-100 text-orange-800" }
];

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["article-comments", articleId],
    queryFn: () => qualityManagementService.getArticleComments(articleId),
  });

  const createCommentMutation = useMutation({
    mutationFn: qualityManagementService.createArticleComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-comments", articleId] });
      setNewComment("");
      setCommentType("comment");
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário: " + error.message,
        variant: "destructive",
      });
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: qualityManagementService.resolveComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-comments", articleId] });
      toast({
        title: "Sucesso",
        description: "Comentário marcado como resolvido!",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comentário",
        variant: "destructive",
      });
      return;
    }

    createCommentMutation.mutate({
      article_id: articleId,
      comment_text: newComment,
      comment_type: commentType
    });
  };

  const handleResolveComment = (commentId: string) => {
    resolveCommentMutation.mutate(commentId);
  };

  const getCommentTypeInfo = (type: string) => {
    return COMMENT_TYPES.find(t => t.value === type) || COMMENT_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Comentários e Discussões</h3>
        <Badge variant="outline">{comments.length} comentários</Badge>
      </div>

      {/* New Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Comentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <Select value={commentType} onValueChange={setCommentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMENT_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite seu comentário, sugestão ou solicitação..."
            rows={4}
          />
          
          <Button 
            onClick={handleSubmitComment}
            disabled={createCommentMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-1" />
            {createCommentMutation.isPending ? "Enviando..." : "Enviar Comentário"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum comentário ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Seja o primeiro a comentar neste artigo
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[50vh]">
          <div className="space-y-4">
            {comments.map((comment) => {
              const typeInfo = getCommentTypeInfo(comment.comment_type);
              const Icon = typeInfo.icon;
              
              return (
                <Card key={comment.id} className={comment.is_resolved ? "opacity-75" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge className={typeInfo.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        {comment.is_resolved && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Usuário
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap mb-4">
                      {comment.comment_text}
                    </p>
                    
                    {!comment.is_resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveComment(comment.id)}
                        disabled={resolveCommentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Resolvido
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}