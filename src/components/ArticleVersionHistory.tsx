import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Eye, User, Clock, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { qualityManagementService } from "@/services/qualityManagement";

interface ArticleVersion {
  id: string;
  version_number: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  changes_summary: string;
  edited_by_user_id: string;
  created_at: string;
}

interface ArticleVersionHistoryProps {
  articleId: string;
}

export function ArticleVersionHistory({ articleId }: ArticleVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["article-versions", articleId],
    queryFn: () => qualityManagementService.getArticleVersions(articleId),
  });

  const handleViewVersion = (version: ArticleVersion) => {
    setSelectedVersion(version);
    setIsViewModalOpen(true);
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
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Histórico de Versões</h3>
        <Badge variant="outline">{versions.length} versões</Badge>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma versão anterior encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">
              As versões anteriores aparecerão aqui após as primeiras edições
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {versions.map((version, index) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Badge variant="secondary">v{version.version_number}</Badge>
                        {version.title}
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">Anterior</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Editado por usuário
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVersion(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Versão
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {version.changes_summary && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Alterações:</span>
                      </div>
                      <p className="text-sm">{version.changes_summary}</p>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {version.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {version.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {version.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{version.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Version View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary">v{selectedVersion?.version_number}</Badge>
              {selectedVersion?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {selectedVersion.category}
                  </Badge>
                  <span>
                    {format(new Date(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                
                {selectedVersion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVersion.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{selectedVersion.content}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}