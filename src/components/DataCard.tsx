import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  Activity, 
  Package, 
  BarChart3, 
  Zap,
  Calculator,
  Gavel,
  AlertTriangle,
  Brain,
  Trash2,
  Flag,
  TrendingUp,
  Leaf,
  TreePine,
  ShoppingCart,
  RotateCcw,
  FileText,
  Folder,
  Database,
  ClipboardList,
  Inbox,
  CheckSquare,
  Import,
  ShieldCheck,
  FileSearch,
  AlertCircle,
  BarChart,
  Eye,
  Edit,
  Download,
  Plus
} from "lucide-react";
import { DatabaseSection } from "@/hooks/useAllDatabaseData";

const categoryIcons = {
  "company": Building2,
  "profiles": Users,
  "activity-logs": Activity,
  "assets": Package,
  "emission-sources": BarChart3,
  "activity-data": Zap,
  "calculated-emissions": Calculator,
  "emission-factors": BarChart3,
  "licenses": Gavel,
  "license-alerts": AlertTriangle,
  "license-ai-analysis": Brain,
  "waste-logs": Trash2,
  "goals": Flag,
  "goal-progress": TrendingUp,
  "esg-metrics": BarChart,
  "carbon-projects": Leaf,
  "conservation-activities": TreePine,
  "credit-purchases": ShoppingCart,
  "credit-retirements": RotateCcw,
  "documents": FileText,
  "document-folders": Folder,
  "extracted-data": Database,
  "custom-forms": ClipboardList,
  "form-submissions": Inbox,
  "data-collection-tasks": CheckSquare,
  "data-import-jobs": Import,
  "compliance-tasks": ShieldCheck,
  "audits": FileSearch,
  "audit-findings": AlertCircle,
  "generated-reports": BarChart,
};

const categoryColors = {
  core: "hsl(var(--primary))",
  assets: "hsl(220, 71%, 60%)",
  licensing: "hsl(38, 92%, 50%)",
  waste: "hsl(16, 100%, 60%)",
  esg: "hsl(151, 100%, 37%)",
  carbon: "hsl(120, 60%, 50%)",
  documents: "hsl(262, 83%, 70%)",
  forms: "hsl(200, 100%, 50%)",
  compliance: "hsl(0, 84%, 60%)",
  reports: "hsl(280, 100%, 70%)"
};

interface DataCardProps {
  section: DatabaseSection;
  onClick?: () => void;
  isSelected?: boolean;
}

export const DataCard: React.FC<DataCardProps> = ({ section, onClick, isSelected = false }) => {
  const IconComponent = categoryIcons[section.id as keyof typeof categoryIcons] || Package;
  const categoryColor = categoryColors[section.category as keyof typeof categoryColors] || "hsl(var(--muted-foreground))";
  
  const completionPercentage = section.count > 0 ? Math.min(100, (section.count / 10) * 100) : 0;
  
  const getStatusBadge = () => {
    if (section.status === 'active') {
      return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
    } else if (section.status === 'empty') {
      return <Badge variant="secondary">Vazio</Badge>;
    } else if (section.status === 'error') {
      return <Badge variant="destructive">Erro</Badge>;
    } else {
      return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      {/* Category accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: categoryColor }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <IconComponent 
                className="h-5 w-5" 
                style={{ color: categoryColor }}
              />
            </div>
            <div>
              <CardTitle className="text-base font-semibold leading-none">
                {section.title}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {section.description}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main metric */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">{section.count}</div>
            <div className="text-xs text-muted-foreground">
              {section.count === 1 ? 'registro' : 'registros'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Última atualização</div>
            <div className="text-sm font-medium">{section.lastUpdated}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Completude</span>
            <span className="font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2"
            style={{ 
              '--progress-foreground': categoryColor 
            } as React.CSSProperties}
          />
        </div>

        {/* Quick actions */}
        <div className="flex justify-between pt-2 border-t border-border/50">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Novo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};