import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Settings
} from 'lucide-react';

interface KPIWidgetProps {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  target?: number;
  current?: number;
  icon: any;
  color: string;
  bgColor: string;
  description?: string;
  trend?: number[];
  unit?: string;
  period?: string;
  className?: string;
}

export function EnhancedKPIWidget({
  title,
  value,
  change,
  changeType,
  target,
  current,
  icon: Icon,
  color,
  bgColor,
  description,
  trend = [],
  unit = '',
  period = 'último mês',
  className = ''
}: KPIWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return ArrowUpRight;
    if (changeType === 'negative') return ArrowDownRight;
    return null;
  };

  const progressValue = target && current ? (current / target) * 100 : 0;
  const ChangeIcon = getChangeIcon();

  return (
    <Card 
      className={`group hover:shadow-xl transition-all duration-500 hover-scale cursor-pointer border-0 shadow-lg animate-fade-in overflow-hidden relative ${className}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0 hover-scale"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {value}
              {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
            </span>
            
            {ChangeIcon && (
              <div className={`flex items-center gap-1 ${getChangeColor()} bg-white/80 px-2 py-1 rounded-full shadow-sm animate-scale-in`}>
                <ChangeIcon className="w-3 h-3" />
                <span className="text-xs font-semibold">
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-3">
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          
          {/* Progress towards target */}
          {target && current && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Meta: {target}{unit}</span>
                <span className={`font-medium ${progressValue >= 100 ? 'text-green-600' : 'text-foreground'}`}>
                  {Math.round(progressValue)}%
                </span>
              </div>
              <Progress 
                value={progressValue} 
                className="h-2 bg-gray-100" 
              />
            </div>
          )}
          
          {/* Mini trend chart */}
          {trend.length > 0 && (
            <div className="flex items-end gap-1 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {trend.map((point, index) => (
                <div
                  key={index}
                  className="bg-primary/20 rounded-t flex-1 transition-all duration-300 hover:bg-primary/40"
                  style={{ 
                    height: `${Math.max(10, (point / Math.max(...trend)) * 32)}px`,
                    animationDelay: `${index * 50}ms`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Additional details on hover */}
          <div className={`space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${showDetails ? 'max-h-20' : 'max-h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              Período: {period}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs h-7 hover-scale"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-3 h-3 mr-1" />
                Detalhes
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs h-7 hover-scale"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="w-3 h-3 mr-1" />
                Config
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Atualizando...
          </div>
        </div>
      )}
    </Card>
  );
}