import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Download,
  Share2,
  Copy,
  Trash2,
  FileText
} from "lucide-react";
import { type IntegratedReport } from "@/services/integratedReports";

interface ReportActionsProps {
  report: IntegratedReport;
  onEdit?: () => void;
  onView?: () => void;
  onSubmitForReview?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onGenerateContent?: () => void;
}

export function ReportActions({
  report,
  onEdit,
  onView,
  onSubmitForReview,
  onApprove,
  onReject,
  onDownload,
  onShare,
  onDuplicate,
  onDelete,
  onGenerateContent,
}: ReportActionsProps) {
  const status = report.status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Actions for all statuses */}
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>

        {/* Actions for Rascunho */}
        {status === 'Rascunho' && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onGenerateContent}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Conteúdo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSubmitForReview}>
              <Send className="h-4 w-4 mr-2" />
              Enviar para Revisão
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </>
        )}

        {/* Actions for Em Revisão */}
        {status === 'Em Revisão' && (
          <>
            <DropdownMenuItem onClick={onApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </DropdownMenuItem>
          </>
        )}

        {/* Actions for Publicado */}
        {status === 'Publicado' && (
          <>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Actions available for multiple statuses */}
        {(status === 'Publicado' || status === 'Arquivado') && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
