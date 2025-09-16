import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Car, Database, AlertCircle, CheckCircle } from "lucide-react";
import { importMobileFuels } from "@/services/mobileCombustion";

interface ImportMobileCombustionButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ImportMobileCombustionButton({ 
  onSuccess, 
  variant = "outline", 
  size = "default" 
}: ImportMobileCombustionButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{success: number; errors: string[]} | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      const result = await importMobileFuels();
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      if (result.errors.length === 0) {
        toast({
          title: "Importação concluída!",
          description: `${result.success} fatores de combustão móvel importados com sucesso`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Importação concluída com avisos",
          description: `${result.success} importados, ${result.errors.length} erros`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setProgress(0);
      setImportResult({ success: 0, errors: [error.message] });
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setProgress(0);
    setImportResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Car className="h-4 w-4 mr-2" />
          Importar Combustão Móvel GHG Protocol 2025
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importar Fatores de Combustão Móvel - GHG Protocol Brasil 2025.0.1
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>GHG Protocol Brasil 2025.0.1:</strong> Esta importação adicionará todos os fatores de emissão 
              para combustão móvel conforme a metodologia oficial, incluindo:
              <br />
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li><strong>Rodoviário:</strong> Gasolina C, Etanol Hidratado, Diesel S10/S500, Biodiesel, GNV</li>
                <li><strong>Aéreo:</strong> Querosene de Aviação</li>
                <li><strong>Hidroviário:</strong> Óleo Combustível Marítimo</li>
                <li><strong>Separação Automática:</strong> Fóssil vs Biogênico conforme protocolo</li>
                <li><strong>Todos os modos de transporte:</strong> Rodoviário, Aéreo, Ferroviário, Hidroviário, Dutoviário</li>
              </ul>
            </AlertDescription>
          </Alert>

          {isImporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Importando fatores de combustão móvel...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processando fatores de emissão GHG Protocol Brasil 2025.0.1
              </p>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              {importResult.errors.length === 0 ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Sucesso!</strong> {importResult.success} fatores de combustão móvel foram importados corretamente.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <strong>Importação concluída com avisos:</strong> {importResult.success} importados com sucesso, 
                      {importResult.errors.length} com erros.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!isImporting && !importResult && (
              <Button onClick={handleImport} className="flex-1">
                <Database className="h-4 w-4 mr-2" />
                Iniciar Importação
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}