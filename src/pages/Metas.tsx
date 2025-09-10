import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag, TrendingUp, AlertTriangle, BarChart3, Pencil, Plus } from "lucide-react";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ value, size = 120, strokeWidth = 8 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--success))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-success">{value}%</span>
      </div>
    </div>
  );
}

const mockGoals = [
  {
    id: 1,
    name: "Reduzir emissões de Escopo 1",
    metric: "Emissões GEE (tCO₂e)",
    baseline: "2.500 tCO₂e (2024)",
    target: "2.125 tCO₂e",
    deadline: "31/12/2026",
    progress: 60,
    status: "No Caminho Certo" as const,
  },
  {
    id: 2,
    name: "Aumentar taxa de reciclagem",
    metric: "% de Resíduos Reciclados",
    baseline: "45% (2024)",
    target: "75%",
    deadline: "31/12/2025",
    progress: 85,
    status: "Atingida" as const,
  },
  {
    id: 3,
    name: "Reduzir consumo de água",
    metric: "Consumo de Água (m³)",
    baseline: "15.000 m³ (2024)",
    target: "12.000 m³",
    deadline: "30/06/2025",
    progress: 45,
    status: "Atenção Necessária" as const,
  },
  {
    id: 4,
    name: "Economia de energia",
    metric: "Consumo Energético (kWh)",
    baseline: "500.000 kWh (2024)",
    target: "400.000 kWh",
    deadline: "31/12/2024",
    progress: 20,
    status: "Atrasada" as const,
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "No Caminho Certo":
      return "default";
    case "Atenção Necessária":
      return "secondary";
    case "Atingida":
      return "default";
    case "Atrasada":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "No Caminho Certo":
      return "bg-success text-success-foreground";
    case "Atenção Necessária":
      return "bg-warning text-warning-foreground";
    case "Atingida":
      return "bg-accent text-accent-foreground";
    case "Atrasada":
      return "bg-destructive text-destructive-foreground";
    default:
      return "";
  }
};

export default function Metas() {
  const activeGoals = mockGoals.filter(goal => goal.status !== "Atingida").length;
  const averageProgress = Math.round(mockGoals.reduce((sum, goal) => sum + goal.progress, 0) / mockGoals.length);
  const delayedGoals = mockGoals.filter(goal => goal.status === "Atrasada").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Painel de Metas de Sustentabilidade
          </h1>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Nova Meta
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metas Ativas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas Ativas
              </CardTitle>
              <Flag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeGoals}</div>
            </CardContent>
          </Card>

          {/* Progresso Médio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso Médio das Metas
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent className="flex items-center justify-center pt-4">
              <CircularProgress value={averageProgress} />
            </CardContent>
          </Card>

          {/* Metas em Atraso */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas em Atraso
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{delayedGoals}</div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Meta</TableHead>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Linha de Base</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Prazo Final</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.name}</TableCell>
                      <TableCell className="text-muted-foreground">{goal.metric}</TableCell>
                      <TableCell className="text-muted-foreground">{goal.baseline}</TableCell>
                      <TableCell className="font-medium">{goal.target}</TableCell>
                      <TableCell className="text-muted-foreground">{goal.deadline}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={goal.progress} className="w-20" />
                          <span className="text-sm font-medium min-w-[3rem]">
                            {goal.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(goal.status)} border-0`}
                        >
                          {goal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Atualizar Progresso"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar Meta"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}