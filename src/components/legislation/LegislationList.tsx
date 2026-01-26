import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2,
  ExternalLink 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LegislationStatusBadge, JurisdictionBadge } from "./LegislationStatusBadge";
import { Legislation } from "@/services/legislations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LegislationListProps {
  legislations: Legislation[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export const LegislationList: React.FC<LegislationListProps> = ({
  legislations,
  isLoading,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (legislations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma legislação encontrada.</p>
        <Button 
          className="mt-4"
          onClick={() => navigate('/licenciamento/legislacoes/nova')}
        >
          Cadastrar Legislação
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Tipo/Número</TableHead>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Ementa</TableHead>
              <TableHead className="w-[120px]">Macrotema</TableHead>
              <TableHead className="w-[100px]">Jurisdição</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legislations.map((legislation) => (
              <TableRow 
                key={legislation.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/licenciamento/legislacoes/${legislation.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="text-sm">
                    {legislation.norm_type}
                    {legislation.norm_number && (
                      <span className="block text-muted-foreground text-xs">
                        nº {legislation.norm_number}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {legislation.publication_date && 
                    format(new Date(legislation.publication_date), "dd/MM/yyyy", { locale: ptBR })
                  }
                </TableCell>
                <TableCell>
                  <div className="max-w-md truncate" title={legislation.summary || legislation.title}>
                    {legislation.summary || legislation.title || "-"}
                  </div>
                  {legislation.issuing_body && (
                    <span className="text-xs text-muted-foreground">
                      {legislation.issuing_body}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {legislation.theme && (
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${legislation.theme.color}20`,
                        color: legislation.theme.color 
                      }}
                    >
                      {legislation.theme.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <JurisdictionBadge value={legislation.jurisdiction} />
                </TableCell>
                <TableCell>
                  <LegislationStatusBadge 
                    type="status" 
                    value={legislation.overall_status} 
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/licenciamento/legislacoes/${legislation.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/licenciamento/legislacoes/${legislation.id}/editar`)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {legislation.full_text_url && (
                        <DropdownMenuItem onClick={() => window.open(legislation.full_text_url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Texto Completo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(legislation.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Legislação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta legislação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
