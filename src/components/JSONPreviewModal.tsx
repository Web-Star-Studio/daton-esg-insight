import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, X } from "lucide-react";
import { toast } from "sonner";

interface JSONPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title: string;
  sectionTitle?: string;
}

export const JSONPreviewModal: React.FC<JSONPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  title,
  sectionTitle
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Dados copiados para a área de transferência');
  };

  const downloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo JSON baixado com sucesso');
  };

  const renderValue = (value: any, key?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'true' : 'false'}
        </Badge>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400 font-mono">{value}</span>;
    }

    if (typeof value === 'string') {
      // Format dates
      if (key?.includes('date') || key?.includes('at') || /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return (
          <div>
            <span className="text-green-600 dark:text-green-400 font-mono">"{value}"</span>
            {/^\d{4}-\d{2}-\d{2}/.test(value) && (
              <div className="text-xs text-muted-foreground">
                {new Date(value).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        );
      }
      
      // Format UUIDs
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return (
          <div>
            <span className="text-purple-600 dark:text-purple-400 font-mono text-sm">"{value}"</span>
            <Badge variant="outline" className="ml-2 text-xs">UUID</Badge>
          </div>
        );
      }

      return <span className="text-green-600 dark:text-green-400 font-mono">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="ml-4">
          <Badge variant="outline">Array ({value.length})</Badge>
          {value.length > 0 && (
            <div className="mt-2 space-y-1">
              {value.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground font-mono text-sm">[{index}]</span>
                  {renderValue(item)}
                </div>
              ))}
              {value.length > 5 && (
                <div className="text-muted-foreground text-sm">
                  ... e mais {value.length - 5} itens
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4">
          <Badge variant="outline">Object</Badge>
          <div className="mt-2 space-y-2">
            {Object.entries(value).slice(0, 10).map(([objKey, objValue]) => (
              <div key={objKey} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm min-w-0 flex-shrink-0">
                  {objKey}:
                </span>
                <div className="min-w-0 flex-1">
                  {renderValue(objValue, objKey)}
                </div>
              </div>
            ))}
            {Object.keys(value).length > 10 && (
              <div className="text-muted-foreground text-sm">
                ... e mais {Object.keys(value).length - 10} propriedades
              </div>
            )}
          </div>
        </div>
      );
    }

    return <span className="font-mono">{String(value)}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {title}
              </DialogTitle>
              {sectionTitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  Seção: {sectionTitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadJSON}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4">
          <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm">
            <div className="space-y-2">
              {typeof data === 'object' && data !== null ? (
                Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-0 flex-shrink-0">
                      {key}:
                    </span>
                    <div className="min-w-0 flex-1">
                      {renderValue(value, key)}
                    </div>
                  </div>
                ))
              ) : (
                renderValue(data)
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};