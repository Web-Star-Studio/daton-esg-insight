import { Card } from "@/components/ui/card";
import { Plus, Target, CheckSquare, FileText, AlertCircle, Users } from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Target className="h-4 w-4" />,
    label: "Criar Meta ESG",
    prompt: "Crie uma nova meta ambiental para reduzir emissões de CO2 em 20% até dezembro de 2025",
    category: "Metas"
  },
  {
    icon: <CheckSquare className="h-4 w-4" />,
    label: "Criar Tarefa",
    prompt: "Crie uma tarefa de coleta de dados de emissões mensais com vencimento em 30 dias",
    category: "Tarefas"
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: "Registrar Licença",
    prompt: "Registre uma licença ambiental de operação válida por 2 anos",
    category: "Licenciamento"
  },
  {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Criar Risco",
    prompt: "Registre um risco ambiental relacionado a descarte inadequado de resíduos",
    category: "Riscos"
  },
  {
    icon: <Plus className="h-4 w-4" />,
    label: "Criar OKR",
    prompt: "Crie um OKR para o trimestre Q1 2025 focado em sustentabilidade",
    category: "OKRs"
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "Adicionar Colaborador",
    prompt: "Adicione um novo colaborador ao departamento de Sustentabilidade",
    category: "Pessoas"
  }
];

interface QuickActionsProps {
  onSelectAction: (prompt: string) => void;
}

export function QuickActions({ onSelectAction }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px bg-border flex-1" />
        <p className="text-xs text-muted-foreground font-medium">Ações Rápidas</p>
        <div className="h-px bg-border flex-1" />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:bg-accent hover:border-primary/50 transition-all group"
            onClick={() => onSelectAction(action.prompt)}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {action.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {action.category}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Clique em uma ação para usar como exemplo ou digite sua própria solicitação
      </p>
    </div>
  );
}
