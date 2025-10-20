import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Eye, Search, Trash2 } from "lucide-react";
import { CompetencyMatrix, deleteCompetency } from "@/services/competencyService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CompetencyTableProps {
  competencies: CompetencyMatrix[];
  onEdit: (competency: CompetencyMatrix) => void;
}

export function CompetencyTable({ competencies, onEdit }: CompetencyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredCompetencies = competencies.filter(comp =>
    comp.competency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.competency_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteCompetency(id);
      toast({
        title: "Sucesso",
        description: "Competência desativada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["competency-matrix"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desativar competência. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'técnica':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'comportamental':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'liderança':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'gestão':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar competências..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competência</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Níveis</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompetencies.map((competency) => (
              <TableRow key={competency.id}>
                <TableCell className="font-medium">
                  {competency.competency_name}
                </TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(competency.competency_category)}>
                    {competency.competency_category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {competency.levels && Array.isArray(competency.levels) ? (
                      competency.levels.map((level: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          Nível {level.level}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Não definidos</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {competency.description || "Sem descrição"}
                </TableCell>
                <TableCell>
                  <Badge variant={competency.is_active ? "default" : "secondary"}>
                    {competency.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(competency)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar desativação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja desativar a competência "{competency.competency_name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(competency.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Desativar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredCompetencies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhuma competência encontrada." : "Nenhuma competência cadastrada."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}