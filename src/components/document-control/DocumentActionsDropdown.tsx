import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Send, CheckSquare, BookOpen, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CollaboratorMultiSelect } from "@/components/document-center/CollaboratorMultiSelect";
import { useCompanyUsers } from "@/hooks/data/useCompanyUsers";
import { documentApprovalsService } from "@/services/gedDocuments";
import { createReadCampaign } from "@/services/documentCenter";
import { useToast } from "@/hooks/use-toast";

type ActionType = "revisao" | "aprovacao" | "leitura" | null;

interface DocumentActionsDropdownProps {
  documentId: string;
  documentName: string;
  onDownload: () => void;
}

const ACTION_CONFIG = {
  revisao: {
    title: "Enviar para Revisão",
    description: "Selecione os colaboradores que devem revisar este documento.",
    icon: Send,
  },
  aprovacao: {
    title: "Enviar para Aprovação",
    description: "Selecione os aprovadores deste documento.",
    icon: CheckSquare,
  },
  leitura: {
    title: "Enviar para Leitura",
    description: "Crie uma campanha de leitura para este documento.",
    icon: BookOpen,
  },
} as const;

export function DocumentActionsDropdown({
  documentId,
  documentName,
  onDownload,
}: DocumentActionsDropdownProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: users = [] } = useCompanyUsers();

  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setActiveAction(null);
    setSelectedIds([]);
    setNotes("");
    setCampaignTitle("");
    setDueDate("");
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Selecione ao menos um colaborador", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (activeAction === "revisao" || activeAction === "aprovacao") {
        const approvalType = activeAction === "revisao" ? "revisao" : "aprovacao";
        for (const userId of selectedIds) {
          await documentApprovalsService.createApproval({
            document_id: documentId,
            status: "pendente",
            approval_type: approvalType,
            approver_user_id: userId,
            approval_notes: notes || null,
          } as any);
        }
        toast({
          title: `Documento enviado para ${activeAction === "revisao" ? "revisão" : "aprovação"}`,
          description: `${selectedIds.length} colaborador(es) notificado(s).`,
        });
      } else if (activeAction === "leitura") {
        if (!campaignTitle.trim()) {
          toast({ title: "Informe o título da campanha", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        await createReadCampaign({
          documentId,
          title: campaignTitle,
          message: notes || undefined,
          dueAt: dueDate || null,
          recipientIds: selectedIds,
        });
        toast({
          title: "Campanha de leitura criada",
          description: `${selectedIds.length} destinatário(s) adicionado(s).`,
        });
      }
      resetForm();
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar ação.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const config = activeAction ? ACTION_CONFIG[activeAction] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/documentos/${documentId}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveAction("revisao")}>
            <Send className="mr-2 h-4 w-4" />
            Enviar para Revisão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveAction("aprovacao")}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Enviar para Aprovação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveAction("leitura")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Enviar para Leitura
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!activeAction} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config?.title}</DialogTitle>
            <DialogDescription>{config?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Documento: <strong>{documentName}</strong>
            </p>

            {activeAction === "leitura" && (
              <>
                <div className="grid gap-2">
                  <Label>Título da Campanha *</Label>
                  <Input
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Ex: Leitura obrigatória — Procedimento X"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data Limite</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Colaboradores *</Label>
              <CollaboratorMultiSelect
                collaborators={users.map((u) => ({ id: u.id, full_name: u.full_name }))}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                placeholder="Selecionar colaboradores"
              />
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações opcionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
