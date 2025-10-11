import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/utils/logger";
import { Download, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function LogsViewer() {
  const [logs, setLogs] = useState(logger.getRecentLogs(50));
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');

  const refreshLogs = () => {
    setLogs(logger.getRecentLogs(50));
    toast.success("Logs atualizados");
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast.success("Logs limpos");
  };

  const downloadLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados");
  };

  const filteredLogs = selectedLevel === 'all' 
    ? logs 
    : logger.getLogsByLevel(selectedLevel);

  const getLevelColor = (level: LogLevel): "default" | "destructive" | "outline" | "secondary" => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'outline';
      case 'info': return 'default';
      case 'debug': return 'secondary';
    }
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs do Sistema</CardTitle>
            <CardDescription>Visualize e analise logs da aplicação</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={downloadLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Level Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedLevel === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel('all')}
            >
              Todos ({logs.length})
            </Button>
            {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLevel(level)}
              >
                {getLevelIcon(level)} {level} ({logger.getLogsByLevel(level).length})
              </Button>
            ))}
          </div>

          {/* Logs Display */}
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum log disponível
                </p>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{log.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.context && (
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                    {log.stack && (
                      <pre className="text-xs bg-destructive/10 p-2 rounded overflow-x-auto text-destructive">
                        {log.stack}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
