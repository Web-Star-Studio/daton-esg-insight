import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Building2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Company = Database['public']['Tables']['companies']['Row'];

export function CompanyTable() {
  const [search, setSearch] = useState("");

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
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredCompanies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies?.map((company) => (
                <TableRow key={company.id}>
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
    </div>
  );
}
