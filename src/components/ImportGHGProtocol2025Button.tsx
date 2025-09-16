import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { importGHGProtocol2025 } from "@/services/ghgProtocol2025Import";

interface ImportGHGProtocol2025ButtonProps {
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  errors: number;
  message: string;
  details: { section: string; count: number; errors: string[] }[];
}

export function ImportGHGProtocol2025Button({ onImportComplete }: ImportGHGProtocol2025ButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    setProgress(0);
    setShowResults(false);
    
    try {
      // Simular progresso durante a importação
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const result = await importGHGProtocol2025();
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Importação GHG Protocol 2025 concluída",
          description: `${result.success} fatores importados com sucesso`,
          variant: "default"
        });
        
        onImportComplete?.();
        setShowResults(true);
      } else {
        toast({
          title: "Erro na importação", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Erro inesperado durante a importação GHG Protocol 2025",
        variant: "destructive"
      });
      console.error('Erro na importação:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setImportResult(null);
    setProgress(0);
  };

  return (
    <>
      <Button 
        onClick={handleImport}
        disabled={isImporting}
        className="gap-2"
        size="lg"
      >
        {isImporting ? (
          <Upload className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        {isImporting ? "Importando..." : "Importar GHG Protocol 2025"}
      </Button>

      {/* Modal de Progresso */}
      {isImporting && (
        <Dialog open={isImporting} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 animate-spin" />
                Importando GHG Protocol 2025
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Importando fatores de emissão organizados por seção...
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm font-medium">
                {progress}%
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Resultados */}
      <Dialog open={showResults} onOpenChange={handleCloseResults}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultados da Importação GHG Protocol 2025
            </DialogTitle>
          </DialogHeader>
          
          {importResult && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-green-700">
                    Fatores importados
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors}
                  </div>
                  <div className="text-sm text-red-700">
                    Erros encontrados
                  </div>
                </div>
              </div>

              {/* Detalhes por Seção */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalhes por Seção</h3>
                {importResult.details.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{detail.section}</h4>
                      <Badge variant={detail.errors.length > 0 ? "destructive" : "default"}>
                        {detail.count} importados
                      </Badge>
                    </div>
                    
                    {detail.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            Erros ({detail.errors.length})
                          </span>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {detail.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Categorias Importadas */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Categorias de Fatores Importadas:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Combustão Estacionária</Badge>
                  <Badge variant="outline">Biomassa</Badge>
                  <Badge variant="outline">Combustão Móvel</Badge>
                  <Badge variant="outline">Fatores Veiculares</Badge>
                  <Badge variant="outline">GWP</Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCloseResults}>
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}