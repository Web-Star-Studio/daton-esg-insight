import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Eye, Edit, Calendar, User } from "lucide-react";
import { qualityManagementService } from "@/services/qualityManagement";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArticleBookmarkButton } from "./ArticleBookmarkButton";

interface BookmarkedArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  view_count: number;
  created_at: string;
  author_user_id: string;
}

interface BookmarkedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewArticle: (article: BookmarkedArticle) => void;
  onEditArticle?: (article: BookmarkedArticle) => void;
}

export function BookmarkedArticlesModal({ 
  isOpen, 
  onClose, 
  onViewArticle,
  onEditArticle 
}: BookmarkedArticlesModalProps) {
  const { data: bookmarkedArticles = [], isLoading } = useQuery({
    queryKey: ["article-bookmarks"],
    queryFn: qualityManagementService.getBookmarkedArticles,
    enabled: isOpen,
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Processos": "bg-primary/10 text-primary",
      "Qualidade": "bg-secondary/10 text-secondary-foreground",
      "Segurança": "bg-destructive/10 text-destructive",
      "Meio Ambiente": "bg-accent/10 text-accent-foreground",
      "Procedimentos": "bg-muted text-muted-foreground",
      "Políticas": "bg-primary/20 text-primary",
      "Treinamentos": "bg-secondary/20 text-secondary-foreground",
      "FAQ": "bg-accent/20 text-accent-foreground",
      "Manuais": "bg-muted/80 text-foreground",
      "Outros": "bg-muted/50 text-muted-foreground"
    };
    return colors[category] || "bg-muted/50 text-muted-foreground";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Artigos Favoritos
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : bookmarkedArticles.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum artigo favoritado
              </h3>
              <p className="text-muted-foreground">
                Favorite artigos para acessá-los rapidamente aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarkedArticles.map((article: BookmarkedArticle) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {article.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(article.category)}>
                          {article.category}
                        </Badge>
                        <ArticleBookmarkButton 
                          articleId={article.id}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">
                      {article.content.substring(0, 200)}...
                    </CardDescription>
                    
                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Separator className="mb-4" />

                    {/* Metadata */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.view_count} visualizações
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(article.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onViewArticle(article)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Artigo
                      </Button>
                      {onEditArticle && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => onEditArticle(article)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}