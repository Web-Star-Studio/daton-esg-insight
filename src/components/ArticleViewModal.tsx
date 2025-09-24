import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Edit, Calendar, User, ArrowLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { qualityManagementService } from "@/services/qualityManagement";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_user_id: string;
  status: string;
  version: number;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface ArticleViewModalProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (article: KnowledgeArticle) => void;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Processos": "bg-primary/10 text-primary border-primary/20",
    "Qualidade": "bg-green-100 text-green-800 border-green-200",
    "Segurança": "bg-red-100 text-red-800 border-red-200",
    "Meio Ambiente": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Procedimentos": "bg-purple-100 text-purple-800 border-purple-200",
    "Políticas": "bg-orange-100 text-orange-800 border-orange-200",
    "Treinamentos": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "FAQ": "bg-pink-100 text-pink-800 border-pink-200",
    "Manuais": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Outros": "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colors[category] || "bg-muted text-muted-foreground border-border";
};

export function ArticleViewModal({ article, isOpen, onClose, onEdit }: ArticleViewModalProps) {
  const [localViewCount, setLocalViewCount] = useState(0);
  const queryClient = useQueryClient();

  const incrementViewMutation = useMutation({
    mutationFn: qualityManagementService.incrementArticleViewCount,
    onSuccess: (data) => {
      if (data?.view_count) {
        setLocalViewCount(data.view_count);
      }
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
    },
  });

  useEffect(() => {
    if (article && isOpen) {
      setLocalViewCount(article.view_count);
      // Increment view count when article is opened
      incrementViewMutation.mutate(article.id);
    }
  }, [article, isOpen]);

  if (!article) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(article);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Base de Conhecimento</span>
                <ChevronRight className="h-3 w-3" />
                <Badge variant="outline" className={getCategoryColor(article.category)}>
                  {article.category}
                </Badge>
              </div>
              
              <DialogTitle className="text-2xl font-bold mb-2">
                {article.title}
              </DialogTitle>
              
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(article.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {localViewCount} visualizações
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Versão {article.version}
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Article Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-foreground mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-foreground leading-7 mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground">
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            Última atualização: {format(new Date(article.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar Artigo
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}