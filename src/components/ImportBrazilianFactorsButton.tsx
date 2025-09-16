import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importBrazilianFactors } from "@/services/brazilianFactorsTransform";

interface ImportBrazilianFactorsButtonProps {
  onImportComplete?: () => void;
}

export function ImportBrazilianFactorsButton({ onImportComplete }: ImportBrazilianFactorsButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    
    try {
      const result = await importBrazilianFactors();
      
      if (result.success > 0) {
        toast({
          title: "Importação concluída",
          description: result.message,
          variant: "default"
        });
        
        onImportComplete?.();
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
        description: "Erro inesperado durante a importação",
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
    >
      {isImporting ? (
        <Upload className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {isImporting ? "Importando..." : "Importar Fatores Brasil"}
    </Button>
  );
}