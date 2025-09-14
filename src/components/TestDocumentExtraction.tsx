import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { documentExtractionService } from "@/services/documentExtraction";

export const TestDocumentExtraction = () => {
  const [fileId, setFileId] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleStartExtraction = async () => {
    if (!fileId.trim()) {
      toast.error("Digite um file_id válido");
      return;
    }

    setIsStarting(true);
    try {
      const result = await documentExtractionService.startExtraction(fileId);
      if (result.ok) {
        toast.success(`Extração iniciada! ID: ${result.extraction_id}`);
        startPolling();
      } else {
        toast.error(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Erro ao iniciar extração");
    } finally {
      setIsStarting(false);
    }
  };

  const startPolling = () => {
    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const currentStatus = await documentExtractionService.getExtractionStatus(fileId);
        setStatus(currentStatus);
        
        if (currentStatus.status === 'completed' || currentStatus.status === 'failed') {
          clearInterval(interval);
          setIsPolling(false);
          
          if (currentStatus.status === 'completed') {
            toast.success("Extração concluída!");
          } else {
            toast.error("Extração falhou");
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
        setIsPolling(false);
      }
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'parsing':
        return <Badge variant="secondary">Processando</Badge>;
      case 'uploaded':
        return <Badge variant="outline">Carregado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Extração de Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-id">File ID</Label>
          <Input
            id="file-id"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Digite o ID do arquivo"
          />
        </div>

        <Button 
          onClick={handleStartExtraction}
          disabled={isStarting || isPolling}
          className="w-full"
        >
          {isStarting ? "Iniciando..." : "Iniciar Extração"}
        </Button>

        {isPolling && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Monitorando progresso...</p>
          </div>
        )}

        {status && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              {getStatusBadge(status.status)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Progresso:</span>
              <span>{status.progress || 0}%</span>
            </div>
            
            {status.message && (
              <div>
                <span className="font-medium">Mensagem:</span>
                <p className="text-sm text-muted-foreground">{status.message}</p>
              </div>
            )}
            
            {status.items_count !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Itens extraídos:</span>
                <span>{status.items_count}</span>
              </div>
            )}
            
            {status.quality_score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Qualidade:</span>
                <span>{Math.round((status.quality_score || 0) * 100)}%</span>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Como testar:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Primeiro, faça upload de um arquivo na tela de análise</li>
            <li>Copie o file_id da URL ou do console</li>
            <li>Cole aqui e clique em "Iniciar Extração"</li>
            <li>Observe o progresso em tempo real</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};