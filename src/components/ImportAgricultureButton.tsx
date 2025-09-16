import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Database, AlertCircle, CheckCircle } from "lucide-react";
import { importAgricultureEmissionFactors } from "@/services/agriculture";

interface ImportAgricultureButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ImportAgricultureButton({ 
  onSuccess, 
  variant = "outline", 
  size = "default" 
}: ImportAgricultureButtonProps) {
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
          if (prev < 90) return prev + 12;
          return prev;
        });
      }, 250);

      const result = await importAgricultureEmissionFactors();
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      if (result.errors.length === 0) {
        toast({
          title: "Importação concluída!",
          description: `${result.success} fatores agrícolas importados com sucesso`,
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
          <Wheat className="h-4 w-4 mr-2" />
          Importar Agricultura GHG Protocol 2025
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importar Fatores Agrícolas - GHG Protocol Brasil 2025.0.1
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>GHG Protocol Brasil 2025.0.1:</strong> Esta importação adicionará todos os fatores de emissão 
              para atividades agrícolas conforme a metodologia oficial, incluindo:
              <br />
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li><strong>Fermentação Entérica:</strong> CH₄ de bovinos, búfalos, suínos por categoria animal</li>
                <li><strong>Manejo de Dejetos:</strong> CH₄ e N₂O por sistema de manejo (pasto, lagoa, sólido)</li>
                <li><strong>Cultivo de Arroz:</strong> CH₄ de solos alagados por sistema de irrigação</li>
                <li><strong>Solos Agrícolas:</strong> N₂O de fertilizantes sintéticos, orgânicos e fixação biológica</li>
                <li><strong>Queima de Resíduos:</strong> CO₂ (biogênico), CH₄, N₂O da queima controlada</li>
                <li><strong>Calcagem e Ureia:</strong> CO₂ de carbonatos e hidrólise da ureia</li>
                <li><strong>Separação Biogênico:</strong> CO₂ de queima é reportado como biogênico</li>
              </ul>
            </AlertDescription>
          </Alert>

          {isImporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Importando fatores agrícolas...</span>
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
                    <strong>Sucesso!</strong> {importResult.success} fatores agrícolas foram importados corretamente.
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