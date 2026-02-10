import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const roleLabels: Record<string, string> = {
  platform_admin: "Platform Admin",
  admin: "Admin",
  manager: "Gestor",
  user: "Usuário",
  auditor: "Auditor",
  viewer: "Visualizador",
};

export function PlatformUsersTable() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ["platform-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["platform-users", debouncedSearch, companyFilter, statusFilter, approvalFilter, page],
    queryFn: async () => {
      // Query 1: profiles + companies (sem user_roles, pois não há FK direta)
      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, email, is_active, is_approved, created_at, job_title, company_id, companies(name)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`
        );
      }

      if (companyFilter !== "all") {
        query = query.eq("company_id", companyFilter);
      }

      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      }

      if (approvalFilter === "approved") {
        query = query.eq("is_approved", true);
      } else if (approvalFilter === "pending") {
        query = query.eq("is_approved", false);
      }

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      // Query 2: buscar roles separadamente
      const userIds = (profiles ?? []).map((p: any) => p.id);
      let roles: any[] = [];
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        roles = rolesData ?? [];
      }

      // Combinar profiles + roles
      const roleMap: Record<string, string> = {};
      roles.forEach((r: any) => { roleMap[r.user_id] = r.role; });
      const users = (profiles ?? []).map((p: any) => ({ ...p, role: roleMap[p.id] }));

      return { users, total: count ?? 0 };
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error } = await (supabase.from("profiles") as any)
        .update({ is_approved: approve })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success(approve ? "Usuário aprovado com sucesso" : "Aprovação revogada");
    },
    onError: () => {
      toast.error("Erro ao alterar aprovação do usuário");
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={companyFilter}
          onValueChange={(v) => {
            setCompanyFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={approvalFilter}
          onValueChange={(v) => {
            setApprovalFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Aprovação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aprovação</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => {
                const role = user.role;
                const companyName =
                  (user.companies as any)?.name ?? "—";
                const isPlatformAdmin = role === 'platform_admin';
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "—"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{companyName}</TableCell>
                    <TableCell>{user.job_title || "—"}</TableCell>
                    <TableCell>
                      {role ? (
                        <Badge variant="secondary">
                          {roleLabels[role] ?? role}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "success-subtle" : "destructive-subtle"}
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_approved ? "success-subtle" : "warning-subtle" as any}
                        className={!user.is_approved ? "bg-warning/10 text-warning border-warning/20" : ""}
                      >
                        {user.is_approved ? "Aprovado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isPlatformAdmin && (
                        <Button
                          variant={user.is_approved ? "ghost" : "default"}
                          size="sm"
                          onClick={() => toggleApproval.mutate({ userId: user.id, approve: !user.is_approved })}
                          disabled={toggleApproval.isPending}
                          className="gap-1.5"
                        >
                          {user.is_approved ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Revogar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} usuário{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
