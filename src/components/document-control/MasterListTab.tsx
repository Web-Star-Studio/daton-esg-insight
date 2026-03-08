import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Search, FileSpreadsheet } from "lucide-react";
import { masterListService } from "@/services/gedDocuments";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import * as XLSX from "xlsx";

export const MasterListTab = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: masterList = [], isLoading } = useQuery({
    queryKey: ["document-master-list"],
    queryFn: () => masterListService.getMasterList(),
  });

  const filtered = masterList.filter((item: any) => {
    const search = searchTerm.toLowerCase();
    return (
      (item.code || "").toLowerCase().includes(search) ||
      (item.title || "").toLowerCase().includes(search) ||
      (item.responsible_department || "").toLowerCase().includes(search)
    );
  });

  const handleExportExcel = () => {
    const exportData = filtered.map((item: any) => ({
      Código: item.code,
      Título: item.title,
      Versão: item.version,
      "Data Vigência": item.effective_date
        ? new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("pt-BR")
        : "",
      "Data Revisão": item.review_date
        ? new Date(`${item.review_date}T00:00:00`).toLocaleDateString("pt-BR")
        : "",
      Departamento: item.responsible_department || "",
      Status: item.is_active ? "Ativo" : "Inativo",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista Mestra");
    XLSX.writeFile(wb, `Lista_Mestra_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando Lista Mestra..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código, título ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[300px]"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Data Vigência</TableHead>
                  <TableHead>Próx. Revisão</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum documento na Lista Mestra.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.code}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>
                        {item.effective_date
                          ? new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {item.review_date
                          ? new Date(`${item.review_date}T00:00:00`).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>{item.responsible_department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "destructive"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Total: {filtered.length} documento(s) na Lista Mestra
      </p>
    </div>
  );
};
