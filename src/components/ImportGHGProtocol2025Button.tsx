import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { importStationaryFuels } from "@/services/stationaryCombustion";

interface ImportGHGProtocol2025ButtonProps {
  onImportComplete?: () => void;
}

export const ImportGHGProtocol2025Button = ({ onImportComplete }: ImportGHGProtocol2025ButtonProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus('idle');
    
    try {
      const result = await importStationaryFuels();
      
      if (result.errors.length > 0) {
        console.warn('Alguns erros durante importação:', result.errors);
        toast.warning(`Importação concluída com ${result.errors.length} avisos`, {
          description: `${result.success} fatores importados com sucesso`
        });
        setImportStatus('error');
      } else {
        toast.success("Fatores GHG Protocol 2025.0.1 importados com sucesso!", {
          description: `${result.success} fatores de combustão estacionária adicionados`
        });
        setImportStatus('success');
        onImportComplete?.(); // Call the callback if provided
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error("Erro ao importar fatores GHG Protocol 2025.0.1", {
        description: "Tente novamente ou entre em contato com o suporte"
      });
      setImportStatus('error');
    } finally {
      setIsImporting(false);
    }
  };

  const getButtonIcon = () => {
    if (isImporting) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (importStatus === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (importStatus === 'error') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <Upload className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (isImporting) return "Importando fatores...";
    if (importStatus === 'success') return "Fatores importados";
    if (importStatus === 'error') return "Importação com avisos";
    return "Importar GHG Protocol 2025.0.1";
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isImporting || importStatus === 'success'}
      variant={importStatus === 'success' ? "secondary" : "default"}
      className="flex items-center gap-2"
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
};