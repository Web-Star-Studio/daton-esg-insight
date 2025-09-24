import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { qualityManagementService } from "@/services/qualityManagement";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
}

interface ArticleApprovalModalProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "approved": return "bg-green-100 text-green-800";
    case "rejected": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending": return Clock;
    case "approved": return CheckCircle;
    case "rejected": return XCircle;
    default: return Clock;
  }
};

export function ArticleApprovalModal({ article, isOpen, onClose }: ArticleApprovalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approvalNotes, setApprovalNotes] = useState("");
  
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["article-approvals", article?.id],
    queryFn: () => article ? qualityManagementService.getArticleApprovals(article.id) : [],
    enabled: !!article?.id && isOpen,
  });

  const updateApprovalMutation = useMutation({
    mutationFn: ({ approvalId, status, notes }: { approvalId: string; status: "approved" | "rejected"; notes?: string }) =>
      qualityManagementService.updateApprovalStatus(approvalId, status, notes),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status de aprovação atualizado!",
      });
      queryClient.invalidateQueries({ queryKey: ["article-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar aprovação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproval = (approvalId: string, status: "approved" | "rejected") => {
    updateApprovalMutation.mutate({
      approvalId,
      status,
      notes: approvalNotes
    });
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Aprovações - {article.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Article Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Prévia do Artigo</h3>
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary">{article.category}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conteúdo:</Label>
                  <ScrollArea className="h-64 w-full border rounded-md p-3">
                    <div className="text-sm whitespace-pre-wrap">{article.content}</div>
                  </ScrollArea>
                </div>
                {article.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tags:</Label>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Approvals Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Histórico de Aprovações</h3>
              
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando aprovações...</div>
              ) : approvals.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma aprovação solicitada ainda.</div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {approvals.map((approval: any) => {
                      const StatusIcon = getStatusIcon(approval.approval_status);
                      return (
                        <div key={approval.id} className="border rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <Badge className={getStatusColor(approval.approval_status)}>
                                {approval.approval_status === "pending" ? "Pendente" :
                                 approval.approval_status === "approved" ? "Aprovado" : "Rejeitado"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              v{approval.version_number}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-3 w-3" />
                              <span>{approval.approver_profile?.full_name || "Usuário"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(approval.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          {approval.approval_notes && (
                            <div className="text-sm p-2 bg-muted rounded text-muted-foreground">
                              {approval.approval_notes}
                            </div>
                          )}

                          {approval.approval_status === "pending" && (
                            <div className="space-y-3 pt-2 border-t">
                              <div className="space-y-2">
                                <Label className="text-sm">Observações da Aprovação:</Label>
                                <Textarea
                                  placeholder="Digite suas observações (opcional)"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  className="text-sm"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproval(approval.id, "approved")}
                                  disabled={updateApprovalMutation.isPending}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApproval(approval.id, "rejected")}
                                  disabled={updateApprovalMutation.isPending}
                                  className="flex-1"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ArticleApprovalModal;