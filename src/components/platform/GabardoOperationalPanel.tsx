import {
  AlertTriangle,
  ClipboardCheck,
  FileWarning,
  GraduationCap,
  Leaf,
  ScrollText,
  ShieldAlert,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGabardoOperationalMetrics } from "@/hooks/useGabardoOperationalMetrics";

const Item = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger" | "success";
}) => {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "success"
          ? "text-emerald-600"
          : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
};

const Block = ({
  title,
  icon: Icon,
  children,
  badge,
  badgeTone,
}: {
  title: string;
  icon: typeof AlertTriangle;
  children: React.ReactNode;
  badge?: string | number;
  badgeTone?: "default" | "destructive" | "secondary";
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </CardTitle>
      {badge !== undefined && (
        <Badge variant={badgeTone ?? "secondary"}>{badge}</Badge>
      )}
    </CardHeader>
    <CardContent className="space-y-2">{children}</CardContent>
  </Card>
);

export const GabardoOperationalPanel = () => {
  const { data, isLoading } = useGabardoOperationalMetrics();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Saúde operacional</h3>
        <p className="text-xs text-muted-foreground">
          Pendências reais nos módulos de compliance, qualidade e ambiental.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Block
          title="Não conformidades"
          icon={ShieldAlert}
          badge={data.ncs.open}
          badgeTone={data.ncs.open > 0 ? "destructive" : "secondary"}
        >
          <Item label="Abertas" value={data.ncs.open} tone={data.ncs.open > 0 ? "danger" : "default"} />
          <Item label="Encerradas" value={data.ncs.closed} tone="success" />
          <Item label="Total" value={data.ncs.total} />
        </Block>

        <Block
          title="Auditorias"
          icon={ClipboardCheck}
          badge={data.audits.inProgress}
        >
          <Item label="Em andamento" value={data.audits.inProgress} tone="warning" />
          <Item label="Total" value={data.audits.total} />
        </Block>

        <Block
          title="Licenças ambientais"
          icon={Leaf}
          badge={data.licenses.expired + data.licenses.expiring90d}
          badgeTone={data.licenses.expired > 0 ? "destructive" : "secondary"}
        >
          <Item label="Vencidas" value={data.licenses.expired} tone={data.licenses.expired > 0 ? "danger" : "default"} />
          <Item label="Vencendo (90d)" value={data.licenses.expiring90d} tone={data.licenses.expiring90d > 0 ? "warning" : "default"} />
          <Item label="Total" value={data.licenses.total} />
        </Block>

        <Block
          title="SGQ / ISO docs"
          icon={FileCheck2}
          badge={data.sgq.expired + data.sgq.expiring30d}
          badgeTone={data.sgq.expired > 0 ? "destructive" : "secondary"}
        >
          <Item label="Vencidos" value={data.sgq.expired} tone={data.sgq.expired > 0 ? "danger" : "default"} />
          <Item label="Vencendo (30d)" value={data.sgq.expiring30d} tone={data.sgq.expiring30d > 0 ? "warning" : "default"} />
          <Item label="Total" value={data.sgq.total} />
        </Block>

        <Block
          title="Treinamentos"
          icon={GraduationCap}
          badge={data.trainings.pendingEfficacy}
          badgeTone={data.trainings.pendingEfficacy > 0 ? "destructive" : "secondary"}
        >
          <Item label="Pendente eficácia" value={data.trainings.pendingEfficacy} tone={data.trainings.pendingEfficacy > 0 ? "warning" : "default"} />
          <Item label="Em andamento" value={data.trainings.inProgress} />
          <Item label="Inscritos" value={data.trainings.enrolled} />
          <Item label="Concluídos" value={data.trainings.completed} tone="success" />
        </Block>

        <Block
          title="LAIA (aspectos)"
          icon={FileWarning}
          badge={data.laia.active}
        >
          <Item label="Ativos" value={data.laia.active} />
          <Item label="Total" value={data.laia.total} />
        </Block>

        <Block title="Legislações" icon={ScrollText} badge={data.legislations.total}>
          <Item label="Cadastradas" value={data.legislations.total} />
        </Block>

        <Block title="Cadastros base" icon={AlertTriangle}>
          <Item label="Funcionários" value={data.employees.total} />
          <Item label="Filiais" value={data.branches.total} />
          <Item label="Documentos" value={data.documents.total} />
        </Block>
      </div>
    </div>
  );
};
