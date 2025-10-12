import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ProactiveInsight {
  id: string;
  type: 'opportunity' | 'alert' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  action?: {
    label: string;
    prompt: string;
  };
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface ProactiveInsightsProps {
  insights: ProactiveInsight[];
  onActionClick: (prompt: string) => void;
}

export function ProactiveInsights({ insights, onActionClick }: ProactiveInsightsProps) {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: ProactiveInsight['type']) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'suggestion': return Lightbulb;
      case 'achievement': return Target;
      default: return Zap;
    }
  };

  const getIconColor = (type: ProactiveInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-green-600';
      case 'alert': return 'text-red-600';
      case 'suggestion': return 'text-blue-600';
      case 'achievement': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: ProactiveInsight['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Insights Inteligentes</h4>
      </div>
      
      {insights.map((insight) => {
        const Icon = getIcon(insight.type);
        const iconColor = getIconColor(insight.type);

        return (
          <Card key={insight.id} className="p-4">
            <div className="flex gap-3">
              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-semibold text-sm">{insight.title}</h5>
                  <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                    {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                
                {insight.category && (
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                )}
                
                {insight.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onActionClick(insight.action!.prompt)}
                  >
                    {insight.action.label}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
