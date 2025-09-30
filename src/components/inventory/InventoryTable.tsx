import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pencil, 
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryTableProps {
  emissionSources: any[];
  selectedSources: string[];
  searchTerm: string;
  isLoading: boolean;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEditSource: (source: any) => void;
  onDeleteSource: (id: string) => void;
  onManageActivityData: (source: any) => void;
}

export function InventoryTable({
  emissionSources,
  selectedSources,
  searchTerm,
  isLoading,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onEditSource,
  onDeleteSource,
  onManageActivityData,
}: InventoryTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatEmission = (value: number) => {
    if (!value) return "0,00";
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
      : <Badge variant="secondary" className="bg-muted text-muted-foreground">Inativo</Badge>;
  };

  const getScopeBadge = (scope: string) => {
    const colors: Record<string, string> = {
      "Escopo 1": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
      "Escopo 2": "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20",
      "Escopo 3": "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20",
    };
    return <Badge className={colors[scope] || ""}>{scope}</Badge>;
  };

  const filteredSources = emissionSources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredSources.length > 0 && 
    filteredSources.every(s => selectedSources.includes(s.id));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Fontes de Emissão</span>
          {filteredSources.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll();
                  } else {
                    onClearSelection();
                  }
                }}
              />
              <span className="text-sm font-normal text-muted-foreground">
                Selecionar todas
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emissões (tCO₂e)</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchTerm 
                      ? "Nenhuma fonte encontrada com esse filtro"
                      : "Nenhuma fonte de emissão cadastrada"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSources.includes(source.id)}
                        onCheckedChange={() => onToggleSelection(source.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{getScopeBadge(source.scope)}</TableCell>
                    <TableCell>{source.category}</TableCell>
                    <TableCell>{getStatusBadge(source.status)}</TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {formatEmission(source.total_emissions)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {source.updated_at ? formatDate(source.updated_at) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onManageActivityData(source)}
                          title="Gerenciar dados de atividade"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditSource(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteSource(source.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
