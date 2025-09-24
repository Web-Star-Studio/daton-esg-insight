import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Calendar, FileText, CheckCircle } from "lucide-react";
import { qualityManagementService } from "@/services/qualityManagement";
import { useState } from "react";
import ArticleApprovalModal from "./ArticleApprovalModal";

export function PendingApprovalsWidget() {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const { data: pendingApprovals = [], isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: qualityManagementService.getPendingApprovals,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleViewApproval = (approval: any) => {
    setSelectedArticle({
      id: approval.article_id,
      title: approval.article.title,
      content: approval.article.content || "",
      category: approval.article.category || "",
      tags: approval.article.tags || [],
      status: approval.article.status || ""
    });
    setIsApprovalModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aprovações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando aprovações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aprovações Pendentes
            </div>
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary">
                {pendingApprovals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-medium text-muted-foreground">Nenhuma aprovação pendente</h3>
              <p className="text-sm text-muted-foreground">
                Todas as aprovações foram processadas!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {pendingApprovals.map((approval: any) => (
                  <div key={approval.id} className="border rounded-lg p-3 space-y-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium text-sm">{approval.article?.title || "Artigo sem título"}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Solicitado por: {approval.requester_profile?.full_name || "Usuário"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        v{approval.version_number}
                      </Badge>
                    </div>

                    {approval.approval_notes && (
                      <div className="text-xs p-2 bg-muted rounded text-muted-foreground">
                        <strong>Observações:</strong> {approval.approval_notes}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewApproval(approval)}
                      >
                        Analisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ArticleApprovalModal
        article={selectedArticle}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedArticle(null);
        }}
      />
    </>
  );
}

export default PendingApprovalsWidget;