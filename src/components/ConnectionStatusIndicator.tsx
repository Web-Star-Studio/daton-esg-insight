import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wifi, WifiOff, Activity, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealTimeData } from '@/hooks/useRealTimeData';

interface ConnectionStatusProps {
  connectionInfo?: {
    status: 'connecting' | 'connected' | 'disconnected';
    lastActivity: Date;
    activeChannels: number;
    isHealthy: boolean;
  };
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({ 
  connectionInfo,
  className 
}) => {
  if (!connectionInfo) return null;

  const { status, lastActivity, activeChannels, isHealthy } = connectionInfo;

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: isHealthy ? CheckCircle : Activity,
          color: isHealthy ? 'success' : 'warning',
          label: isHealthy ? 'Conectado' : 'Conectado (lento)',
          description: 'Dados em tempo real ativos'
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'primary',
          label: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'destructive',
          label: 'Desconectado',
          description: 'Usando dados em cache'
        };
      default:
        return {
          icon: WifiOff,
          color: 'muted',
          label: 'Status desconhecido',
          description: 'Status da conexão indefinido'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 ${className}`}
        >
          <Icon 
            className={`h-3 w-3 mr-1 ${
              status === 'connecting' ? 'animate-spin' : 
              status === 'connected' && isHealthy ? 'animate-pulse' : ''
            }`} 
          />
          <span className="text-xs">{config.label}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              Status da Conexão
            </h4>
            <Badge 
              variant={config.color as any}
              className="text-xs"
            >
              {config.label}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {config.description}
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canais ativos:</span>
              <span className="font-medium">{activeChannels}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última atividade:</span>
              <span className="font-medium">
                {formatDistanceToNow(lastActivity, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qualidade:</span>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-1 ${
                  isHealthy ? 'bg-success' : 
                  status === 'connected' ? 'bg-warning' : 'bg-destructive'
                }`} />
                <span className="font-medium">
                  {isHealthy ? 'Excelente' : 
                   status === 'connected' ? 'Instável' : 'Sem conexão'}
                </span>
              </div>
            </div>
          </div>

          {status === 'disconnected' && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                💡 Os dados podem estar desatualizados. Verifique sua conexão com a internet.
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};