import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { emissionFactorsUpdateService } from "@/services/emissionFactorsUpdate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UpdateResult {
  updated: number;
  created: number;
  errors: string[];
}

export function UpdateEmissionFactorsButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<UpdateResult | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      toast.loading("Atualizando fatores de emissão...");
      
      const result = await emissionFactorsUpdateService.executeCompleteUpdate();
      
      setLastUpdate(result);
      
      if (result.errors.length === 0) {
        toast.success(
          `Atualização concluída! ${result.updated} fatores atualizados, ${result.created} fatores criados.`
        );
      } else {
        toast.warning(
          `Atualização parcial: ${result.updated} atualizados, ${result.created} criados, ${result.errors.length} erros.`
        );
      }
    } catch (error) {
      console.error("Erro na atualização:", error);
      toast.error("Erro ao atualizar fatores de emissão");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? "Atualizando..." : "Atualizar Fatores (GHG 2025.0.1)"}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar Fatores de Emissão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá atualizar os fatores de emissão existentes com os dados 
              mais recentes do GHG Protocol Brasil 2025.0.1, incluindo unidades convertidas 
              para facilitar os cálculos do inventário.
              <br /><br />
              <strong>O que será feito:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Fatores existentes serão atualizados com valores corretos</li>
                <li>Novos fatores serão adicionados se necessário</li>
                <li>Unidades serão convertidas para facilitar cálculos (ex: L, m³, kg)</li>
                <li>Dados de densidade e poder calorífico serão incluídos</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate}>
              Atualizar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {lastUpdate.errors.length === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span>
            Última atualização: {lastUpdate.updated} atualizados, {lastUpdate.created} criados
            {lastUpdate.errors.length > 0 && `, ${lastUpdate.errors.length} erros`}
          </span>
        </div>
      )}

      {lastUpdate?.errors && lastUpdate.errors.length > 0 && (
        <div className="text-xs text-red-500 max-h-20 overflow-y-auto">
          <strong>Erros:</strong>
          <ul className="list-disc list-inside">
            {lastUpdate.errors.slice(0, 3).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
            {lastUpdate.errors.length > 3 && (
              <li>... e mais {lastUpdate.errors.length - 3} erros</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}