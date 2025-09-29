import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle, 
  Calendar, 
  BarChart3,
  Leaf,
  FileText,
  Users,
  Shield
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'add-emission',
    title: 'Registrar Emissão',
    description: 'Adicionar dados ao inventário GEE',
    path: '/inventario-gee',
    icon: Leaf,
    color: 'bg-green-500 hover:bg-green-600',
    available: true
  },
  {
    id: 'new-audit',
    title: 'Nova Auditoria',
    description: 'Iniciar processo de auditoria',
    path: '/auditoria',
    icon: CheckCircle,
    color: 'bg-blue-500 hover:bg-blue-600',
    available: true
  },
  {
    id: 'employee-training',
    title: 'Gestão de Treinamentos',
    description: 'Gerenciar capacitação da equipe',
    path: '/gestao-treinamentos',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    available: true
  },
  {
    id: 'generate-report',
    title: 'Relatórios',
    description: 'Acessar central de relatórios',
    path: '/relatorios',
    icon: FileText,
    color: 'bg-orange-500 hover:bg-orange-600',
    available: true
  },
  {
    id: 'compliance',
    title: 'Compliance',
    description: 'Gerenciar conformidade regulatória',
    path: '/compliance',
    icon: Shield,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    available: true
  },
  {
    id: 'performance',
    title: 'Dashboard ESG',
    description: 'Visualizar indicadores ESG',
    path: '/gestao-esg',
    icon: BarChart3,
    color: 'bg-teal-500 hover:bg-teal-600',
    available: true
  }
];

interface QuickAccessButtonsProps {
  maxItems?: number;
  className?: string;
}

export function QuickAccessButtons({ maxItems = 4, className = "" }: QuickAccessButtonsProps) {
  const navigate = useNavigate();

  const availableActions = quickActions.filter(action => action.available).slice(0, maxItems);

  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 ${className}`}>
      {availableActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => navigate(action.path)}
            className={`flex-shrink-0 gap-2 hover-scale transition-all ${action.color} text-white border-0 shadow-md hover:shadow-lg`}
            title={action.description}
          >
            <Icon className="w-4 h-4" />
            {action.title}
          </Button>
        );
      })}
    </div>
  );
}

export default QuickAccessButtons;