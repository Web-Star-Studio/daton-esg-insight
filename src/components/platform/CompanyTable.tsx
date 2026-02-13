import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, Building2, MoreVertical, X, Ban, Power } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Company = Database['public']['Tables']['companies']['Row'];

export function CompanyTable() {
  const [search, setSearch] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['platform-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    company.cnpj.includes(search)
  );

  const bulkSuspendMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke("manage-platform", {
        body: { action: "bulkSuspendCompanies", data: { companyIds } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      setSelectedCompanyIds(new Set());
      toast.success(data?.message || "Empresas suspensas com sucesso");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao suspender empresas"),
  });

  const bulkActivateMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke("manage-platform", {
        body: { action: "bulkActivateCompanies", data: { companyIds } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      setSelectedCompanyIds(new Set());
      toast.success(data?.message || "Empresas ativadas com sucesso");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao ativar empresas"),
  });

  const allSelected = filteredCompanies && filteredCompanies.length > 0 && filteredCompanies.every(c => selectedCompanyIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set((filteredCompanies ?? []).map(c => c.id)));
    }
  };

  const toggleSelectCompany = (id: string) => {
    const next = new Set(selectedCompanyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCompanyIds(next);
  };

  const selectedCount = selectedCompanyIds.size;
  const isBulkProcessing = bulkSuspendMutation.isPending || bulkActivateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={!!allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                />
              </TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Funcionários</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredCompanies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies?.map((company) => (
                <TableRow key={company.id} data-state={selectedCompanyIds.has(company.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCompanyIds.has(company.id)}
                      onCheckedChange={() => toggleSelectCompany(company.id)}
                      aria-label={`Selecionar ${company.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{company.cnpj}</TableCell>
                  <TableCell>
                    {company.sector ? (
                      <Badge variant="secondary">{company.sector}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.employee_count || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(company.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Impersonar</DropdownMenuItem>
                        <DropdownMenuItem>Editar configurações</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Suspender
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[400px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">{selectedCount} selecionada(s)</Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCompanyIds(new Set())} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={isBulkProcessing}
                  onClick={() => bulkActivateMutation.mutate(Array.from(selectedCompanyIds))}
                >
                  <Power className="h-4 w-4 mr-2" /> Ativar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={isBulkProcessing}
                  onClick={() => bulkSuspendMutation.mutate(Array.from(selectedCompanyIds))}
                >
                  <Ban className="h-4 w-4 mr-2" /> Suspender
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
