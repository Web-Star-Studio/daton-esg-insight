// Action Card - Ações acionáveis inteligentes com execução direta
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  FileText, 
  Calendar,
  Sparkles,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ActionCardData {
  id: string;
  title: string;
  description: string;
  category: 'import' | 'create' | 'analyze' | 'schedule' | 'alert' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  confidence?: number;
  estimatedImpact?: string;
  action: {
    label: string;
    prompt?: string;
    directAction?: () => void;
  };
  metadata?: {
    dataPoints?: number;
    affectedItems?: number;
    timeframe?: string;
  };
}

interface ActionCardProps {
  data: ActionCardData;
  onExecute?: (action: ActionCardData) => void;
  className?: string;
}

export function ActionCard({ data, onExecute, className }: ActionCardProps) {
  const getCategoryConfig = () => {
    const configs = {
      import: {
        icon: FileText,
        color: 'blue',
        bgClass: 'bg-blue-500/10 border-blue-500/20',
        iconClass: 'text-blue-500'
      },
      create: {
        icon: Target,
        color: 'green',
        bgClass: 'bg-green-500/10 border-green-500/20',
        iconClass: 'text-green-500'
      },
      analyze: {
        icon: TrendingUp,
        color: 'purple',
        bgClass: 'bg-purple-500/10 border-purple-500/20',
        iconClass: 'text-purple-500'
      },
      schedule: {
        icon: Calendar,
        color: 'orange',
        bgClass: 'bg-orange-500/10 border-orange-500/20',
        iconClass: 'text-orange-500'
      },
      alert: {
        icon: AlertCircle,
        color: 'red',
        bgClass: 'bg-red-500/10 border-red-500/20',
        iconClass: 'text-red-500'
      },
      opportunity: {
        icon: Lightbulb,
        color: 'yellow',
        bgClass: 'bg-yellow-500/10 border-yellow-500/20',
        iconClass: 'text-yellow-500'
      }
    };
    
    return configs[data.category];
  };

  const getPriorityBadge = () => {
    const badges = {
      high: { label: 'Alta Prioridade', variant: 'destructive' as const },
      medium: { label: 'Média Prioridade', variant: 'default' as const },
      low: { label: 'Baixa Prioridade', variant: 'secondary' as const }
    };
    
    return badges[data.priority];
  };

  const config = getCategoryConfig();
  const priority = getPriorityBadge();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer border-2",
        config.bgClass,
        "hover:shadow-lg"
      )}>
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              config.bgClass
            )}>
              <Icon className={cn("h-5 w-5", config.iconClass)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm leading-tight">{data.title}</h4>
                <Badge variant={priority.variant} className="text-xs shrink-0">
                  {priority.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {data.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {data.metadata && (
            <div className="flex flex-wrap gap-2 text-xs">
              {data.metadata.dataPoints && (
                <Badge variant="outline" className="font-normal">
                  {data.metadata.dataPoints} pontos de dados
                </Badge>
              )}
              {data.metadata.affectedItems && (
                <Badge variant="outline" className="font-normal">
                  {data.metadata.affectedItems} itens afetados
                </Badge>
              )}
              {data.metadata.timeframe && (
                <Badge variant="outline" className="font-normal">
                  <Calendar className="h-3 w-3 mr-1" />
                  {data.metadata.timeframe}
                </Badge>
              )}
            </div>
          )}

          {/* Impact & Confidence */}
          <div className="flex items-center gap-3 text-xs">
            {data.estimatedImpact && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Impacto: {data.estimatedImpact}</span>
              </div>
            )}
            {data.confidence && data.confidence > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>{Math.round(data.confidence * 100)}% confiança</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onExecute?.(data)}
            className="w-full group"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {data.action.label}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// Container para múltiplos ActionCards
interface ActionCardsGridProps {
  actions: ActionCardData[];
  onExecute?: (action: ActionCardData) => void;
  className?: string;
}

export function ActionCardsGrid({ actions, onExecute, className }: ActionCardsGridProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Ações Sugeridas</h3>
        <Badge variant="secondary" className="ml-auto">
          {actions.length} {actions.length === 1 ? 'ação' : 'ações'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <ActionCard 
            key={action.id} 
            data={action} 
            onExecute={onExecute}
          />
        ))}
      </div>
    </div>
  );
}
