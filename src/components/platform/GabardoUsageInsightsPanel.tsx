import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flame, Users, AlertTriangle, Ghost, Clock } from "lucide-react";
import {
  useGabardoUsageInsights,
  type UserClassification,
} from "@/hooks/useGabardoUsageInsights";

/**
 * Painel "quem usou o quê" — perfil de engajamento + adoção por módulo.
 * Janela fixa de 30 dias, não-testers da Gabardo.
 */

const classificationMeta: Record<
  UserClassification,
  { label: string; tone: string; icon: typeof Users }
> = {
  power: { label: "Power users", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: Flame },
  regular: { label: "Regulares", tone: "text-blue-700 bg-blue-50 border-blue-200", icon: Users },
  casual: { label: "Casuais", tone: "text-slate-700 bg-slate-50 border-slate-200", icon: Clock },
  churning: { label: "Sumindo", tone: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
  ghost: { label: "Nunca logaram", tone: "text-rose-700 bg-rose-50 border-rose-200", icon: Ghost },
};

const moduleLabels: Record<string, string> = {
  esgEnvironmental: "ESG Ambiental",
  esgGovernance: "ESG Governança",
  esgSocial: "ESG Social",
  esgManagement: "ESG Gestão",
  quality: "Qualidade (SGQ)",
  suppliers: "Fornecedores",
  financial: "Financeiro",
  dataReports: "Dados & Relatórios",
  settings: "Configurações",
  other: "Outros / Home",
};

const formatLastSeen = (
  iso: string | null,
  daysSince: number | null,
): string => {
  if (!iso || daysSince === null) return "Nunca";
  if (daysSince === 0) return "Hoje";
  if (daysSince === 1) return "Ontem";
  return `há ${daysSince}d`;
};

export const GabardoUsageInsightsPanel = () => {
  const { data, isLoading } = useGabardoUsageInsights();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const order: UserClassification[] = ["power", "regular", "casual", "churning", "ghost"];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Perfil de engajamento (30d)</h3>
        <p className="text-xs text-muted-foreground">
          Classificação baseada em frequência de acesso e dias ativos. Total
          elegível: {data.total_eligible_users} usuários.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {order.map((c) => {
          const meta = classificationMeta[c];
          const Icon = meta.icon;
          const count = data.classification_counts[c];
          return (
            <Card key={c} className={`border ${meta.tone}`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="mt-1 text-xs font-medium">{meta.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adoção por módulo</CardTitle>
            <p className="text-xs text-muted-foreground">
              % dos usuários da Gabardo que abriram cada módulo nos últimos 30d.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.module_adoption.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem dados de pageviews no período.
              </p>
            ) : (
              data.module_adoption.map((m) => (
                <div key={m.module_key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {moduleLabels[m.module_key] ?? m.module_key}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.unique_users} users · {m.pageviews} pv ·{" "}
                      <strong>{m.adoption_pct}%</strong>
                    </span>
                  </div>
                  <Progress value={m.adoption_pct} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários por status</CardTitle>
            <p className="text-xs text-muted-foreground">
              Lista detalhada — quem está engajado, quem está sumindo.
            </p>
          </CardHeader>
          <CardContent className="max-h-[460px] overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">PV</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                  <TableHead className="text-right">Última</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => {
                  const meta = classificationMeta[u.classification];
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium text-sm">
                        {u.full_name ?? u.user_id.slice(0, 8)}
                        {u.modules_used.length > 0 && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {u.modules_used.length} módulo
                            {u.modules_used.length === 1 ? "" : "s"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${meta.tone}`}
                        >
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {u.pageviews_30d}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {u.active_days_30d}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatLastSeen(u.last_seen, u.days_since_last_seen)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
