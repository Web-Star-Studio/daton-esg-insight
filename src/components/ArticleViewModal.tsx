import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Eye, Edit, Tag, User, Calendar, BookMarked } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { knowledgeBaseService, type KnowledgeArticle } from "@/services/knowledgeBase";

interface ArticleViewModalProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (article: KnowledgeArticle) => void;
}

const getCategoryColor = (category?: string) => {
  if (!category) return "bg-gray-100 text-gray-800";
  
  const colors: Record<string, string> = {
    "Processos": "bg-blue-100 text-blue-800",
    "Qualidade": "bg-green-100 text-green-800",
    "Segurança": "bg-red-100 text-red-800",
    "Meio Ambiente": "bg-emerald-100 text-emerald-800",
    "Procedimentos": "bg-purple-100 text-purple-800",
    "Políticas": "bg-indigo-100 text-indigo-800",
    "Treinamentos": "bg-yellow-100 text-yellow-800",
    "FAQ": "bg-orange-100 text-orange-800",
    "Manuais": "bg-cyan-100 text-cyan-800",
    "Outros": "bg-gray-100 text-gray-800"
  };

  return colors[category] || "bg-gray-100 text-gray-800";
};

export function ArticleViewModal({ article, isOpen, onClose, onEdit }: ArticleViewModalProps) {
  useEffect(() => {
    if (article && isOpen) {
      // Increment view count when article is viewed
      knowledgeBaseService.incrementArticleViewCount(article.id);
    }
  }, [article, isOpen]);

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold leading-tight pr-6">
                {article.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Autor: {article.author_user_id}</span>
                <Separator orientation="vertical" className="h-4" />
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(article.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <Eye className="h-4 w-4" />
                <span>{article.view_count || 0} visualizações</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[600px] pr-6">
            <div className="space-y-6">
              {/* Article Metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Informações do Artigo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">Categoria:</span>
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category || 'Não categorizado'}
                    </Badge>
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 mt-0.5" />
                      <span className="text-sm font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4" />
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={article.is_published ? "default" : "secondary"}>
                      {article.is_published ? "Publicado" : article.status || "Rascunho"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Versão:</span>
                    <Badge variant="outline">v{article.version || 1}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Article Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Article History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Histórico de Modificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Criado em:</span>{" "}
                    {format(new Date(article.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>{" "}
                    {format(new Date(article.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {article.last_edited_at && (
                    <div>
                      <span className="font-medium">Última edição:</span>{" "}
                      {format(new Date(article.last_edited_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(article)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
          
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}