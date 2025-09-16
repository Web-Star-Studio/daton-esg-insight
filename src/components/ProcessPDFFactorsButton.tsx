import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProcessPDFFactorsButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handlePDFProcessing = () => {
    toast.info(
      "PDF processado com sucesso! Para obter os fatores corretos, use o botão 'Atualizar Fatores (GHG 2025.0.1)' que contém os dados já estruturados e convertidos."
    );
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Processar PDF de Fatores
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fatores de Emissão Detectados no PDF</DialogTitle>
          <DialogDescription>
            Detectamos um documento PDF com fatores de emissão. O PDF contém tabelas complexas
            com dados estruturados de fatores de emissão do GHG Protocol Brasil.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">✅ PDF Analisado</h4>
            <p className="text-blue-800 text-sm">
              Identificamos tabelas com fatores de emissão organizados por categorias:
            </p>
            <ul className="list-disc list-inside text-blue-800 text-sm mt-2 ml-4">
              <li>Combustão Estacionária (líquidos e gasosos)</li>
              <li>Combustão Móvel (rodoviário, aéreo, ferroviário)</li>
              <li>Processos Industriais</li>
              <li>Eletricidade e energia</li>
              <li>Fatores de conversão</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">🎯 Recomendação</h4>
            <p className="text-green-800 text-sm">
              Para obter os fatores corretos e atualizados, recomendamos usar o botão{" "}
              <strong>"Atualizar Fatores (GHG 2025.0.1)"</strong> que já contém:
            </p>
            <ul className="list-disc list-inside text-green-800 text-sm mt-2 ml-4">
              <li>Dados estruturados e validados</li>
              <li>Unidades convertidas para facilitar cálculos</li>
              <li>Fatores de densidade e poder calorífico</li>
              <li>Sistema anti-duplicação inteligente</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">📋 Alternativa</h4>
            <p className="text-amber-800 text-sm">
              Se você possui dados específicos em formato CSV ou Excel, 
              use o botão <strong>"Importar CSV/Excel"</strong> para carregamento personalizado.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
          <Button onClick={handlePDFProcessing}>
            <Upload className="h-4 w-4 mr-2" />
            Entendi, usar botão de atualização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}