import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importBrazilianGHGData } from "@/services/brazilianDataImport";

interface ImportBrazilianGHGDataButtonProps {
  onImportComplete?: () => void;
}

export function ImportBrazilianGHGDataButton({ onImportComplete }: ImportBrazilianGHGDataButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    
    try {
      const result = await importBrazilianGHGData();
      
      if (result.success) {
        toast({
          title: "Importação Concluída ✅",
          description: `${result.message}
          
Dados importados:
• ${result.details.variableFactors.success} fatores variáveis (SIN, biodiesel, etanol)
• ${result.details.conversionFactors.success} fatores de conversão
• ${result.details.refrigerantFactors.success} fatores de refrigerantes fugitivos`,
          variant: "default"
        });
        
        onImportComplete?.();
      } else {
        toast({
          title: "Erro na Importação ❌", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na Importação",
        description: "Erro inesperado durante a importação dos dados brasileiros",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Button 
      onClick={handleImport}
      disabled={isImporting}
      className="gap-2"
      variant="outline"
    >
      {isImporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isImporting ? "Importando..." : "Importar Dados GHG Brasil"}
    </Button>
  );
}